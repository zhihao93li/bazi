/**
 * 异步任务队列服务
 *
 * 使用数据库持久化 + 后台 Worker 处理长时间运行的任务
 */

import type { Task as PrismaTask } from '@prisma/client';
import type { ThemeUnlockPayload, ThemeUnlockTask, Task, TaskStatus } from './types.js';
import { generateThemeAnalysis, generateInitialAnalysis, AIError } from '../ai/service.js';
import { refundPoints } from '../points/service.js';
import prisma from '../prisma.js';
import type { BaziData } from '../bazi/types.js';
import { THEME_NAMES } from '../themes/constants.js';

// 内存处理队列（追踪正在处理的任务）
const processingTasks = new Set<string>();
let isProcessing = false;
let pollTimer: NodeJS.Timeout | null = null;

// 配置（可通过环境变量覆盖）
const POLL_INTERVAL = parseInt(process.env.TASK_POLL_INTERVAL || '500', 10); // 轮询间隔（毫秒）
const MAX_CONCURRENT_TASKS = parseInt(process.env.MAX_CONCURRENT_TASKS || '50', 10); // 最大并发任务数

// 是否为 Worker 模式（只有 Worker 进程才处理任务）
let isWorkerMode = false;

/**
 * 将数据库任务转换为应用任务类型
 */
function toTask(dbTask: PrismaTask): Task {
    return {
        id: dbTask.id,
        type: dbTask.type as 'theme_unlock',
        status: dbTask.status as TaskStatus,
        payload: dbTask.payload as unknown as ThemeUnlockPayload,
        result: dbTask.result ?? undefined,
        error: dbTask.error ?? undefined,
        createdAt: dbTask.createdAt,
        completedAt: dbTask.completedAt ?? undefined,
    };
}

/**
 * 创建主题解锁任务
 * API 模式：只入队，不触发处理
 * Worker 模式：入队后触发处理
 */
export async function createThemeUnlockTask(payload: ThemeUnlockPayload): Promise<ThemeUnlockTask> {
    const dbTask = await prisma.task.create({
        data: {
            type: 'theme_unlock',
            status: 'pending',
            payload: payload as unknown as object,
            userId: payload.userId,
        },
    });

    console.log(`[Task Service] Created task: ${dbTask.id}, type: theme_unlock`);

    // 只有 Worker 模式才触发处理
    if (isWorkerMode) {
        triggerProcessing();
    }

    return toTask(dbTask) as ThemeUnlockTask;
}

/**
 * 获取任务状态
 */
export async function getTask(taskId: string): Promise<Task | undefined> {
    const dbTask = await prisma.task.findUnique({
        where: { id: taskId },
    });

    if (!dbTask) return undefined;
    return toTask(dbTask);
}

/**
 * 获取用户的任务列表
 */
export async function getUserTasks(userId: string, limit: number = 20): Promise<Task[]> {
    const dbTasks = await prisma.task.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });

    return dbTasks.map(toTask);
}

/**
 * 处理队列中的任务
 */
async function processQueue(): Promise<void> {
    // 防止并发进入
    if (isProcessing) return;
    isProcessing = true;

    try {
        // 检查是否达到并发上限
        if (processingTasks.size >= MAX_CONCURRENT_TASKS) {
            return;
        }

        // 查找待处理的任务（排除正在处理的）
        const pendingTasks = await prisma.task.findMany({
            where: {
                status: 'pending',
                id: { notIn: Array.from(processingTasks) },
            },
            orderBy: { createdAt: 'asc' },
            take: MAX_CONCURRENT_TASKS - processingTasks.size,
        });

        // 并发处理任务
        const promises = pendingTasks.map(async (dbTask) => {
            // 二次检查，防止竞态
            if (processingTasks.has(dbTask.id)) return;
            processingTasks.add(dbTask.id);

            try {
                await processTask(toTask(dbTask));
            } catch (error) {
                console.error(`[Task Service] Error processing task ${dbTask.id}:`, error);
            } finally {
                processingTasks.delete(dbTask.id);
            }
        });

        await Promise.all(promises);
    } catch (error) {
        console.error('[Task Service] Error in processQueue:', error);
    } finally {
        isProcessing = false;
    }
}

/**
 * 启动任务轮询
 */
function startPolling(): void {
    if (pollTimer) return;

    pollTimer = setInterval(async () => {
        try {
            await processQueue();
        } catch (error) {
            console.error('[Task Service] Polling error:', error);
        }
    }, POLL_INTERVAL);

    console.log('[Task Service] Task polling started');
}

/**
 * 停止任务轮询
 */
export function stopPolling(): void {
    if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
        console.log('[Task Service] Task polling stopped');
    }
}

/**
 * 触发立即处理（用于新任务创建后）
 */
function triggerProcessing(): void {
    // 确保轮询已启动
    startPolling();
    // 立即尝试处理
    processQueue().catch(console.error);
}

