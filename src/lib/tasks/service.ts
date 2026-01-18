/**
 * 异步任务队列服务
 * 
 * 使用内存队列 + 后台 Worker 处理长时间运行的任务
 */

import { randomUUID } from 'crypto';
import type { Task, TaskStatus, ThemeUnlockPayload, ThemeUnlockTask } from './types.js';
import { generateThemeAnalysis, generateInitialAnalysis } from '../ai/service.js';
import { refundPoints } from '../points/service.js';
import prisma from '../prisma.js';
import type { BaziData } from '../bazi/types.js';

// 任务存储（内存）
const tasks = new Map<string, Task>();

// 处理队列
const processingQueue: string[] = [];
let isProcessing = false;

/**
 * 创建主题解锁任务
 */
export function createThemeUnlockTask(payload: ThemeUnlockPayload): ThemeUnlockTask {
    const task: ThemeUnlockTask = {
        id: randomUUID(),
        type: 'theme_unlock',
        status: 'pending',
        payload,
        createdAt: new Date(),
    };

    tasks.set(task.id, task);
    processingQueue.push(task.id);

    console.log(`[Task Service] Created task: ${task.id}, type: ${task.type}`);

    // 触发队列处理
    processQueue();

    return task;
}

/**
 * 获取任务状态
 */
export function getTask(taskId: string): Task | undefined {
    return tasks.get(taskId);
}

/**
 * 处理队列中的任务
 */
async function processQueue(): Promise<void> {
    if (isProcessing) return;
    if (processingQueue.length === 0) return;

    isProcessing = true;

    while (processingQueue.length > 0) {
        const taskId = processingQueue.shift()!;
        const task = tasks.get(taskId);

        if (!task) continue;

        try {
            await processTask(task);
        } catch (error) {
            console.error(`[Task Service] Error processing task ${taskId}:`, error);
        }
    }

    isProcessing = false;
}

/**
 * 处理单个任务
 */
async function processTask(task: Task): Promise<void> {
    if (task.type !== 'theme_unlock') {
        console.error(`[Task Service] Unknown task type: ${task.type}`);
        return;
    }

    const themeTask = task as ThemeUnlockTask;
    const { subjectId, theme, userId, price } = themeTask.payload;

    // 更新状态为处理中
    task.status = 'processing';
    console.log(`[Task Service] Processing task: ${task.id}, theme: ${theme}`);

    try {
        // 获取 Subject 数据
        const subject = await prisma.subject.findUnique({
            where: { id: subjectId },
            select: { baziData: true, gender: true, initialAnalysis: true },
        });

        if (!subject || !subject.baziData) {
            throw new Error('测算对象不存在或数据不完整');
        }

        const baziData = subject.baziData as unknown as BaziData;

        // 确保初步解读存在
        let initialAnalysis = subject.initialAnalysis;
        if (!initialAnalysis) {
            console.log(`[Task Service] Generating initial analysis for subject: ${subjectId}`);
            initialAnalysis = await generateInitialAnalysis(baziData, subject.gender);
            await prisma.subject.update({
                where: { id: subjectId },
                data: { initialAnalysis },
            });
        }

        // 生成主题解读
        console.log(`[Task Service] Generating theme analysis: ${theme}`);
        const content = await generateThemeAnalysis(
            theme as Parameters<typeof generateThemeAnalysis>[0],
            baziData,
            initialAnalysis as string,
            subject.gender
        );

        // 再次验证 Subject 存在
        const subjectStillExists = await prisma.subject.findUnique({
            where: { id: subjectId },
            select: { id: true },
        });

        if (!subjectStillExists) {
            throw new Error('测算对象在处理过程中被删除');
        }

        // 保存到数据库
        await prisma.themeAnalysis.upsert({
            where: { subjectId_theme: { subjectId, theme } },
            create: {
                userId,
                subjectId,
                theme,
                content,
                pointsCost: price,
            },
            update: {
                content,
                pointsCost: price,
            },
        });

        // 标记完成
        task.status = 'completed';
        task.result = content;
        task.completedAt = new Date();

        console.log(`[Task Service] Task completed: ${task.id}`);

    } catch (error) {
        console.error(`[Task Service] Task failed: ${task.id}`, error);

        task.status = 'failed';
        task.error = error instanceof Error ? error.message : '处理失败';
        task.completedAt = new Date();

        // 退还积分
        try {
            await refundPoints({
                userId,
                amount: price,
                description: `解锁主题解读 - ${theme}`,
                orderId: `task_${task.id}`,
                reason: task.error,
            });
            console.log(`[Task Service] Points refunded for task: ${task.id}`);
        } catch (refundError) {
            console.error(`[Task Service] Failed to refund points:`, refundError);
        }
    }
}

/**
 * 清理过期任务（保留最近 1 小时的任务）
 */
export function cleanupTasks(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    for (const [id, task] of tasks) {
        if (task.completedAt && task.completedAt < oneHourAgo) {
            tasks.delete(id);
        }
    }
}

// 每 10 分钟清理一次过期任务
setInterval(cleanupTasks, 10 * 60 * 1000);
