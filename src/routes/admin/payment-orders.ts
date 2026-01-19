/**
 * 管理后台充值订单路由
 */

import { Hono } from 'hono';
import prisma from '../../lib/prisma.js';
import { adminAuthRequired } from '../../middleware/admin-auth.js';

const app = new Hono();

// 所有路由需要管理员认证
app.use('*', adminAuthRequired);

/**
 * GET /api/admin/payment-orders
 * 获取充值订单列表
 */
app.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1', 10);
    const pageSize = parseInt(c.req.query('pageSize') || '20', 10);
    const sort = c.req.query('sort') || 'createdAt';
    const order = c.req.query('order') || 'desc';
    const status = c.req.query('status') || '';
    const paymentMethod = c.req.query('paymentMethod') || '';
    const userId = c.req.query('userId') || '';
    const orderNo = c.req.query('orderNo') || '';

    // 构建查询条件
    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }
    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }
    if (userId) {
      where.userId = userId;
    }
    if (orderNo) {
      where.orderNo = { contains: orderNo };
    }

    // 并行查询数据和总数
    const [orders, total] = await Promise.all([
      prisma.paymentOrder.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sort]: order },
        select: {
          id: true,
          userId: true,
          orderNo: true,
          amount: true,
          points: true,
          paymentMethod: true,
          status: true,
          transactionId: true,
          createdAt: true,
          paidAt: true,
          user: {
            select: {
              id: true,
              phone: true,
              username: true,
            },
          },
        },
      }),
      prisma.paymentOrder.count({ where }),
    ]);

    return c.json({
      success: true,
      data: {
        list: orders,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get payment orders error:', error);
    return c.json({ success: false, message: '获取充值订单列表失败' }, 500);
  }
});

/**
 * GET /api/admin/payment-orders/:id
 * 获取充值订单详情
 */
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const order = await prisma.paymentOrder.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            username: true,
          },
        },
      },
    });

    if (!order) {
      return c.json({ success: false, message: '订单不存在' }, 404);
    }

    return c.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Get payment order detail error:', error);
    return c.json({ success: false, message: '获取订单详情失败' }, 500);
  }
});

export const adminPaymentOrdersRoutes = app;
