/**
 * 支付相关 API 路由
 * 
 * POST /create - 创建支付订单
 * POST /create-checkout - 创建 Stripe Checkout Session
 * POST /create-mazfu - 创建码支付订单
 * GET /status/:orderNo - 查询订单状态
 * POST /mock-confirm - Mock 支付确认（开发环境）
 * POST /webhook - Stripe Webhook 回调
 * POST /mazfu-notify - 码支付异步通知回调
 * GET /mazfu-return - 码支付同步跳转回调
 */

import { Hono } from 'hono';
import type Stripe from 'stripe';
import { authRequired, getCurrentUserId } from '../middleware/auth.js';
import { 
  createOrder, 
  queryOrder, 
  mockConfirmPayment,
  getPackageById,
  generateOrderNo,
} from '../lib/payment/service.js';
import { PaymentError, PaymentErrorCode, PaymentMethod } from '../lib/payment/types.js';
import { 
  createCheckoutSession, 
  verifyWebhookSignature,
  extractSessionInfo,
  stripe,
} from '../lib/payment/stripe.js';
import {
  createPayment as createMazfuPayment,
  verifySign,
  isMazfuConfigured,
  getMazfuConfig,
  type MazfuNotifyParams,
} from '../lib/payment/mazfu.js';
import prisma from '../lib/prisma.js';
import { addPoints } from '../lib/points/service.js';

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
 * 创建 Stripe Checkout Session
 * POST /api/payment/create-checkout
 */
