/**
 * 命理报告生成和存储服务
 * 实现完整的报告生成流程和数据库存储
 */

import prisma from '../prisma';
import { generateFullAnalysis } from './service';
import type { FortuneAnalysis, AnalysisSection } from './types';
import type { BaziData } from '../bazi/types';

/**
 * 命理报告数据结构
 */
export interface FortuneReportData {
  id: string;
  userId: string;
  subjectId: string | null;
  baziData: BaziData;
  analysis: FortuneAnalysis;
  pointsCost: number;
  createdAt: Date;
  deletedAt: Date | null;
}

/**
 * 创建报告的输入参数
 */
export interface CreateReportInput {
  userId: string;
  baziData: BaziData;
  pointsCost: number;
  sections?: AnalysisSection[];
  subjectId?: string;  // 关联的测算对象
}

/**
 * 生成并保存命理报告
 */
export async function createFortuneReport(input: CreateReportInput): Promise<FortuneReportData> {
  const { userId, baziData, pointsCost, sections, subjectId } = input;

  console.log(`[Fortune Report] Generating report for user: ${userId}`);

  // 生成 AI 分析
  const analysis = await generateFullAnalysis(baziData, sections);

  // 保存到数据库
  const report = await prisma.fortuneReport.create({
    data: {
      userId,
      subjectId: subjectId || null,
      birthInfo: baziData.lunarDate as object,
      baziChart: baziData as object,
      analysis: analysis as object,
      pointsCost,
    },
  });

  console.log(`[Fortune Report] Report created with ID: ${report.id}`);

  return {
    id: report.id,
    userId: report.userId,
    subjectId: report.subjectId,
    baziData: report.baziChart as unknown as BaziData,
    analysis: report.analysis as unknown as FortuneAnalysis,
    pointsCost: report.pointsCost,
    createdAt: report.createdAt,
    deletedAt: report.deletedAt,
  };
}

/**
 * 根据 ID 获取报告
 */
export async function getFortuneReport(
  reportId: string,
  userId: string
): Promise<FortuneReportData | null> {
  const report = await prisma.fortuneReport.findFirst({
    where: {
      id: reportId,
      userId,
      deletedAt: null,
    },
  });

  if (!report) {
    return null;
  }

  return {
    id: report.id,
    userId: report.userId,
    subjectId: report.subjectId,
    baziData: report.baziChart as unknown as BaziData,
    analysis: report.analysis as unknown as FortuneAnalysis,
    pointsCost: report.pointsCost,
    createdAt: report.createdAt,
    deletedAt: report.deletedAt,
  };
}

/**
 * 获取用户的历史报告列表
 */
export async function getUserReports(
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ reports: FortuneReportData[]; total: number }> {
  const skip = (page - 1) * limit;

  const [reports, total] = await Promise.all([
    prisma.fortuneReport.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.fortuneReport.count({
      where: {
        userId,
        deletedAt: null,
      },
    }),
  ]);

  return {
    reports: reports.map((report) => ({
      id: report.id,
      userId: report.userId,
      subjectId: report.subjectId,
      baziData: report.baziChart as unknown as BaziData,
      analysis: report.analysis as unknown as FortuneAnalysis,
      pointsCost: report.pointsCost,
      createdAt: report.createdAt,
      deletedAt: report.deletedAt,
    })),
    total,
  };
}

/**
 * 软删除报告
 */
export async function deleteFortuneReport(reportId: string, userId: string): Promise<boolean> {
  const result = await prisma.fortuneReport.updateMany({
    where: {
      id: reportId,
      userId,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  return result.count > 0;
}

/**
 * 检查报告是否存在
 */
export async function reportExists(reportId: string): Promise<boolean> {
  const count = await prisma.fortuneReport.count({
    where: {
      id: reportId,
    },
  });

  return count > 0;
}
