/**
 * 主题解读服务
 * 处理主题解锁、初步解读和分主题解读的核心业务逻辑
 */

import prisma from '../prisma.js';
import { generateInitialAnalysis, generateThemeAnalysis } from '../ai/service.js';
import { deductPoints, refundPoints } from '../points/service.js';
import { PointsError, PointsErrorCode } from '../points/types.js';
import type { AnalysisTheme } from '../ai/types.js';
import type { BaziData } from '../bazi/types.js';

/**
 * 主题价格信息
 */
export interface ThemePricingInfo {
  theme: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  isActive: boolean;
}

/**
 * 主题解锁状态
 */
export interface ThemeUnlockStatusInfo {
  theme: string;
  isUnlocked: boolean;
  unlockedAt?: Date;
}

/**
 * 主题解锁结果
 */
export interface ThemeUnlockResult {
  success: boolean;
  theme: string;
  content: string;
  pointsDeducted: number;
  remainingBalance: number;
}

/**
 * 获取所有主题价格配置
 */
export async function getAllThemePricing(): Promise<ThemePricingInfo[]> {
  const pricing = await prisma.themePricing.findMany({
    // show all, frontend can filter by isActive if needed, or we just map it
    // But requirement says "show coming soon", so we might need isActive=false items?
    // The previous code filtered where: { isActive: true }.
    // If I want to show "Coming Soon", I should probably allow isActive=false but sort them?
    // Or maybe "Coming Soon" items are isActive=false?
    // The requirement says "create in db, show in frontend, but not clickable".
    // If I filter isActive: true, then synastry (isActive=false) won't show up.
    // So I should remove the filter or change it.
    orderBy: { sortOrder: 'asc' },
  });

  return pricing.map((p) => ({
    theme: p.theme,
    name: p.name,
    description: p.description,
    price: p.price,
    originalPrice: p.originalPrice,
    isActive: p.isActive,
  }));
}

/**
 * 获取指定主题的价格
 */
export async function getThemePrice(theme: AnalysisTheme): Promise<number | null> {
  const pricing = await prisma.themePricing.findUnique({
    where: { theme },
  });

  return pricing?.price ?? null;
}

/**
 * 获取测算对象的所有主题解锁状态
 */
export async function getThemeUnlockStatus(
  subjectId: string,
  userId: string
): Promise<ThemeUnlockStatusInfo[]> {
  // 获取所有活跃主题
  const allThemes = await prisma.themePricing.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  // 获取已解锁的主题
  const unlockedThemes = await prisma.themeAnalysis.findMany({
    where: {
      subjectId,
      userId,
    },
    select: {
      theme: true,
      createdAt: true,
    },
  });

  const unlockedMap = new Map(
    unlockedThemes.map((t) => [t.theme, t.createdAt])
  );

  return allThemes.map((t) => ({
    theme: t.theme,
    isUnlocked: unlockedMap.has(t.theme),
    unlockedAt: unlockedMap.get(t.theme),
  }));
}

/**
 * 获取已解锁主题的内容
 */
export async function getThemeContent(
  subjectId: string,
  theme: AnalysisTheme,
  userId: string
): Promise<{ content: string; createdAt: Date } | null> {
  const analysis = await prisma.themeAnalysis.findUnique({
    where: {
      subjectId_theme: {
        subjectId,
        theme,
      },
    },
  });

  if (!analysis || analysis.userId !== userId) {
    return null;
  }

  return {
    content: analysis.content as string,
    createdAt: analysis.createdAt,
  };
}

// 内存锁：防止同一个 subject 的 initial analysis 被并发生成
const initialAnalysisLocks = new Map<string, Promise<string>>();

// 内存锁：防止同一个 subject + theme 被并发解锁
const themeUnlockLocks = new Map<string, Promise<ThemeUnlockResult>>();

/**
 * 检查某个 Subject 是否正在进行主题解锁
 * 用于在删除 Subject 前检查，防止解锁过程中删除导致外键约束错误
 */
