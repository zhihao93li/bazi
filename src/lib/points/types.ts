/**
 * 积分系统类型定义
 */

/**
 * 积分变动类型
 */
export type PointsTransactionType = 'recharge' | 'consume' | 'gift';

/**
 * 积分账户信息
 */
export interface PointsAccountInfo {
  id: string;
  userId: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 积分交易记录
 */
export interface PointsTransactionRecord {
  id: string;
  userId: string;
  type: PointsTransactionType;
  amount: number;
  balance: number;
  description: string;
  orderId?: string | null;
  createdAt: Date;
}

/**
 * 积分查询结果
 */
export interface PointsQueryResult {
  balance: number;
  transactions: PointsTransactionRecord[];
  total: number;
  page: number;
  limit: number;
}

/**
 * 积分操作结果
 */
export interface PointsOperationResult {
  success: boolean;
  message: string;
  balance?: number;
  transactionId?: string;
}

/**
 * 积分变动参数
 */
export interface PointsChangeParams {
  userId: string;
  amount: number;
  type: PointsTransactionType;
  description: string;
  orderId?: string;
}

/**
 * 积分错误码
 */
export enum PointsErrorCode {
  INSUFFICIENT_BALANCE = 'POINTS_INSUFFICIENT',
  USER_NOT_FOUND = 'POINTS_USER_NOT_FOUND',
  INVALID_AMOUNT = 'POINTS_INVALID_AMOUNT',
  OPERATION_FAILED = 'POINTS_OPERATION_FAILED',
}

/**
 * 积分错误
 */
export class PointsError extends Error {
  code: PointsErrorCode;
  
  constructor(code: PointsErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'PointsError';
  }
}
