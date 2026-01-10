/**
 * 测算对象的报告列表 API
 * GET /api/subjects/[id]/reports - 获取某个测算对象的所有报告
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSubjectById } from '@/lib/subject';
import prisma from '@/lib/prisma';
import type { BaziData } from '@/lib/bazi/types';
import type { FortuneAnalysis } from '@/lib/ai/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      );
    }

    const { id: subjectId } = await params;

    // 验证 subject 属于当前用户
    const subject = await getSubjectById(subjectId, session.user.id);
    if (!subject) {
      return NextResponse.json(
        { success: false, message: '测算对象不存在' },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const [reports, total] = await Promise.all([
      prisma.fortuneReport.findMany({
        where: {
          subjectId,
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.fortuneReport.count({
        where: {
          subjectId,
          deletedAt: null,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      subject,
      reports: reports.map((report) => ({
        id: report.id,
        subjectId: report.subjectId,
        baziData: report.baziChart as unknown as BaziData,
        analysis: report.analysis as unknown as FortuneAnalysis,
        pointsCost: report.pointsCost,
        createdAt: report.createdAt,
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Get subject reports error:', error);
    return NextResponse.json(
      { success: false, message: '获取报告列表失败' },
      { status: 500 }
    );
  }
}
