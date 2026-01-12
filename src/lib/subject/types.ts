/**
 * 测算对象类型定义
 */

import type { BaziData } from '../bazi/types.js';

export interface SubjectData {
  id: string;
  userId: string;
  name: string;
  gender: 'male' | 'female';
  calendarType: 'solar' | 'lunar';
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
  birthMinute: number;
  isLeapMonth: boolean;
  location: string;          // 出生地点（省/市/区 三级格式）
  baziData?: BaziData | null; // 完整八字计算结果
  relationship?: string | null;
  note?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubjectInput {
  name: string;
  gender: 'male' | 'female';
  calendarType: 'solar' | 'lunar';
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
  birthMinute: number;
  isLeapMonth?: boolean;
  location: string;          // 出生地点（省/市/区 三级格式）
  baziData?: BaziData;       // 完整八字计算结果（前端传入）
  relationship?: string;
  note?: string;
}

export interface UpdateSubjectInput {
  name?: string;
  gender?: 'male' | 'female';
  calendarType?: 'solar' | 'lunar';
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  birthHour?: number;
  birthMinute?: number;
  isLeapMonth?: boolean;
  location?: string;
  relationship?: string;
  note?: string;
  // 注意：baziData 一旦创建就不允许修改，只能重新排盘创建新对象
}

export type SubjectRelationship = 'self' | 'family' | 'friend' | 'other';
