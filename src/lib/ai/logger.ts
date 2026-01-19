/**
 * AI 服务日志工具
 *
 * 提供结构化的日志记录，便于监控和排查问题
 */

import { randomUUID } from 'crypto';

import type { AIErrorCode } from './errors.js';

/**
 * 日志事件类型
 */
export enum AILogEvent {
  REQUEST_START = 'REQUEST_START',
  REQUEST_END = 'REQUEST_END',
  ERROR = 'ERROR',
  STREAM_START = 'STREAM_START',
  STREAM_CHUNK = 'STREAM_CHUNK',
  STREAM_END = 'STREAM_END',
}

/**
 * AI 操作类型
 */
export type AIOperation = 'initial_analysis' | 'theme_analysis' | 'theme_analysis_stream';

/**
 * 日志上下文
 */
export interface AILogContext {
  /** 操作类型 */
  operation: AIOperation;
  /** 主题（如果是主题解读） */
  theme?: string;
  /** 使用的模型 */
  model?: string;
  /** Subject ID */
  subjectId?: string;
  /** 请求 ID（用于关联请求和响应） */
  requestId?: string;
}

/**
 * 请求结束日志数据
 */
export interface AIRequestEndData {
  /** 耗时（毫秒） */
  duration: number;
  /** 输入 token 数量 */
  promptTokens?: number;
  /** 输出 token 数量 */
  completionTokens?: number;
  /** 总 token 数量 */
  totalTokens?: number;
  /** 是否成功 */
  success: boolean;
}

/**
 * 错误日志数据
 */
export interface AIErrorLogData {
  /** 错误码 */
  code: AIErrorCode | string;
  /** 错误信息 */
  message: string;
  /** 堆栈信息（可选） */
  stack?: string;
  /** HTTP 状态码 */
  httpStatus?: number;
}

/**
 * 格式化时间戳
 */
function formatTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace('T', ' ').replace('Z', '');
}

/**
 * 生成唯一请求 ID
 */
export function generateRequestId(): string {
  return randomUUID();
}

/**
 * 截断字符串（用于 prompt 摘要）
 */
function truncate(str: string, maxLength: number = 200): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength) + '...';
}

/**
 * 构建日志前缀
 */
function buildPrefix(event: AILogEvent): string {
  return `[AI] [${formatTimestamp()}] [${event}]`;
}

/**
 * 构建上下文字符串
 */
function buildContextStr(ctx: AILogContext): string {
  const parts: string[] = [];
  parts.push(`operation=${ctx.operation}`);
  if (ctx.theme) parts.push(`theme=${ctx.theme}`);
  if (ctx.model) parts.push(`model=${ctx.model}`);
  if (ctx.subjectId) parts.push(`subjectId=${ctx.subjectId}`);
  if (ctx.requestId) parts.push(`requestId=${ctx.requestId}`);
  return parts.join(' ');
}

/**
 * AI 日志记录器
 */
export const aiLogger = {
  /**
   * 记录请求开始
   */
  requestStart(ctx: AILogContext, promptSummary?: string): void {
    const prefix = buildPrefix(AILogEvent.REQUEST_START);
    const contextStr = buildContextStr(ctx);
    let message = `${prefix} ${contextStr}`;

    if (promptSummary) {
      message += ` prompt="${truncate(promptSummary)}"`;
    }

    console.log(message);
  },

  /**
   * 记录请求结束
   */
  requestEnd(ctx: AILogContext, data: AIRequestEndData): void {
    const prefix = buildPrefix(AILogEvent.REQUEST_END);
    const contextStr = buildContextStr(ctx);

    let tokenInfo = '';
    if (data.totalTokens !== undefined) {
      tokenInfo = ` tokens=${data.totalTokens}`;
      if (data.promptTokens !== undefined && data.completionTokens !== undefined) {
        tokenInfo += ` (prompt=${data.promptTokens}, completion=${data.completionTokens})`;
      }
    }

    const message = `${prefix} ${contextStr} duration=${data.duration}ms${tokenInfo} success=${data.success}`;
    console.log(message);
  },

  /**
   * 记录错误
   */
  error(ctx: AILogContext, data: AIErrorLogData): void {
    const prefix = buildPrefix(AILogEvent.ERROR);
    const contextStr = buildContextStr(ctx);

    let message = `${prefix} ${contextStr} code=${data.code} message="${data.message}"`;
    if (data.httpStatus) {
      message += ` httpStatus=${data.httpStatus}`;
    }

    console.error(message);

    // 如果有堆栈信息，额外输出
    if (data.stack) {
      console.error(`[AI] Stack trace:\n${data.stack}`);
    }
  },

  /**
   * 记录流式请求开始
   */
  streamStart(ctx: AILogContext): void {
    const prefix = buildPrefix(AILogEvent.STREAM_START);
    const contextStr = buildContextStr(ctx);
    console.log(`${prefix} ${contextStr}`);
  },

  /**
   * 记录流式请求结束
   */
  streamEnd(ctx: AILogContext, data: { duration: number; contentLength: number; success: boolean }): void {
    const prefix = buildPrefix(AILogEvent.STREAM_END);
    const contextStr = buildContextStr(ctx);
    const message = `${prefix} ${contextStr} duration=${data.duration}ms contentLength=${data.contentLength} success=${data.success}`;
    console.log(message);
  },
};

/**
 * 创建带上下文的日志记录器
 */
export function createAILogger(baseCtx: AILogContext) {
  const requestId = generateRequestId();
  const ctx = { ...baseCtx, requestId };
  const startTime = Date.now();

  return {
    ctx,

    /**
     * 记录请求开始
     */
    start(promptSummary?: string): void {
      aiLogger.requestStart(ctx, promptSummary);
    },

    /**
     * 记录请求成功结束
     */
    success(usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }): void {
      aiLogger.requestEnd(ctx, {
        duration: Date.now() - startTime,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        totalTokens: usage?.total_tokens,
        success: true,
      });
    },

    /**
     * 记录请求失败
     */
    failure(error: AIErrorLogData): void {
      aiLogger.requestEnd(ctx, {
        duration: Date.now() - startTime,
        success: false,
      });
      aiLogger.error(ctx, error);
    },

    /**
     * 记录流式请求开始
     */
    streamStart(): void {
      aiLogger.streamStart(ctx);
    },

    /**
     * 记录流式请求结束
     */
    streamEnd(contentLength: number, success: boolean): void {
      aiLogger.streamEnd(ctx, {
        duration: Date.now() - startTime,
        contentLength,
        success,
      });
    },

    /**
     * 获取耗时
     */
    getDuration(): number {
      return Date.now() - startTime;
    },
  };
}
