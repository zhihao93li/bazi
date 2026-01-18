/**
 * 主题常量定义
 * 
 * 统一管理主题列表，与后端 src/lib/themes/constants.ts 保持同步
 * 
 * 注意: 修改主题列表时需同时更新后端对应文件
 */

/**
 * 有效的分析主题列表
 */
export const VALID_THEMES = [
    'life_color',
    'relationship',
    'career_wealth',
    'health',
    'life_lesson',
    'yearly_fortune',
];

/**
 * 主题显示名称映射
 */
export const THEME_NAMES = {
    life_color: '生命色彩',
    relationship: '情感关系',
    career_wealth: '事业财富',
    health: '健康运势',
    life_lesson: '贵人小人',
    yearly_fortune: '流年运势',
};

/**
 * 主题图标映射 (Phosphor Icons)
 */
export const THEME_ICONS = {
    life_color: 'Palette',
    relationship: 'Heart',
    career_wealth: 'CurrencyCircleDollar',
    health: 'FirstAid',
    life_lesson: 'Users',
    yearly_fortune: 'Calendar',
};

/**
 * 验证主题是否有效
 * @param {string} theme 
 * @returns {boolean}
 */
export function isValidTheme(theme) {
    return VALID_THEMES.includes(theme);
}