export function isSubjectUnlocking(subjectId: string): boolean {
  // 检查是否有任何以该 subjectId 开头的锁
  for (const key of themeUnlockLocks.keys()) {
    if (key.startsWith(`${subjectId}_`)) {
      return true;
    }
  }
  // 也检查初步解读锁
  if (initialAnalysisLocks.has(subjectId)) {
    return true;
  }
  return false;
}

/**
 * 检查并生成初步解读
 * 如果已存在则直接返回，否则生成新的
 * 使用内存锁防止并发请求重复生成
 */
async function ensureInitialAnalysis(
  subjectId: string,
  baziData: BaziData,
  gender?: string
): Promise<string> {
  // 检查是否已有初步解读（数据库）
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { initialAnalysis: true },
  });

  if (subject?.initialAnalysis) {
    console.log(`[Theme Service] Using existing initial analysis for subject: ${subjectId}`);
    return subject.initialAnalysis as string;
  }

  // 检查是否有正在进行的生成任务（内存锁）
  const existingTask = initialAnalysisLocks.get(subjectId);
  if (existingTask) {
    console.log(`[Theme Service] Waiting for existing initial analysis task: ${subjectId}`);
    return existingTask;
  }

  // 创建生成任务并加锁
  const generateTask = (async () => {
    try {
      // 再次检查数据库（双重检查，防止在等待锁时已完成）
      const subjectCheck = await prisma.subject.findUnique({
        where: { id: subjectId },
        select: { initialAnalysis: true },
      });
      if (subjectCheck?.initialAnalysis) {
        return subjectCheck.initialAnalysis as string;
      }

      // 生成新的初步解读
      console.log(`[Theme Service] Generating new initial analysis for subject: ${subjectId}`);
      const initialAnalysis = await generateInitialAnalysis(baziData, gender);

      // 存储初步解读
      await prisma.subject.update({
        where: { id: subjectId },
        data: {
          initialAnalysis,
          initialAnalyzedAt: new Date(),
        },
      });

      return initialAnalysis;
    } finally {
      // 任务完成后释放锁
      initialAnalysisLocks.delete(subjectId);
    }
  })();

  // 注册锁
  initialAnalysisLocks.set(subjectId, generateTask);

  return generateTask;
}

/**
 * 解锁主题
 * 
 * 流程（乐观锁模式）：
 * 1. 验证主题和价格
 * 2. 检查是否已解锁
 * 3. 预扣积分（乐观锁，原子操作）
 * 4. 获取测算对象信息
 * 5. 确保初步解读已生成
 * 6. 生成分主题解读
 * 7. 存储解读结果
 * 8. 如果任何步骤失败，退还积分
 */
