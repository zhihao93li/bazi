/**
 * 管理后台 Dashboard 路由
 */

import { Hono } from 'hono';
import prisma from '../../lib/prisma.js';
import { adminAuthRequired } from '../../middleware/admin-auth.js';

const app = new Hono();

// 所有路由需要管理员认证
app.use('*', adminAuthRequired);

/**
 * GET /api/admin/dashboard/stats
 * 获取统计数据
 */
app.get('/stats', async (c) => {
  try {
    // 并行查询各项统计数据
    const [
      totalUsers,
      totalSubjects,
      totalThemeAnalyses,
      totalPaymentOrders,
      totalRevenue,
      todayUsers,
      todayOrders,
      pendingTasks,
    ] = await Promise.all([
      // 总用户数
      prisma.user.count(),
      // 总命盘数
      prisma.subject.count(),
      // 总解读数
      prisma.themeAnalysis.count(),
      // 总充值订单数
      prisma.paymentOrder.count({ where: { status: 'paid' } }),
      // 总收入（分）
      prisma.paymentOrder.aggregate({
        where: { status: 'paid' },
        _sum: { amount: true },
      }),
      // 今日新增用户
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      // 今日充值订单
      prisma.paymentOrder.count({
        where: {
          status: 'paid',
          paidAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      // 待处理任务数
      prisma.task.count({
        where: {
          status: { in: ['pending', 'processing'] },
        },
      }),
    ]);

    return c.json({
      success: true,
      data: {
        totalUsers,
        totalSubjects,
        totalThemeAnalyses,
        totalPaymentOrders,
        totalRevenue: totalRevenue._sum.amount || 0,
        todayUsers,
        todayOrders,
        pendingTasks,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return c.json({ success: false, message: '获取统计数据失败' }, 500);
  }
});

export const adminDashboardRoutes = app;
