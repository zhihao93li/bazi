/**
 * AI 配置加载器
 * 从 YAML 文件加载 AI 配置，支持错误回退到默认值
 * 支持新版两轮 LLM 配置结构
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse as parseYaml } from 'yaml';
import type {
  AIConfig,
  PromptTemplates,
  NewAIConfig,
  NewPromptTemplates,
  ThemePromptTemplates,
  AnalysisTheme,
  PromptTemplate,
} from './types.js';
import { DEFAULT_AI_CONFIG } from './types.js';

// 配置文件路径 - 支持开发和生产环境
// 生产环境: dist/lib/ai/ 运行，config 在 dist/config/
// 开发环境: src/lib/ai/ 运行（通过 tsx），config 在 ./config/
function getConfigFilePath(): string {
  const moduleDir = path.dirname(new URL(import.meta.url).pathname);

  // 首先尝试相对于当前模块位置（生产环境 dist/lib/ai/ -> dist/config/）
  const prodPath = path.join(moduleDir, '..', '..', 'config', 'ai-prompts.yaml');
  console.log(`[AI Config] Module dir: ${moduleDir}`);
  console.log(`[AI Config] Trying prod path: ${prodPath}`);
  console.log(`[AI Config] Prod path exists: ${fs.existsSync(prodPath)}`);

  if (fs.existsSync(prodPath)) {
    console.log(`[AI Config] Using prod config path: ${prodPath}`);
    return prodPath;
  }

  // 回退到 cwd/config（开发环境）
  const devPath = path.join(process.cwd(), 'config', 'ai-prompts.yaml');
  console.log(`[AI Config] Trying dev path: ${devPath}`);
  console.log(`[AI Config] Dev path exists: ${fs.existsSync(devPath)}`);

  if (fs.existsSync(devPath)) {
    console.log(`[AI Config] Using dev config path: ${devPath}`);
    return devPath;
  }

  console.warn(`[AI Config] WARNING: Config file not found at either location!`);
  return devPath; // Return anyway, will fail later with better error message
}

const CONFIG_FILE_PATH = getConfigFilePath();

// 缓存配置和文件修改时间
let cachedConfig: AIConfig | null = null;
let cachedNewConfig: NewAIConfig | null = null;
let lastModifiedTime: number = 0;

// 默认新版配置
const DEFAULT_NEW_AI_CONFIG: NewAIConfig = {
  provider: 'aihubmix',
  model: 'gemini-3-pro-preview',
  temperature: 0.7,
  maxTokens: 2000,
  prompts: {
    initial: {
      system: '你是一位资深的中国传统命理分析师，精通八字命理学。请对用户的八字进行全面深入的初步解读，作为后续分主题深度分析的参考基础。分析要专业、全面、有条理。',
      user: '请对此八字进行全面的初步解读。',
    },
    themes: {
      life_color: {
        system: '你是一位资深的命理分析师，专注于解读人的生命底色与核心特质。',
        user: '请分析此人的生命底色。',
      },
      relationship: {
        system: '你是一位资深的命理分析师，专注于亲密关系与情感运势分析。',
        user: '请分析此人的亲密关系运势。',
      },
      career_wealth: {
        system: '你是一位资深的命理分析师，专注于事业发展与财富运势分析。',
        user: '请分析此人的事业财富运势。',
      },
      health: {
        system: '你是一位资深的命理分析师，专注于身心健康分析。',
        user: '请分析此人的身心健康状况。',
      },
      life_lesson: {
        system: '你是一位资深的命理分析师，专注于人生课题与成长方向分析。',
        user: '请分析此人的人生课题。',
      },
      yearly_fortune: {
        system: '你是一位资深的命理分析师，专注于流年运势分析。',
        user: '请分析此人的当年运势。',
      },
      synastry: {
        system: '你是一位资深的命理分析师，专注于合盘分析。',
        user: '请分析双人合盘。',
      },
    },
  },
};

/**
 * 验证旧版 prompt 模板是否完整
 */
