/**
 * 数据库事务封装工具
 * 
 * 提供事务管理功能：
 * - 自动重试机制（处理并发冲突）
 * - 统一的错误处理
 * - 事务超时控制
 * - 嵌套事务支持
 */

import prisma from "../prisma.js";
import { Prisma, PrismaClient } from "../../generated/prisma/client.js";

/**
 * 事务客户端类型
 * 用于在事务回调中执行数据库操作
 */
export type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * 事务配置选项
 */
export interface TransactionOptions {
  /** 最大重试次数（默认 3） */
  maxRetries?: number;
  /** 事务超时时间（毫秒，默认 5000） */
  timeout?: number;
  /** 事务隔离级别 */
  isolationLevel?: Prisma.TransactionIsolationLevel;
  /** 重试延迟基数（毫秒，默认 100） */
  retryDelayBase?: number;
}

/**
 * 事务执行结果
 */
export interface TransactionResult<T> {
  /** 是否成功 */
  success: boolean;
  /** 执行结果数据 */
  data?: T;
  /** 错误信息 */
  error?: string;
  /** 重试次数 */
  retryCount: number;
}

/**
 * 事务错误类
 */
export class TransactionError extends Error {
  constructor(
    message: string,
    public readonly code: TransactionErrorCode,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'TransactionError';
  }
}

/**
 * 事务错误码
 */
export enum TransactionErrorCode {
  /** 事务超时 */
  TIMEOUT = 'TRANSACTION_TIMEOUT',
  /** 并发冲突 */
  CONFLICT = 'TRANSACTION_CONFLICT',
  /** 重试次数超限 */
  MAX_RETRIES_EXCEEDED = 'MAX_RETRIES_EXCEEDED',
  /** 执行失败 */
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  /** 回滚失败 */
  ROLLBACK_FAILED = 'ROLLBACK_FAILED',
}

/**
 * 默认事务配置
 */
const DEFAULT_OPTIONS: Required<TransactionOptions> = {
  maxRetries: 3,
  timeout: 5000,
  isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
  retryDelayBase: 100,
};

/**
 * 判断错误是否为可重试的并发冲突
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2034: 事务冲突
    // P2024: 连接池超时
    // P2028: 事务 API 错误
    return ['P2034', 'P2024', 'P2028'].includes(error.code);
  }
  return false;
}

/**
 * 计算重试延迟（指数退避 + 随机抖动）
 */
function calculateRetryDelay(retryCount: number, baseDelay: number): number {
  const exponentialDelay = baseDelay * Math.pow(2, retryCount);
  const jitter = Math.random() * baseDelay;
  return exponentialDelay + jitter;
}

/**
 * 延迟执行
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 执行数据库事务
 * 
 * 提供自动重试、超时控制和统一错误处理
 * 
 * @param fn 事务回调函数
 * @param options 事务配置选项
 * @returns 事务执行结果
 * 
 * @example
 * ```typescript
 * const result = await executeTransaction(async (tx) => {
 *   const user = await tx.user.create({ data: { name: 'John' } });
 *   const account = await tx.pointsAccount.create({ 
 *     data: { userId: user.id, balance: 100 } 
 *   });
 *   return { user, account };
 * });
 * 
 * if (result.success) {
 *   console.log('Created:', result.data);
 * } else {
 *   console.error('Failed:', result.error);
 * }
 * ```
 */
export async function executeTransaction<T>(
  fn: (tx: TransactionClient) => Promise<T>,
  options: TransactionOptions = {}
): Promise<TransactionResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let retryCount = 0;

  while (retryCount <= opts.maxRetries) {
    try {
      const data = await prisma.$transaction(fn, {
        timeout: opts.timeout,
        isolationLevel: opts.isolationLevel,
      });

      return {
        success: true,
        data,
        retryCount,
      };
    } catch (error) {
      // 检查是否为可重试错误
      if (isRetryableError(error) && retryCount < opts.maxRetries) {
        retryCount++;
        const delayMs = calculateRetryDelay(retryCount, opts.retryDelayBase);
        await delay(delayMs);
        continue;
      }

      // 不可重试或已达最大重试次数
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      
      if (retryCount >= opts.maxRetries && isRetryableError(error)) {
        return {
          success: false,
          error: `事务重试次数超限: ${errorMessage}`,
          retryCount,
        };
      }

      return {
        success: false,
        error: errorMessage,
        retryCount,
      };
    }
  }

  // 理论上不会到达这里
  return {
    success: false,
    error: '事务执行异常',
    retryCount,
  };
}

