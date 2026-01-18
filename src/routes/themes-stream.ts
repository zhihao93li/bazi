/**
 * 流式主题解锁 API 路由
 * 
 * POST /unlock/stream - 流式解锁主题（SSE）
 */

import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { authRequired, requireUserId } from '../middleware/auth.js';
import { isValidTheme } from '../lib/themes/constants.js';
import { getThemePrice, ensureInitialAnalysis } from '../lib/themes/service.js';
import { deductPoints, refundPoints } from '../lib/points/service.js';
import { PointsError, PointsErrorCode } from '../lib/points/types.js';
import { generateThemeAnalysisStream } from '../lib/ai/service.js';
import prisma from '../lib/prisma.js';
import type { BaziData } from '../lib/bazi/types.js';
import type { AnalysisTheme } from '../lib/ai/types.js';

export const themesStreamRoutes = new Hono();

/**
 * 流式解锁主题
 * POST /api/themes/unlock/stream
 * Body: { subjectId: string, theme: string }
 * 
 * SSE Events:
 * - init: 开始生成
 * - chunk: 内容片段
 * - done: 完成，返回积分信息
 * - error: 错误信息
 */
themesStreamRoutes.post('/unlock/stream', authRequired, async (c) => {
    const userId = requireUserId(c);

    let body: { subjectId: string; theme: string };
    try {
        body = await c.req.json();
    } catch {
        return c.json({ success: false, message: '请求格式错误' }, 400);
    }

    const { subjectId, theme } = body;

    // 验证参数
    if (!subjectId) {
        return c.json({ success: false, message: '请选择测算对象', code: 'SUBJECT_REQUIRED' }, 400);
    }
    if (!theme || !isValidTheme(theme)) {
        return c.json({ success: false, message: '无效的主题', code: 'INVALID_THEME' }, 400);
    }

    // 获取主题价格
    const price = await getThemePrice(theme);
    if (price === null) {
        return c.json({ success: false, message: '无效的主题', code: 'INVALID_THEME' }, 400);
    }

    // 检查是否已解锁
    const existing = await prisma.themeAnalysis.findUnique({
        where: {
            subjectId_theme: { subjectId, theme },
        },
    });

    if (existing) {
        // 已解锁，返回已有内容（非流式）
        const account = await prisma.pointsAccount.findUnique({
            where: { userId },
            select: { balance: true },
        });
        return c.json({
            success: true,
            alreadyUnlocked: true,
            content: existing.content,
            pointsDeducted: 0,
            remainingBalance: account?.balance || 0,
        });
    }

    // 验证 Subject
    const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
        select: { userId: true, baziData: true, gender: true },
    });

    if (!subject) {
        return c.json({ success: false, message: '测算对象不存在', code: 'SUBJECT_NOT_FOUND' }, 404);
    }
    if (subject.userId !== userId) {
        return c.json({ success: false, message: '无权访问该测算对象', code: 'UNAUTHORIZED' }, 403);
    }
    if (!subject.baziData) {
        return c.json({ success: false, message: '测算对象缺少八字数据', code: 'BAZI_DATA_MISSING' }, 400);
    }

    const baziData = subject.baziData as unknown as BaziData;

    // 预扣积分
    let pointsDeducted = false;
    let deductResult: { balance?: number } = {};
    const orderId = `theme_stream_${subjectId}_${theme}`;

    try {
        deductResult = await deductPoints({
            userId,
            amount: price,
            description: `解锁主题解读 - ${theme}`,
            orderId,
        });
        pointsDeducted = true;
        console.log(`[Theme Stream] Points deducted: ${price}, remaining: ${deductResult.balance}`);
    } catch (error) {
        if (error instanceof PointsError && error.code === PointsErrorCode.INSUFFICIENT_BALANCE) {
            return c.json({ success: false, message: error.message, code: 'INSUFFICIENT_POINTS' }, 402);
        }
        throw error;
    }

    // 设置 SSE 响应
    return streamSSE(c, async (stream) => {
        let fullContent = '';

        try {
            // 发送初始化事件
            await stream.writeSSE({ event: 'init', data: JSON.stringify({ message: '开始生成' }) });

            // 确保初步解读已生成
            const initialAnalysis = await ensureInitialAnalysis(subjectId, baziData, subject.gender);

            // 流式生成主题解读
            const generator = generateThemeAnalysisStream(
                theme as AnalysisTheme,
                baziData,
                initialAnalysis,
                subject.gender
            );

            for await (const chunk of generator) {
                fullContent += chunk;
                await stream.writeSSE({ event: 'chunk', data: JSON.stringify({ content: chunk }) });
            }

            // 再次验证 Subject 仍然存在
            const subjectStillExists = await prisma.subject.findUnique({
                where: { id: subjectId },
                select: { id: true },
            });

            if (!subjectStillExists) {
                throw new Error('Subject was deleted during analysis generation');
            }

            // 保存到数据库
            await prisma.themeAnalysis.create({
                data: {
                    userId,
                    subjectId,
                    theme,
                    content: fullContent,
                    pointsCost: price,
                },
            });

            console.log(`[Theme Stream] Theme unlocked successfully: ${theme}`);

            // 发送完成事件
            await stream.writeSSE({
                event: 'done',
                data: JSON.stringify({
                    pointsDeducted: price,
                    remainingBalance: deductResult.balance,
                }),
            });

        } catch (error) {
            console.error('[Theme Stream] Error:', error);

            // 退还积分
            if (pointsDeducted) {
                try {
                    await refundPoints({
                        userId,
                        amount: price,
                        description: `解锁主题解读 - ${theme}`,
                        orderId,
                        reason: `流式生成失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    });
                    console.log('[Theme Stream] Points refunded');
                } catch (refundError) {
                    console.error('[Theme Stream] Failed to refund points:', refundError);
                }
            }

            // 发送错误事件
            const errorMessage = error instanceof Error ? error.message : '生成失败';
            await stream.writeSSE({
                event: 'error',
                data: JSON.stringify({ message: errorMessage, code: 'STREAM_ERROR' }),
            });
        }
    });
});
