/**
 * 主题解读服务
 * 处理主题解锁、初步解读和分主题解读的核心业务逻辑
 */

import prisma from '../prisma.js';
import { generateInitialAnalysis, generateThemeAnalysis } from '../ai/service.js';
import { deductPoints, checkSufficientBalance } from '../points/service.js';
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
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  return pricing.map((p) => ({
    theme: p.theme,
    name: p.name,
    description: p.description,
    price: p.price,
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

/**
 * 检查并生成初步解读
 * 如果已存在则直接返回，否则生成新的
 */
async function ensureInitialAnalysis(
  subjectId: string,
  baziData: BaziData,
  gender?: string
): Promise<string> {
  // 检查是否已有初步解读
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { initialAnalysis: true },
  });

  if (subject?.initialAnalysis) {
    console.log(`[Theme Service] Using existing initial analysis for subject: ${subjectId}`);
    return subject.initialAnalysis as string;
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
}

/**
 * 解锁主题
 * 
 * 流程：
 * 1. 验证主题和价格
 * 2. 检查积分是否充足
 * 3. 确保初步解读已生成
 * 4. 生成分主题解读
 * 5. 存储解读结果
 * 6. 扣除积分
 */
export async function unlockTheme(
  userId: string,
  subjectId: string,
  theme: AnalysisTheme
): Promise<ThemeUnlockResult> {
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
    throw new Error(`Theme ${theme} is already unlocked for this subject`);
  }

  // 3. 检查积分是否充足
  const { sufficient, currentBalance } = await checkSufficientBalance(userId, price);
  if (!sufficient) {
    throw new PointsError(
      PointsErrorCode.INSUFFICIENT_BALANCE,
      `积分不足，当前余额: ${currentBalance}，需要: ${price}`
    );
  }

  // 4. 获取测算对象信息
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

  // 5. 确保初步解读已生成
  const initialAnalysis = await ensureInitialAnalysis(
    subjectId,
    baziData,
    subject.gender
  );

  // 6. 生成分主题解读
  console.log(`[Theme Service] Generating theme analysis: ${theme}`);
  const content = await generateThemeAnalysis(
    theme,
    baziData,
    initialAnalysis,
    subject.gender
  );

  // 7. 存储解读结果
  await prisma.themeAnalysis.create({
    data: {
      userId,
      subjectId,
      theme,
      content,
      pointsCost: price,
    },
  });

  // 8. 扣除积分
  const deductResult = await deductPoints({
    userId,
    amount: price,
    description: `解锁主题解读 - ${theme}`,
    orderId: `theme_${subjectId}_${theme}`,
  });

  console.log(`[Theme Service] Theme unlocked successfully: ${theme}`);

  return {
    success: true,
    theme,
    content,
    pointsDeducted: price,
    remainingBalance: deductResult.balance ?? 0,
  };
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
