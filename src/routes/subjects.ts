/**
 * 测算对象 API 路由
 * 
 * GET / - 获取测算对象列表
 * POST / - 创建测算对象
 * GET /:id - 获取测算对象详情
 * PUT /:id - 更新测算对象
 * DELETE /:id - 删除测算对象
 * GET /:id/reports - 获取测算对象的报告列表
 */

import { Hono } from 'hono';
import { authRequired, requireUserId } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import {
  createSubject,
  getSubjectsByUserId,
  getSubjectById,
  updateSubject,
  deleteSubject,
  getSubjectReportCount,
  isSubjectNameExists,
} from '../lib/subject/index.js';
import type { CreateSubjectInput, UpdateSubjectInput } from '../lib/subject/types.js';
import type { BaziData } from '../lib/bazi/types.js';
import type { FortuneAnalysis } from '../lib/ai/types.js';

export const subjectsRoutes = new Hono();

/**
 * 获取测算对象列表
 * GET /api/subjects
 */
subjectsRoutes.get('/', authRequired, async (c) => {
  try {
    const userId = requireUserId(c);

    const limit = parseInt(c.req.query('limit') || '50', 10);
    const offset = parseInt(c.req.query('offset') || '0', 10);

    const { subjects, total } = await getSubjectsByUserId(userId, {
      limit,
      offset,
    });

    return c.json({
      success: true,
      subjects,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    return c.json({ success: false, message: '获取测算对象失败' }, 500);
  }
});

/**
 * 创建测算对象
 * POST /api/subjects
 * 
 * 支持存储前端计算的 baziData，并检测名称重复
 */
subjectsRoutes.post('/', authRequired, async (c) => {
  try {
    const userId = requireUserId(c);

    const body = await c.req.json();
    const input: CreateSubjectInput = {
      name: body.name,
      gender: body.gender,
      calendarType: body.calendarType,
      birthYear: body.birthYear,
      birthMonth: body.birthMonth,
      birthDay: body.birthDay,
      birthHour: body.birthHour,
      birthMinute: body.birthMinute,
      isLeapMonth: body.isLeapMonth,
      location: body.location,
      baziData: body.baziData, // 前端计算的完整八字数据
      relationship: body.relationship,
      note: body.note,
    };

    // 基本验证
    if (!input.name || !input.gender || !input.location) {
      return c.json({ success: false, message: '请填写必要信息' }, 400);
    }

    // 检测名称重复（同一用户下）
    const nameExists = await isSubjectNameExists(userId, input.name);
    if (nameExists) {
      return c.json({
        success: false,
        message: '名称已存在，请使用其他名称',
        code: 'NAME_DUPLICATE',
      }, 400);
    }

    const subject = await createSubject(userId, input);

    return c.json({
      success: true,
      message: '创建成功',
      subject,
    });
  } catch (error) {
    console.error('Create subject error:', error);
    // 返回更详细的错误信息
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return c.json({
      success: false,
      message: '创建测算对象失败',
      detail: errorMessage,
    }, 500);
  }
});

/**
 * 获取测算对象详情
 * GET /api/subjects/:id
 */
subjectsRoutes.get('/:id', authRequired, async (c) => {
  try {
    const userId = requireUserId(c);

    const id = c.req.param('id');
    const subject = await getSubjectById(id, userId);

    if (!subject) {
      return c.json({ success: false, message: '测算对象不存在' }, 404);
    }

    // 获取关联的报告数量
    const reportCount = await getSubjectReportCount(id);

    return c.json({
      success: true,
      subject,
      reportCount,
    });
  } catch (error) {
    console.error('Get subject error:', error);
    return c.json({ success: false, message: '获取测算对象失败' }, 500);
  }
});

/**
 * 更新测算对象
 * PUT /api/subjects/:id
 */
subjectsRoutes.put('/:id', authRequired, async (c) => {
  try {
    const userId = requireUserId(c);

    const id = c.req.param('id');
    const body = await c.req.json();

    const input: UpdateSubjectInput = {};
    if (body.name !== undefined) input.name = body.name;
    if (body.gender !== undefined) input.gender = body.gender;
    if (body.calendarType !== undefined) input.calendarType = body.calendarType;
    if (body.birthYear !== undefined) input.birthYear = body.birthYear;
    if (body.birthMonth !== undefined) input.birthMonth = body.birthMonth;
    if (body.birthDay !== undefined) input.birthDay = body.birthDay;
    if (body.birthHour !== undefined) input.birthHour = body.birthHour;
    if (body.birthMinute !== undefined) input.birthMinute = body.birthMinute;
    if (body.isLeapMonth !== undefined) input.isLeapMonth = body.isLeapMonth;
    if (body.location !== undefined) input.location = body.location;
    if (body.relationship !== undefined) input.relationship = body.relationship;
    if (body.note !== undefined) input.note = body.note;

    const subject = await updateSubject(id, userId, input);

    if (!subject) {
      return c.json({ success: false, message: '测算对象不存在' }, 404);
    }

    return c.json({
      success: true,
      message: '更新成功',
      subject,
    });
  } catch (error) {
    console.error('Update subject error:', error);
    return c.json({ success: false, message: '更新测算对象失败' }, 500);
  }
});

/**
 * 删除测算对象
 * DELETE /api/subjects/:id
 */
subjectsRoutes.delete('/:id', authRequired, async (c) => {
  try {
    const userId = requireUserId(c);

    const id = c.req.param('id');
    const success = await deleteSubject(id, userId);

    if (!success) {
      return c.json({ success: false, message: '测算对象不存在' }, 404);
    }

    return c.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('Delete subject error:', error);
    return c.json({ success: false, message: '删除测算对象失败' }, 500);
  }
});

/**
 * 获取测算对象的报告列表
 * GET /api/subjects/:id/reports
 */
subjectsRoutes.get('/:id/reports', authRequired, async (c) => {
  try {
    const userId = requireUserId(c);

    const subjectId = c.req.param('id');

    // 验证 subject 属于当前用户
    const subject = await getSubjectById(subjectId, userId);
    if (!subject) {
      return c.json({ success: false, message: '测算对象不存在' }, 404);
    }

    const limit = parseInt(c.req.query('limit') || '20', 10);
    const offset = parseInt(c.req.query('offset') || '0', 10);

    const [reports, total] = await Promise.all([
      prisma.fortuneReport.findMany({
        where: {
          subjectId,
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.fortuneReport.count({
        where: {
          subjectId,
          deletedAt: null,
        },
      }),
    ]);

    return c.json({
      success: true,
      subject,
      reports: reports.map((report) => ({
        id: report.id,
        subjectId: report.subjectId,
        baziData: report.baziChart as unknown as BaziData,
        analysis: report.analysis as unknown as FortuneAnalysis,
        pointsCost: report.pointsCost,
        createdAt: report.createdAt,
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Get subject reports error:', error);
    return c.json({ success: false, message: '获取报告列表失败' }, 500);
  }
});
