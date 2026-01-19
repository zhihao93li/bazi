/**
 * 管理后台任务路由
 */

import { Hono } from 'hono';
import prisma from '../../lib/prisma.js';
import { adminAuthRequired } from '../../middleware/admin-auth.js';

const app = new Hono();

// 所有路由需要管理员认证
app.use('*', adminAuthRequired);

/**
 * GET /api/admin/tasks
 * 获取任务列表
 */
app.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1', 10);
    const pageSize = parseInt(c.req.query('pageSize') || '20', 10);
    const sort = c.req.query('sort') || 'createdAt';
    const order = c.req.query('order') || 'desc';
    const status = c.req.query('status') || '';
    const type = c.req.query('type') || '';
    const userId = c.req.query('userId') || '';

    // 构建查询条件
    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }
    if (userId) {
      where.userId = userId;
    }

    // 并行查询数据和总数
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sort]: order },
        select: {
          id: true,
          type: true,
          status: true,
          payload: true,
          result: true,
          error: true,
          userId: true,
          createdAt: true,
          startedAt: true,
          completedAt: true,
        },
      }),
      prisma.task.count({ where }),
    ]);

    return c.json({
      success: true,
      data: {
        list: tasks,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    return c.json({ success: false, message: '获取任务列表失败' }, 500);
  }
});

/**
 * GET /api/admin/tasks/:id
 * 获取任务详情
 */
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return c.json({ success: false, message: '任务不存在' }, 404);
    }

    return c.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Get task detail error:', error);
    return c.json({ success: false, message: '获取任务详情失败' }, 500);
  }
});

export const adminTasksRoutes = app;
