/**
 * 历史记录详情查询 API
 * 
 * GET /api/reports/[id] - 获取指定报告的详情
 * DELETE /api/reports/[id] - 软删除指定报告
 * 
 * Requirements: 6.3, 6.4, 6.5
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 获取报告详情
 * 
 * - 确保用户隔离（只能查看自己的报告）
 * - 过滤已删除的记录
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 获取当前用户会话
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "请先登录",
          },
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id } = await params;

    // 查询报告详情
    const report = await prisma.fortuneReport.findFirst({
      where: {
        id,
        userId, // 确保用户隔离
        deletedAt: null, // 过滤已删除
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
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "报告不存在或已被删除",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
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
    console.error("Failed to fetch report detail:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "获取报告详情失败",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 软删除报告
 * 
 * - 确保用户隔离（只能删除自己的报告）
 * - 软删除：设置 deletedAt 字段，保留数据用于审计
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // 获取当前用户会话
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "请先登录",
          },
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id } = await params;

    // 先检查报告是否存在且属于当前用户
    const existingReport = await prisma.fortuneReport.findFirst({
      where: {
        id,
        userId, // 确保用户隔离
        deletedAt: null, // 只能删除未删除的记录
      },
      select: {
        id: true,
      },
    });

    if (!existingReport) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "报告不存在或已被删除",
          },
        },
        { status: 404 }
      );
    }

    // 执行软删除
    await prisma.fortuneReport.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: "报告已删除",
      },
    });
  } catch (error) {
    console.error("Failed to delete report:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "删除报告失败",
        },
      },
      { status: 500 }
    );
  }
}
