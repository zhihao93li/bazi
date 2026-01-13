/**
 * AI 解读内容本地缓存
 * 
 * 用于缓存已解锁的主题解读内容，减少网络请求
 * 缓存结构：{ [subjectId]: { [theme]: { content, cachedAt } } }
 */

const CACHE_KEY = 'bazi_theme_cache';
const CACHE_VERSION = 1;
const CACHE_EXPIRE_DAYS = 7; // 缓存过期天数

/**
 * 获取完整缓存
 */
function getCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return { version: CACHE_VERSION, data: {} };
    
    const cache = JSON.parse(raw);
    
    // 版本不匹配，清空缓存
    if (cache.version !== CACHE_VERSION) {
      localStorage.removeItem(CACHE_KEY);
      return { version: CACHE_VERSION, data: {} };
    }
    
    return cache;
  } catch {
    return { version: CACHE_VERSION, data: {} };
  }
}

/**
 * 保存完整缓存
 */
function setCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Failed to save theme cache:', e);
  }
}

/**
 * 检查缓存是否过期
 */
function isExpired(cachedAt) {
  if (!cachedAt) return true;
  const expireTime = CACHE_EXPIRE_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - cachedAt > expireTime;
}

/**
 * 获取某个命盘的所有主题缓存
 * @param {string} subjectId 
 * @returns {{ [theme]: { content, isUnlocked } }}
 */
export function getSubjectThemeCache(subjectId) {
  if (!subjectId) return {};
  
  const cache = getCache();
  const subjectCache = cache.data[subjectId] || {};
  
  // 过滤掉过期的缓存
  const validCache = {};
  Object.entries(subjectCache).forEach(([theme, data]) => {
    if (!isExpired(data.cachedAt)) {
      validCache[theme] = {
        content: data.content,
        isUnlocked: true,
      };
    }
  });
  
  return validCache;
}

/**
 * 获取单个主题的缓存内容
 * @param {string} subjectId 
 * @param {string} theme 
 * @returns {{ content, isUnlocked } | null}
 */
export function getThemeCache(subjectId, theme) {
  if (!subjectId || !theme) return null;
  
  const cache = getCache();
  const themeData = cache.data[subjectId]?.[theme];
  
  if (!themeData || isExpired(themeData.cachedAt)) {
    return null;
  }
  
  return {
    content: themeData.content,
    isUnlocked: true,
  };
}

/**
 * 缓存单个主题内容
 * @param {string} subjectId 
 * @param {string} theme 
 * @param {string} content 
 */
export function setThemeCache(subjectId, theme, content) {
  if (!subjectId || !theme || !content) return;
  
  const cache = getCache();
  
  if (!cache.data[subjectId]) {
    cache.data[subjectId] = {};
  }
  
  cache.data[subjectId][theme] = {
    content,
    cachedAt: Date.now(),
  };
  
  setCache(cache);
}

/**
 * 批量缓存多个主题内容
 * @param {string} subjectId 
 * @param {{ theme: string, content: string }[]} themes 
 */
export function setThemeCacheBatch(subjectId, themes) {
  if (!subjectId || !themes?.length) return;
  
  const cache = getCache();
  
  if (!cache.data[subjectId]) {
    cache.data[subjectId] = {};
  }
  
  const now = Date.now();
  themes.forEach(({ theme, content }) => {
    if (theme && content) {
      cache.data[subjectId][theme] = {
        content,
        cachedAt: now,
      };
    }
  });
  
  setCache(cache);
}

/**
 * 清除某个命盘的缓存
 * @param {string} subjectId 
 */
export function clearSubjectCache(subjectId) {
  if (!subjectId) return;
  
  const cache = getCache();
  delete cache.data[subjectId];
  setCache(cache);
}

/**
 * 清除所有缓存
 */
export function clearAllThemeCache() {
  localStorage.removeItem(CACHE_KEY);
}

/**
 * 获取缓存统计信息（用于调试）
 */
export function getCacheStats() {
  const cache = getCache();
  const subjects = Object.keys(cache.data).length;
  let themes = 0;
  
  Object.values(cache.data).forEach(subjectData => {
    themes += Object.keys(subjectData).length;
  });
  
  return { subjects, themes };
}
