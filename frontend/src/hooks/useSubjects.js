/**
 * 命盘列表 Query Hook
 * 
 * 管理命盘列表的获取，支持本地命盘和后端命盘的合并
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, isAbortError } from '../services/api';
import { getLocalSubjects, deleteLocalSubject } from '../utils/localSubjects';

// Query Keys
export const SUBJECTS_QUERY_KEY = ['subjects'];

/**
 * 获取命盘列表（本地 + 后端）
 * @param {boolean} isLoggedIn - 是否已登录
 */
export function useSubjects(isLoggedIn) {
  return useQuery({
    queryKey: [...SUBJECTS_QUERY_KEY, isLoggedIn],
    queryFn: async ({ signal }) => {
      let allSubjects = [];

      // 加载本地命盘
      const localSubjects = getLocalSubjects();
      allSubjects = [...localSubjects];

      // 如果已登录，加载后端命盘
      if (isLoggedIn) {
        try {
          const res = await api.get('/subjects', { signal });
          allSubjects = [...allSubjects, ...(res.subjects || [])];
        } catch (error) {
          // 如果是取消请求，重新抛出
          if (isAbortError(error)) throw error;
          // 其他错误静默处理，至少返回本地数据
          console.error('Failed to fetch subjects:', error);
        }
      }

      return allSubjects;
    },
    staleTime: 2 * 60 * 1000, // 2分钟内不重新请求
  });
}

/**
 * 同步本地命盘到后端
 */
export function useSyncLocalSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (localSubject) => {
      const res = await api.post('/subjects', {
        name: localSubject.name,
        gender: localSubject.gender,
        calendarType: localSubject.calendarType,
        birthYear: localSubject.birthYear,
        birthMonth: localSubject.birthMonth,
        birthDay: localSubject.birthDay,
        birthHour: localSubject.birthHour,
        birthMinute: localSubject.birthMinute,
        isLeapMonth: localSubject.isLeapMonth,
        location: localSubject.location,
        baziData: localSubject.baziData,
      });

      return { newSubject: res.subject, localId: localSubject.id };
    },
    onSuccess: ({ newSubject, localId }) => {
      // 删除本地存储中的命盘
      deleteLocalSubject(localId);

      // 更新缓存：移除本地的，添加后端的
      queryClient.setQueryData([...SUBJECTS_QUERY_KEY, true], (old) => {
        if (!old) return [newSubject];
        const filtered = old.filter(s => s.id !== localId);
        return [newSubject, ...filtered];
      });
    },
  });
}

/**
 * 删除命盘
 */
export function useDeleteSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isLocal }) => {
      if (isLocal) {
        deleteLocalSubject(id);
      } else {
        await api.delete(`/subjects/${id}`);
      }
      return { id };
    },
    onSuccess: ({ id }) => {
      // 更新缓存
      queryClient.setQueriesData({ queryKey: SUBJECTS_QUERY_KEY }, (old) => {
        if (!old) return old;
        return old.filter(s => s.id !== id);
      });
    },
  });
}
