/**
 * ConflictEngine - 冲突与衰减引擎
 * 
 * 职责: 计算现实世界中的能量损耗
 * - 刑冲破害扣分
 * - 墓库开启判定
 * - 合绊状态检测
 * - 调候系数应用
 * 
 * 核心理念: 现实有摩擦 (Reality has Friction)
 */

import type { DetectionContext } from '../types.js';
import { BRANCH_CLASH_MAP } from '../constants.js';
import { calculateSeasonalAdjustment } from '../seasonal-adjustment.js';

export interface ConflictReport {
  clashPenalty: number;         // 冲克扣分
  seasonalAdjustment: number;   // 调候系数
  graveOpened: boolean;         // 墓库是否打开
  blockingLinks: Array<{        // 合绊关系
    branch1: string;
    branch2: string;
  }>;
}

export class ConflictEngine {
  /**
   * 分析冲突与衰减
   */
  public analyze(ctx: DetectionContext): ConflictReport {
    return {
      clashPenalty: this.calculateClashPenalty(ctx),
      seasonalAdjustment: this.getSeasonalAdjustment(ctx),
      graveOpened: this.isGraveOpened(ctx),
      blockingLinks: this.findBlockingLinks(ctx),
    };
  }

  /**
   * 计算刑冲破害扣分
   * 
   * 例: 寅申冲 → 禄位从45降至36 (扣20%)
   */
  private calculateClashPenalty(ctx: DetectionContext): number {
    const branches = [
      ctx.fourPillars.year.earthlyBranch.chinese,
      ctx.fourPillars.month.earthlyBranch.chinese,
      ctx.fourPillars.day.earthlyBranch.chinese,
      ctx.fourPillars.hour.earthlyBranch.chinese,
    ];

    let totalPenalty = 0;

    for (let i = 0; i < branches.length; i++) {
      for (let j = i + 1; j < branches.length; j++) {
        const branch1 = branches[i];
        const branch2 = branches[j];

        // 检查是否相冲
        if (BRANCH_CLASH_MAP[branch1] === branch2) {
          totalPenalty += 0.2; // 每次冲扣20%
        }
      }
    }

    return Math.min(totalPenalty, 0.6); // 最多扣60%
  }

  /**
   * 获取调候系数
   * 
   * 根据出生月份的寒暖燥湿应用折扣
   * 例: 冬月生火命 → 系数0.7
   */
  private getSeasonalAdjustment(ctx: DetectionContext): number {
    const dayElement = ctx.fourPillars.day.heavenlyStem.element;
    
    // 调用统一的调候分析函数
    const seasonalAnalysis = calculateSeasonalAdjustment(ctx.fourPillars, dayElement);
    
    return seasonalAnalysis.adjustmentFactor;
  }

  /**
   * 判定墓库是否打开
   * 
   * 条件:
   * - 有冲: 辰戌冲、丑未冲 → 打开
   * - 有刑: 三刑 → 打开
   * 
   * 物理意义: "冲开库门，释放能量"
   */
  private isGraveOpened(ctx: DetectionContext): boolean {
    const branches = [
      ctx.fourPillars.year.earthlyBranch.chinese,
      ctx.fourPillars.month.earthlyBranch.chinese,
      ctx.fourPillars.day.earthlyBranch.chinese,
      ctx.fourPillars.hour.earthlyBranch.chinese,
    ];

    const GRAVE_BRANCHES = ['辰', '戌', '丑', '未'];

    // 检查是否有库墓地支
    const hasGrave = branches.some(b => GRAVE_BRANCHES.includes(b));
    if (!hasGrave) return false;

    // 检查是否有冲
    for (let i = 0; i < branches.length; i++) {
      for (let j = i + 1; j < branches.length; j++) {
        const b1 = branches[i];
        const b2 = branches[j];

        // 辰戌冲或丑未冲
        if ((b1 === '辰' && b2 === '戌') || (b1 === '戌' && b2 === '辰') ||
            (b1 === '丑' && b2 === '未') || (b1 === '未' && b2 === '丑')) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 查找合绊关系
   * 
   * 例: 子丑合但无法化土 → 合绊
   * 
   * 物理意义: "两支相合但不化，能量被锁定"
   */
  private findBlockingLinks(ctx: DetectionContext): Array<{ branch1: string; branch2: string }> {
    const links: Array<{ branch1: string; branch2: string }> = [];

    const BLOCKING_PAIRS: Record<string, string> = {
      '子': '丑',
      '寅': '亥',
      '卯': '戌',
      '辰': '酉',
      '巳': '申',
      '午': '未',
    };

    const branches = [
      ctx.fourPillars.year.earthlyBranch.chinese,
      ctx.fourPillars.month.earthlyBranch.chinese,
      ctx.fourPillars.day.earthlyBranch.chinese,
      ctx.fourPillars.hour.earthlyBranch.chinese,
    ];

    for (const [b1, b2] of Object.entries(BLOCKING_PAIRS)) {
      if (branches.includes(b1) && branches.includes(b2)) {
        links.push({ branch1: b1, branch2: b2 });
      }
    }

    return links;
  }
}
