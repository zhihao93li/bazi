/**
 * 测算对象服务
 */

import prisma from '../prisma.js';
import type { SubjectData, CreateSubjectInput, UpdateSubjectInput } from './types.js';

/**
 * 检查用户名下是否已存在同名测算对象
 */
export async function isSubjectNameExists(
  userId: string,
  name: string
): Promise<boolean> {
  const existing = await prisma.subject.findFirst({
    where: { userId, name },
  });
  return !!existing;
}

/**
 * 创建测算对象
 */
export async function createSubject(
  userId: string,
  input: CreateSubjectInput
): Promise<SubjectData> {
  const subject = await prisma.subject.create({
    data: {
      userId,
      name: input.name,
      gender: input.gender,
      calendarType: input.calendarType,
      birthYear: input.birthYear,
      birthMonth: input.birthMonth,
      birthDay: input.birthDay,
      birthHour: input.birthHour,
      birthMinute: input.birthMinute,
      isLeapMonth: input.isLeapMonth ?? false,
      location: input.location,
      baziData: input.baziData ?? undefined, // 存储前端计算的完整八字数据
      relationship: input.relationship,
      note: input.note,
    },
  });

  return subject as SubjectData;
}

/**
 * 获取用户的所有测算对象
 */
export async function getSubjectsByUserId(
  userId: string,
  options?: { limit?: number; offset?: number }
): Promise<{ subjects: SubjectData[]; total: number }> {
  const { limit = 50, offset = 0 } = options || {};

  const [subjects, total] = await Promise.all([
    prisma.subject.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.subject.count({ where: { userId } }),
  ]);

  return { subjects: subjects as SubjectData[], total };
}

/**
 * 根据 ID 获取测算对象
 */
export async function getSubjectById(
  subjectId: string,
  userId: string
): Promise<SubjectData | null> {
  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, userId },
  });

  return subject as SubjectData | null;
}

/**
 * 更新测算对象
 */
export async function updateSubject(
  subjectId: string,
  userId: string,
  input: UpdateSubjectInput
): Promise<SubjectData | null> {
  // 先检查是否存在且属于该用户
  const existing = await prisma.subject.findFirst({
    where: { id: subjectId, userId },
  });

  if (!existing) {
    return null;
  }

  const subject = await prisma.subject.update({
    where: { id: subjectId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.gender !== undefined && { gender: input.gender }),
      ...(input.calendarType !== undefined && { calendarType: input.calendarType }),
      ...(input.birthYear !== undefined && { birthYear: input.birthYear }),
      ...(input.birthMonth !== undefined && { birthMonth: input.birthMonth }),
      ...(input.birthDay !== undefined && { birthDay: input.birthDay }),
      ...(input.birthHour !== undefined && { birthHour: input.birthHour }),
      ...(input.birthMinute !== undefined && { birthMinute: input.birthMinute }),
      ...(input.isLeapMonth !== undefined && { isLeapMonth: input.isLeapMonth }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.relationship !== undefined && { relationship: input.relationship }),
      ...(input.note !== undefined && { note: input.note }),
    },
  });

  return subject as SubjectData;
}

/**
 * 删除测算对象
 */
export async function deleteSubject(
  subjectId: string,
  userId: string
): Promise<boolean> {
  const existing = await prisma.subject.findFirst({
    where: { id: subjectId, userId },
  });

  if (!existing) {
    return false;
  }

  await prisma.subject.delete({
    where: { id: subjectId },
  });

  return true;
}

/**
 * 获取测算对象的报告数量
 */
export async function getSubjectReportCount(subjectId: string): Promise<number> {
  return prisma.fortuneReport.count({
    where: { subjectId, deletedAt: null },
  });
}
