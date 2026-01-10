/**
 * 命理分析 API
 * POST /api/fortune/analyze
 * 
 * Requirements: 3.1, 3.4, 3.5
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { performFortuneAnalysisWithPoints, checkPointsForAnalysis } from "@/lib/points/fortune-integration";
import { PointsError, PointsErrorCode } from "@/lib/points/types";
import type { BaziData } from "@/lib/bazi/types";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { baziData, subjectId } = body as { baziData: BaziData; subjectId?: string };

    if (!baziData) {
      return NextResponse.json(
        { success: false, message: "请先进行八字排盘" },
        { status: 400 }
      );
    }

    // Check points before analysis
    const pointsCheck = await checkPointsForAnalysis(userId);
    if (!pointsCheck.canAnalyze) {
      return NextResponse.json(
        {
          success: false,
          message: `积分不足，当前余额: ${pointsCheck.currentBalance}，需要: ${pointsCheck.requiredPoints}`,
          code: "INSUFFICIENT_POINTS",
          currentBalance: pointsCheck.currentBalance,
          requiredPoints: pointsCheck.requiredPoints,
        },
        { status: 402 }
      );
    }

    // Perform analysis and deduct points
    const result = await performFortuneAnalysisWithPoints({
      userId,
      baziData,
      subjectId,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      analysis: result.report?.analysis,
      reportId: result.report?.id,
      pointsDeducted: result.pointsDeducted,
      remainingBalance: result.remainingBalance,
    });
  } catch (error) {
    console.error("Fortune analysis error:", error);

    if (error instanceof PointsError) {
      if (error.code === PointsErrorCode.INSUFFICIENT_BALANCE) {
        return NextResponse.json(
          { success: false, message: error.message, code: "INSUFFICIENT_POINTS" },
          { status: 402 }
        );
      }
    }

    return NextResponse.json(
      { success: false, message: "分析失败，请稍后重试" },
      { status: 500 }
    );
  }
}
