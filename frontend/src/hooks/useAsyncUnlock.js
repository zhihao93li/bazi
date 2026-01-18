/**
 * useAsyncUnlock - 异步解锁主题 Hook
 * 
 * 使用异步任务队列模式：
 * 1. 提交解锁请求 → 立即返回任务 ID
 * 2. 轮询任务状态 → 直到完成或失败
 */

import { useState, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

const POLL_INTERVAL = 3000; // 3 秒轮询一次
const MAX_POLL_TIME = 5 * 60 * 1000; // 最长轮询 5 分钟

export function useAsyncUnlock({
    onSuccess,
    onError,
    updateUser,
} = {}) {
    const queryClient = useQueryClient();
    const [status, setStatus] = useState('idle'); // idle | pending | processing | completed | failed
    const [taskId, setTaskId] = useState(null);
    const pollTimerRef = useRef(null);
    const startTimeRef = useRef(null);

    // 清理轮询
    const stopPolling = useCallback(() => {
        if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
        }
    }, []);

    // 轮询任务状态
    const pollTaskStatus = useCallback(async (taskId, subjectId) => {
        try {
            const response = await api.get(`/tasks/${taskId}`);

            if (!response.success) {
                throw new Error(response.message || '查询任务状态失败');
            }

            const { status: taskStatus, content, error } = response;
            setStatus(taskStatus);

            if (taskStatus === 'completed') {
                stopPolling();

                // 更新缓存
                queryClient.invalidateQueries({ queryKey: ['themes', subjectId] });

                onSuccess?.({ content });
                return;
            }

            if (taskStatus === 'failed') {
                stopPolling();
                onError?.({ message: error || '解锁失败，积分已退还', code: 'TASK_FAILED' });
                return;
            }

            // 检查是否超时
            if (Date.now() - startTimeRef.current > MAX_POLL_TIME) {
                stopPolling();
                onError?.({ message: '任务超时，请稍后刷新页面查看', code: 'POLL_TIMEOUT' });
            }

        } catch (err) {
            console.error('[useAsyncUnlock] Poll error:', err);
            // 网络错误时继续轮询，不中断
        }
    }, [queryClient, stopPolling, onSuccess, onError]);

    // 开始轮询
    const startPolling = useCallback((taskId, subjectId) => {
        startTimeRef.current = Date.now();

        // 立即执行一次
        pollTaskStatus(taskId, subjectId);

        // 设置定时轮询
        pollTimerRef.current = setInterval(() => {
            pollTaskStatus(taskId, subjectId);
        }, POLL_INTERVAL);
    }, [pollTaskStatus]);

    // 解锁主题
    const unlock = useCallback(async ({ subjectId, theme }) => {
        try {
            setStatus('pending');
            setTaskId(null);

            const response = await api.post('/themes/unlock', { subjectId, theme });

            if (!response.success) {
                throw { message: response.message, code: response.code };
            }

            // 如果已解锁，直接完成
            if (response.alreadyUnlocked) {
                setStatus('completed');
                queryClient.invalidateQueries({ queryKey: ['themes', subjectId] });
                onSuccess?.({ content: response.content, alreadyUnlocked: true });
                return;
            }

            // 更新用户余额
            if (updateUser && response.remainingBalance !== undefined) {
                updateUser({ points: response.remainingBalance });
            }

            // 开始轮询任务状态
            const { taskId } = response;
            setTaskId(taskId);
            setStatus('processing');
            startPolling(taskId, subjectId);

        } catch (err) {
            setStatus('failed');
            onError?.(err);
        }
    }, [queryClient, startPolling, updateUser, onSuccess, onError]);

    // 组件卸载时清理
    const cleanup = useCallback(() => {
        stopPolling();
        setStatus('idle');
        setTaskId(null);
    }, [stopPolling]);

    return {
        unlock,
        status,
        taskId,
        isUnlocking: status === 'pending' || status === 'processing',
        cleanup,
    };
}

export default useAsyncUnlock;
