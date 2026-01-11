/**
 * 命理分析 API 路由
 * 
 * POST /analyze - AI 运势分析
 */

import { Hono } from 'hono';
import { authRequired, getCurrentUserId } from '../middleware/auth.js';
import { performFortuneAnalysisWithPoints, checkPointsForAnalysis } from '../lib/points/fortune-integration.js';
import { PointsError, PointsErrorCode } from '../lib/points/types.js';
import type { BaziData } from '../lib/bazi/types.js';

export const fortuneRoutes = new Hono();

/**
 * AI 运势分析
 * POST /api/fortune/analyze
 */
fortuneRoutes.post('/analyze', authRequired, async (c) => {
  try {
    const userId = getCurrentUserId(c);
    if (!userId) {
      return c.json({ success: false, message: '请先登录' }, 401);
    }

    const body = await c.req.json();
    const { baziData, subjectId } = body as { baziData: BaziData; subjectId?: string };

    if (!baziData) {
      return c.json({ success: false, message: '请先进行八字排盘' }, 400);
    }

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
