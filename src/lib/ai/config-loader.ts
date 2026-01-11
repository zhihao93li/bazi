/**
 * AI 配置加载器
 * 从 YAML 文件加载 AI 配置，支持错误回退到默认值
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse as parseYaml } from 'yaml';
import { AIConfig, DEFAULT_AI_CONFIG, PromptTemplates } from './types.js';

// 配置文件路径
const CONFIG_FILE_PATH = path.join(process.cwd(), 'config', 'ai-prompts.yaml');

// 缓存配置和文件修改时间
let cachedConfig: AIConfig | null = null;
let lastModifiedTime: number = 0;

/**
 * 验证 prompt 模板是否完整
 */
function validatePrompts(prompts: unknown): prompts is PromptTemplates {
  if (!prompts || typeof prompts !== 'object') {
    return false;
  }

  const requiredKeys: (keyof PromptTemplates)[] = [
    'personality',
    'career',
    'wealth',
    'relationship',
    'health',
    'overall',
  ];

  return requiredKeys.every(
    (key) => key in prompts && typeof (prompts as Record<string, unknown>)[key] === 'string'
  );
}

/**
 * 验证并解析 AI 配置
 */
function parseAndValidateConfig(rawConfig: unknown): AIConfig {
  if (!rawConfig || typeof rawConfig !== 'object') {
    console.warn('[AI Config] Invalid config format, using defaults');
    return DEFAULT_AI_CONFIG;
  }

  const config = rawConfig as Record<string, unknown>;

  // 验证并提取各字段，无效时使用默认值
  const provider =
    typeof config.provider === 'string' ? config.provider : DEFAULT_AI_CONFIG.provider;

  const model = typeof config.model === 'string' ? config.model : DEFAULT_AI_CONFIG.model;

  const temperature =
    typeof config.temperature === 'number' && config.temperature >= 0 && config.temperature <= 2
      ? config.temperature
      : DEFAULT_AI_CONFIG.temperature;

  const maxTokens =
    typeof config.maxTokens === 'number' && config.maxTokens > 0
      ? config.maxTokens
      : DEFAULT_AI_CONFIG.maxTokens;

  // 验证 prompts
  let prompts: PromptTemplates;
  if (validatePrompts(config.prompts)) {
    prompts = config.prompts;
  } else {
    console.warn('[AI Config] Invalid prompts format, using defaults');
    prompts = DEFAULT_AI_CONFIG.prompts;
  }

  return {
    provider,
    model,
    temperature,
    maxTokens,
    prompts,
  };
}

/**
 * 检查配置文件是否已更新
 */
function isConfigFileUpdated(): boolean {
  try {
    const stats = fs.statSync(CONFIG_FILE_PATH);
    return stats.mtimeMs > lastModifiedTime;
  } catch {
    return false;
  }
}

/**
 * 加载 AI 配置
 * 支持热加载：当配置文件更新时自动重新加载
 * 配置错误时回退到默认值
 */
export function loadAIConfig(): AIConfig {
  // 如果有缓存且文件未更新，返回缓存
  if (cachedConfig && !isConfigFileUpdated()) {
    return cachedConfig;
  }

  try {
    // 检查文件是否存在
    if (!fs.existsSync(CONFIG_FILE_PATH)) {
      console.warn(`[AI Config] Config file not found at ${CONFIG_FILE_PATH}, using defaults`);
      cachedConfig = DEFAULT_AI_CONFIG;
      return DEFAULT_AI_CONFIG;
    }

    // 读取并解析 YAML 文件
    const fileContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
    const rawConfig = parseYaml(fileContent);

    // 验证并解析配置
    const config = parseAndValidateConfig(rawConfig);

    // 更新缓存和修改时间
    const stats = fs.statSync(CONFIG_FILE_PATH);
    lastModifiedTime = stats.mtimeMs;
    cachedConfig = config;

    console.log('[AI Config] Configuration loaded successfully');
    return config;
  } catch (error) {
    console.error('[AI Config] Error loading config:', error);
    console.warn('[AI Config] Using default configuration');
    cachedConfig = DEFAULT_AI_CONFIG;
    return DEFAULT_AI_CONFIG;
  }
}

/**
 * 强制重新加载配置（用于测试或手动刷新）
 */
export function reloadAIConfig(): AIConfig {
  cachedConfig = null;
  lastModifiedTime = 0;
  return loadAIConfig();
}

/**
 * 获取特定模块的 prompt 模板
 */
export function getPromptTemplate(section: keyof PromptTemplates): string {
  const config = loadAIConfig();
  return config.prompts[section];
}

/**
 * 清除配置缓存（用于测试）
 */
export function clearConfigCache(): void {
  cachedConfig = null;
  lastModifiedTime = 0;
}
