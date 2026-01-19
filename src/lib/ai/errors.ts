/**
 * AI 服务错误类型定义
 *
 * 提供结构化的错误类型，便于前端处理和日志分析
 */

/**
 * AI 错误码枚举
 */
export enum AIErrorCode {
  /** 请求超时 */
  AI_TIMEOUT = 'AI_TIMEOUT',
  /** API 被限流 */
  AI_RATE_LIMITED = 'AI_RATE_LIMITED',
  /** 服务不可用 */
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  /** 响应无效 */
  AI_INVALID_RESPONSE = 'AI_INVALID_RESPONSE',
  /** 内容被过滤 */
  AI_CONTENT_FILTERED = 'AI_CONTENT_FILTERED',
  /** 未知错误 */
  AI_UNKNOWN_ERROR = 'AI_UNKNOWN_ERROR',
}

/**
 * 用户友好的错误信息映射
 */
export const AI_ERROR_MESSAGES: Record<AIErrorCode, string> = {
  [AIErrorCode.AI_TIMEOUT]: '生成超时，请稍后重试',
  [AIErrorCode.AI_RATE_LIMITED]: '服务繁忙，请稍后重试',
  [AIErrorCode.AI_SERVICE_UNAVAILABLE]: 'AI 服务暂时不可用，请稍后重试',
  [AIErrorCode.AI_INVALID_RESPONSE]: '生成结果异常，请重试',
  [AIErrorCode.AI_CONTENT_FILTERED]: '内容生成受限，请重试',
  [AIErrorCode.AI_UNKNOWN_ERROR]: '生成失败，请稍后重试',
};

/**
 * AI 服务错误类
 */
export class AIError extends Error {
  /** 错误码 */
  readonly code: AIErrorCode;
  /** 用户友好的错误信息 */
  readonly userMessage: string;
  /** 原始错误 */
  readonly originalError?: Error;
  /** HTTP 状态码（如果有） */
  readonly httpStatus?: number;

  constructor(
    code: AIErrorCode,
    message?: string,
    originalError?: Error,
    httpStatus?: number
  ) {
    super(message || AI_ERROR_MESSAGES[code]);
    this.name = 'AIError';
    this.code = code;
    this.userMessage = AI_ERROR_MESSAGES[code];
    this.originalError = originalError;
    this.httpStatus = httpStatus;

    // 保持原型链
    Object.setPrototypeOf(this, AIError.prototype);
  }

  /**
   * 转换为 JSON 格式（用于日志）
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      httpStatus: this.httpStatus,
      originalError: this.originalError?.message,
      stack: this.stack,
    };
  }
}

/**
 * 从原始错误创建 AIError
 *
 * @param error - 原始错误
 * @returns AIError 实例
 */
export function wrapAIError(error: unknown): AIError {
  // 如果已经是 AIError，直接返回
  if (error instanceof AIError) {
    return error;
  }

  // 处理 OpenAI SDK 错误
  if (error && typeof error === 'object') {
    const err = error as { status?: number; code?: string; message?: string; error?: { type?: string } };

    // 超时错误
    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED' ||
        err.message?.includes('timeout') || err.message?.includes('Timeout')) {
      return new AIError(
        AIErrorCode.AI_TIMEOUT,
        `Request timed out: ${err.message}`,
        error instanceof Error ? error : undefined,
        err.status
      );
    }

    // HTTP 状态码错误
    if (err.status) {
      // 429 - 限流
      if (err.status === 429) {
        return new AIError(
          AIErrorCode.AI_RATE_LIMITED,
          `Rate limited: ${err.message}`,
          error instanceof Error ? error : undefined,
          429
        );
      }

      // 5xx - 服务不可用
      if (err.status >= 500) {
        return new AIError(
          AIErrorCode.AI_SERVICE_UNAVAILABLE,
          `Service unavailable (${err.status}): ${err.message}`,
          error instanceof Error ? error : undefined,
          err.status
        );
      }
    }

    // 内容过滤
    if (err.error?.type === 'content_filter' ||
        err.message?.includes('content_filter') ||
        err.message?.includes('content policy')) {
      return new AIError(
        AIErrorCode.AI_CONTENT_FILTERED,
        `Content filtered: ${err.message}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  // 默认未知错误
  const message = error instanceof Error ? error.message : String(error);
  return new AIError(
    AIErrorCode.AI_UNKNOWN_ERROR,
    message,
    error instanceof Error ? error : undefined
  );
}

/**
 * 判断错误是否可重试
 */
export function isRetryableError(error: AIError): boolean {
  return [
    AIErrorCode.AI_TIMEOUT,
    AIErrorCode.AI_RATE_LIMITED,
    AIErrorCode.AI_SERVICE_UNAVAILABLE,
  ].includes(error.code);
}
