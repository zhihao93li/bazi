/**
 * PurityChecker - 纯度检查器
 * 
 * 职责: 对特殊格局执行"一票否决"检查
 * - 天干透出禁忌五行 → 破格
 * - 地支藏干禁忌元素过多 → 破格
 * 
 * 核心理念: 纯度决定真伪 (Purity determines Authenticity)
 */

import type { PatternInfo, DetectionContext, FiveElement } from '../types.js';
import {
  PROSPERITY_PATTERN_CONFIG,
  PROSPERITY_FORBIDDEN_WEIGHT_LIMIT,
  FOLLOW_PATTERN_CONFIG,
  HIDDEN_STEMS_MAP,
  HIDDEN_STEM_WEIGHTS,
} from '../constants.js';

export interface PurityResult {
  passed: boolean;
  reason?: string;
  forbiddenWeight?: number;
}

export class PurityChecker {
  /**
   * 验证格局纯度
   * 
   * 检查项:
   * 1. 天干透出禁忌 (checkStemPurity)
   * 2. 藏干权重超标 (calculateForbiddenWeight)
   */
  public verify(
    pattern: PatternInfo,
    ctx: DetectionContext
  ): PurityResult {
    const patternName = pattern.name;

    // 专旺格纯度检查
    if (PROSPERITY_PATTERN_CONFIG[patternName]) {
      return this.verifyProsperityPattern(patternName, ctx);
    }

    // 从格纯度检查
    if (FOLLOW_PATTERN_CONFIG[patternName]) {
      return this.verifyFollowPattern(patternName, ctx);
    }

    // 其他格局默认通过
    return { passed: true };
  }

  /**
   * 专旺格纯度检查
   */
  private verifyProsperityPattern(
    patternName: string,
    ctx: DetectionContext
  ): PurityResult {
    const config = PROSPERITY_PATTERN_CONFIG[patternName];

    // 1. 检查天干是否透出禁忌
    const stemPurityResult = this.checkStemPurity(
      config.forbiddenElements,
      ctx
    );

    if (!stemPurityResult.passed) {
      return stemPurityResult;
    }

    // 2. 检查藏干权重
    const forbiddenWeight = this.calculateForbiddenWeight(
      config.forbiddenElements,
      ctx
    );

    if (forbiddenWeight > PROSPERITY_FORBIDDEN_WEIGHT_LIMIT) {
      return {
        passed: false,
        reason: `藏干禁忌权重超标 (${(forbiddenWeight * 100).toFixed(1)}% > ${PROSPERITY_FORBIDDEN_WEIGHT_LIMIT * 100}%)`,
        forbiddenWeight,
      };
    }

    return { passed: true, forbiddenWeight };
  }

  /**
   * 从格纯度检查
   */
  private verifyFollowPattern(
    patternName: string,
    ctx: DetectionContext
  ): PurityResult {
    const config = FOLLOW_PATTERN_CONFIG[patternName];

    // 检查天干是否有禁忌十神
    const forbiddenStemResult = this.checkForbiddenTenGods(
      config.forbiddenTenGods,
      ctx
    );

    if (!forbiddenStemResult.passed) {
      return forbiddenStemResult;
    }

    return { passed: true };
  }

  /**
   * 检查天干透出禁忌五行
   * 
   * 例: 润下格禁忌土 (戊己)
   */
  private checkStemPurity(
    forbiddenElements: FiveElement[],
    ctx: DetectionContext
  ): PurityResult {
    const stems = [
      ctx.fourPillars.year.heavenlyStem,
      ctx.fourPillars.month.heavenlyStem,
      // 日干不检查
      ctx.fourPillars.hour.heavenlyStem,
    ];

    for (const stem of stems) {
      if (forbiddenElements.includes(stem.element)) {
        return {
          passed: false,
          reason: `天干透出禁忌 (${stem.chinese}/${stem.element})`,
        };
      }
    }

    return { passed: true };
  }

  /**
   * 计算禁忌元素在藏干中的权重
   * 
   * 【优化】库墓地支(辰戌丑未)中的禁忌元素权重减半
   */
  private calculateForbiddenWeight(
    forbiddenElements: FiveElement[],
    ctx: DetectionContext
  ): number {
    const branches = [
      ctx.fourPillars.year.earthlyBranch.chinese,
      ctx.fourPillars.month.earthlyBranch.chinese,
      ctx.fourPillars.day.earthlyBranch.chinese,
      ctx.fourPillars.hour.earthlyBranch.chinese,
    ];

    const TREASURY_BRANCHES = ['辰', '戌', '丑', '未'];
    let totalWeight = 0;
    let forbiddenWeight = 0;

    for (const branchChinese of branches) {
      const hiddenStems = HIDDEN_STEMS_MAP[branchChinese] || [];
      const weights = HIDDEN_STEM_WEIGHTS[branchChinese] || [];
      const isTreasury = TREASURY_BRANCHES.includes(branchChinese);

      for (let i = 0; i < hiddenStems.length; i++) {
        const stemChinese = hiddenStems[i];
        const weight = weights[i] || 0;
        const stemElement = this.getStemElement(stemChinese);

        if (!stemElement) continue;

        totalWeight += weight;

        if (forbiddenElements.includes(stemElement)) {
          // 库墓中的禁忌元素权重减半
          const adjustedWeight = isTreasury ? weight * 0.5 : weight;
          forbiddenWeight += adjustedWeight;
        }
      }
    }

    return totalWeight === 0 ? 0 : forbiddenWeight / totalWeight;
  }

  /**
   * 检查禁忌十神 (用于从格)
   */
  private checkForbiddenTenGods(
    forbiddenTenGods: string[],
    ctx: DetectionContext
  ): PurityResult {
    // TODO: 实现十神检查逻辑
    return { passed: true };
  }

  /**
   * 获取天干五行
   */
  private getStemElement(stemChinese: string): FiveElement | null {
    const map: Record<string, FiveElement> = {
      甲: 'wood', 乙: 'wood',
      丙: 'fire', 丁: 'fire',
      戊: 'earth', 己: 'earth',
      庚: 'metal', 辛: 'metal',
      壬: 'water', 癸: 'water',
    };
    return map[stemChinese] || null;
  }
}
