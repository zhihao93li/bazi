/**
 * 主题解锁 Mutation Hook
 * 
 * 处理 AI 解读的解锁操作，支持并行解锁多个主题
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { setThemeCache } from '../utils/themeCache';
import { THEME_STATUS_QUERY_KEY } from './useThemes';

/**
 * 解锁主题（支持并行解锁）
 * @param {Object} options
 * @param {Function} options.onSuccess - 成功回调
 * @param {Function} options.onError - 错误回调
 * @param {Function} options.updateUser - 更新用户信息（余额）
 * @param {string} options.currentSubjectId - 当前显示的命盘 ID（用于判断是否显示 toast）
 */
export function useUnlockTheme({ onSuccess, onError, updateUser, currentSubjectId } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ subjectId, theme }) => {
      const res = await api.post('/themes/unlock', { subjectId, theme });
      return { ...res, requestSubjectId: subjectId, requestTheme: theme };
    },

    // 乐观更新：立即显示 loading 状态
    onMutate: async ({ subjectId, theme }) => {
      // 取消该命盘该主题的查询，避免覆盖乐观更新
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
      // 回滚该主题的 loading 状态
      if (context?.previousData) {
        // 只回滚该主题的状态，保持其他主题的状态
        queryClient.setQueryData([THEME_STATUS_QUERY_KEY, subjectId], (old) => {
          if (!old) return context.previousData;
          const prevThemeData = context.previousData[theme] || {};
          return {
            ...old,
            [theme]: {
              ...old[theme],
              ...prevThemeData,
              isLoading: false,
            },
          };
        });
      }

      // 调用错误回调
      onError?.(error, { subjectId, theme });
    },

    // 成功时更新缓存
    onSuccess: (data, { subjectId, theme }) => {
      // 更新对应 subjectId 的主题缓存
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

      // 更新用户余额（无论当前显示哪个命盘都更新）
      if (updateUser && data.remainingBalance !== undefined) {
        updateUser({ balance: data.remainingBalance });
      }

      // 调用外部成功回调
      onSuccess?.(data, { subjectId, theme });
    },
  });
}

/**
 * 获取指定命盘中正在加载的主题列表
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
