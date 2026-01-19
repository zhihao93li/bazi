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
import { AIError, AIErrorCode, wrapAIError } from './errors.js';
import { createAILogger } from './logger.js';
import type {
  AnalysisSection,
  FortuneAnalysis,
  AnalysisTheme,
} from './types.js';
import type { BaziData } from '../bazi/types.js';

/**
 * 超时配置（毫秒）
 */
const TIMEOUT_CONFIG = {
  /** OpenAI 客户端全局超时 */
  global: 60000,
  /** 初步解读超时（内容较长） */
  initialAnalysis: 90000,
  /** 主题解读超时 */
  themeAnalysis: 60000,
};

// AI 服务单例
let openaiClient: OpenAI | null = null;

/**
 * 判断模型是否需要使用 max_completion_tokens 参数
 * GPT-5、O1 等新模型需要使用 max_completion_tokens 而不是 max_tokens
 */
function useMaxCompletionTokens(model: string): boolean {
  const newModelPrefixes = ['gpt-5', 'o1', 'o3'];
  return newModelPrefixes.some(prefix => model.toLowerCase().startsWith(prefix));
}

/**
 * 构建 API 请求的 token 限制参数
 */
function buildTokenLimitParam(model: string, maxTokens: number): { max_tokens?: number; max_completion_tokens?: number } {
  if (useMaxCompletionTokens(model)) {
    return { max_completion_tokens: maxTokens };
  }
  return { max_tokens: maxTokens };
}

