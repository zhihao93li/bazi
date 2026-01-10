/**
 * 测算对象类型定义
 */

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
  location: string;
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
  location: string;
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
}

export type SubjectRelationship = 'self' | 'family' | 'friend' | 'other';
