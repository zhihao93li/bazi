/**
 * 历史报告 API 路由
 * 
 * GET / - 获取报告列表
 * GET /:id - 获取报告详情
 * DELETE /:id - 软删除报告
 */

import { Hono } from 'hono';
import { authRequired, getCurrentUserId } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

export const reportsRoutes = new Hono();

/**
 * 获取报告列表
 * GET /api/reports
 */
reportsRoutes.get('/', authRequired, async (c) => {
  try {
    const userId = getCurrentUserId(c);
    if (!userId) {
      return c.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        401
      );
    }

    // 解析分页参数
    const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(c.req.query('limit') || '10', 10)));
    const skip = (page - 1) * limit;

    // 查询条件：当前用户 + 未删除
    const whereCondition = {
      userId,
      deletedAt: null,
    };

    // 并行查询：获取总数和分页数据
    const [total, reports] = await Promise.all([
      prisma.fortuneReport.count({
        where: whereCondition,
      }),
      prisma.fortuneReport.findMany({
        where: whereCondition,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        select: {
          id: true,
          subjectId: true,
          birthInfo: true,
          baziChart: true,
          analysis: true,
          pointsCost: true,
          createdAt: true,
          subject: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    // 计算分页信息
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    // 格式化返回数据
    const formattedReports = reports.map((report) => ({
      id: report.id,
      subjectId: report.subjectId,
      subjectName: report.subject?.name,
      birthInfo: report.birthInfo,
      baziChart: report.baziChart,
      analysis: report.analysis,
      pointsCost: report.pointsCost,
      createdAt: report.createdAt,
    }));

    return c.json({
      success: true,
      reports: formattedReports,
      data: {
        reports: formattedReports,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore,
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    return c.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '获取历史记录失败' } },
      500
    );
  }
});

/**
 * 获取报告详情
 * GET /api/reports/:id
 */
reportsRoutes.get('/:id', authRequired, async (c) => {
  try {
    const userId = getCurrentUserId(c);
    if (!userId) {
      return c.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        401
      );
    }

    const id = c.req.param('id');

    // 查询报告详情
    const report = await prisma.fortuneReport.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
        subjectId: true,
        birthInfo: true,
        baziChart: true,
        analysis: true,
        pointsCost: true,
        createdAt: true,
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!report) {
      return c.json(
        { success: false, error: { code: 'NOT_FOUND', message: '报告不存在或已被删除' } },
        404
      );
    }

    return c.json({
      success: true,
      report: {
        id: report.id,
        subjectId: report.subjectId,
        subjectName: report.subject?.name,
        birthInfo: report.birthInfo,
        baziChart: report.baziChart,
        analysis: report.analysis,
        pointsCost: report.pointsCost,
        createdAt: report.createdAt,
      },
      data: report,
    });
  } catch (error) {
    console.error('Failed to fetch report detail:', error);
    return c.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '获取报告详情失败' } },
      500
    );
  }
});

/**
 * 软删除报告
 * DELETE /api/reports/:id
 */
reportsRoutes.delete('/:id', authRequired, async (c) => {
  try {
    const userId = getCurrentUserId(c);
    if (!userId) {
      return c.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        401
      );
    }

    const id = c.req.param('id');

    // 先检查报告是否存在且属于当前用户
    const existingReport = await prisma.fortuneReport.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!existingReport) {
      return c.json(
        { success: false, error: { code: 'NOT_FOUND', message: '报告不存在或已被删除' } },
        404
      );
    }

    // 执行软删除
    await prisma.fortuneReport.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return c.json({
      success: true,
      data: { message: '报告已删除' },
    });
  } catch (error) {
    console.error('Failed to delete report:', error);
    return c.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '删除报告失败' } },
      500
    );
  }
});
