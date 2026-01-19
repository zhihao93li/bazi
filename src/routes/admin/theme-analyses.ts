/**
 * 管理后台主题解读路由
 */

import { Hono } from 'hono';
import prisma from '../../lib/prisma.js';
import { adminAuthRequired } from '../../middleware/admin-auth.js';

const app = new Hono();

// 所有路由需要管理员认证
app.use('*', adminAuthRequired);

/**
 * GET /api/admin/theme-analyses
 * 获取解读列表
 */
app.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1', 10);
    const pageSize = parseInt(c.req.query('pageSize') || '20', 10);
    const sort = c.req.query('sort') || 'createdAt';
    const order = c.req.query('order') || 'desc';
    const theme = c.req.query('theme') || '';
    const userId = c.req.query('userId') || '';
    const subjectId = c.req.query('subjectId') || '';

    // 构建查询条件
    const where: Record<string, unknown> = {};
    if (theme) {
      where.theme = theme;
    }
    if (userId) {
      where.userId = userId;
    }
    if (subjectId) {
      where.subjectId = subjectId;
    }

    // 并行查询数据和总数
    const [analyses, total] = await Promise.all([
      prisma.themeAnalysis.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sort]: order },
        select: {
          id: true,
          userId: true,
          subjectId: true,
          theme: true,
          pointsCost: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              phone: true,
              username: true,
            },
          },
          subject: {
            select: {
              id: true,
              name: true,
              gender: true,
            },
          },
        },
      }),
      prisma.themeAnalysis.count({ where }),
    ]);

    return c.json({
      success: true,
      data: {
        list: analyses,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get theme analyses error:', error);
    return c.json({ success: false, message: '获取解读列表失败' }, 500);
  }
});

/**
 * GET /api/admin/theme-analyses/:id
 * 获取解读详情
 */
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const analysis = await prisma.themeAnalysis.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            username: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            gender: true,
            birthYear: true,
            birthMonth: true,
            birthDay: true,
            birthHour: true,
            birthMinute: true,
            location: true,
          },
        },
      },
    });

    if (!analysis) {
      return c.json({ success: false, message: '解读不存在' }, 404);
    }

    return c.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Get theme analysis detail error:', error);
    return c.json({ success: false, message: '获取解读详情失败' }, 500);
  }
});

export const adminThemeAnalysesRoutes = app;