export async function unlockTheme(
  userId: string,
  subjectId: string,
  theme: AnalysisTheme
): Promise<ThemeUnlockResult> {
  const lockKey = `${subjectId}_${theme}`;
  const orderId = `theme_${subjectId}_${theme}`;
  // #region agent log
  const serviceStartTime = Date.now();
  console.log(`[DEBUG][Theme Service] unlockTheme called: userId=${userId}, subjectId=${subjectId}, theme=${theme}`);
  // #endregion

  // 0. 检查是否有正在进行的解锁任务（防止并发重复解锁）
  const existingTask = themeUnlockLocks.get(lockKey);
  if (existingTask) {
    // #region agent log
    console.log(`[DEBUG][Theme Service] Found existing lock task, will wait for it: ${lockKey}`);
    // #endregion
    console.log(`[Theme Service] Waiting for existing unlock task: ${lockKey}`);
    return existingTask;
  }

  // 1. 获取主题价格
  const price = await getThemePrice(theme);
  if (price === null) {
    throw new Error(`Invalid theme: ${theme}`);
  }

  // 2. 检查是否已解锁
  const existing = await prisma.themeAnalysis.findUnique({
    where: {
      subjectId_theme: {
        subjectId,
        theme,
      },
    },
  });

  if (existing) {
    // #region agent log
    console.log(`[DEBUG][Theme Service] Theme already unlocked in DB, returning existing content: ${lockKey}`);
    // #endregion
    // 如果已解锁，直接返回已有内容
    const account = await prisma.pointsAccount.findUnique({
      where: { userId },
      select: { balance: true },
    });
    return {
      success: true,
      theme,
      content: existing.content as string,
      pointsDeducted: 0,
      remainingBalance: account?.balance || 0,
    };
  }

  // #region agent log
  console.log(`[DEBUG][Theme Service] Creating new unlock task for: ${lockKey}`);
  // #endregion
  // 创建解锁任务并加锁（防止并发重复调用 AI）
  const unlockTask = (async (): Promise<ThemeUnlockResult> => {
    let pointsDeducted = false;
    let deductResult: { balance?: number } = {};
    // #region agent log
    const taskStartTime = Date.now();
    // #endregion

    try {
      // 3. 先验证测算对象是否存在且有效（在扣积分之前）
      const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
        select: {
          userId: true,
          baziData: true,
          gender: true,
        },
      });

      if (!subject) {
        throw new Error('Subject not found');
      }

      if (subject.userId !== userId) {
        throw new Error('Unauthorized access to subject');
      }

      if (!subject.baziData) {
        throw new Error('Subject has no bazi data');
      }

      const baziData = subject.baziData as unknown as BaziData;

      // 4. 预扣积分（乐观锁 - 原子操作，自动检查余额）
      console.log(`[Theme Service] Pre-deducting points for theme: ${theme}, amount: ${price}`);
      deductResult = await deductPoints({
        userId,
        amount: price,
        description: `解锁主题解读 - ${theme}`,
        orderId,
      });
      pointsDeducted = true;
      // #region agent log
      console.log(`[DEBUG][Theme Service] Points deducted: ${price}, time elapsed: ${Date.now() - taskStartTime}ms`);
      // #endregion
      console.log(`[Theme Service] Points pre-deducted successfully, remaining: ${deductResult.balance}`);

      // 5. 确保初步解读已生成
      // #region agent log
      const initialAnalysisStartTime = Date.now();
      console.log(`[DEBUG][Theme Service] Starting initial analysis generation...`);
      // #endregion
      const initialAnalysis = await ensureInitialAnalysis(
        subjectId,
        baziData,
        subject.gender
      );
      // #region agent log
      console.log(`[DEBUG][Theme Service] Initial analysis completed in ${Date.now() - initialAnalysisStartTime}ms`);
      // #endregion

      // 6. 生成分主题解读
      // #region agent log
      const themeAnalysisStartTime = Date.now();
      console.log(`[DEBUG][Theme Service] Starting theme analysis generation: ${theme}`);
      // #endregion
      console.log(`[Theme Service] Generating theme analysis: ${theme}`);
      const content = await generateThemeAnalysis(
        theme,
        baziData,
        initialAnalysis,
        subject.gender
      );
      // #region agent log
      console.log(`[DEBUG][Theme Service] Theme analysis completed in ${Date.now() - themeAnalysisStartTime}ms`);
      // #endregion

      // 7. 存储解读结果（先验证 Subject 仍然存在）
      try {
        // 再次验证 Subject 是否仍然存在（防止 AI 生成期间被删除）
        const subjectStillExists = await prisma.subject.findUnique({
          where: { id: subjectId },
          select: { id: true },
        });

        if (!subjectStillExists) {
          throw new Error('Subject was deleted during analysis generation');
        }

        await prisma.themeAnalysis.create({
          data: {
            userId,
            subjectId,
            theme,
            content,
            pointsCost: price,
          },
        });
      } catch (error) {
        // 捕获唯一约束冲突（并发请求导致）
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
          console.log(`[Theme Service] Theme already unlocked (concurrent request): ${theme}`);
          // 已经有人解锁了，需要退还我们预扣的积分
          console.log(`[Theme Service] Refunding pre-deducted points due to concurrent unlock`);
          await refundPoints({
            userId,
            amount: price,
            description: `解锁主题解读 - ${theme}`,
            orderId,
            reason: '并发解锁冲突，已由其他请求完成',
          });
          pointsDeducted = false;

          // 查询已有记录
          const existingAnalysis = await prisma.themeAnalysis.findUnique({
            where: {
              subjectId_theme: { subjectId, theme },
            },
          });
          const account = await prisma.pointsAccount.findUnique({
            where: { userId },
            select: { balance: true },
          });
          return {
            success: true,
            theme,
            content: existingAnalysis?.content as string || content,
            pointsDeducted: 0, // 已退还
            remainingBalance: account?.balance || 0,
          };
        }
        // 捕获外键约束冲突（Subject 在 AI 生成期间被删除）
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
          console.log(`[Theme Service] Subject was deleted during analysis, handling gracefully`);
          throw new Error('Subject was deleted during analysis generation');
        }
        throw error;
      }

      console.log(`[Theme Service] Theme unlocked successfully: ${theme}`);
      // #region agent log
      console.log(`[DEBUG][Theme Service] Total unlock time: ${Date.now() - taskStartTime}ms`);
      // #endregion

      return {
        success: true,
        theme,
        content,
        pointsDeducted: price,
        remainingBalance: deductResult.balance ?? 0,
      };
    } catch (error) {
      // #region agent log
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`[DEBUG][Theme Service] Unlock task failed after ${Date.now() - taskStartTime}ms, error: ${errorMessage}`);
      // #endregion
      // 如果已经扣了积分但后续流程失败，需要退还
      if (pointsDeducted) {
        console.error(`[Theme Service] Operation failed after deducting points, initiating refund`);
        console.error(`[Theme Service] Failure reason: ${errorMessage}`);

        try {
          await refundPoints({
            userId,
            amount: price,
            description: `解锁主题解读 - ${theme}`,
            orderId,
            reason: `操作失败: ${errorMessage}`,
          });
          console.log(`[Theme Service] Points refunded successfully after failure`);
        } catch (refundError) {
          // 退款失败是严重错误，需要人工介入
          console.error(`[Theme Service] CRITICAL: Refund failed!`, refundError);
          console.error(`[Theme Service] User: ${userId}, Amount: ${price}, OrderId: ${orderId}`);
        }
      }
      throw error;
    } finally {
      // 任务完成后释放锁
      themeUnlockLocks.delete(lockKey);
    }
  })();

  // 注册锁
  themeUnlockLocks.set(lockKey, unlockTask);

  return unlockTask;
}

/**
 * 获取主题的详细信息（包含内容，如果已解锁）
 */
export async function getThemeDetail(
  subjectId: string,
  theme: AnalysisTheme,
  userId: string
): Promise<{
  theme: string;
  name: string;
  description: string | null;
  price: number;
  isUnlocked: boolean;
  content?: string;
  unlockedAt?: Date;
}> {
  // 获取价格信息
  const pricing = await prisma.themePricing.findUnique({
    where: { theme },
  });

  if (!pricing) {
    throw new Error(`Theme not found: ${theme}`);
  }

  // 检查是否已解锁
  const analysis = await prisma.themeAnalysis.findUnique({
    where: {
      subjectId_theme: {
        subjectId,
        theme,
      },
    },
  });

  const isUnlocked = !!analysis && analysis.userId === userId;

  return {
    theme: pricing.theme,
    name: pricing.name,
    description: pricing.description,
    price: pricing.price,
    isUnlocked,
    content: isUnlocked ? (analysis?.content as string) : undefined,
    unlockedAt: isUnlocked ? analysis?.createdAt : undefined,
  };
}