/**
 * 处理单个任务
 */
async function processTask(task: Task): Promise<void> {
    if (task.type !== 'theme_unlock') {
        console.error(`[Task Service] Unknown task type: ${task.type}`);
        return;
    }

    const payload = task.payload as ThemeUnlockPayload;
    const { subjectId, theme, userId, price } = payload;

    // 【并发保护】先检查是否已有其他任务完成了这个主题的解锁
    const existingAnalysis = await prisma.themeAnalysis.findUnique({
        where: { subjectId_theme: { subjectId, theme } },
    });

    if (existingAnalysis) {
        // 已被其他任务完成，跳过并退款
        console.log(`[Task Service] Theme already unlocked by another task: ${theme}, refunding...`);

        await prisma.task.update({
            where: { id: task.id },
            data: {
                status: 'completed',
                result: existingAnalysis.content as string,
                completedAt: new Date(),
            },
        });

        // 退还积分（因为是重复任务）
        try {
            await refundPoints({
                userId,
                amount: price,
                description: `解锁主题解读 - ${THEME_NAMES[theme as keyof typeof THEME_NAMES]}`,
                orderId: `task_${task.id}`,
                reason: '重复解锁，已由其他请求完成',
            });
            console.log(`[Task Service] Refunded duplicate task: ${task.id}`);
        } catch (refundError) {
            console.error(`[Task Service] Failed to refund duplicate task:`, refundError);
        }

        return;
    }

    // 更新状态为处理中
    await prisma.task.update({
        where: { id: task.id },
        data: {
            status: 'processing',
            startedAt: new Date(),
        },
    });
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
            initialAnalysis = await generateInitialAnalysis(baziData, subject.gender, subjectId);
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
            subject.gender,
            subjectId
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
        await prisma.task.update({
            where: { id: task.id },
            data: {
                status: 'completed',
                result: content,
                completedAt: new Date(),
            },
        });

        console.log(`[Task Service] Task completed: ${task.id}`);

    } catch (error) {
        console.error(`[Task Service] Task failed: ${task.id}`, error);

        // 获取用户友好的错误消息
        const userMessage = error instanceof AIError
            ? error.userMessage
            : '处理失败，请稍后重试';

        // 标记失败
        await prisma.task.update({
            where: { id: task.id },
            data: {
                status: 'failed',
                error: userMessage,
                completedAt: new Date(),
            },
        });

        // 退还积分
        try {
            await refundPoints({
                userId,
                amount: price,
                description: `解锁主题解读 - ${THEME_NAMES[theme as keyof typeof THEME_NAMES]}`,
                orderId: `task_${task.id}`,
                reason: '生成失败，系统已自动退款',
            });
            console.log(`[Task Service] Points refunded for task: ${task.id}`);
        } catch (refundError) {
            console.error(`[Task Service] Failed to refund points:`, refundError);
        }
    }
}

/**
 * 恢复未完成的任务（服务启动时调用）
 *
 * 将 processing 状态的任务重置为 pending，以便重新处理
 * 只在 Worker 模式下启动轮询
 */
export async function recoverPendingTasks(): Promise<number> {
    // 将所有 processing 状态的任务重置为 pending
    const result = await prisma.task.updateMany({
        where: { status: 'processing' },
        data: { status: 'pending', startedAt: null },
    });

    if (result.count > 0) {
        console.log(`[Task Service] Recovered ${result.count} interrupted tasks`);
    }

    // 只在 Worker 模式下启动轮询
    if (isWorkerMode) {
        startPolling();
    }

    return result.count;
}

/**
 * 启动 Worker 模式
 * 在独立 Worker 进程中调用，启动任务处理
 */
export async function startWorkerMode(): Promise<void> {
    isWorkerMode = true;
    console.log(`[Task Service] Worker mode enabled`);
    console.log(`[Task Service] Max concurrent tasks: ${MAX_CONCURRENT_TASKS}`);
    console.log(`[Task Service] Poll interval: ${POLL_INTERVAL}ms`);

    // 恢复中断的任务并启动轮询
    await recoverPendingTasks();
    startPolling();
}

/**
 * 检查是否为 Worker 模式
 */
export function isInWorkerMode(): boolean {
    return isWorkerMode;
}

/**
 * 清理过期任务（保留最近 7 天的任务）
 */
export async function cleanupTasks(): Promise<number> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const result = await prisma.task.deleteMany({
        where: {
            completedAt: {
                lt: sevenDaysAgo,
            },
            status: {
                in: ['completed', 'failed'],
            },
        },
    });

    if (result.count > 0) {
        console.log(`[Task Service] Cleaned up ${result.count} old tasks`);
    }

    return result.count;
}

// 每小时清理一次过期任务
setInterval(() => cleanupTasks(), 60 * 60 * 1000);
