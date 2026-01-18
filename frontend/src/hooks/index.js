/**
 * Hooks 统一导出
 */

// 命盘列表
export {
  useSubjects,
  useSyncLocalSubject,
  useDeleteSubject,
  SUBJECTS_QUERY_KEY
} from './useSubjects';

// 命盘详情
export {
  useSubjectDetail,
  usePrefetchSubjectDetail,
  SUBJECT_DETAIL_QUERY_KEY
} from './useSubjectDetail';

// 主题相关
export {
  useThemePricing,
  useThemes,
  useResetThemes,
  useUpdateThemeCache,
  THEME_PRICING_QUERY_KEY,
  THEME_STATUS_QUERY_KEY
} from './useThemes';

// 主题解锁
export {
  useUnlockTheme,
  useLoadingThemes
} from './useUnlockTheme';

// 异步主题解锁（任务队列模式）
export { useAsyncUnlock } from './useAsyncUnlock';

// 命盘切换（请求取消和竞态处理）
export {
  useSubjectSwitch,
  useSubjectSwitchEffect,
  useLatestCallback,
} from './useSubjectSwitch';