/**
 * 执行数据库事务（抛出异常版本）
 * 
 * 与 executeTransaction 类似，但失败时抛出异常而非返回错误结果
 * 
 * @param fn 事务回调函数
 * @param options 事务配置选项
 * @returns 事务执行结果数据
 * @throws TransactionError 事务执行失败时抛出
 * 
 * @example
 * ```typescript
 * try {
 *   const result = await executeTransactionOrThrow(async (tx) => {
 *     return await tx.user.create({ data: { name: 'John' } });
 *   });
 *   console.log('Created:', result);
 * } catch (error) {
 *   if (error instanceof TransactionError) {
 *     console.error('Transaction failed:', error.code, error.message);
 *   }
 * }
 * ```
 */
export async function executeTransactionOrThrow<T>(
  fn: (tx: TransactionClient) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const result = await executeTransaction(fn, options);

  if (!result.success) {
    throw new TransactionError(
      result.error || '事务执行失败',
      result.retryCount >= (options.maxRetries ?? DEFAULT_OPTIONS.maxRetries)
        ? TransactionErrorCode.MAX_RETRIES_EXCEEDED
        : TransactionErrorCode.EXECUTION_FAILED
    );
  }

  return result.data as T;
}

/**
 * 批量执行多个事务操作
 * 
 * 所有操作在同一个事务中执行，任一失败则全部回滚
 * 
 * @param operations 操作函数数组
 * @param options 事务配置选项
 * @returns 所有操作的结果数组
 * 
 * @example
 * ```typescript
 * const results = await executeBatchTransaction([
 *   (tx) => tx.user.create({ data: { name: 'User1' } }),
 *   (tx) => tx.user.create({ data: { name: 'User2' } }),
 * ]);
 * ```
 */
export async function executeBatchTransaction<T>(
  operations: Array<(tx: TransactionClient) => Promise<T>>,
  options: TransactionOptions = {}
): Promise<TransactionResult<T[]>> {
  return executeTransaction(async (tx) => {
    const results: T[] = [];
    for (const operation of operations) {
      const result = await operation(tx);
      results.push(result);
    }
    return results;
  }, options);
}

/**
 * 创建事务上下文
 * 
 * 用于需要在多个函数间共享事务的场景
 * 
 * @param options 事务配置选项
 * @returns 事务上下文对象
 * 
 * @example
 * ```typescript
 * const ctx = createTransactionContext();
 * 
 * await ctx.execute(async (tx) => {
 *   await createUser(tx, userData);
 *   await createAccount(tx, accountData);
 * });
 * ```
 */
export function createTransactionContext(options: TransactionOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return {
    /**
     * 在事务上下文中执行操作
     */
    execute: <T>(fn: (tx: TransactionClient) => Promise<T>) => 
      executeTransaction(fn, opts),

    /**
     * 在事务上下文中执行操作（抛出异常版本）
     */
    executeOrThrow: <T>(fn: (tx: TransactionClient) => Promise<T>) => 
      executeTransactionOrThrow(fn, opts),

    /**
     * 批量执行操作
     */
    executeBatch: <T>(operations: Array<(tx: TransactionClient) => Promise<T>>) =>
      executeBatchTransaction(operations, opts),
  };
}

/**
 * 事务装饰器工厂
 * 
 * 用于将普通函数包装为事务函数
 * 
 * @param options 事务配置选项
 * @returns 装饰器函数
 * 
 * @example
 * ```typescript
 * const withTransaction = transactional();
 * 
 * const createUserWithAccount = withTransaction(async (tx, userData) => {
 *   const user = await tx.user.create({ data: userData });
 *   await tx.pointsAccount.create({ data: { userId: user.id } });
 *   return user;
 * });
 * 
 * const user = await createUserWithAccount({ name: 'John' });
 * ```
 */
export function transactional(options: TransactionOptions = {}) {
  return function <TArgs extends unknown[], TResult>(
    fn: (tx: TransactionClient, ...args: TArgs) => Promise<TResult>
  ) {
    return async (...args: TArgs): Promise<TResult> => {
      return executeTransactionOrThrow((tx) => fn(tx, ...args), options);
    };
  };
}
