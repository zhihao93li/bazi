/**
 * 命理分析 API 路由
 * 
 * POST /analyze - AI 运势分析
 */

import { Hono } from 'hono';
import { authRequired, getCurrentUserId } from '../middleware/auth.js';
import { performFortuneAnalysisWithPoints, checkPointsForAnalysis } from '../lib/points/fortune-integration.js';
import { PointsError, PointsErrorCode } from '../lib/points/types.js';
import { getSubjectById } from '../lib/subject/index.js';
import type { BaziData } from '../lib/bazi/types.js';

export const fortuneRoutes = new Hono();

/**
 * AI 运势分析
 * POST /api/fortune/analyze
 * 
 * 改进后的流程：
 * - 必须提供 subjectId，从数据库读取存储的 baziData
 * - 不再接受前端直接传入 baziData（确保数据一致性）
 */
fortuneRoutes.post('/analyze', authRequired, async (c) => {
  try {
    const userId = getCurrentUserId(c);
    if (!userId) {
      return c.json({ success: false, message: '请先登录' }, 401);
    }

    const body = await c.req.json();
    const { subjectId } = body as { subjectId: string };

    // 必须提供 subjectId
    if (!subjectId) {
      return c.json({ 
        success: false, 
        message: '请选择测算对象',
        code: 'SUBJECT_REQUIRED',
      }, 400);
    }

    // 从数据库加载测算对象
    const subject = await getSubjectById(subjectId, userId);
    if (!subject) {
      return c.json({ 
        success: false, 
        message: '测算对象不存在',
        code: 'SUBJECT_NOT_FOUND',
      }, 404);
    }

    // 检查 baziData 是否存在
    if (!subject.baziData) {
      return c.json({ 
        success: false, 
        message: '测算对象数据不完整，请重新排盘',
        code: 'BAZI_DATA_MISSING',
      }, 400);
    }

    // 直接使用存储的 baziData，不重新计算
    const baziData = subject.baziData as BaziData;

    // Check points before analysis
    const pointsCheck = await checkPointsForAnalysis(userId);
    if (!pointsCheck.canAnalyze) {
      return c.json(
        {
          success: false,
          message: `积分不足，当前余额: ${pointsCheck.currentBalance}，需要: ${pointsCheck.requiredPoints}`,
          code: 'INSUFFICIENT_POINTS',
          currentBalance: pointsCheck.currentBalance,
          requiredPoints: pointsCheck.requiredPoints,
        },
        402
      );
    }

    // Perform analysis and deduct points
    const result = await performFortuneAnalysisWithPoints({
      userId,
      baziData,
      subjectId,
    });

    return c.json({
      success: true,
      message: result.message,
      analysis: result.report?.analysis,
      reportId: result.report?.id,
      pointsDeducted: result.pointsDeducted,
      remainingBalance: result.remainingBalance,
    });
  } catch (error) {
    console.error('Fortune analysis error:', error);

    if (error instanceof PointsError) {
      if (error.code === PointsErrorCode.INSUFFICIENT_BALANCE) {
        return c.json(
          { success: false, message: error.message, code: 'INSUFFICIENT_POINTS' },
          402
        );
      }
    }

    return c.json({ success: false, message: '分析失败，请稍后重试' }, 500);
  }
});
