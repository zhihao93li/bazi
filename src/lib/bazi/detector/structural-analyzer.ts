/**
 * StructuralAnalyzer - 结构特征分析器
 * 
 * 职责: 识别地支之间的"化学反应"
 * - 全三合局 (San He)
 * - 三会方 (San Hui)
 * - 半三合 (Ban San He)
 * - 空亡衰减 (Void Damping)
 * 
 * 核心理念: 结构先于分数 (Structure precedes Score)
 */

import type { DetectionContext, HarmonyCheck } from '../types.js';
import {
  SAN_HE_PATTERNS,
  SAN_HUI_PATTERNS,
  BAN_SAN_HE_PATTERNS,
  HARMONY_VOID_CONVERSION_RATE,
} from '../constants.js';

export class StructuralAnalyzer {
  /**
   * 分析地支结构特征
   * 
   * 优先级:
   * 1. 全三合 (转化率 1.0 或 0.6 if void)
   * 2. 三会方 (转化率 1.0 或 0.6 if void)
   * 3. 半三合 (转化率 0.5)
   * 4. 无合局 (转化率 0)
   */
  public analyze(ctx: DetectionContext): HarmonyCheck {
    const branches = this.extractBranches(ctx);
    const xunKong = ctx.xunKong || '';

    // 1. 检查全三合局
    const sanHeResult = this.checkSanHe(branches, xunKong);
    if (sanHeResult.type !== 'none') {
      return sanHeResult;
    }

    // 2. 检查三会方
    const sanHuiResult = this.checkSanHui(branches, xunKong);
    if (sanHuiResult.type !== 'none') {
      return sanHuiResult;
    }

    // 3. 检查半三合
    const banSanHeResult = this.checkBanSanHe(branches);
    if (banSanHeResult.type !== 'none') {
      return banSanHeResult;
    }

    // 4. 无合局
    return {
      type: 'none',
      branches: [],
      name: '无合局',
      conversionRate: 0,
    };
  }

  /**
   * 检查全三合局
   * 
   * 例: 申子辰三合水局
   * - 核心地支: 子 (旺位, 索引1)
   * - 若子空亡 → 转化率降至 0.6
   */
  private checkSanHe(branches: string[], xunKong: string): HarmonyCheck {
    for (const [key, pattern] of Object.entries(SAN_HE_PATTERNS)) {
      const hasAll = pattern.branches.every((b) => branches.includes(b));
      
      if (hasAll) {
        // 检查核心地支是否空亡
        const coreBranch = pattern.branches[1]; // 旺位
        const isVoid = xunKong.includes(coreBranch);

        return {
          type: 'full',
          element: pattern.element,
          branches: pattern.branches,
          name: pattern.name,
          conversionRate: isVoid ? HARMONY_VOID_CONVERSION_RATE : 1.0,
          isVoid,
          voidBranch: isVoid ? coreBranch : undefined,
        };
      }
    }

    return { type: 'none', branches: [], name: '', conversionRate: 0 };
  }

  /**
   * 检查三会方
   * 
   * 例: 亥子丑三会水方
   * - 核心地支: 子 (正气, 索引1)
   */
  private checkSanHui(branches: string[], xunKong: string): HarmonyCheck {
    for (const [key, pattern] of Object.entries(SAN_HUI_PATTERNS)) {
      const hasAll = pattern.branches.every((b) => branches.includes(b));
      
      if (hasAll) {
        const coreBranch = pattern.branches[1]; // 正气
        const isVoid = xunKong.includes(coreBranch);

        return {
          type: 'hui',
          element: pattern.element,
          branches: pattern.branches,
          name: pattern.name,
          conversionRate: isVoid ? HARMONY_VOID_CONVERSION_RATE : 1.0,
          isVoid,
          voidBranch: isVoid ? coreBranch : undefined,
        };
      }
    }

    return { type: 'none', branches: [], name: '', conversionRate: 0 };
  }

  /**
   * 检查半三合
   * 
   * 例: 申子半合水局
   * - 转化率固定为 0.5
   * - 【修正1】半三合不能定特殊格局
   */
  private checkBanSanHe(branches: string[]): HarmonyCheck {
    for (const [element, patterns] of Object.entries(BAN_SAN_HE_PATTERNS)) {
      for (const pattern of patterns) {
        const hasAll = pattern.branches.every((b) => branches.includes(b));
        
        if (hasAll) {
          return {
            type: 'half',
            element: element as any,
            branches: pattern.branches,
            name: pattern.name,
            conversionRate: 0.5,
          };
        }
      }
    }

    return { type: 'none', branches: [], name: '', conversionRate: 0 };
  }

  /**
   * 提取四柱地支
   */
  private extractBranches(ctx: DetectionContext): string[] {
    return [
      ctx.fourPillars.year.earthlyBranch.chinese,
      ctx.fourPillars.month.earthlyBranch.chinese,
      ctx.fourPillars.day.earthlyBranch.chinese,
      ctx.fourPillars.hour.earthlyBranch.chinese,
    ];
  }

  /**
   * 空亡修正逻辑 (Void Damping)
   * 
   * 当合局的关键地支逢空时:
   * - 原转化率 1.0 → 降至 0.6
   * - 原转化率 0.5 → 降至 0.3
   * 
   * 物理意义: "空亡如同阻尼器，削弱化学反应强度"
   */
  public applyVoidDamping(
    harmony: HarmonyCheck,
    xunKong: string
  ): HarmonyCheck {
    if (harmony.type === 'none') return harmony;

    // 检查核心地支是否空亡
    const coreBranch = harmony.branches[1]; // 假设核心在中间
    const isVoid = xunKong.includes(coreBranch);

    if (!isVoid) return harmony;

    // 应用衰减
    return {
      ...harmony,
      conversionRate: harmony.conversionRate * 0.6,
      isVoid: true,
      voidBranch: coreBranch,
    };
  }

  /**
   * 检查地支是否参与合局
   * @param branch 地支(如"子")
   * @param harmony 合局检测结果
   * @returns 是否参与合局
   */
  public static isInHarmony(branch: string, harmony: HarmonyCheck): boolean {
    return harmony.branches.includes(branch);
  }

  /**
   * 获取合局的详细描述
   * @param harmony 合局检测结果
   * @returns 详细描述
   */
  public static getDescription(harmony: HarmonyCheck): string {
    if (harmony.type === 'none') {
      return '无合局';
    }

    const typeDesc = {
      full: '全三合',
      half: '半三合',
      hui: '三会',
    }[harmony.type];

    const voidDesc = harmony.isVoid
      ? ` (核心地支${harmony.voidBranch}逢空,力量削弱)`
      : '';

    const rateDesc = `(转化率${(harmony.conversionRate * 100).toFixed(0)}%)`;

    return `${typeDesc}: ${harmony.name}${voidDesc} ${rateDesc}`;
  }
}
