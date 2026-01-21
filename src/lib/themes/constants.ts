/**
 * 主题常量定义
 * 
 * 统一管理主题列表，避免前后端硬编码不同步
 * 后端路由和前端都应从此文件导入
 */

/**
 * 有效的分析主题类型
 */
export type AnalysisTheme =
    | 'life_color'       // 生命色彩
    | 'relationship'     // 情感关系
    | 'career_wealth'    // 事业财富
    | 'health'           // 健康运势
    | 'life_lesson'      // 贵人小人
    | 'yearly_fortune'   // 流年运势
    | 'synastry'         // 合盘分析
    | 'soul_song';       // 灵魂歌曲

/**
 * 有效主题列表
 * 
 * 用于验证前端传入的主题是否有效
 */
export const VALID_THEMES: readonly AnalysisTheme[] = [
    'life_color',
    'relationship',
    'career_wealth',
    'health',
    'life_lesson',
    'yearly_fortune',
    'synastry',
    'soul_song',
] as const;

/**
 * 主题显示名称映射
 */
export const THEME_NAMES: Record<AnalysisTheme, string> = {
    life_color: '生命色彩',
    relationship: '情感关系',
    career_wealth: '事业财富',
    health: '健康运势',
    life_lesson: '贵人小人',
    yearly_fortune: '流年运势',
    synastry: '合盘分析',
    soul_song: '灵魂歌曲',
};

/**
 * 验证主题是否有效
 */
export function isValidTheme(theme: string): theme is AnalysisTheme {
    return VALID_THEMES.includes(theme as AnalysisTheme);
}
