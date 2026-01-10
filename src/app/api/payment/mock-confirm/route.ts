/**
 * Mock 支付确认接口
 * 
 * 开发环境专用：直接确认支付成功并增加积分
 * 
 * POST /api/payment/mock-confirm
 * Body: { orderNo: string, transactionId?: string }
 * 
 * Requirements: 5.5
 */

import { NextRequest, NextResponse } from "next/server";
import { mockConfirmPayment, PaymentError, PaymentErrorCode } from "@/lib/payment";

/**
 * 检查是否为开发环境
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV !== 'production';
}

/**
 * Mock 支付确认
 * 
 * 仅在开发环境可用，用于测试支付流程
 */
export async function POST(request: NextRequest) {
  // 生产环境禁止使用此接口
  if (!isDevelopment()) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '此接口仅在开发环境可用',
        },
      },
      { status: 403 }
    );
  }

  try {
    // 解析请求体
    const body = await request.json();
    const { orderNo, transactionId } = body;

    // 验证必填参数
    if (!orderNo || typeof orderNo !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: '订单号(orderNo)为必填参数',
          },
        },
        { status: 400 }
      );
    }

    // 调用 Mock 支付确认服务
    const result = await mockConfirmPayment({
      orderNo,
      transactionId,
    });

    return NextResponse.json({
      success: true,
      data: {
        orderNo: result.orderNo,
        pointsAdded: result.pointsAdded,
        message: result.message,
      },
    });
  } catch (error) {
    // 处理支付错误
    if (error instanceof PaymentError) {
      const statusCode = getStatusCodeForPaymentError(error.code);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: statusCode }
      );
    }

    // 处理其他错误
    console.error('Mock payment confirm error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '服务器内部错误',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 根据支付错误码返回对应的 HTTP 状态码
 */
function getStatusCodeForPaymentError(code: PaymentErrorCode): number {
  switch (code) {
    case PaymentErrorCode.ORDER_NOT_FOUND:
      return 404;
    case PaymentErrorCode.ORDER_ALREADY_PAID:
      return 409;
    case PaymentErrorCode.INVALID_SIGNATURE:
      return 403;
    case PaymentErrorCode.PACKAGE_NOT_FOUND:
    case PaymentErrorCode.PACKAGE_INACTIVE:
      return 400;
    default:
      return 500;
  }
}
