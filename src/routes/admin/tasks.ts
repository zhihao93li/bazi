/**
 * 管理后台任务队列路由
 *
 * 功能：
 * - 查看任务列表和详情
 * - 查看队列统计信息
 * - 重试失败任务
 * - 取消待处理任务
 * - 清理过期任务
 */

import { Hono } from 'hono';
import prisma from '../../lib/prisma.js';
import { adminAuthRequired } from '../../middleware/admin-auth.js';

const app = new Hono();

// 所有路由需要管理员认证
app.use('*', adminAuthRequired);

/**
 * GET /api/admin/tasks/stats
 * 获取任务队列统计信息
 */
app.get('/stats', async (c) => {
  try {
    // 并行查询各状态任务数
    const [pending, processing, completed, failed, total] = await Promise.all([
      prisma.task.count({ where: { status: 'pending' } }),
      prisma.task.count({ where: { status: 'processing' } }),
      prisma.task.count({ where: { status: 'completed' } }),
      prisma.task.count({ where: { status: 'failed' } }),
      prisma.task.count(),
    ]);

    // 获取最近 24 小时的任务统计
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [completedToday, failedToday, createdToday] = await Promise.all([
      prisma.task.count({
        where: { status: 'completed', completedAt: { gte: oneDayAgo } },
      }),
      prisma.task.count({
        where: { status: 'failed', completedAt: { gte: oneDayAgo } },
      }),
      prisma.task.count({
        where: { createdAt: { gte: oneDayAgo } },
      }),
    ]);

    // 获取平均处理时间（最近完成的 100 个任务）
    const recentCompleted = await prisma.task.findMany({
      where: {
        status: 'completed',
        startedAt: { not: null },
        completedAt: { not: null },
      },
      select: { startedAt: true, completedAt: true },
      orderBy: { completedAt: 'desc' },
      take: 100,
    });

    let avgProcessingTime = 0;
    if (recentCompleted.length > 0) {
      const totalTime = recentCompleted.reduce((sum, task) => {
        if (task.startedAt && task.completedAt) {
          return sum + (task.completedAt.getTime() - task.startedAt.getTime());
        }
        return sum;
      }, 0);
      avgProcessingTime = Math.round(totalTime / recentCompleted.length);
    }

    return c.json({
      success: true,
      data: {
        // 当前状态统计
        queue: {
          pending,
          processing,
          completed,
          failed,
          total,
        },
        // 24 小时统计
        last24h: {
          created: createdToday,
          completed: completedToday,
          failed: failedToday,
          successRate: createdToday > 0
            ? Math.round((completedToday / (completedToday + failedToday)) * 100) || 0
            : 0,
        },
        // 性能指标
        performance: {
          avgProcessingTimeMs: avgProcessingTime,
          avgProcessingTimeSec: Math.round(avgProcessingTime / 1000),
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Get task stats error:', error);
    return c.json({ success: false, message: '获取任务统计失败' }, 500);
  }
});

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

/**
 * POST /api/admin/tasks/:id/retry
 * 重试失败的任务
 */
app.post('/:id/retry', async (c) => {
  try {
    const id = c.req.param('id');

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return c.json({ success: false, message: '任务不存在' }, 404);
    }

    if (task.status !== 'failed') {
      return c.json({ success: false, message: '只能重试失败的任务' }, 400);
    }

    // 重置任务状态为 pending
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: 'pending',
        error: null,
        startedAt: null,
        completedAt: null,
      },
    });

    console.log(`[Admin] Task ${id} retried by admin`);

    return c.json({
      success: true,
      message: '任务已重新加入队列',
      data: updatedTask,
    });
  } catch (error) {
    console.error('Retry task error:', error);
    return c.json({ success: false, message: '重试任务失败' }, 500);
  }
});

/**
 * POST /api/admin/tasks/:id/cancel
 * 取消待处理的任务
 */
app.post('/:id/cancel', async (c) => {
  try {
    const id = c.req.param('id');

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return c.json({ success: false, message: '任务不存在' }, 404);
    }

    if (task.status !== 'pending') {
      return c.json({ success: false, message: '只能取消待处理的任务' }, 400);
    }

    // 标记任务为失败并记录取消原因
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: 'failed',
        error: '管理员手动取消',
        completedAt: new Date(),
      },
    });

    console.log(`[Admin] Task ${id} cancelled by admin`);

    return c.json({
      success: true,
      message: '任务已取消',
      data: updatedTask,
    });
  } catch (error) {
    console.error('Cancel task error:', error);
    return c.json({ success: false, message: '取消任务失败' }, 500);
  }
});

/**
 * POST /api/admin/tasks/retry-all-failed
 * 重试所有失败的任务
 */
app.post('/retry-all-failed', async (c) => {
  try {
    const result = await prisma.task.updateMany({
      where: { status: 'failed' },
      data: {
        status: 'pending',
        error: null,
        startedAt: null,
        completedAt: null,
      },
    });

    console.log(`[Admin] ${result.count} failed tasks retried by admin`);

    return c.json({
      success: true,
      message: `已重试 ${result.count} 个失败任务`,
      data: { count: result.count },
    });
  } catch (error) {
    console.error('Retry all failed tasks error:', error);
    return c.json({ success: false, message: '批量重试失败' }, 500);
  }
});

/**
 * POST /api/admin/tasks/cleanup
 * 清理过期任务（保留最近 N 天）
 */
app.post('/cleanup', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const days = body.days || 7;

    const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await prisma.task.deleteMany({
      where: {
        completedAt: { lt: threshold },
        status: { in: ['completed', 'failed'] },
      },
    });

    console.log(`[Admin] Cleaned up ${result.count} old tasks (older than ${days} days)`);

    return c.json({
      success: true,
      message: `已清理 ${result.count} 个过期任务`,
      data: { count: result.count, days },
    });
  } catch (error) {
    console.error('Cleanup tasks error:', error);
    return c.json({ success: false, message: '清理任务失败' }, 500);
  }
});

export const adminTasksRoutes = app;
