/**
 * AI 服务调用层
 * 集成 aihubmix API（OpenAI 兼容接口）
 * 
 * 新版架构：两轮 LLM 调用
 * - 第一轮：初步解读（生成后台参考资料）
 * - 第二轮：分主题解读（基于初步解读生成具体主题内容）
 */

import OpenAI from 'openai';
import { 
  loadAIConfig, 
  loadNewAIConfig, 
  getPromptTemplate,
  getInitialPromptTemplate,
  getThemePromptTemplate,
} from './config-loader.js';
import { replaceTemplateVariables, TemplateContext } from './template-engine.js';
import type { 
  AnalysisSection, 
  FortuneAnalysis,
  AnalysisTheme,
} from './types.js';
import type { BaziData } from '../bazi/types.js';

// AI 服务单例
let openaiClient: OpenAI | null = null;

/**
 * 获取 OpenAI 客户端实例
 */
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.AIHUBMIX_API_KEY;
    const baseURL = process.env.AIHUBMIX_BASE_URL || 'https://aihubmix.com/v1';

    if (!apiKey) {
      throw new Error('AIHUBMIX_API_KEY environment variable is not set');
    }

    openaiClient = new OpenAI({
      apiKey,
      baseURL,
    });
  }

  return openaiClient;
}

// ============================================
// 新版 AI 服务（两轮 LLM 架构）
// ============================================

/**
 * 生成初步解读（第一轮 LLM）
 * 
 * 用于生成后台参考资料，不直接展示给用户
 * 结果存储在 Subject.initialAnalysis 中
 * 
 * @param baziData - 八字排盘结果
 * @param gender - 性别
 * @returns 初步解读内容
 */
export async function generateInitialAnalysis(
  baziData: BaziData,
  gender?: string
): Promise<string> {
  const config = loadNewAIConfig();
  const client = getOpenAIClient();

  // 获取初步解读模板（包含 system 和 user）
  const promptTemplate = getInitialPromptTemplate();
  const context: TemplateContext = { baziData, gender };
  
  // 替换模板变量
  const systemPrompt = replaceTemplateVariables(promptTemplate.system, context);
  const userPrompt = replaceTemplateVariables(promptTemplate.user, context);

  console.log('[AI Service] Generating initial analysis (Round 1)...');

  try {
    const response = await client.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('AI response is empty for initial analysis');
    }

    console.log('[AI Service] Initial analysis generated successfully');
    return content;
  } catch (error) {
    console.error('[AI Service] Error generating initial analysis:', error);
    throw error;
  }
}

/**
 * 生成分主题解读（第二轮 LLM）
 * 
 * 基于初步解读结果，生成特定主题的深度分析
 * 
 * @param theme - 主题类型
 * @param baziData - 八字排盘结果
 * @param initialAnalysis - 初步解读结果
 * @param gender - 性别
 * @returns 主题解读内容
 */
export async function generateThemeAnalysis(
  theme: AnalysisTheme,
  baziData: BaziData,
  initialAnalysis: string,
  gender?: string
): Promise<string> {
  const config = loadNewAIConfig();
  const client = getOpenAIClient();

  // 获取主题模板（包含 system 和 user）
  const promptTemplate = getThemePromptTemplate(theme);
  const context: TemplateContext = { 
    baziData, 
    gender,
    initialAnalysis,
    currentYear: new Date().getFullYear(),
  };
  
  // 替换模板变量
  const systemPrompt = replaceTemplateVariables(promptTemplate.system, context);
  const userPrompt = replaceTemplateVariables(promptTemplate.user, context);

  console.log(`[AI Service] Generating theme analysis (Round 2): ${theme}...`);

  try {
    const response = await client.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error(`AI response is empty for theme: ${theme}`);
    }

    console.log(`[AI Service] Theme analysis generated successfully: ${theme}`);
    return content;
  } catch (error) {
    console.error(`[AI Service] Error generating ${theme} analysis:`, error);
    throw error;
  }
}

// ============================================
// 旧版 AI 服务（保留向后兼容）
// ============================================

/**
 * @deprecated 使用 generateThemeAnalysis 替代
 * 调用 AI 生成单个模块的分析内容
 */
export async function generateSectionAnalysis(
  section: AnalysisSection,
  baziData: BaziData
): Promise<string> {
  const config = loadAIConfig();
  const client = getOpenAIClient();

  // 获取并替换模板变量
  const template = getPromptTemplate(section);
  const context: TemplateContext = { baziData };
  const prompt = replaceTemplateVariables(template, context);

  try {
    const response = await client.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: 'system',
          content:
            '你是一位资深的中国传统命理分析师，精通八字命理学。请用专业但易懂的语言进行分析，避免过于晦涩的术语。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error(`AI response is empty for section: ${section}`);
    }

    return content;
  } catch (error) {
    console.error(`[AI Service] Error generating ${section} analysis:`, error);
    throw error;
  }
}

/**
 * 从分析内容中提取建议
 */
function extractSuggestions(analysis: Partial<FortuneAnalysis>): string[] {
  const suggestions: string[] = [];

  // 从各模块分析中提取关键建议
  const allContent = [
    analysis.personality,
    analysis.career,
    analysis.wealth,
    analysis.relationship,
    analysis.health,
    analysis.overall,
  ]
    .filter(Boolean)
    .join('\n');

  // 简单提取包含"建议"关键词的句子
  const lines = allContent.split('\n');
  for (const line of lines) {
    if (
      line.includes('建议') ||
      line.includes('可以') ||
      line.includes('适合') ||
      line.includes('注意')
    ) {
      const trimmed = line.trim();
      if (trimmed.length > 10 && trimmed.length < 200) {
        suggestions.push(trimmed);
      }
    }
  }

  // 限制建议数量
  return suggestions.slice(0, 10);
}

/**
 * @deprecated 使用新版两轮 LLM 架构替代
 * 生成完整的命理分析报告
 */
export async function generateFullAnalysis(
  baziData: BaziData,
  sections?: AnalysisSection[]
): Promise<FortuneAnalysis> {
  const sectionsToGenerate: AnalysisSection[] = sections || [
    'personality',
    'career',
    'wealth',
    'relationship',
    'health',
    'overall',
  ];

  const analysis: Partial<FortuneAnalysis> = {};

  // 依次生成各模块分析
  for (const section of sectionsToGenerate) {
    try {
      console.log(`[AI Service] Generating ${section} analysis...`);
      analysis[section] = await generateSectionAnalysis(section, baziData);
    } catch (error) {
      console.error(`[AI Service] Failed to generate ${section}:`, error);
      analysis[section] = `${section} 分析生成失败，请稍后重试。`;
    }
  }

  // 提取建议
  analysis.suggestions = extractSuggestions(analysis);

  return {
    personality: analysis.personality || '',
    career: analysis.career || '',
    wealth: analysis.wealth || '',
    relationship: analysis.relationship || '',
    health: analysis.health || '',
    overall: analysis.overall || '',
    suggestions: analysis.suggestions || [],
  };
}

/**
 * 重置 AI 客户端（用于测试或配置更新）
 */
export function resetAIClient(): void {
  openaiClient = null;
}
