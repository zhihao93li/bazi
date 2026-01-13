/**
 * 命盘切换处理 Hook
 * 
 * 处理切换命盘时的请求取消和竞态条件
 */

import { useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SUBJECT_DETAIL_QUERY_KEY } from './useSubjectDetail';
import { THEME_STATUS_QUERY_KEY } from './useThemes';

/**
 * 切换命盘时取消所有相关的 pending 请求
 */
export function useSubjectSwitch() {
  const queryClient = useQueryClient();
  const previousSubjectIdRef = useRef(null);
  
  /**
   * 切换到新的命盘
   * @param {string} newSubjectId - 新的命盘 ID
   * @param {string} previousSubjectId - 之前的命盘 ID（可选）
   */
  const switchSubject = useCallback((newSubjectId, previousSubjectId) => {
    const prevId = previousSubjectId || previousSubjectIdRef.current;
    
    if (prevId && prevId !== newSubjectId) {
      // 取消之前命盘的所有 pending 请求
      queryClient.cancelQueries({ 
        queryKey: [SUBJECT_DETAIL_QUERY_KEY, prevId],
        exact: true,
      });
      queryClient.cancelQueries({ 
        queryKey: [THEME_STATUS_QUERY_KEY, prevId],
        exact: true,
      });
    }
    
    // 更新当前命盘 ID
    previousSubjectIdRef.current = newSubjectId;
  }, [queryClient]);
  
  /**
   * 取消当前命盘的所有 pending 请求
   */
  const cancelCurrentQueries = useCallback(() => {
    const currentId = previousSubjectIdRef.current;
    if (currentId) {
      queryClient.cancelQueries({ 
        queryKey: [SUBJECT_DETAIL_QUERY_KEY, currentId],
        exact: true,
      });
      queryClient.cancelQueries({ 
        queryKey: [THEME_STATUS_QUERY_KEY, currentId],
        exact: true,
      });
    }
  }, [queryClient]);
  
  return {
    switchSubject,
    cancelCurrentQueries,
    currentSubjectId: previousSubjectIdRef.current,
  };
}

/**
 * 监听命盘 ID 变化并自动取消旧请求
 * @param {string} subjectId - 当前命盘 ID
 * @param {string} localId - 当前本地命盘 ID
 */
export function useSubjectSwitchEffect(subjectId, localId) {
  const { switchSubject } = useSubjectSwitch();
  const currentId = subjectId || localId;
  
  useEffect(() => {
    if (currentId) {
      switchSubject(currentId);
    }
  }, [currentId, switchSubject]);
}

/**
 * 创建一个带有竞态条件保护的异步函数
 * 确保只有最新的调用结果会被使用
 */
export function useLatestCallback() {
  const callIdRef = useRef(0);
  
  /**
   * 包装异步函数，确保只有最新调用的结果被使用
   * @param {Function} asyncFn - 异步函数
   * @returns {Function} 包装后的函数
   */
  const wrapAsync = useCallback((asyncFn) => {
    return async (...args) => {
      const callId = ++callIdRef.current;
      
      try {
        const result = await asyncFn(...args);
        
        // 检查是否是最新的调用
        if (callId !== callIdRef.current) {
          // 不是最新调用，忽略结果
          return { isStale: true, result: null };
        }
        
        return { isStale: false, result };
      } catch (error) {
        // 检查是否是最新的调用
        if (callId !== callIdRef.current) {
          return { isStale: true, error: null };
        }
        
        return { isStale: false, error };
      }
    };
  }, []);
  
  /**
   * 重置调用计数器（用于取消所有 pending 的调用）
   */
  const reset = useCallback(() => {
    callIdRef.current++;
  }, []);
  
  return { wrapAsync, reset };
}