paymentRoutes.post('/create-checkout', authRequired, async (c) => {
  try {
    const userId = getCurrentUserId(c);
    if (!userId) {
      return c.json({ success: false, message: '请先登录' }, 401);
    }

    if (!stripe) {
      return c.json({ success: false, message: 'Stripe 支付未配置' }, 503);
    }

    const body = await c.req.json();
    const { packageId } = body;

    if (!packageId) {
      return c.json({ success: false, message: '请选择充值套餐' }, 400);
    }

    // 获取套餐信息
    const pkg = await getPackageById(packageId);
    if (!pkg) {
      return c.json({ success: false, message: '套餐不存在' }, 404);
    }
    if (!pkg.isActive) {
      return c.json({ success: false, message: '该套餐已下架' }, 400);
    }

    // 生成订单号
    const orderNo = generateOrderNo();

    // 创建订单记录
    await prisma.paymentOrder.create({
      data: {
        userId,
        orderNo,
        amount: pkg.price,
        points: pkg.points,
        paymentMethod: 'stripe',
        status: 'pending',
      },
    });

    // 构建回调 URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const successUrl = `${frontendUrl}/payment/success?order_no=${orderNo}`;
    const cancelUrl = `${frontendUrl}/payment/cancel?order_no=${orderNo}`;

    // 创建 Stripe Checkout Session
    const session = await createCheckoutSession({
      orderNo,
      packageName: pkg.name,
      amount: pkg.price,
      points: pkg.points,
      successUrl,
      cancelUrl,
    });

    // 更新订单的 stripeSessionId
    await prisma.paymentOrder.update({
      where: { orderNo },
      data: { stripeSessionId: session.sessionId },
    });

    return c.json({
      success: true,
      orderNo,
      checkoutUrl: session.checkoutUrl,
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    
    if (error instanceof PaymentError) {
      return c.json(
        { success: false, message: error.message, code: error.code },
        400
      );
    }

    return c.json({ success: false, message: '创建支付会话失败' }, 500);
  }
});

/**
 * Stripe Webhook 回调
 * POST /api/payment/webhook
 * 
 * 注意：此端点需要原始请求体来验证签名
 */
paymentRoutes.post('/webhook', async (c) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return c.json({ error: 'Webhook not configured' }, 500);
  }

  if (!stripe) {
    console.error('Stripe is not configured');
    return c.json({ error: 'Stripe not configured' }, 500);
  }

  try {
    // 获取原始请求体和签名
    const rawBody = await c.req.text();
    const signature = c.req.header('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return c.json({ error: 'Missing signature' }, 400);
    }

    // 验证签名并解析事件
    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return c.json({ error: 'Invalid signature' }, 400);
    }

    // 处理事件
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const sessionInfo = extractSessionInfo(session);

        console.log('Checkout session completed:', sessionInfo);

        if (!sessionInfo.orderNo) {
          console.error('Missing orderNo in session metadata');
          break;
        }

        // 查询订单
        const order = await prisma.paymentOrder.findUnique({
          where: { orderNo: sessionInfo.orderNo },
        });

        if (!order) {
          console.error('Order not found:', sessionInfo.orderNo);
          break;
        }

        // 幂等处理：已支付的订单跳过
        if (order.status === 'paid') {
          console.log('Order already paid:', sessionInfo.orderNo);
          break;
        }

        // 更新订单状态
        await prisma.paymentOrder.update({
          where: { orderNo: sessionInfo.orderNo },
          data: {
            status: 'paid',
            transactionId: sessionInfo.paymentIntentId,
            paidAt: new Date(),
          },
        });

        // 增加用户积分
        await addPoints({
          userId: order.userId,
          amount: order.points,
          type: 'recharge',
          description: `充值套餐 - 订单号: ${sessionInfo.orderNo}`,
          orderId: order.id,
        });

        console.log('Payment processed successfully:', sessionInfo.orderNo);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderNo = session.metadata?.orderNo;

        if (orderNo) {
          // 更新订单状态为失败
          await prisma.paymentOrder.update({
            where: { orderNo },
            data: { status: 'failed' },
          });
          console.log('Checkout session expired:', orderNo);
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return c.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

/**
 * 创建码支付订单
 * POST /api/payment/create-mazfu
 * 
 * 需求: 2.1, 2.2, 7.4
 */
paymentRoutes.post('/create-mazfu', authRequired, async (c) => {
  try {
    const userId = getCurrentUserId(c);
    if (!userId) {
      return c.json({ success: false, message: '请先登录' }, 401);
    }

    // 检查码支付是否已配置
    if (!isMazfuConfigured()) {
      return c.json({ 
        success: false, 
        message: '码支付服务未配置',
        code: 'MAZFU_NOT_CONFIGURED',
      }, 503);
    }

    const body = await c.req.json();
    const { packageId, device = 'pc' } = body;

    if (!packageId) {
      return c.json({ success: false, message: '请选择充值套餐' }, 400);
    }

    // 验证设备类型
    if (device !== 'pc' && device !== 'mobile') {
      return c.json({ success: false, message: '无效的设备类型' }, 400);
    }

    // 获取套餐信息
    const pkg = await getPackageById(packageId);
    if (!pkg) {
      return c.json({ success: false, message: '套餐不存在' }, 404);
    }
    if (!pkg.isActive) {
      return c.json({ success: false, message: '该套餐已下架' }, 400);
    }

    // 生成订单号
    const orderNo = generateOrderNo();

    // 确定支付方式
    const paymentMethod: PaymentMethod = device === 'pc' ? 'alipay_qrcode' : 'alipay_h5';

    // 创建订单记录
    await prisma.paymentOrder.create({
      data: {
        userId,
        orderNo,
        amount: pkg.price,
        points: pkg.points,
        paymentMethod,
        status: 'pending',
      },
    });

    // 获取客户端 IP
    const clientIp = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() 
      || c.req.header('x-real-ip') 
      || undefined;

    // 调用码支付创建支付请求
    const mazfuResult = await createMazfuPayment({
      orderNo,
      amount: pkg.price,
      productName: pkg.name,
      device,
      clientIp,
    });

    if (!mazfuResult.success) {
      // 更新订单状态为失败
      await prisma.paymentOrder.update({
        where: { orderNo },
        data: { status: 'failed' },
      });

      return c.json({
        success: false,
        message: mazfuResult.message || '创建支付请求失败',
        code: 'MAZFU_API_ERROR',
      }, 502);
    }

    // 更新订单的交易号
    if (mazfuResult.tradeNo) {
      await prisma.paymentOrder.update({
        where: { orderNo },
        data: { transactionId: mazfuResult.tradeNo },
      });
    }

    // 返回结果
    const response: {
      success: boolean;
      orderNo: string;
      amount: number;
      points: number;
      qrcode?: string;
      payurl?: string;
      money?: string;
    } = {
      success: true,
      orderNo,
      amount: pkg.price,
      points: pkg.points,
    };

    if (device === 'pc' && mazfuResult.qrcode) {
      response.qrcode = mazfuResult.qrcode;
    }
    if (device === 'mobile' && mazfuResult.payurl) {
      response.payurl = mazfuResult.payurl;
    }
    if (mazfuResult.money) {
      response.money = mazfuResult.money;
    }

    return c.json(response);
  } catch (error) {
    console.error('Create mazfu order error:', error);

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
 * 码支付异步通知回调
 * POST /api/payment/mazfu-notify
 * 
 * 需求: 3.1, 3.2, 3.3, 3.4, 3.6
 */
paymentRoutes.post('/mazfu-notify', async (c) => {
  try {
    // 获取配置
    const config = getMazfuConfig();
    if (!config.key) {
      console.error('Mazfu key not configured');
      return c.text('fail', 500);
    }

    // 解析请求体（支持 form-urlencoded 和 JSON）
    let params: MazfuNotifyParams;
    const contentType = c.req.header('content-type') || '';
    
    if (contentType.includes('application/json')) {
      params = await c.req.json() as MazfuNotifyParams;
    } else {
      // form-urlencoded
      const formData = await c.req.parseBody();
      params = {
        pid: String(formData.pid || ''),
        trade_no: String(formData.trade_no || ''),
        out_trade_no: String(formData.out_trade_no || ''),
        type: String(formData.type || ''),
        name: String(formData.name || ''),
        money: String(formData.money || ''),
        trade_status: String(formData.trade_status || ''),
        param: formData.param ? String(formData.param) : undefined,
        sign: String(formData.sign || ''),
        sign_type: String(formData.sign_type || ''),
      };
    }

    console.log('Mazfu notify received:', {
      out_trade_no: params.out_trade_no,
      trade_no: params.trade_no,
      trade_status: params.trade_status,
      money: params.money,
    });

    // 验证签名
    if (!verifySign(params, config.key)) {
      console.error('Mazfu notify signature verification failed:', params.out_trade_no);
      return c.text('fail', 403);
    }

    // 检查支付状态
    if (params.trade_status !== 'TRADE_SUCCESS') {
      console.log('Mazfu notify: trade not success:', params.trade_status);
      return c.text('success');
    }

    const orderNo = params.out_trade_no;

    // 查询订单
    const order = await prisma.paymentOrder.findUnique({
      where: { orderNo },
    });

    if (!order) {
      console.error('Mazfu notify: order not found:', orderNo);
      return c.text('fail', 404);
    }

    // 幂等处理：已支付的订单直接返回成功
    if (order.status === 'paid') {
      console.log('Mazfu notify: order already paid:', orderNo);
      return c.text('success');
    }

    // 更新订单状态为已支付
    await prisma.paymentOrder.update({
      where: { orderNo },
      data: {
        status: 'paid',
        transactionId: params.trade_no,
        paidAt: new Date(),
      },
    });

    // 为用户充值积分
    await addPoints({
      userId: order.userId,
      amount: order.points,
      type: 'recharge',
      description: `充值套餐 - 订单号: ${orderNo}`,
      orderId: order.id,
    });

    console.log('Mazfu notify: payment processed successfully:', orderNo);

    // 返回 success 表示处理成功
    return c.text('success');
  } catch (error) {
    console.error('Mazfu notify processing error:', error);
    return c.text('fail', 500);
  }
});

/**
 * 码支付同步跳转回调
 * GET /api/payment/mazfu-return
 * 
 * 需求: 3.5
 */
paymentRoutes.get('/mazfu-return', async (c) => {
  try {
    // 获取配置
    const config = getMazfuConfig();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // 获取查询参数
    const query = c.req.query();
    const params: MazfuNotifyParams = {
      pid: query.pid || '',
      trade_no: query.trade_no || '',
      out_trade_no: query.out_trade_no || '',
      type: query.type || '',
      name: query.name || '',
      money: query.money || '',
      trade_status: query.trade_status || '',
      param: query.param,
      sign: query.sign || '',
      sign_type: query.sign_type || '',
    };

    console.log('Mazfu return received:', {
      out_trade_no: params.out_trade_no,
      trade_status: params.trade_status,
    });

    // 验证签名
    const signValid = config.key ? verifySign(params, config.key) : false;

    if (!signValid) {
      console.error('Mazfu return signature verification failed:', params.out_trade_no);
      // 签名验证失败，重定向到失败页面
      return c.redirect(`${frontendUrl}/payment/result?order_no=${params.out_trade_no}&status=failed&error=invalid_signature`);
    }

    // 根据支付状态重定向
    const status = params.trade_status === 'TRADE_SUCCESS' ? 'success' : 'pending';
    return c.redirect(`${frontendUrl}/payment/result?order_no=${params.out_trade_no}&status=${status}`);
  } catch (error) {
    console.error('Mazfu return processing error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return c.redirect(`${frontendUrl}/payment/result?status=error`);
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
