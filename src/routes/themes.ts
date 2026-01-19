/**
 * 主题解读 API 路由
 * 
 * GET /pricing - 获取所有主题价格配置
 * GET /status/:subjectId - 获取某对象各主题解锁状态
 * GET /:subjectId/:theme - 获取已解锁主题的内容
 * POST /unlock - 解锁指定主题
 */

import { Hono } from 'hono';
import { authRequired, requireUserId } from '../middleware/auth.js';
import {
  getAllThemePricing,
  getThemeUnlockStatus,
  getThemeContent,
  getThemeDetail,
  getThemePrice,
} from '../lib/themes/index.js';
import { PointsError, PointsErrorCode } from '../lib/points/types.js';
import { deductPoints } from '../lib/points/service.js';
import { THEME_NAMES } from '../lib/themes/constants.js';
import { isValidTheme } from '../lib/themes/constants.js';
import { createThemeUnlockTask } from '../lib/tasks/index.js';
import prisma from '../lib/prisma.js';

export const themesRoutes = new Hono();

/**
 * 获取所有主题价格配置
 * GET /api/themes/pricing
 */
themesRoutes.get('/pricing', async (c) => {
  try {
    const pricing = await getAllThemePricing();
    return c.json({
      success: true,
      pricing,
    });
  } catch (error) {
    console.error('Error fetching theme pricing:', error);
    return c.json(
      { success: false, message: '获取主题价格失败' },
      500
    );
  }
});

/**
 * 获取某对象各主题解锁状态
 * GET /api/themes/status/:subjectId
 */
themesRoutes.get('/status/:subjectId', authRequired, async (c) => {
  try {
    const userId = requireUserId(c);

    const subjectId = c.req.param('subjectId');
    if (!subjectId) {
      return c.json({ success: false, message: '缺少 subjectId' }, 400);
    }

    const status = await getThemeUnlockStatus(subjectId, userId);
    return c.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('Error fetching theme status:', error);
    return c.json(
      { success: false, message: '获取主题状态失败' },
      500
    );
  }
});

/**
 * 获取已解锁主题的详细内容
 * GET /api/themes/:subjectId/:theme
 */
themesRoutes.get('/:subjectId/:theme', authRequired, async (c) => {
  try {
    const userId = requireUserId(c);

    const subjectId = c.req.param('subjectId');
    const theme = c.req.param('theme');

    if (!subjectId || !theme) {
      return c.json({ success: false, message: '缺少必要参数' }, 400);
    }

    if (!isValidTheme(theme)) {
      return c.json({ success: false, message: '无效的主题' }, 400);
    }

    const detail = await getThemeDetail(subjectId, theme, userId);

    return c.json({
      success: true,
      ...detail,
    });
  } catch (error) {
    console.error('Error fetching theme content:', error);
    return c.json(
      { success: false, message: '获取主题内容失败' },
      500
    );
  }
});

/**
 * 解锁指定主题（异步任务模式）
 * POST /api/themes/unlock
 * Body: { subjectId: string, theme: string }
 * 
 * 返回任务 ID，前端轮询 /api/tasks/:id 获取结果
 */
themesRoutes.post('/unlock', authRequired, async (c) => {
  try {
    const userId = requireUserId(c);

    const body = await c.req.json();
    const { subjectId, theme } = body as { subjectId: string; theme: string };

    if (!subjectId) {
      return c.json({
        success: false,
        message: '请选择测算对象',
        code: 'SUBJECT_REQUIRED',
      }, 400);
    }

    if (!theme) {
      return c.json({
        success: false,
        message: '请选择要解锁的主题',
        code: 'THEME_REQUIRED',
      }, 400);
    }

    if (!isValidTheme(theme)) {
      return c.json({
        success: false,
        message: '无效的主题',
        code: 'INVALID_THEME',
      }, 400);
    }

    // 检查是否已解锁
    const existingAnalysis = await prisma.themeAnalysis.findUnique({
      where: { subjectId_theme: { subjectId, theme } },
    });

    if (existingAnalysis) {
      // 已解锁，直接返回内容
      const account = await prisma.pointsAccount.findUnique({
        where: { userId },
        select: { balance: true },
      });

      return c.json({
        success: true,
        alreadyUnlocked: true,
        content: existingAnalysis.content,
        pointsDeducted: 0,
        remainingBalance: account?.balance || 0,
      });
    }

    // 验证 Subject
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { userId: true, baziData: true },
    });

    if (!subject) {
      return c.json({
        success: false,
        message: '测算对象不存在',
        code: 'SUBJECT_NOT_FOUND',
      }, 404);
    }

    if (subject.userId !== userId) {
      return c.json({
        success: false,
        message: '无权访问该测算对象',
        code: 'UNAUTHORIZED',
      }, 403);
    }

    if (!subject.baziData) {
      return c.json({
        success: false,
        message: '测算对象缺少八字数据，请重新排盘',
        code: 'BAZI_DATA_MISSING',
      }, 400);
    }

    // 获取价格
    const price = await getThemePrice(theme);
    if (price === null) {
      return c.json({
        success: false,
        message: '无效的主题',
        code: 'INVALID_THEME',
      }, 400);
    }

    // 扣除积分
    const orderId = `theme_${subjectId}_${theme}_${Date.now()}`;
    let deductResult: { balance?: number };
    try {
      deductResult = await deductPoints({
        userId,
        amount: price,
        description: `解锁主题解读 - ${THEME_NAMES[theme as keyof typeof THEME_NAMES]}`,
        orderId,
      });
    } catch (error) {
      if (error instanceof PointsError && error.code === PointsErrorCode.INSUFFICIENT_BALANCE) {
        return c.json({
          success: false,
          message: '积分不足，请先充值',
          code: 'INSUFFICIENT_POINTS',
        }, 402);
      }
      throw error;
    }

    // 创建异步任务
    const task = createThemeUnlockTask({
      subjectId,
      theme,
      userId,
      price,
    });

    console.log(`[Theme API] Task created: ${task.id}, remaining balance: ${deductResult.balance}`);

    // 立即返回任务 ID
    return c.json({
      success: true,
      taskId: task.id,
      status: 'pending',
      remainingBalance: deductResult.balance,
    });

  } catch (error) {
    console.error('Theme unlock error:', error);
    return c.json(
      { success: false, message: '解锁失败，请稍后重试' },
      500
    );
  }
});

/**
 * 批量获取多个主题的解锁状态和内容
 * POST /api/themes/batch
 * Body: { subjectId: string, themes: string[] }
 */
themesRoutes.post('/batch', authRequired, async (c) => {
  try {
    const userId = requireUserId(c);

    const body = await c.req.json();
    const { subjectId, themes } = body as { subjectId: string; themes: string[] };

    if (!subjectId || !themes || !Array.isArray(themes)) {
      return c.json({ success: false, message: '参数无效' }, 400);
    }

    const validThemes = themes.filter(isValidTheme);

    const results = await Promise.all(
      validThemes.map((theme) => getThemeDetail(subjectId, theme, userId))
    );

    return c.json({
      success: true,
      themes: results,
    });
  } catch (error) {
    console.error('Error fetching batch themes:', error);
    return c.json(
      { success: false, message: '获取主题信息失败' },
      500
    );
  }
});