function validateLegacyPrompts(prompts: unknown): prompts is PromptTemplates {
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
 * 验证单个 PromptTemplate 结构
 */
function validatePromptTemplate(template: unknown): template is PromptTemplate {
  if (!template || typeof template !== 'object') {
    return false;
  }
  const t = template as Record<string, unknown>;
  // system 和 user 必须是字符串，model 是可选的字符串
  const hasRequiredFields = typeof t.system === 'string' && typeof t.user === 'string';
  const hasValidModel = t.model === undefined || typeof t.model === 'string';
  return hasRequiredFields && hasValidModel;
}

/**
 * 验证新版主题 prompt 模板是否完整
 */
function validateThemePrompts(themes: unknown): themes is ThemePromptTemplates {
  if (!themes || typeof themes !== 'object') {
    return false;
  }

  const requiredKeys: (keyof ThemePromptTemplates)[] = [
    'life_color',
    'relationship',
    'career_wealth',
    'health',
    'life_lesson',
    'yearly_fortune',
    'synastry',
  ];

  return requiredKeys.every(
    (key) => key in themes && validatePromptTemplate((themes as Record<string, unknown>)[key])
  );
}

/**
 * 验证新版 prompt 结构
 */
function validateNewPrompts(prompts: unknown): prompts is NewPromptTemplates {
  if (!prompts || typeof prompts !== 'object') {
    return false;
  }

  const p = prompts as Record<string, unknown>;

  if (!validatePromptTemplate(p.initial)) {
    return false;
  }

  return validateThemePrompts(p.themes);
}

/**
 * 验证并解析旧版 AI 配置
 */
function parseAndValidateLegacyConfig(rawConfig: unknown): AIConfig {
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

  // 验证 prompts - 优先使用 legacy_prompts，回退到 prompts
  let prompts: PromptTemplates;
  if (validateLegacyPrompts(config.legacy_prompts)) {
    prompts = config.legacy_prompts;
  } else if (validateLegacyPrompts(config.prompts)) {
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
 * 验证并解析新版 AI 配置
 */
function parseAndValidateNewConfig(rawConfig: unknown): NewAIConfig {
  if (!rawConfig || typeof rawConfig !== 'object') {
    console.warn('[AI Config] Invalid config format, using defaults');
    return DEFAULT_NEW_AI_CONFIG;
  }

  const config = rawConfig as Record<string, unknown>;

  // 验证并提取各字段
  const provider =
    typeof config.provider === 'string' ? config.provider : DEFAULT_NEW_AI_CONFIG.provider;

  const model = typeof config.model === 'string' ? config.model : DEFAULT_NEW_AI_CONFIG.model;

  const temperature =
    typeof config.temperature === 'number' && config.temperature >= 0 && config.temperature <= 2
      ? config.temperature
      : DEFAULT_NEW_AI_CONFIG.temperature;

  const maxTokens =
    typeof config.maxTokens === 'number' && config.maxTokens > 0
      ? config.maxTokens
      : DEFAULT_NEW_AI_CONFIG.maxTokens;

  // 验证新版 prompts 结构
  let prompts: NewPromptTemplates;
  if (validateNewPrompts(config.prompts)) {
    prompts = config.prompts;
  } else {
    console.warn('[AI Config] Invalid new prompts format, using defaults');
    prompts = DEFAULT_NEW_AI_CONFIG.prompts;
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
 * 读取并解析配置文件
 */
function readConfigFile(): unknown {
  if (!fs.existsSync(CONFIG_FILE_PATH)) {
    console.warn(`[AI Config] Config file not found at ${CONFIG_FILE_PATH}`);
    return null;
  }

  const fileContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
  const rawConfig = parseYaml(fileContent);

  // 更新修改时间
  const stats = fs.statSync(CONFIG_FILE_PATH);
  lastModifiedTime = stats.mtimeMs;

  return rawConfig;
}

/**
 * 加载旧版 AI 配置（向后兼容）
 * 支持热加载：当配置文件更新时自动重新加载
 * 配置错误时回退到默认值
 */
export function loadAIConfig(): AIConfig {
  // 如果有缓存且文件未更新，返回缓存
  if (cachedConfig && !isConfigFileUpdated()) {
    return cachedConfig;
  }

  try {
    const rawConfig = readConfigFile();
    if (!rawConfig) {
      cachedConfig = DEFAULT_AI_CONFIG;
      return DEFAULT_AI_CONFIG;
    }

    const config = parseAndValidateLegacyConfig(rawConfig);
    cachedConfig = config;

    console.log('[AI Config] Legacy configuration loaded successfully');
    return config;
  } catch (error) {
    console.error('[AI Config] Error loading config:', error);
    console.warn('[AI Config] Using default configuration');
    cachedConfig = DEFAULT_AI_CONFIG;
    return DEFAULT_AI_CONFIG;
  }
}

/**
 * 加载新版 AI 配置（两轮 LLM 架构）
 */
export function loadNewAIConfig(): NewAIConfig {
  // 如果有缓存且文件未更新，返回缓存
  if (cachedNewConfig && !isConfigFileUpdated()) {
    return cachedNewConfig;
  }

  try {
    const rawConfig = readConfigFile();
    if (!rawConfig) {
      cachedNewConfig = DEFAULT_NEW_AI_CONFIG;
      return DEFAULT_NEW_AI_CONFIG;
    }

    const config = parseAndValidateNewConfig(rawConfig);
    cachedNewConfig = config;

    console.log('[AI Config] New configuration loaded successfully');
    return config;
  } catch (error) {
    console.error('[AI Config] Error loading new config:', error);
    console.warn('[AI Config] Using default new configuration');
    cachedNewConfig = DEFAULT_NEW_AI_CONFIG;
    return DEFAULT_NEW_AI_CONFIG;
  }
}

/**
 * 强制重新加载配置（用于测试或手动刷新）
 */
export function reloadAIConfig(): AIConfig {
  cachedConfig = null;
  cachedNewConfig = null;
  lastModifiedTime = 0;
  return loadAIConfig();
}

/**
 * 获取特定模块的 prompt 模板（旧版）
 */
export function getPromptTemplate(section: keyof PromptTemplates): string {
  const config = loadAIConfig();
  return config.prompts[section];
}

/**
 * 获取初步解读的 prompt 模板
 */
export function getInitialPromptTemplate(): PromptTemplate {
  const config = loadNewAIConfig();
  return config.prompts.initial;
}

/**
 * 获取分主题解读的 prompt 模板
 */
export function getThemePromptTemplate(theme: AnalysisTheme): PromptTemplate {
  const config = loadNewAIConfig();
  return config.prompts.themes[theme];
}

/**
 * 清除配置缓存（用于测试）
 */
export function clearConfigCache(): void {
  cachedConfig = null;
  cachedNewConfig = null;
  lastModifiedTime = 0;
}
