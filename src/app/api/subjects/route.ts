/**
 * 测算对象 API
 * GET /api/subjects - 获取用户的测算对象列表
 * POST /api/subjects - 创建新的测算对象
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createSubject, getSubjectsByUserId } from '@/lib/subject';
import type { CreateSubjectInput } from '@/lib/subject';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const { subjects, total } = await getSubjectsByUserId(session.user.id, {
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      subjects,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    return NextResponse.json(
      { success: false, message: '获取测算对象失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const input: CreateSubjectInput = {
      name: body.name,
      gender: body.gender,
      calendarType: body.calendarType,
      birthYear: body.birthYear,
      birthMonth: body.birthMonth,
      birthDay: body.birthDay,
      birthHour: body.birthHour,
      birthMinute: body.birthMinute,
      isLeapMonth: body.isLeapMonth,
      location: body.location,
      relationship: body.relationship,
      note: body.note,
    };

    // 基本验证
    if (!input.name || !input.gender || !input.location) {
      return NextResponse.json(
        { success: false, message: '请填写必要信息' },
        { status: 400 }
      );
    }

    const subject = await createSubject(session.user.id, input);

    return NextResponse.json({
      success: true,
      message: '创建成功',
      subject,
    });
  } catch (error) {
    console.error('Create subject error:', error);
    return NextResponse.json(
      { success: false, message: '创建测算对象失败' },
      { status: 500 }
    );
  }
}
