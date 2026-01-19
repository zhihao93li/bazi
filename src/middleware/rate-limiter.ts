/**
 * 请求限流中间件
 *
 * 提供全局限流和用户级限流功能
 * 使用内存存储，适用于单实例部署
 *
 * 注意：在分布式部署时需要替换为 Redis 等分布式存储
 */

import type { Context, Next } from 'hono';

/**
 * 限流配置
 */
interface RateLimitConfig {
  /** 时间窗口（毫秒） */
  windowMs: number;
  /** 窗口内最大请求数 */
  maxRequests: number;
  /** 超出限制时的错误信息 */
  message?: string;
}

/**
 * 请求记录
 */
interface RequestRecord {
  /** 请求时间戳列表（已排序） */
  timestamps: number[];
}

/**
 * 限流存储（内存）
 *
 * 使用滑动窗口算法，在单进程 Node.js 中线程安全
 */
class RateLimitStore {
  private records: Map<string, RequestRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // 定期清理过期记录（每分钟）
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * 检查并记录请求（原子操作）
   *
   * 在单进程 Node.js 中，同步代码块不会被中断，因此是线程安全的
   *
   * @returns 允许状态和限流信息
   */
  check(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // 获取或创建记录
    let record = this.records.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.records.set(key, record);
    }

    // 原子操作：移除过期时间戳、检查限流、记录请求
    // 过滤掉窗口外的时间戳
    const validTimestamps = record.timestamps.filter((t) => t > windowStart);

    // 检查是否超出限制（在记录之前检查）
    if (validTimestamps.length >= config.maxRequests) {
      // 更新记录（清理过期的）
      record.timestamps = validTimestamps;

      // 计算重置时间（最早的时间戳 + 窗口时间）
      const resetTime = validTimestamps[0] + config.windowMs;

      return { allowed: false, remaining: 0, resetTime };
    }

    // 记录本次请求
    validTimestamps.push(now);
    record.timestamps = validTimestamps;

    // 计算剩余配额
    const remaining = config.maxRequests - validTimestamps.length;
    const resetTime = validTimestamps[0] + config.windowMs;

    return { allowed: true, remaining, resetTime };
  }

  /**
   * 清理过期记录
   */
  private cleanup(): void {
    const now = Date.now();
    // 清理 5 分钟内没有活动的记录
    const threshold = now - 5 * 60 * 1000;

    for (const [key, record] of this.records.entries()) {
      // 清理空记录或过期记录
      if (record.timestamps.length === 0) {
        this.records.delete(key);
        continue;
      }

      // 检查最后一个时间戳是否过期
      const lastTimestamp = record.timestamps[record.timestamps.length - 1];
      if (lastTimestamp < threshold) {
        this.records.delete(key);
      }
    }
  }

  /**
   * 获取存储统计信息（用于监控）
   */
  getStats(): { totalKeys: number; totalRecords: number } {
    let totalRecords = 0;
    for (const record of this.records.values()) {
      totalRecords += record.timestamps.length;
    }
    return {
      totalKeys: this.records.size,
      totalRecords,
    };
  }

  /**
   * 销毁存储（停止清理任务）
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.records.clear();
  }
}

// 全局限流存储（单例）
const globalStore = new RateLimitStore();

// 用户级限流存储（单例）
const userStore = new RateLimitStore();

/**
 * 默认限流配置
 */
export const RATE_LIMIT_CONFIGS = {
  /** 全局限流：20 req/sec */
  global: {
    windowMs: 1000,
    maxRequests: 20,
    message: '服务繁忙，请稍后重试',
  } as RateLimitConfig,

  /** 用户主题解锁限流：10 次/分钟 */
  themeUnlock: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: '解锁请求过于频繁，请稍后再试',
  } as RateLimitConfig,
};

/**
 * 创建全局限流中间件
 */
export function globalRateLimit(config: RateLimitConfig = RATE_LIMIT_CONFIGS.global) {
  return async (c: Context, next: Next) => {
    // 使用客户端 IP 作为限流 key
    const clientIp = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
                     c.req.header('x-real-ip') ||
                     'unknown';

    const result = globalStore.check(`global:${clientIp}`, config);

    // 设置限流相关响应头
    c.res.headers.set('X-RateLimit-Limit', String(config.maxRequests));
    c.res.headers.set('X-RateLimit-Remaining', String(result.remaining));
    c.res.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetTime / 1000)));

    if (!result.allowed) {
      console.warn(`[RateLimit] Global rate limit exceeded for IP: ${clientIp}`);
      return c.json(
        {
          success: false,
          message: config.message || '请求过于频繁，请稍后重试',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        429
      );
    }

    await next();
  };
}

/**
 * 创建用户级主题解锁限流中间件
 *
 * 需要在 authRequired 之后使用
 */
export function themeUnlockRateLimit(config: RateLimitConfig = RATE_LIMIT_CONFIGS.themeUnlock) {
  return async (c: Context, next: Next) => {
    const userId = c.get('userId');

    // 如果没有用户 ID（理论上不应发生，因为应在 authRequired 之后使用）
    if (!userId) {
      await next();
      return;
    }

    const result = userStore.check(`user:${userId}:theme`, config);

    // 设置限流相关响应头
    c.res.headers.set('X-RateLimit-Limit', String(config.maxRequests));
    c.res.headers.set('X-RateLimit-Remaining', String(result.remaining));
    c.res.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetTime / 1000)));

    if (!result.allowed) {
      console.warn(`[RateLimit] Theme unlock rate limit exceeded for user: ${userId}`);
      return c.json(
        {
          success: false,
          message: config.message || '请求过于频繁，请稍后重试',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        429
      );
    }

    await next();
  };
}

/**
 * 获取限流存储统计信息（用于监控）
 */
export function getRateLimitStats() {
  return {
    global: globalStore.getStats(),
    user: userStore.getStats(),
  };
}
