/**
 * ScoreRecalculator - 能量重算引擎
 * 
 * 职责: 根据合局重定向能量流
 * 核心公式: 
 *   目标五行得分 += 原五行得分 × 转化率
 *   原五行得分 -= 原五行得分 × 转化率
 * 
 * 物理意义: "化学反应导致元素重组"
 */

import type { DetectionContext, RecalculatedDistribution, FiveElement } from '../types.js';
import { StructuralAnalyzer } from './structural-analyzer.js';
import { EARTHLY_BRANCHES_MAP } from '../constants.js';

export class ScoreRecalculator {
  /**
   * 重算五行分布
   * 
   * 算法:
   * 1. 如果无合局 → 返回原始分布
   * 2. 如果有合局 → 遍历参与合局的地支，转移能量
   */
  public recalculate(ctx: DetectionContext): RecalculatedDistribution {
    const harmony = ctx.harmony;
    const originalDist = ctx.fiveElements.distribution;

    // 无合局时直接返回
    if (!harmony || harmony.type === 'none' || !harmony.element) {
      return {
        ...originalDist,
        originalDistribution: { ...originalDist },
      };
    }

    // 复制原始分布
    const recalculated: RecalculatedDistribution = {
      metal: originalDist.metal,
      wood: originalDist.wood,
      water: originalDist.water,
      fire: originalDist.fire,
      earth: originalDist.earth,
      originalDistribution: { ...originalDist },
    };

    const targetElement = harmony.element;
    const conversionRate = harmony.conversionRate;

    // 遍历四柱地支
    const pillars = [
      ctx.fourPillars.year.earthlyBranch,
      ctx.fourPillars.month.earthlyBranch,
      ctx.fourPillars.day.earthlyBranch,
      ctx.fourPillars.hour.earthlyBranch,
    ];

    for (const branch of pillars) {
      if (!StructuralAnalyzer.isInHarmony(branch.chinese, harmony)) {
        continue;
      }

      const originalElement = branch.element;
      
      if (originalElement === targetElement) {
        continue; // 已经是目标五行，跳过
      }

      // 估算该地支的贡献
      const contribution = this.estimateBranchContribution(
        branch.chinese,
        originalElement,
        originalDist
      );

      // 转移能量
      const transferEnergy = contribution * conversionRate;
      recalculated[originalElement] = Math.max(0, recalculated[originalElement] - transferEnergy);
      recalculated[targetElement] += transferEnergy;
    }

    return recalculated;
  }

  /**
   * 估算地支对五行的贡献
   * 
   * 简化算法: 该五行总分 / 4
   * 实际应考虑藏干权重、月令加成等
   */
  private estimateBranchContribution(
    branchChinese: string,
    element: FiveElement,
    distribution: Record<FiveElement, number>
  ): number {
    const avgContribution = distribution[element] / 4;
    return Math.max(avgContribution, 15); // 最少15分
  }

  /**
   * 获取重算后的五行占比
   */
  public getPercentage(
    recalculated: RecalculatedDistribution
  ): Record<FiveElement, number> {
    const total =
      recalculated.metal +
      recalculated.wood +
      recalculated.water +
      recalculated.fire +
      recalculated.earth;

    if (total === 0) {
      return { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 };
    }

    return {
      metal: (recalculated.metal / total) * 100,
      wood: (recalculated.wood / total) * 100,
      water: (recalculated.water / total) * 100,
      fire: (recalculated.fire / total) * 100,
      earth: (recalculated.earth / total) * 100,
    };
  }
}
