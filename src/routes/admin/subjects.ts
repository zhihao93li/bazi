/**
 * 管理后台命盘路由
 */

import { Hono } from 'hono';
import prisma from '../../lib/prisma.js';
import { adminAuthRequired } from '../../middleware/admin-auth.js';

const app = new Hono();

// 所有路由需要管理员认证
app.use('*', adminAuthRequired);

/**
 * GET /api/admin/subjects
 * 获取命盘列表
 */
app.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1', 10);
    const pageSize = parseInt(c.req.query('pageSize') || '20', 10);
    const sort = c.req.query('sort') || 'createdAt';
    const order = c.req.query('order') || 'desc';
    const userId = c.req.query('userId') || '';
    const search = c.req.query('search') || '';

    // 构建查询条件
    const where: Record<string, unknown> = {};
    if (userId) {
      where.userId = userId;
    }
    if (search) {
      where.name = { contains: search };
    }

    // 并行查询数据和总数
    const [subjects, total] = await Promise.all([
      prisma.subject.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sort]: order },
        select: {
          id: true,
          userId: true,
          name: true,
          gender: true,
          calendarType: true,
          birthYear: true,
          birthMonth: true,
          birthDay: true,
          birthHour: true,
          birthMinute: true,
          isLeapMonth: true,
          location: true,
          relationship: true,
          note: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              phone: true,
              username: true,
            },
          },
          _count: {
            select: {
              themeAnalyses: true,
              reports: true,
            },
          },
        },
      }),
      prisma.subject.count({ where }),
    ]);

    return c.json({
      success: true,
      data: {
        list: subjects.map((subject) => ({
          ...subject,
          themeAnalysesCount: subject._count.themeAnalyses,
          reportsCount: subject._count.reports,
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    return c.json({ success: false, message: '获取命盘列表失败' }, 500);
  }
});

/**
 * GET /api/admin/subjects/:id
 * 获取命盘详情
 */
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            username: true,
          },
        },
        themeAnalyses: {
          select: {
            id: true,
            theme: true,
            pointsCost: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            themeAnalyses: true,
            reports: true,
          },
        },
      },
    });

    if (!subject) {
      return c.json({ success: false, message: '命盘不存在' }, 404);
    }

    return c.json({
      success: true,
      data: subject,
    });
  } catch (error) {
    console.error('Get subject detail error:', error);
    return c.json({ success: false, message: '获取命盘详情失败' }, 500);
  }
});

export const adminSubjectsRoutes = app;