/**
 * 获取 OpenAI 客户端实例
 */
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.AIHUBMIX_API_KEY;
    const baseURL = process.env.AIHUBMIX_BASE_URL || 'https://aihubmix.com/v1';

    if (!apiKey) {
      throw new AIError(
        AIErrorCode.AI_SERVICE_UNAVAILABLE,
        'AIHUBMIX_API_KEY environment variable is not set'
      );
    }

    openaiClient = new OpenAI({
      apiKey,
      baseURL,
      maxRetries: 3, // 自动重试 3 次，解决网络不稳定问题
      timeout: TIMEOUT_CONFIG.global, // 全局超时设置
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
 * @param subjectId - Subject ID（用于日志）
 * @returns 初步解读内容
 * @throws AIError
 */
export async function generateInitialAnalysis(
  baziData: BaziData,
  gender?: string,
  subjectId?: string
): Promise<string> {
  const config = loadNewAIConfig();
  const client = getOpenAIClient();

  // 创建日志记录器
  const logger = createAILogger({
    operation: 'initial_analysis',
    model: config.model,
    subjectId,
  });

  // 获取初步解读模板（包含 system 和 user）
  const promptTemplate = getInitialPromptTemplate();
  const context: TemplateContext = { baziData, gender };

  // 替换模板变量
  const systemPrompt = replaceTemplateVariables(promptTemplate.system, context);
  const userPrompt = replaceTemplateVariables(promptTemplate.user, context);

  // 记录请求开始
  logger.start(userPrompt.substring(0, 200));

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
      ...buildTokenLimitParam(config.model, config.maxTokens),
    }, {
      timeout: TIMEOUT_CONFIG.initialAnalysis, // 初步解读允许更长时间
    });

    // 详细记录 API 响应
    const finishReason = response.choices[0]?.finish_reason;
    const content = response.choices[0]?.message?.content;

    // 如果因为长度截断但有内容，仍然返回（虽然不完整）
    if (!content) {
      // 如果是因为长度限制，给出更明确的错误提示
      if (finishReason === 'length') {
        const error = new AIError(
          AIErrorCode.AI_INVALID_RESPONSE,
          `AI response truncated due to max_tokens limit (${config.maxTokens})`
        );
        logger.failure({ code: error.code, message: error.message });
        throw error;
      }

      const error = new AIError(
        AIErrorCode.AI_INVALID_RESPONSE,
        `AI response is empty for initial analysis (model: ${config.model}, finish_reason: ${finishReason})`
      );
      logger.failure({ code: error.code, message: error.message });
      throw error;
    }

    // 如果内容被截断，记录警告但仍返回
    if (finishReason === 'length') {
      console.warn(`[AI Service] Warning: Initial analysis was truncated (max_tokens: ${config.maxTokens}). Consider increasing the limit.`);
    }

    // 记录成功
    logger.success(response.usage);
    return content;

  } catch (error) {
    // 如果已经是 AIError，直接抛出
    if (error instanceof AIError) {
      throw error;
    }

    // 包装为 AIError
    const aiError = wrapAIError(error);
    logger.failure({
      code: aiError.code,
      message: aiError.message,
      httpStatus: aiError.httpStatus,
      stack: aiError.stack,
    });
    throw aiError;
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
 * @param subjectId - Subject ID（用于日志）
 * @returns 主题解读内容
 * @throws AIError
 */
export async function generateThemeAnalysis(
  theme: AnalysisTheme,
  baziData: BaziData,
  initialAnalysis: string,
  gender?: string,
  subjectId?: string
): Promise<string> {
  const config = loadNewAIConfig();
  const client = getOpenAIClient();

  // 获取主题模板（包含 system 和 user，可能有专属 model）
  const promptTemplate = getThemePromptTemplate(theme);
  const context: TemplateContext = {
    baziData,
    gender,
    initialAnalysis,
    currentYear: new Date().getFullYear(),
  };

  // 使用主题专属模型（如果有），否则使用全局配置
  const modelToUse = promptTemplate.model || config.model;

  // 创建日志记录器
  const logger = createAILogger({
    operation: 'theme_analysis',
    theme,
    model: modelToUse,
    subjectId,
  });

  // 替换模板变量
  const systemPrompt = replaceTemplateVariables(promptTemplate.system, context);
  const userPrompt = replaceTemplateVariables(promptTemplate.user, context);

  // 记录请求开始
  logger.start(userPrompt.substring(0, 200));

  try {
    const response = await client.chat.completions.create({
      model: modelToUse,
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
      ...buildTokenLimitParam(modelToUse, config.maxTokens),
    }, {
      timeout: TIMEOUT_CONFIG.themeAnalysis,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      const error = new AIError(
        AIErrorCode.AI_INVALID_RESPONSE,
        `AI response is empty for theme: ${theme}`
      );
      logger.failure({ code: error.code, message: error.message });
      throw error;
    }

    // 记录成功
    logger.success(response.usage);
    return content;

  } catch (error) {
    // 如果已经是 AIError，直接抛出
    if (error instanceof AIError) {
      throw error;
    }

    // 包装为 AIError
    const aiError = wrapAIError(error);
    logger.failure({
      code: aiError.code,
      message: aiError.message,
      httpStatus: aiError.httpStatus,
      stack: aiError.stack,
    });
    throw aiError;
  }
}

/**
 * 生成分主题解读（流式版本）
 *
 * 基于初步解读结果，流式生成特定主题的深度分析
 *
 * @param theme - 主题类型
 * @param baziData - 八字排盘结果
 * @param initialAnalysis - 初步解读结果
 * @param gender - 性别
 * @param subjectId - Subject ID（用于日志）
 * @yields 解读内容片段
 * @throws AIError
 */
export async function* generateThemeAnalysisStream(
  theme: AnalysisTheme,
  baziData: BaziData,
  initialAnalysis: string,
  gender?: string,
  subjectId?: string
): AsyncGenerator<string, void, unknown> {
  const config = loadNewAIConfig();
  const client = getOpenAIClient();

  // 获取主题模板（包含 system 和 user，可能有专属 model）
  const promptTemplate = getThemePromptTemplate(theme);
  const context: TemplateContext = {
    baziData,
    gender,
    initialAnalysis,
    currentYear: new Date().getFullYear(),
  };

  // 使用主题专属模型（如果有），否则使用全局配置
  const modelToUse = promptTemplate.model || config.model;

  // 创建日志记录器
  const logger = createAILogger({
    operation: 'theme_analysis_stream',
    theme,
    model: modelToUse,
    subjectId,
  });

  // 替换模板变量
  const systemPrompt = replaceTemplateVariables(promptTemplate.system, context);
  const userPrompt = replaceTemplateVariables(promptTemplate.user, context);

  // 记录流式请求开始
  logger.streamStart();

  let contentLength = 0;

  try {
    const stream = await client.chat.completions.create({
      model: modelToUse,
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
      ...buildTokenLimitParam(modelToUse, config.maxTokens),
      stream: true,
    }, {
      timeout: TIMEOUT_CONFIG.themeAnalysis,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        contentLength += content.length;
        yield content;
      }
    }

    // 记录流式请求结束
    logger.streamEnd(contentLength, true);

  } catch (error) {
    // 记录失败
    logger.streamEnd(contentLength, false);

    // 如果已经是 AIError，直接抛出
    if (error instanceof AIError) {
      throw error;
    }

    // 包装为 AIError
    const aiError = wrapAIError(error);
    throw aiError;
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
      ...buildTokenLimitParam(config.model, config.maxTokens),
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

// 导出错误类型，便于外部使用
export { AIError, AIErrorCode, wrapAIError } from './errors.js';

