/**
 * AI 服务调用层
 * 集成 aihubmix API（OpenAI 兼容接口）
 * 实现分模块生成命理分析内容
 */

import OpenAI from 'openai';
import { loadAIConfig, getPromptTemplate } from './config-loader.js';
import { replaceTemplateVariables, TemplateContext } from './template-engine.js';
import type { AnalysisSection, FortuneAnalysis } from './types.js';
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

/**
 * 调用 AI 生成单个模块的分析内容
 *
 * @param section - 分析模块类型
 * @param baziData - 八字排盘结果
 * @returns 生成的分析内容
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
 * 生成完整的命理分析报告
 *
 * @param baziData - 八字排盘结果
 * @param sections - 要生成的模块列表（可选，默认全部）
 * @returns 完整的分析结果
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
