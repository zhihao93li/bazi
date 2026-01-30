/**
 * Detector Module - 统一导出接口
 * 
 * 将所有detector模块的核心功能集中导出，
 * 简化外部调用，提供清晰的模块边界。
 */

// 核心检测器类（detector子目录内的模块）
export { StructuralAnalyzer } from './structural-analyzer.js';
export { ScoreRecalculator } from './score-recalculator.js';
export { PurityChecker } from './purity-checker.js';
export { PatternDispatcher } from './pattern-dispatcher.js';
export { ConflictEngine } from './conflict-engine.js';

// 类型导出（从types.js重新导出）
export type {
  DetectionContext,
  HarmonyCheck,
  RecalculatedDistribution,
  PurityResult,
} from '../types.js';
