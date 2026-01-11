/**
 * AI 服务模块导出
 */

// 类型导出
export type {
  AIConfig,
  PromptTemplates,
  AnalysisSection,
  FortuneAnalysis,
} from './types.js';

export { DEFAULT_AI_CONFIG } from './types.js';

// 配置加载器
export {
  loadAIConfig,
  reloadAIConfig,
  getPromptTemplate,
  clearConfigCache,
} from './config-loader.js';

// 模板引擎
export {
  replaceTemplateVariables,
  findUnreplacedPlaceholders,
  validateTemplateReplacement,
} from './template-engine.js';

export type { TemplateContext } from './template-engine.js';

// AI 服务
export {
  generateSectionAnalysis,
  generateFullAnalysis,
  resetAIClient,
} from './service.js';

// 命理报告服务
export {
  createFortuneReport,
  getFortuneReport,
  getUserReports,
  deleteFortuneReport,
  reportExists,
} from './fortune-report.js';

export type {
  FortuneReportData,
  CreateReportInput,
} from './fortune-report.js';
