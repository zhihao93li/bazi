/**
 * 支付相关 API 路由
 * 
 * POST /create - 创建支付订单
 * GET /status/:orderNo - 查询订单状态
 * POST /mock-confirm - Mock 支付确认（开发环境）
 */

import { Hono } from 'hono';
import { authRequired, getCurrentUserId } from '../middleware/auth.js';
import { createOrder, queryOrder, mockConfirmPayment } from '../lib/payment/service.js';
import { PaymentError, PaymentErrorCode } from '../lib/payment/types.js';

export const paymentRoutes = new Hono();

/**
 * 创建支付订单
 * POST /api/payment/create
 */
paymentRoutes.post('/create', authRequired, async (c) => {
  try {
    const userId = getCurrentUserId(c);
    if (!userId) {
      return c.json({ success: false, message: '请先登录' }, 401);
    }

    const body = await c.req.json();
    const { packageId, platform = 'pc' } = body;

    if (!packageId) {
      return c.json({ success: false, message: '请选择充值套餐' }, 400);
    }

    const result = await createOrder({
      userId,
      packageId,
      platform,
    });

    return c.json(result);
  } catch (error) {
    console.error('Create order error:', error);

    if (error instanceof PaymentError) {
      return c.json(
        { success: false, message: error.message, code: error.code },
        400
      );
    }

    return c.json({ success: false, message: '创建订单失败' }, 500);
  }
});

/**
 * 查询订单状态
 * GET /api/payment/status/:orderNo
 */
paymentRoutes.get('/status/:orderNo', authRequired, async (c) => {
  try {
    const userId = getCurrentUserId(c);
    if (!userId) {
      return c.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        401
      );
    }

    const orderNo = c.req.param('orderNo');

    if (!orderNo) {
      return c.json(
        { success: false, error: { code: 'INVALID_PARAMS', message: '订单号不能为空' } },
        400
      );
    }

    // 查询订单
    const result = await queryOrder(orderNo);

    if (!result.success || !result.order) {
      return c.json(
        { success: false, error: { code: 'ORDER_NOT_FOUND', message: result.message || '订单不存在' } },
        404
      );
    }

    // 确保用户只能查询自己的订单
    if (result.order.userId !== userId) {
      return c.json(
        { success: false, error: { code: 'FORBIDDEN', message: '无权查看此订单' } },
        403
      );
    }

    return c.json({
      success: true,
      data: {
        orderNo: result.order.orderNo,
        amount: result.order.amount,
        points: result.order.points,
        status: result.order.status,
        paymentMethod: result.order.paymentMethod,
        transactionId: result.order.transactionId,
        createdAt: result.order.createdAt,
        paidAt: result.order.paidAt,
      },
    });
  } catch (error) {
    console.error('Query order status error:', error);
    return c.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '查询订单状态失败' } },
      500
    );
  }
});

/**
 * Mock 支付确认（开发环境）
 * POST /api/payment/mock-confirm
 */
paymentRoutes.post('/mock-confirm', async (c) => {
  // 生产环境禁止使用此接口
  if (process.env.NODE_ENV === 'production') {
    return c.json(
      { success: false, error: { code: 'FORBIDDEN', message: '此接口仅在开发环境可用' } },
      403
    );
  }

  try {
    const body = await c.req.json();
    const { orderNo, transactionId } = body;

    // 验证必填参数
    if (!orderNo || typeof orderNo !== 'string') {
      return c.json(
        { success: false, error: { code: 'INVALID_PARAMS', message: '订单号(orderNo)为必填参数' } },
        400
      );
    }

    // 调用 Mock 支付确认服务
    const result = await mockConfirmPayment({
      orderNo,
      transactionId,
    });

    return c.json({
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
      return c.json(
        { success: false, error: { code: error.code, message: error.message } },
        statusCode
      );
    }

    // 处理其他错误
    console.error('Mock payment confirm error:', error);
    return c.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' } },
      500
    );
  }
});

/**
 * 根据支付错误码返回对应的 HTTP 状态码
 */
function getStatusCodeForPaymentError(code: PaymentErrorCode): 400 | 403 | 404 | 409 | 500 {
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
