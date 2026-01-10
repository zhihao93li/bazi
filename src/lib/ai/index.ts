/**
 * AI 服务模块导出
 */

// 类型导出
export type {
  AIConfig,
  PromptTemplates,
  AnalysisSection,
  FortuneAnalysis,
} from './types';

export { DEFAULT_AI_CONFIG } from './types';

// 配置加载器
export {
  loadAIConfig,
  reloadAIConfig,
  getPromptTemplate,
  clearConfigCache,
} from './config-loader';

// 模板引擎
export {
  replaceTemplateVariables,
  findUnreplacedPlaceholders,
  validateTemplateReplacement,
} from './template-engine';

export type { TemplateContext } from './template-engine';

// AI 服务
export {
  generateSectionAnalysis,
  generateFullAnalysis,
  resetAIClient,
} from './service';

// 命理报告服务
export {
  createFortuneReport,
  getFortuneReport,
  getUserReports,
  deleteFortuneReport,
  reportExists,
} from './fortune-report';

export type {
  FortuneReportData,
  CreateReportInput,
} from './fortune-report';
