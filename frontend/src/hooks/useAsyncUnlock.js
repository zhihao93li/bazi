/**
 * useAsyncUnlock - 异步解锁主题 Hook
 * 
 * 使用异步任务队列模式：
 * 1. 提交解锁请求 → 立即返回任务 ID
 * 2. 轮询任务状态 → 直到完成或失败
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { THEME_STATUS_QUERY_KEY } from './useThemes';

const POLL_INTERVAL = 2000; // 2 秒轮询一次
const MAX_POLL_TIME = 5 * 60 * 1000; // 最长轮询 5 分钟

export function useAsyncUnlock({
    onSuccess,
    onError,
    updateUser,
} = {}) {
    const queryClient = useQueryClient();
    const [status, setStatus] = useState('idle'); // idle | pending | processing | completed | failed
    const [taskId, setTaskId] = useState(null);
    const [subjectId, setSubjectId] = useState(null);
    const pollTimerRef = useRef(null);
    const startTimeRef = useRef(null);
    const isPollingRef = useRef(false);

    // 保存回调的 ref，避免依赖变化导致问题
    const callbacksRef = useRef({ onSuccess, onError, updateUser });
    callbacksRef.current = { onSuccess, onError, updateUser };

    // 清理轮询
    const stopPolling = useCallback(() => {
        console.log('[useAsyncUnlock] Stopping polling');
        if (pollTimerRef.current) {
            clearTimeout(pollTimerRef.current);
            pollTimerRef.current = null;
        }
        isPollingRef.current = false;
    }, []);

    // 轮询任务状态（使用 setTimeout 而非 setInterval，避免堆积）
    const pollOnce = useCallback(async () => {
        if (!isPollingRef.current || !taskId || !subjectId) {
            return;
        }

        try {
            console.log('[useAsyncUnlock] Polling task:', taskId);
            const response = await api.get(`/tasks/${taskId}`);

            if (!response.success) {
                throw new Error(response.message || '查询任务状态失败');
            }

            const { status: taskStatus, content, error } = response;
            console.log('[useAsyncUnlock] Task status:', taskStatus);

            if (taskStatus === 'completed') {
                stopPolling();
                setStatus('completed');

                // 更新缓存，强制刷新
                await queryClient.invalidateQueries({ queryKey: [THEME_STATUS_QUERY_KEY, subjectId] });
                await queryClient.refetchQueries({ queryKey: [THEME_STATUS_QUERY_KEY, subjectId] });

                callbacksRef.current.onSuccess?.({ content });
                return;
            }

            if (taskStatus === 'failed') {
                stopPolling();
                setStatus('failed');
                callbacksRef.current.onError?.({ message: error || '解锁失败，积分已退还', code: 'TASK_FAILED' });
                return;
            }

            // 检查是否超时
            if (Date.now() - startTimeRef.current > MAX_POLL_TIME) {
                stopPolling();
                setStatus('failed');
                callbacksRef.current.onError?.({ message: '任务超时，请稍后刷新页面查看', code: 'POLL_TIMEOUT' });
                return;
            }

            // 继续轮询（使用 setTimeout 而非 setInterval）
            if (isPollingRef.current) {
                pollTimerRef.current = setTimeout(pollOnce, POLL_INTERVAL);
            }

        } catch (err) {
            console.error('[useAsyncUnlock] Poll error:', err);
            // 网络错误时继续轮询
            if (isPollingRef.current) {
                pollTimerRef.current = setTimeout(pollOnce, POLL_INTERVAL);
            }
        }
    }, [taskId, subjectId, queryClient, stopPolling]);

    // 开始轮询
    const startPolling = useCallback(() => {
        // 先清理之前的轮询
        stopPolling();

        startTimeRef.current = Date.now();
        isPollingRef.current = true;

        console.log('[useAsyncUnlock] Starting polling for task:', taskId);

        // 立即执行第一次轮询
        pollOnce();
    }, [pollOnce, stopPolling, taskId]);

    // 当 taskId 变化时开始轮询
    useEffect(() => {
        if (taskId && subjectId && status === 'processing') {
            startPolling();
        }

        return () => {
            stopPolling();
        };
    }, [taskId, subjectId, status, startPolling, stopPolling]);

    // 解锁主题
    const unlock = useCallback(async ({ subjectId: sid, theme }) => {
        try {
            // 先清理之前的状态
            stopPolling();
            setStatus('pending');
            setTaskId(null);
            setSubjectId(sid);

            console.log('[useAsyncUnlock] Submitting unlock request:', { subjectId: sid, theme });
            const response = await api.post('/themes/unlock', { subjectId: sid, theme });

            if (!response.success) {
                throw { message: response.message, code: response.code };
            }

            // 如果已解锁，直接完成
            if (response.alreadyUnlocked) {
                console.log('[useAsyncUnlock] Already unlocked');
                setStatus('completed');
                await queryClient.invalidateQueries({ queryKey: [THEME_STATUS_QUERY_KEY, sid] });
                await queryClient.refetchQueries({ queryKey: [THEME_STATUS_QUERY_KEY, sid] });
                callbacksRef.current.onSuccess?.({ content: response.content, alreadyUnlocked: true });
                return;
            }

            // 更新用户余额
            if (callbacksRef.current.updateUser && response.remainingBalance !== undefined) {
                callbacksRef.current.updateUser({ points: response.remainingBalance });
            }

            // 设置任务 ID，触发轮询（通过 useEffect）
            console.log('[useAsyncUnlock] Task created:', response.taskId);
            setTaskId(response.taskId);
            setStatus('processing');

        } catch (err) {
            console.error('[useAsyncUnlock] Unlock error:', err);
            setStatus('failed');
            callbacksRef.current.onError?.(err);
        }
    }, [queryClient, stopPolling]);

    // 组件卸载时清理
    useEffect(() => {
        return () => {
            stopPolling();
        };
    }, [stopPolling]);

    return {
        unlock,
        status,
        taskId,
        isUnlocking: status === 'pending' || status === 'processing',
    };
}

export default useAsyncUnlock;
