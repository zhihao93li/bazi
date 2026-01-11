/**
 * 支付服务
 * 
 * 功能：
 * - 订单号生成（确保唯一性）
 * - 订单创建和状态管理
 * - Mock 支付确认（开发环境）
 * - 订单查询
 */

import prisma from "../prisma.js";
import { addPoints } from "../points/service.js";
import {
  PaymentOrderInfo,
  CreateOrderParams,
  CreateOrderResult,
  OrderQueryResult,
  MockPaymentConfirmParams,
  PaymentConfirmResult,
  PointsPackageInfo,
  PaymentMethod,
  OrderStatus,
  PaymentError,
  PaymentErrorCode,
} from "./types.js";

/**
 * 生成唯一订单号
 * 格式: BZ + 年月日时分秒 + 6位随机数
 * 例如: BZ20260109143052123456
 */
export function generateOrderNo(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  
  // 6位随机数
  const random = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  
  return `BZ${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}${random}`;
}

/**
 * 获取所有可用的积分套餐
 */
export async function getActivePackages(): Promise<PointsPackageInfo[]> {
  const packages = await prisma.pointsPackage.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  return packages.map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    points: pkg.points,
    price: pkg.price,
    isActive: pkg.isActive,
    sortOrder: pkg.sortOrder,
  }));
}

/**
 * 根据ID获取积分套餐
 */
export async function getPackageById(packageId: string): Promise<PointsPackageInfo | null> {
  const pkg = await prisma.pointsPackage.findUnique({
    where: { id: packageId },
  });

  if (!pkg) {
    return null;
  }

  return {
    id: pkg.id,
    name: pkg.name,
    points: pkg.points,
    price: pkg.price,
    isActive: pkg.isActive,
    sortOrder: pkg.sortOrder,
  };
}


/**
 * 创建支付订单
 * Mock 版本：直接返回成功状态，不实际调用支付接口
 */
export async function createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
  const { userId, packageId, platform } = params;

  // 获取套餐信息
  const pkg = await getPackageById(packageId);
  
  if (!pkg) {
    throw new PaymentError(
      PaymentErrorCode.PACKAGE_NOT_FOUND,
      "积分套餐不存在"
    );
  }

  if (!pkg.isActive) {
    throw new PaymentError(
      PaymentErrorCode.PACKAGE_INACTIVE,
      "该积分套餐已下架"
    );
  }

  // 生成唯一订单号
  const orderNo = generateOrderNo();
  
  // 确定支付方式
  const paymentMethod: PaymentMethod = platform === 'pc' ? 'alipay_qrcode' : 'alipay_h5';

  try {
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

    // Mock 支付：生成模拟的支付链接
    const result: CreateOrderResult = {
      success: true,
      orderNo,
      amount: pkg.price,
      points: pkg.points,
    };

    if (platform === 'pc') {
      // PC端返回模拟二维码URL
      result.qrCodeUrl = `mock://pay.alipay.com/qrcode/${orderNo}`;
    } else {
      // 移动端返回模拟H5支付链接
      result.h5PayUrl = `mock://pay.alipay.com/h5/${orderNo}`;
    }

    return result;
  } catch (error) {
    throw new PaymentError(
      PaymentErrorCode.ORDER_CREATION_FAILED,
      `订单创建失败: ${error instanceof Error ? error.message : "未知错误"}`
    );
  }
}

/**
 * 查询订单信息
 */
export async function queryOrder(orderNo: string): Promise<OrderQueryResult> {
  const order = await prisma.paymentOrder.findUnique({
    where: { orderNo },
  });

  if (!order) {
    return {
      success: false,
      message: "订单不存在",
    };
  }

  return {
    success: true,
    order: {
      id: order.id,
      userId: order.userId,
      orderNo: order.orderNo,
      amount: order.amount,
      points: order.points,
      paymentMethod: order.paymentMethod as PaymentMethod,
      status: order.status as OrderStatus,
      transactionId: order.transactionId,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
    },
  };
}

/**
 * 根据用户ID查询订单列表
 */
export async function queryOrdersByUserId(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ orders: PaymentOrderInfo[]; total: number }> {
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.paymentOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.paymentOrder.count({
      where: { userId },
    }),
  ]);

  return {
    orders: orders.map((order) => ({
      id: order.id,
      userId: order.userId,
      orderNo: order.orderNo,
      amount: order.amount,
      points: order.points,
      paymentMethod: order.paymentMethod as PaymentMethod,
      status: order.status as OrderStatus,
      transactionId: order.transactionId,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
    })),
    total,
  };
}


/**
 * Mock 支付确认
 * 开发环境专用：直接确认支付成功并增加积分
 */
export async function mockConfirmPayment(params: MockPaymentConfirmParams): Promise<PaymentConfirmResult> {
  const { orderNo, transactionId } = params;

  // 查询订单
  const order = await prisma.paymentOrder.findUnique({
    where: { orderNo },
  });

  if (!order) {
    throw new PaymentError(
      PaymentErrorCode.ORDER_NOT_FOUND,
      "订单不存在"
    );
  }

  // 检查订单状态
  if (order.status === 'paid') {
    // 幂等处理：已支付的订单直接返回成功
    return {
      success: true,
      orderNo: order.orderNo,
      pointsAdded: order.points,
      message: "订单已支付",
    };
  }

  if (order.status !== 'pending') {
    throw new PaymentError(
      PaymentErrorCode.OPERATION_FAILED,
      `订单状态异常: ${order.status}`
    );
  }

  try {
    // 使用事务确保原子性
    const result = await prisma.$transaction(async (tx) => {
      // 更新订单状态为已支付
      const updatedOrder = await tx.paymentOrder.update({
        where: { orderNo },
        data: {
          status: 'paid',
          transactionId: transactionId || `MOCK_${Date.now()}`,
          paidAt: new Date(),
        },
      });

      return updatedOrder;
    });

    // 增加用户积分（在事务外执行，因为 addPoints 有自己的事务）
    await addPoints({
      userId: order.userId,
      amount: order.points,
      type: 'recharge',
      description: `充值套餐 - 订单号: ${orderNo}`,
      orderId: order.id,
    });

    return {
      success: true,
      orderNo: result.orderNo,
      pointsAdded: result.points,
      message: "支付确认成功",
    };
  } catch (error) {
    if (error instanceof PaymentError) {
      throw error;
    }
    throw new PaymentError(
      PaymentErrorCode.OPERATION_FAILED,
      `支付确认失败: ${error instanceof Error ? error.message : "未知错误"}`
    );
  }
}

/**
 * 更新订单状态
 */
export async function updateOrderStatus(
  orderNo: string,
  status: OrderStatus,
  transactionId?: string
): Promise<PaymentOrderInfo> {
  const updateData: { status: OrderStatus; transactionId?: string; paidAt?: Date } = {
    status,
  };

  if (transactionId) {
    updateData.transactionId = transactionId;
  }

  if (status === 'paid') {
    updateData.paidAt = new Date();
  }

  const order = await prisma.paymentOrder.update({
    where: { orderNo },
    data: updateData,
  });

  return {
    id: order.id,
    userId: order.userId,
    orderNo: order.orderNo,
    amount: order.amount,
    points: order.points,
    paymentMethod: order.paymentMethod as PaymentMethod,
    status: order.status as OrderStatus,
    transactionId: order.transactionId,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
  };
}
