/**
 * 历史记录查询 API
 * 
 * GET /api/reports - 获取当前用户的命理分析报告列表
 * 
 * Query Parameters:
 * - page: 页码（默认 1）
 * - limit: 每页数量（默认 10，最大 50）
 * 
 * Requirements: 6.1, 6.2
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * 获取历史记录列表
 * 
 * - 确保用户隔离（只返回当前用户的记录）
 * - 按时间倒序排列
 * - 支持分页查询
 * - 过滤已删除的记录
 */
export async function GET(request: NextRequest) {
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

    // 解析分页参数
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    // 查询条件：当前用户 + 未删除
    const whereCondition = {
      userId,
      deletedAt: null,
    };

    // 并行查询：获取总数和分页数据
    const [total, reports] = await Promise.all([
      prisma.fortuneReport.count({
        where: whereCondition,
      }),
      prisma.fortuneReport.findMany({
        where: whereCondition,
        orderBy: {
          createdAt: "desc", // 按时间倒序
        },
        skip,
        take: limit,
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
      }),
    ]);

    // 计算分页信息
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    // 格式化返回数据
    const formattedReports = reports.map((report) => ({
      id: report.id,
      subjectId: report.subjectId,
      subjectName: report.subject?.name,
      birthInfo: report.birthInfo,
      baziChart: report.baziChart,
      analysis: report.analysis,
      pointsCost: report.pointsCost,
      createdAt: report.createdAt,
    }));

    return NextResponse.json({
      success: true,
      reports: formattedReports,
      data: {
        reports: formattedReports,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore,
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "获取历史记录失败",
        },
      },
      { status: 500 }
    );
  }
}
