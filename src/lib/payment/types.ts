/**
 * 支付模块类型定义
 */

/**
 * 支付方式
 */
export type PaymentMethod = 'alipay_qrcode' | 'alipay_h5';

/**
 * 订单状态
 */
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded';

/**
 * 支付平台
 */
export type PaymentPlatform = 'pc' | 'mobile';

/**
 * 支付订单信息
 */
export interface PaymentOrderInfo {
  id: string;
  userId: string;
  orderNo: string;
  amount: number;        // 金额（分）
  points: number;        // 对应积分
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  transactionId?: string | null;
  createdAt: Date;
  paidAt?: Date | null;
}

/**
 * 创建订单参数
 */
export interface CreateOrderParams {
  userId: string;
  packageId: string;
  platform: PaymentPlatform;
}

/**
 * 创建订单结果
 */
export interface CreateOrderResult {
  success: boolean;
  orderNo: string;
  amount: number;
  points: number;
  qrCodeUrl?: string;    // PC端返回二维码URL
  h5PayUrl?: string;     // 移动端返回H5支付链接
  message?: string;
}

/**
 * 订单查询结果
 */
export interface OrderQueryResult {
  success: boolean;
  order?: PaymentOrderInfo;
  message?: string;
}

/**
 * Mock 支付确认参数
 */
export interface MockPaymentConfirmParams {
  orderNo: string;
  transactionId?: string;
}

/**
 * 支付确认结果
 */
export interface PaymentConfirmResult {
  success: boolean;
  orderNo?: string;
  pointsAdded?: number;
  message?: string;
}

/**
 * 积分套餐信息
 */
export interface PointsPackageInfo {
  id: string;
  name: string;
  points: number;
  price: number;  // 金额（分）
  isActive: boolean;
  sortOrder: number;
}

/**
 * 支付错误码
 */
export enum PaymentErrorCode {
  PACKAGE_NOT_FOUND = 'PAY_PACKAGE_NOT_FOUND',
  PACKAGE_INACTIVE = 'PAY_PACKAGE_INACTIVE',
  ORDER_NOT_FOUND = 'PAY_ORDER_NOT_FOUND',
  ORDER_ALREADY_PAID = 'PAY_ORDER_ALREADY_PAID',
  ORDER_CREATION_FAILED = 'PAY_ORDER_CREATION_FAILED',
  INVALID_SIGNATURE = 'PAY_INVALID_SIGNATURE',
  OPERATION_FAILED = 'PAY_OPERATION_FAILED',
}

/**
 * 支付错误
 */
export class PaymentError extends Error {
  code: PaymentErrorCode;
  
  constructor(code: PaymentErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'PaymentError';
  }
}
