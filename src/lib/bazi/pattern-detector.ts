/**
 * PatternDetector - 格局判定引擎 (第一性原理重构版)
 * 
 * 核心设计理念:
 * - 结构 > 纯度 > 分数 (Structure > Purity > Score)
 * - 从"数数"升级为"逻辑推演"
 * - 具有物理意义的能量建模
 * 
 * 五层架构:
 * 1. StructuralAnalyzer   - 结构特征层 (化学反应识别)
 * 2. PurityChecker        - 纯度检查层 (一票否决)
 * 3. ScoreRecalculator    - 能量重算层 (动态分数)
 * 4. ConflictEngine       - 冲突衰减层 (现实损耗)
 * 5. PatternDispatcher    - 决策中心 (格局分流)
 */

import type {
  FourPillars,
  PatternInfo,
  DayMaster,
  FiveElementsAnalysis,
  HarmonyCheck,
  RecalculatedDistribution,
  DetectionContext,
} from './types.js';

import {
  StructuralAnalyzer,
  PurityChecker,
  ScoreRecalculator,
  ConflictEngine,
  PatternDispatcher,
} from './detector/index.js';

/**
 * PatternDetector - 格局判定引擎主类
 * 
 * 职责:
 * - 协调五大子系统
 * - 执行分层决策流程
 * - 输出格局判定结果
 */
export class PatternDetector {
  private structuralAnalyzer: StructuralAnalyzer;
  private purityChecker: PurityChecker;
  private scoreRecalculator: ScoreRecalculator;
  private conflictEngine: ConflictEngine;
  private patternDispatcher: PatternDispatcher;

  constructor() {
    this.structuralAnalyzer = new StructuralAnalyzer();
    this.purityChecker = new PurityChecker();
    this.scoreRecalculator = new ScoreRecalculator();
    this.conflictEngine = new ConflictEngine();
    this.patternDispatcher = new PatternDispatcher();
  }

  /**
   * 主检测流程 - 执行分层决策
   * 
   * 流程图:
   * ```
   * Input → [结构层] → [能量层] → [纯度层] → [决策层] → Output
   *           ↓           ↓           ↓           ↓
   *        合会扫描    分数重算    一票否决    格局分流
   * ```
   */
  public detect(
    fourPillars: FourPillars,
    dayMaster: DayMaster,
    fiveElements: FiveElementsAnalysis,
    xunKong?: string
  ): PatternInfo {
    // 初始化上下文
    const ctx: DetectionContext = {
      fourPillars,
      dayMaster,
      fiveElements,
      xunKong,
    };

    // ========================================
    // 第一层: 结构特征分析 (Structural Gate)
    // ========================================
    // 检测三合局、三会局、半三合等"化学反应"
    ctx.harmony = this.structuralAnalyzer.analyze(ctx);
    
    if (this.isDebugMode()) {
      console.log('[PatternDetector] 结构层输出:', {
        harmonyType: ctx.harmony?.type,
        harmonyElement: ctx.harmony?.element,
        conversionRate: ctx.harmony?.conversionRate,
      });
    }

    // ========================================
    // 第二层: 能量重算 (Energy Recalculation)
    // ========================================
    // 根据合局将能量重定向到目标五行
    ctx.recalculatedDistribution = this.scoreRecalculator.recalculate(ctx);
    
    if (this.isDebugMode()) {
      console.log('[PatternDetector] 能量层输出:', ctx.recalculatedDistribution);
    }

    // ========================================
    // 第三层: 冲突与衰减 (Conflict Analysis)
    // ========================================
    // 计算刑冲破害、墓库状态、合绊等
    const conflictReport = this.conflictEngine.analyze(ctx);
    ctx.clashPenalty = conflictReport.clashPenalty;
    ctx.seasonalAdjustment = conflictReport.seasonalAdjustment;
    ctx.graveOpened = conflictReport.graveOpened;
    ctx.blockingLinks = conflictReport.blockingLinks;

    if (this.isDebugMode()) {
      console.log('[PatternDetector] 冲突层输出:', conflictReport);
    }

    // ========================================
    // 第四层: 格局分流决策 (Pattern Dispatch)
    // ========================================
    // 优先级: 化气格 > 专旺格 > 禄刃格 > 从格 > 普通格
    const candidatePattern = this.patternDispatcher.dispatch(ctx);

    if (this.isDebugMode()) {
      console.log('[PatternDetector] 候选格局:', candidatePattern.name);
    }

    // ========================================
    // 第五层: 纯度验证 (Purity Gate)
    // ========================================
    // 对特殊格局执行一票否决检查
    if (candidatePattern.category === 'special') {
      const purityResult = this.purityChecker.verify(candidatePattern, ctx);
      
      if (!purityResult.passed) {
        if (this.isDebugMode()) {
          console.log('[PatternDetector] 纯度检查失败:', purityResult.reason);
        }
        
        // 降级为普通格局
        return this.patternDispatcher.dispatchNormalPattern(ctx);
      }
    }

    // ========================================
    // 输出最终结果
    // ========================================
    return candidatePattern;
  }

  /**
   * 调试模式检查
   */
  private isDebugMode(): boolean {
    return process.env.NODE_ENV === 'test' || process.env.DEBUG_PATTERN === 'true';
  }
}

/**
 * 工厂函数 - 创建 PatternDetector 实例
 */
export function createPatternDetector(): PatternDetector {
  return new PatternDetector();
}

/**
 * 快捷函数 - 直接检测格局
 */
export function detectPattern(
  fourPillars: FourPillars,
  dayMaster: DayMaster,
  fiveElements: FiveElementsAnalysis,
  xunKong?: string
): PatternInfo {
  const detector = createPatternDetector();
  return detector.detect(fourPillars, dayMaster, fiveElements, xunKong);
}
