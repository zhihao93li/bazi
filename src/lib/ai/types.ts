/**
 * AI 服务相关类型定义
 */

// ============================================
// 新版主题系统类型（分主题付费解锁）
// ============================================

/**
 * 分析主题枚举
 */
export type AnalysisTheme =
  | 'life_color'      // 生命底色
  | 'relationship'    // 亲密关系
  | 'career_wealth'   // 事业财富
  | 'health'          // 身心健康
  | 'life_lesson'     // 人生课题
  | 'yearly_fortune'; // 流年解读

/**
 * 主题分类
 */
export type ThemeCategory = 'standalone' | 'special_analysis';

/**
 * 主题元数据
 */
export interface ThemeMeta {
  id: AnalysisTheme;
  name: string;
  description: string;
  category: ThemeCategory;
  icon?: string;
}

/**
 * 所有主题的元数据
 */
export const THEME_METADATA: Record<AnalysisTheme, ThemeMeta> = {
  life_color: {
    id: 'life_color',
    name: '生命底色',
    description: '探索你的生命本质与核心特质',
    category: 'standalone',
    icon: 'palette',
  },
  relationship: {
    id: 'relationship',
    name: '亲密关系',
    description: '解读情感模式与亲密关系运势',
    category: 'special_analysis',
    icon: 'heart',
  },
  career_wealth: {
    id: 'career_wealth',
    name: '事业财富',
    description: '分析事业发展与财富机遇',
    category: 'special_analysis',
    icon: 'briefcase',
  },
  health: {
    id: 'health',
    name: '身心健康',
    description: '关注身体健康与心理平衡',
    category: 'special_analysis',
    icon: 'activity',
  },
  life_lesson: {
    id: 'life_lesson',
    name: '人生课题',
    description: '洞察生命成长与人生使命',
    category: 'special_analysis',
    icon: 'book',
  },
  yearly_fortune: {
    id: 'yearly_fortune',
    name: '流年解读',
    description: '当年运势分析与趋吉避凶',
    category: 'standalone',
    icon: 'calendar',
  },
};

/**
 * 专项分析的主题列表
 */
export const SPECIAL_ANALYSIS_THEMES: AnalysisTheme[] = [
  'relationship',
  'career_wealth',
  'health',
  'life_lesson',
];

/**
 * 独立主题列表
 */
export const STANDALONE_THEMES: AnalysisTheme[] = [
  'life_color',
  'yearly_fortune',
];

/**
 * 主题价格信息
 */
export interface ThemePricing {
  theme: AnalysisTheme;
  name: string;
  description?: string;
  price: number;
  isActive: boolean;
}

/**
 * 主题解锁状态
 */
export interface ThemeUnlockStatus {
  theme: AnalysisTheme;
  isUnlocked: boolean;
  unlockedAt?: Date;
  content?: string;
}

/**
 * 主题解读内容
 */
export interface ThemeAnalysisContent {
  theme: AnalysisTheme;
  content: string;
  createdAt: Date;
}

/**
 * 初步解读结果（后台参考资料）
 */
export interface InitialAnalysis {
  content: string;
  analyzedAt: Date;
}

// ============================================
// 新版 AI 配置（支持两轮 LLM）
// ============================================

/**
 * 单个提示词模板（支持 System + User 分离）
 */
export interface PromptTemplate {
  system: string;  // System Prompt
  user: string;    // User Prompt
}

/**
 * 主题提示词模板
 */
export interface ThemePromptTemplates {
  life_color: PromptTemplate;
  relationship: PromptTemplate;
  career_wealth: PromptTemplate;
  health: PromptTemplate;
  life_lesson: PromptTemplate;
  yearly_fortune: PromptTemplate;
}

/**
 * 新版提示词模板结构
 */
export interface NewPromptTemplates {
  initial: PromptTemplate;           // 初步解读提示词
  themes: ThemePromptTemplates;      // 分主题提示词
}

/**
 * 新版 AI 配置接口
 */
export interface NewAIConfig {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  prompts: NewPromptTemplates;
}

// ============================================
// 旧版类型定义（保留向后兼容）
// ============================================

/**
 * @deprecated 使用 NewPromptTemplates 替代
 */
export interface PromptTemplates {
  personality: string;
  career: string;
  wealth: string;
  relationship: string;
  health: string;
  overall: string;
}

/**
 * @deprecated 使用 AnalysisTheme 替代
 */
export type AnalysisSection = keyof PromptTemplates;

/**
 * @deprecated 使用 ThemeAnalysisContent 替代
 */
export interface FortuneAnalysis {
  personality: string;
  career: string;
  wealth: string;
  relationship: string;
  health: string;
  overall: string;
  suggestions: string[];
}

/**
 * @deprecated 使用 NewAIConfig 替代
 */
export interface AIConfig {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  prompts: PromptTemplates;
}

/**
 * @deprecated 默认 AI 配置（旧版）
 */
export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'aihubmix',
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 2000,
  prompts: {
    personality: '请分析此人的性格特点。',
    career: '请分析此人的事业运势。',
    wealth: '请分析此人的财运。',
    relationship: '请分析此人的感情运势。',
    health: '请分析此人的健康状况。',
    overall: '请进行综合分析。',
  },
};
