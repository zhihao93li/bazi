/**
 * 单个测算对象 API
 * GET /api/subjects/[id] - 获取测算对象详情
 * PUT /api/subjects/[id] - 更新测算对象
 * DELETE /api/subjects/[id] - 删除测算对象
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getSubjectById,
  updateSubject,
  deleteSubject,
  getSubjectReportCount,
} from '@/lib/subject';
import type { UpdateSubjectInput } from '@/lib/subject';

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

    const { id } = await params;
    const subject = await getSubjectById(id, session.user.id);

    if (!subject) {
      return NextResponse.json(
        { success: false, message: '测算对象不存在' },
        { status: 404 }
      );
    }

    // 获取关联的报告数量
    const reportCount = await getSubjectReportCount(id);

    return NextResponse.json({
      success: true,
      subject,
      reportCount,
    });
  } catch (error) {
    console.error('Get subject error:', error);
    return NextResponse.json(
      { success: false, message: '获取测算对象失败' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const input: UpdateSubjectInput = {};
    if (body.name !== undefined) input.name = body.name;
    if (body.gender !== undefined) input.gender = body.gender;
    if (body.calendarType !== undefined) input.calendarType = body.calendarType;
    if (body.birthYear !== undefined) input.birthYear = body.birthYear;
    if (body.birthMonth !== undefined) input.birthMonth = body.birthMonth;
    if (body.birthDay !== undefined) input.birthDay = body.birthDay;
    if (body.birthHour !== undefined) input.birthHour = body.birthHour;
    if (body.birthMinute !== undefined) input.birthMinute = body.birthMinute;
    if (body.isLeapMonth !== undefined) input.isLeapMonth = body.isLeapMonth;
    if (body.location !== undefined) input.location = body.location;
    if (body.relationship !== undefined) input.relationship = body.relationship;
    if (body.note !== undefined) input.note = body.note;

    const subject = await updateSubject(id, session.user.id, input);

    if (!subject) {
      return NextResponse.json(
        { success: false, message: '测算对象不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '更新成功',
      subject,
    });
  } catch (error) {
    console.error('Update subject error:', error);
    return NextResponse.json(
      { success: false, message: '更新测算对象失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const success = await deleteSubject(id, session.user.id);

    if (!success) {
      return NextResponse.json(
        { success: false, message: '测算对象不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('Delete subject error:', error);
    return NextResponse.json(
      { success: false, message: '删除测算对象失败' },
      { status: 500 }
    );
  }
}
