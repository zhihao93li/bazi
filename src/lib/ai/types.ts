/**
 * AI 服务相关类型定义
 */

/**
 * AI 配置接口
 */
export interface AIConfig {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  prompts: PromptTemplates;
}

/**
 * Prompt 模板集合
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
 * 分析模块类型
 */
export type AnalysisSection = keyof PromptTemplates;

/**
 * 命理报告分析结果
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
 * 默认 AI 配置
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
