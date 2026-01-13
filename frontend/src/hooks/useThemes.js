/**
 * 主题解读 Query Hooks
 * 
 * 管理主题价格、状态和内容的获取
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, isAbortError } from '../services/api';
import { 
  getSubjectThemeCache, 
  setThemeCacheBatch 
} from '../utils/themeCache';

// Query Keys
export const THEME_PRICING_QUERY_KEY = ['theme-pricing'];
export const THEME_STATUS_QUERY_KEY = 'theme-status';

// 默认主题数据结构
const DEFAULT_THEMES_DATA = {
  life_color: { isUnlocked: false, content: null, price: 0 },
  relationship: { isUnlocked: false, content: null, price: 0 },
  career_wealth: { isUnlocked: false, content: null, price: 0 },
  health: { isUnlocked: false, content: null, price: 0 },
  life_lesson: { isUnlocked: false, content: null, price: 0 },
  yearly_fortune: { isUnlocked: false, content: null, price: 0 },
};

/**
 * 获取主题价格配置
 */
export function useThemePricing() {
  return useQuery({
    queryKey: THEME_PRICING_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const res = await api.get('/themes/pricing', { signal });
      const pricing = {};
      (res.pricing || []).forEach(p => {
        pricing[p.theme] = p;
      });
      return pricing;
    },
    staleTime: 30 * 60 * 1000, // 30分钟内不重新请求
    gcTime: 60 * 60 * 1000, // 1小时后垃圾回收
  });
}

/**
 * 获取主题状态和内容
 * @param {string} subjectId - 命盘 ID
 * @param {boolean} isLoggedIn - 是否已登录
 * @param {Object} pricing - 主题价格配置
 */
export function useThemes(subjectId, isLoggedIn, pricing = {}) {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: [THEME_STATUS_QUERY_KEY, subjectId],
    queryFn: async ({ signal }) => {
      // 初始化主题数据（带价格）
      const themesData = { ...DEFAULT_THEMES_DATA };
      Object.keys(themesData).forEach(theme => {
        if (pricing[theme]) {
          themesData[theme].price = pricing[theme].price;
        }
      });
      
      if (!subjectId || !isLoggedIn) {
        return themesData;
      }
      
      // 1. 先检查本地缓存
      const cachedThemes = getSubjectThemeCache(subjectId);
      const cachedThemeKeys = Object.keys(cachedThemes);
      
      if (cachedThemeKeys.length > 0) {
        // 有缓存，先使用缓存数据
        cachedThemeKeys.forEach(theme => {
          if (themesData[theme]) {
            themesData[theme] = {
              ...themesData[theme],
              isUnlocked: true,
              content: cachedThemes[theme].content,
            };
          }
        });
      }
      
      // 2. 请求后端获取最新状态
      try {
        const res = await api.get(`/themes/status/${subjectId}`, { signal });
        const status = res.status || [];
        
        // 更新解锁状态
        status.forEach(s => {
          if (themesData[s.theme]) {
            themesData[s.theme] = {
              ...themesData[s.theme],
              isUnlocked: s.isUnlocked,
            };
          }
        });
        
        // 3. 找出已解锁但本地缓存没有的主题
        const unlockedThemes = status.filter(s => s.isUnlocked);
        const themesNeedFetch = unlockedThemes.filter(s => !cachedThemes[s.theme]);
        
        // 4. 批量请求缓存中没有的主题内容
        if (themesNeedFetch.length > 0) {
          const batchRes = await api.post('/themes/batch', {
            subjectId,
            themes: themesNeedFetch.map(s => s.theme),
          }, { signal });
          
          const newThemes = batchRes.themes || [];
          
          // 更新主题数据
          newThemes.forEach(t => {
            if (themesData[t.theme]) {
              themesData[t.theme] = {
                ...themesData[t.theme],
                isUnlocked: t.isUnlocked,
                content: t.content,
              };
            }
          });
          
          // 保存到本地缓存
          setThemeCacheBatch(subjectId, newThemes.filter(t => t.content));
        }
      } catch (error) {
        // 如果是取消请求，重新抛出
        if (isAbortError(error)) throw error;
        // 其他错误静默处理，本地缓存数据仍然可用
        console.error('Failed to load theme status:', error);
      }
      
      return themesData;
    },
    enabled: !!subjectId && isLoggedIn,
    staleTime: 2 * 60 * 1000, // 2分钟内不重新请求
    placeholderData: (previousData) => previousData, // 保持旧数据直到新数据就绪
  });
}

/**
 * 重置主题缓存（切换命盘时使用）
 */
export function useResetThemes() {
  const queryClient = useQueryClient();
  
  return (subjectId) => {
    if (!subjectId) return;
    
    // 取消正在进行的主题请求
    queryClient.cancelQueries({ queryKey: [THEME_STATUS_QUERY_KEY, subjectId] });
  };
}

/**
 * 更新单个主题的缓存数据
 */
export function useUpdateThemeCache() {
  const queryClient = useQueryClient();
  
  return (subjectId, theme, updates) => {
    queryClient.setQueryData([THEME_STATUS_QUERY_KEY, subjectId], (old) => {
      if (!old) return old;
      return {
        ...old,
        [theme]: {
          ...old[theme],
          ...updates,
        },
      };
    });
  };
}
