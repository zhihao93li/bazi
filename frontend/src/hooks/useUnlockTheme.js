/**
 * 主题解锁 Mutation Hook
 * 
 * 处理 AI 解读的解锁操作，包含乐观更新和错误回滚
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { api } from '../services/api';
import { setThemeCache } from '../utils/themeCache';
import { THEME_STATUS_QUERY_KEY } from './useThemes';

/**
 * 解锁主题
 * @param {Object} options
 * @param {Function} options.onSuccess - 成功回调
 * @param {Function} options.onError - 错误回调
 * @param {Function} options.updateUser - 更新用户信息（余额）
 */
export function useUnlockTheme({ onSuccess, onError, updateUser } = {}) {
  const queryClient = useQueryClient();
  // 用于追踪当前有效的 subjectId，防止切换后更新错误的缓存
  const activeSubjectIdRef = useRef(null);
  
  return useMutation({
    mutationFn: async ({ subjectId, theme }) => {
      // 记录当前解锁的 subjectId
      activeSubjectIdRef.current = subjectId;
      const res = await api.post('/themes/unlock', { subjectId, theme });
      return { ...res, requestSubjectId: subjectId };
    },
    
    // 乐观更新：立即显示 loading 状态
    onMutate: async ({ subjectId, theme }) => {
      // 取消该命盘的主题查询，避免覆盖乐观更新
      await queryClient.cancelQueries({ queryKey: [THEME_STATUS_QUERY_KEY, subjectId] });
      
      // 保存之前的数据用于回滚
      const previousData = queryClient.getQueryData([THEME_STATUS_QUERY_KEY, subjectId]);
      
      // 乐观更新：设置 loading 状态
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
      
      return { previousData, subjectId, theme };
    },
    
    // 错误时回滚
    onError: (error, { subjectId, theme }, context) => {
      // 回滚到之前的数据
      if (context?.previousData) {
        queryClient.setQueryData([THEME_STATUS_QUERY_KEY, subjectId], context.previousData);
      }
      
      // 只有当前 subjectId 仍然有效时才调用错误回调
      if (activeSubjectIdRef.current === subjectId) {
        onError?.(error, { subjectId, theme });
      }
    },
    
    // 成功时更新缓存
    onSuccess: (data, { subjectId, theme }) => {
      // 检查是否仍然是同一个 subjectId（防止切换命盘后更新错误的缓存）
      const isStale = data.requestSubjectId !== activeSubjectIdRef.current;
      
      // 总是更新对应 subjectId 的缓存（即使已切换，数据仍然有效）
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
      
      // 同步到本地存储
      if (data.content) {
        setThemeCache(subjectId, theme, data.content);
      }
      
      // 只有当前 subjectId 仍然有效时才更新余额和调用回调
      if (!isStale) {
        // 更新用户余额
        if (updateUser && data.remainingBalance !== undefined) {
          updateUser({ balance: data.remainingBalance });
        }
        
        // 调用外部成功回调
        onSuccess?.(data, { subjectId, theme });
      }
    },
  });
}

/**
 * 获取当前正在解锁的主题
 * @param {string} subjectId
 */
export function useLoadingThemes(subjectId) {
  const queryClient = useQueryClient();
  const themesData = queryClient.getQueryData([THEME_STATUS_QUERY_KEY, subjectId]);
  
  if (!themesData) return [];
  
  return Object.entries(themesData)
    .filter(([_, data]) => data.isLoading)
    .map(([theme]) => theme);
}
