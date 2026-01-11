/**
 * 命理分析积分扣除流程
 * 
 * 功能：
 * - 分析前检查积分
 * - 分析完成后扣除积分
 */

import { checkSufficientBalance, deductPoints } from "./service.js";
import { PointsError, PointsErrorCode } from "./types.js";
import { createFortuneReport, type CreateReportInput, type FortuneReportData } from "../ai/fortune-report.js";

// 默认命理分析消耗积分（可通过环境变量配置）
const DEFAULT_FORTUNE_ANALYSIS_COST = 50;

/**
 * 获取命理分析所需积分
 */
export function getFortuneAnalysisCost(): number {
  return parseInt(process.env.FORTUNE_ANALYSIS_COST || String(DEFAULT_FORTUNE_ANALYSIS_COST), 10);
}

/**
 * 检查用户是否有足够积分进行命理分析
 */
export interface PointsCheckResult {
  canAnalyze: boolean;
  currentBalance: number;
  requiredPoints: number;
  shortfall: number;
}

export async function checkPointsForAnalysis(userId: string): Promise<PointsCheckResult> {
  const requiredPoints = getFortuneAnalysisCost();
  const { sufficient, currentBalance } = await checkSufficientBalance(userId, requiredPoints);
  
  return {
    canAnalyze: sufficient,
    currentBalance,
    requiredPoints,
    shortfall: sufficient ? 0 : requiredPoints - currentBalance,
  };
}

/**
 * 命理分析结果（包含积分信息）
 */
export interface FortuneAnalysisResult {
  success: boolean;
  message: string;
  report?: FortuneReportData;
  pointsDeducted?: number;
  remainingBalance?: number;
}

/**
 * 执行命理分析并扣除积分
 * 
 * 流程：
 * 1. 检查用户积分是否足够
 * 2. 生成命理报告
 * 3. 扣除积分
 * 
 * 注意：积分在分析完成后扣除，确保用户只为成功的分析付费
 */
export async function performFortuneAnalysisWithPoints(
  input: Omit<CreateReportInput, 'pointsCost'>
): Promise<FortuneAnalysisResult> {
  const { userId, baziData, sections, subjectId } = input;
  const pointsCost = getFortuneAnalysisCost();

  // 1. 检查积分是否足够
  const pointsCheck = await checkPointsForAnalysis(userId);
  
  if (!pointsCheck.canAnalyze) {
    throw new PointsError(
      PointsErrorCode.INSUFFICIENT_BALANCE,
      `积分不足，当前余额: ${pointsCheck.currentBalance}，需要: ${pointsCheck.requiredPoints}`
    );
  }

  try {
    // 2. 生成命理报告
    const report = await createFortuneReport({
      userId,
      baziData,
      pointsCost,
      sections,
      subjectId,
    });

    // 3. 扣除积分
    const deductResult = await deductPoints({
      userId,
      amount: pointsCost,
      description: `命理分析报告 - ${report.id}`,
      orderId: report.id,
    });

    return {
      success: true,
      message: "命理分析完成",
      report,
      pointsDeducted: pointsCost,
      remainingBalance: deductResult.balance,
    };
  } catch (error) {
    // 如果是积分错误，直接抛出
    if (error instanceof PointsError) {
      throw error;
    }
    
    // 其他错误包装后抛出
    throw new Error(
      `命理分析失败: ${error instanceof Error ? error.message : "未知错误"}`
    );
  }
}

/**
 * 预检查并返回分析所需信息
 * 用于前端显示确认对话框
 */
export async function preCheckFortuneAnalysis(userId: string): Promise<{
  canProceed: boolean;
  currentBalance: number;
  cost: number;
  balanceAfter: number;
  message: string;
}> {
  const cost = getFortuneAnalysisCost();
  const { sufficient, currentBalance } = await checkSufficientBalance(userId, cost);
  
  if (!sufficient) {
    return {
      canProceed: false,
      currentBalance,
      cost,
      balanceAfter: currentBalance,
      message: `积分不足，当前余额 ${currentBalance}，需要 ${cost} 积分`,
    };
  }

  return {
    canProceed: true,
    currentBalance,
    cost,
    balanceAfter: currentBalance - cost,
    message: `本次分析将消耗 ${cost} 积分，分析后余额为 ${currentBalance - cost}`,
  };
}
