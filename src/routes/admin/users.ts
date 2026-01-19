/**
 * 管理后台用户路由
 */

import { Hono } from 'hono';
import prisma from '../../lib/prisma.js';
import { adminAuthRequired } from '../../middleware/admin-auth.js';

const app = new Hono();

// 所有路由需要管理员认证
app.use('*', adminAuthRequired);

/**
 * GET /api/admin/users
 * 获取用户列表
 */
app.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1', 10);
    const pageSize = parseInt(c.req.query('pageSize') || '20', 10);
    const sort = c.req.query('sort') || 'createdAt';
    const order = c.req.query('order') || 'desc';
    const search = c.req.query('search') || '';

    // 构建查询条件
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { phone: { contains: search } },
        { username: { contains: search } },
      ];
    }

    // 并行查询数据和总数
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sort]: order },
        select: {
          id: true,
          phone: true,
          username: true,
          createdAt: true,
          updatedAt: true,
          pointsAccount: {
            select: { balance: true },
          },
          _count: {
            select: {
              subjects: true,
              themeAnalyses: true,
              orders: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return c.json({
      success: true,
      data: {
        list: users.map((user) => ({
          ...user,
          balance: user.pointsAccount?.balance || 0,
          subjectsCount: user._count.subjects,
          themeAnalysesCount: user._count.themeAnalyses,
          ordersCount: user._count.orders,
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ success: false, message: '获取用户列表失败' }, 500);
  }
});

/**
 * GET /api/admin/users/:id
 * 获取用户详情
 */
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        phone: true,
        username: true,
        createdAt: true,
        updatedAt: true,
        pointsAccount: {
          select: {
            balance: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            subjects: true,
            themeAnalyses: true,
            orders: true,
            transactions: true,
          },
        },
      },
    });

    if (!user) {
      return c.json({ success: false, message: '用户不存在' }, 404);
    }

    return c.json({
      success: true,
      data: {
        ...user,
        balance: user.pointsAccount?.balance || 0,
        subjectsCount: user._count.subjects,
        themeAnalysesCount: user._count.themeAnalyses,
        ordersCount: user._count.orders,
        transactionsCount: user._count.transactions,
      },
    });
  } catch (error) {
    console.error('Get user detail error:', error);
    return c.json({ success: false, message: '获取用户详情失败' }, 500);
  }
});

export const adminUsersRoutes = app;
