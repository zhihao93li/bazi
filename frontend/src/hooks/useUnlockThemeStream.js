/**
 * 流式解锁主题 Hook
 * 
 * 使用 SSE (Server-Sent Events) 实现流式解锁，
 * 实时显示 AI 生成的内容
 */

import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getToken } from '../services/api';
import { setThemeCache } from '../utils/themeCache';
import { THEME_STATUS_QUERY_KEY } from './useThemes';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

/**
 * 解析 SSE 事件
 */
function parseSSEEvent(line) {
    if (line.startsWith('event: ')) {
        return { type: 'event', value: line.slice(7) };
    }
    if (line.startsWith('data: ')) {
        return { type: 'data', value: line.slice(6) };
    }
    return null;
}

/**
 * 流式解锁主题 Hook
 * 
 * @param {Object} options
 * @param {Function} options.onChunk - 每收到一个内容片段时的回调
 * @param {Function} options.onSuccess - 完成时的回调
 * @param {Function} options.onError - 错误时的回调
 * @param {Function} options.updateUser - 更新用户余额
 */
export function useUnlockThemeStream({ onChunk, onSuccess, onError, updateUser } = {}) {
    const queryClient = useQueryClient();
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const abortControllerRef = useRef(null);

    const startStream = useCallback(async ({ subjectId, theme }) => {
        // 如果已经在流式传输，先取消
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        setIsStreaming(true);
        setStreamingContent('');

        // 设置乐观更新：显示 loading 状态
        queryClient.setQueryData([THEME_STATUS_QUERY_KEY, subjectId], (old) => {
            if (!old) return old;
            return {
                ...old,
                [theme]: {
                    ...old[theme],
                    isLoading: true,
                },
            };
        });

        const token = getToken();
        abortControllerRef.current = new AbortController();

        try {
            const response = await fetch(`${API_BASE}/themes/unlock/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify({ subjectId, theme }),
                signal: abortControllerRef.current.signal,
            });

            // 检查是否是非流式响应（已解锁或错误）
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                const data = await response.json();

                if (data.alreadyUnlocked) {
                    // 已解锁，更新缓存并返回
                    queryClient.setQueryData([THEME_STATUS_QUERY_KEY, subjectId], (old) => {
                        if (!old) return old;
                        return {
                            ...old,
                            [theme]: {
                                ...old[theme],
                                isUnlocked: true,
                                content: data.content,
                                isLoading: false,
                            },
                        };
                    });
                    setIsStreaming(false);
                    onSuccess?.({ content: data.content, pointsDeducted: 0, remainingBalance: data.remainingBalance });
                    return;
                }

                // 错误响应
                if (!data.success) {
                    throw new Error(data.message || '请求失败');
                }
            }

            // 处理 SSE 流
            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('无法读取响应流');
            }

            const decoder = new TextDecoder();
            let currentEvent = null;
            let accumulatedContent = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');

                // 保留最后一行（可能不完整）
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) {
                        // 空行表示事件结束
                        currentEvent = null;
                        continue;
                    }

                    const parsed = parseSSEEvent(trimmed);
                    if (!parsed) continue;

                    if (parsed.type === 'event') {
                        currentEvent = parsed.value;
                    } else if (parsed.type === 'data') {
                        try {
                            const payload = JSON.parse(parsed.value);

                            if (currentEvent === 'chunk') {
                                accumulatedContent += payload.content;
                                setStreamingContent(accumulatedContent);
                                onChunk?.(payload.content, accumulatedContent);
                            } else if (currentEvent === 'done') {
                                // 流式完成
                                queryClient.setQueryData([THEME_STATUS_QUERY_KEY, subjectId], (old) => {
                                    if (!old) return old;
                                    return {
                                        ...old,
                                        [theme]: {
                                            ...old[theme],
                                            isUnlocked: true,
                                            content: accumulatedContent,
                                            isLoading: false,
                                        },
                                    };
                                });

                                // 保存到本地缓存
                                setThemeCache(subjectId, theme, accumulatedContent);

                                // 更新用户余额
                                if (updateUser && payload.remainingBalance !== undefined) {
                                    updateUser({ balance: payload.remainingBalance });
                                }

                                onSuccess?.({
                                    content: accumulatedContent,
                                    pointsDeducted: payload.pointsDeducted,
                                    remainingBalance: payload.remainingBalance,
                                });
                            } else if (currentEvent === 'error') {
                                throw new Error(payload.message || '生成失败');
                            }
                        } catch (e) {
                            if (e.message && !e.message.includes('JSON')) {
                                throw e;
                            }
                            // JSON 解析错误，忽略
                        }
                    }
                }
            }
        } catch (error) {
            // 回滚 loading 状态
            queryClient.setQueryData([THEME_STATUS_QUERY_KEY, subjectId], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    [theme]: {
                        ...old[theme],
                        isLoading: false,
                    },
                };
            });

            if (error.name !== 'AbortError') {
                onError?.(error, { subjectId, theme });
            }
        } finally {
            setIsStreaming(false);
            abortControllerRef.current = null;
        }
    }, [queryClient, onChunk, onSuccess, onError, updateUser]);

    const cancelStream = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    }, []);

    return {
        startStream,
        cancelStream,
        isStreaming,
        streamingContent,
    };
}
