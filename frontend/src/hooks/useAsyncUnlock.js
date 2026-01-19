/**
 * useAsyncUnlock - 异步解锁主题 Hook（v3）
 * 
 * 改进:
 * 1. 每个主题独立管理状态
 * 2. 使用 sessionStorage 持久化进行中的任务
 * 3. 避免重复轮询导致的重复 toast
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { THEME_STATUS_QUERY_KEY } from './useThemes';

const POLL_INTERVAL = 2000;
const MAX_POLL_TIME = 5 * 60 * 1000;
const STORAGE_KEY = 'async_unlock_tasks';

function getStoredTasks() {
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

function storeTasks(tasks) {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
        console.error('[useAsyncUnlock] Failed to store tasks:', e);
    }
}

function clearStoredTask(themeKey) {
    const tasks = getStoredTasks();
    delete tasks[themeKey];
    storeTasks(tasks);
}

export function useAsyncUnlock({
    onSuccess,
    onError,
    updateUser,
} = {}) {
    const queryClient = useQueryClient();

    const [taskStates, setTaskStates] = useState({});
    const pollTimersRef = useRef({});
    const activePollingRef = useRef(new Set()); // 跟踪正在轮询的任务，防止重复
    const mountedRef = useRef(true);

    // 使用 ref 保存回调，避免依赖变化
    const callbacksRef = useRef({ onSuccess, onError, updateUser });
    useEffect(() => {
        callbacksRef.current = { onSuccess, onError, updateUser };
    }, [onSuccess, onError, updateUser]);

    const getThemeKey = (subjectId, theme) => `${subjectId}:${theme}`;

    const stopPolling = useCallback((themeKey) => {
        if (pollTimersRef.current[themeKey]) {
            clearTimeout(pollTimersRef.current[themeKey]);
            delete pollTimersRef.current[themeKey];
        }
        activePollingRef.current.delete(themeKey);
    }, []);

    const updateTaskState = useCallback((themeKey, updates) => {
        if (!mountedRef.current) return;
        setTaskStates(prev => {
            const newStates = { ...prev };
            if (updates === null) {
                delete newStates[themeKey];
            } else {
                newStates[themeKey] = { ...prev[themeKey], ...updates };
            }
            return newStates;
        });
    }, []);

    // 轮询函数 - 不使用 useCallback 避免依赖问题
    const pollTask = async (themeKey, taskId, subjectId, theme, startTime) => {
        // 检查是否仍需要轮询
        if (!mountedRef.current || !activePollingRef.current.has(themeKey)) {
            return;
        }

        try {
            const response = await api.get(`/tasks/${taskId}`);

            if (!response.success) {
                throw new Error(response.message || '查询任务状态失败');
            }

            const { status: taskStatus, content, error } = response;

            if (taskStatus === 'completed') {
                stopPolling(themeKey);
                clearStoredTask(themeKey);

                // 先 refetch 数据，确保新数据加载完成后再清除任务状态
                // 这样可以避免在数据返回前短暂显示"未解锁"状态
                await queryClient.invalidateQueries({ queryKey: [THEME_STATUS_QUERY_KEY, subjectId] });
                await queryClient.refetchQueries({ queryKey: [THEME_STATUS_QUERY_KEY, subjectId] });

                // 数据加载完成后，再清除任务状态
                updateTaskState(themeKey, null);

                callbacksRef.current.onSuccess?.({ content, theme });
                return;
            }

            if (taskStatus === 'failed') {
                stopPolling(themeKey);
                updateTaskState(themeKey, null);
                clearStoredTask(themeKey);
                callbacksRef.current.onError?.({ message: error || '解锁失败，积分已退还', code: 'TASK_FAILED', theme });
                return;
            }

            if (Date.now() - startTime > MAX_POLL_TIME) {
                stopPolling(themeKey);
                updateTaskState(themeKey, null);
                clearStoredTask(themeKey);
                callbacksRef.current.onError?.({ message: '任务超时，请刷新页面查看结果', code: 'POLL_TIMEOUT', theme });
                return;
            }

            // 继续轮询
            if (mountedRef.current && activePollingRef.current.has(themeKey)) {
                pollTimersRef.current[themeKey] = setTimeout(() => {
                    pollTask(themeKey, taskId, subjectId, theme, startTime);
                }, POLL_INTERVAL);
            }

        } catch (err) {
            console.error('[useAsyncUnlock] Poll error:', themeKey, err);
            if (mountedRef.current && activePollingRef.current.has(themeKey)) {
                pollTimersRef.current[themeKey] = setTimeout(() => {
                    pollTask(themeKey, taskId, subjectId, theme, startTime);
                }, POLL_INTERVAL);
            }
        }
    };

    const startPolling = useCallback((themeKey, taskId, subjectId, theme, startTime) => {
        // 如果已经在轮询，不重复启动
        if (activePollingRef.current.has(themeKey)) {
            console.log('[useAsyncUnlock] Already polling:', themeKey);
            return;
        }

        stopPolling(themeKey);
        activePollingRef.current.add(themeKey);
        console.log('[useAsyncUnlock] Starting polling:', themeKey);
        pollTask(themeKey, taskId, subjectId, theme, startTime);
    }, [stopPolling, updateTaskState, queryClient]);

    // 初始化 - 只执行一次
    useEffect(() => {
        mountedRef.current = true;

        // 恢复进行中的任务
        const stored = getStoredTasks();
        const initialStates = {};

        for (const [themeKey, task] of Object.entries(stored)) {
            if (task.taskId && (task.status === 'pending' || task.status === 'processing')) {
                initialStates[themeKey] = { ...task, status: 'processing' };
                // 延迟启动轮询，确保状态已设置
                setTimeout(() => {
                    if (mountedRef.current && !activePollingRef.current.has(themeKey)) {
                        startPolling(themeKey, task.taskId, task.subjectId, task.theme, task.startTime);
                    }
                }, 100);
            }
        }

        if (Object.keys(initialStates).length > 0) {
            setTaskStates(initialStates);
        }

        return () => {
            mountedRef.current = false;
            Object.keys(pollTimersRef.current).forEach(key => {
                clearTimeout(pollTimersRef.current[key]);
            });
            activePollingRef.current.clear();
        };
    }, []); // 空依赖，只执行一次

    const unlock = useCallback(async ({ subjectId, theme }) => {
        const themeKey = getThemeKey(subjectId, theme);

        if (activePollingRef.current.has(themeKey)) {
            console.log('[useAsyncUnlock] Task already in progress:', themeKey);
            return;
        }

        try {
            updateTaskState(themeKey, { status: 'pending', subjectId, theme });

            const response = await api.post('/themes/unlock', { subjectId, theme });

            if (!response.success) {
                throw { message: response.message, code: response.code };
            }

            if (response.alreadyUnlocked) {
                updateTaskState(themeKey, null);
                await queryClient.invalidateQueries({ queryKey: [THEME_STATUS_QUERY_KEY, subjectId] });
                await queryClient.refetchQueries({ queryKey: [THEME_STATUS_QUERY_KEY, subjectId] });
                callbacksRef.current.onSuccess?.({ content: response.content, alreadyUnlocked: true, theme });
                return;
            }

            if (callbacksRef.current.updateUser && response.remainingBalance !== undefined) {
                callbacksRef.current.updateUser({ balance: response.remainingBalance });
            }

            const taskInfo = {
                taskId: response.taskId,
                status: 'processing',
                subjectId,
                theme,
                startTime: Date.now(),
            };

            updateTaskState(themeKey, taskInfo);

            const stored = getStoredTasks();
            stored[themeKey] = taskInfo;
            storeTasks(stored);

            startPolling(themeKey, response.taskId, subjectId, theme, taskInfo.startTime);

        } catch (err) {
            console.error('[useAsyncUnlock] Unlock error:', themeKey, err);
            updateTaskState(themeKey, null);
            callbacksRef.current.onError?.(err);
        }
    }, [queryClient, updateTaskState, startPolling]);

    const isThemeUnlocking = useCallback((subjectId, theme) => {
        const themeKey = getThemeKey(subjectId, theme);
        return activePollingRef.current.has(themeKey) ||
            taskStates[themeKey]?.status === 'pending' ||
            taskStates[themeKey]?.status === 'processing';
    }, [taskStates]);

    const getThemeStatus = useCallback((subjectId, theme) => {
        const themeKey = getThemeKey(subjectId, theme);
        return taskStates[themeKey]?.status || 'idle';
    }, [taskStates]);

    return {
        unlock,
        isThemeUnlocking,
        getThemeStatus,
        taskStates,
    };
}

export default useAsyncUnlock;
