/**
 * 异步任务类型定义
 */

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type TaskType = 'theme_unlock';

export interface ThemeUnlockPayload {
    subjectId: string;
    theme: string;
    userId: string;
    price: number;
}

export interface Task<T = unknown> {
    id: string;
    type: TaskType;
    status: TaskStatus;
    payload: T;
    result?: string;
    error?: string;
    createdAt: Date;
    completedAt?: Date;
}

export interface ThemeUnlockTask extends Task<ThemeUnlockPayload> {
    type: 'theme_unlock';
}
