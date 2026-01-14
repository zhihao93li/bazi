/**
 * 命盘详情 Query Hook
 * 
 * 获取单个命盘的详细信息
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { getLocalSubjects } from '../utils/localSubjects';

// Query Keys
export const SUBJECT_DETAIL_QUERY_KEY = 'subject-detail';

/**
 * 获取命盘详情
 * @param {string} subjectId - 后端命盘 ID（可选）
 * @param {string} localId - 本地命盘 ID（可选）
 * @param {Object} options - 额外配置
 * @param {Array} options.subjects - 已加载的命盘列表（用于避免重复请求）
 */
export function useSubjectDetail(subjectId, localId, options = {}) {
  const { subjects = [] } = options;

  return useQuery({
    queryKey: [SUBJECT_DETAIL_QUERY_KEY, subjectId || localId],
    queryFn: async ({ signal }) => {
      if (localId) {
        // 本地命盘：直接从本地存储获取
        const localSubjects = getLocalSubjects();
        const localSubject = localSubjects.find(s => s.id === localId);
        if (!localSubject) {
          throw new Error('未找到本地命盘');
        }
        return localSubject;
      }

      if (subjectId) {
        // 后端命盘：先尝试从已加载的 subjects 中查找
        const existingSubject = subjects.find(s => s.id === subjectId && !s.isLocal);
        if (existingSubject && existingSubject.baziData) {
          // 已有完整数据，直接使用
          return existingSubject;
        }

        // 请求后端获取详情
        const res = await api.get(`/subjects/${subjectId}`, { signal });
        return res.subject;
      }

      return null;
    },
    enabled: !!(subjectId || localId),
    staleTime: 10 * 60 * 1000, // 10分钟内不重新请求
    placeholderData: (previousData) => previousData, // 保持旧数据直到新数据就绪
  });
}

/**
 * 预取命盘详情（用于优化切换体验）
 */
export function usePrefetchSubjectDetail() {
  const queryClient = useQueryClient();

  return async (subjectId, localId) => {
    if (localId) {
      // 本地命盘无需预取
      return;
    }

    if (subjectId) {
      await queryClient.prefetchQuery({
        queryKey: [SUBJECT_DETAIL_QUERY_KEY, subjectId],
        queryFn: async ({ signal }) => {
          const res = await api.get(`/subjects/${subjectId}`, { signal });
          return res.subject;
        },
        staleTime: 10 * 60 * 1000,
      });
    }
  };
}
