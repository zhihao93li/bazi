/**
 * Stripe 支付服务
 * 
 * 功能：
 * - 创建 Checkout Session
 * - 验证 Webhook 签名
 * - 处理支付成功回调
 */

import Stripe from 'stripe';

// 初始化 Stripe 客户端
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.warn('Warning: STRIPE_SECRET_KEY is not set. Stripe payments will not work.');
}

export const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

/**
 * 创建 Checkout Session 参数
 */
export interface CreateCheckoutSessionParams {
  orderNo: string;
  packageName: string;
  amount: number;       // 单位：分
  points: number;
  successUrl: string;
  cancelUrl: string;
}

/**
 * 创建 Checkout Session 结果
 */
export interface CheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
}

/**
 * 创建 Stripe Checkout Session
 * 用于跳转到 Stripe 托管支付页面
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CheckoutSessionResult> {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY.');
  }

  const { orderNo, packageName, amount, points, successUrl, cancelUrl } = params;

  const session = await stripe.checkout.sessions.create({
    // 不指定 payment_method_types，让 Stripe 自动显示 Dashboard 中启用的所有支付方式
    // 包括：银行卡、支付宝、微信支付、Apple Pay、Google Pay 等
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'cny',
          product_data: {
            name: packageName,
            description: `充值 ${points.toLocaleString()} 积分`,
          },
          unit_amount: amount, // Stripe 使用最小货币单位（分）
        },
        quantity: 1,
      },
    ],
    metadata: {
      orderNo,
      points: points.toString(),
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session URL');
  }

  return {
    sessionId: session.id,
    checkoutUrl: session.url,
  };
}

/**
 * 验证 Stripe Webhook 签名
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY.');
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * 从 Checkout Session 中提取订单信息
 */
export interface CheckoutSessionInfo {
  orderNo: string;
  paymentIntentId: string | null;
  amountTotal: number | null;
  paymentStatus: string;
}

export function extractSessionInfo(session: Stripe.Checkout.Session): CheckoutSessionInfo {
  return {
    orderNo: session.metadata?.orderNo || '',
    paymentIntentId: typeof session.payment_intent === 'string' 
      ? session.payment_intent 
      : session.payment_intent?.id || null,
    amountTotal: session.amount_total,
    paymentStatus: session.payment_status,
  };
}
