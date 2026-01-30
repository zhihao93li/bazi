/**
 * PatternDispatcher - 格局分流决策中心
 * 
 * 职责: 执行格局判定的决策树
 * 
 * 优先级 (从高到低):
 * 1. 化气格 (天干五合 + 月令支持)
 * 2. 专旺格 (全三合/三会 + 日主同五行 + 分数>75%)
 * 3. 禄刃格 (月支直接判定)
 * 4. 从格 (日主<20 + 目标五行旺)
 * 5. 普通格 (透干优先)
 * 6. 杂格 (兜底)
 */

import type { PatternInfo, DetectionContext } from '../types.js';
import { checkHuaQiPattern } from '../transformation-pattern.js';
import { checkProsperityPattern } from '../prosperity-pattern.js';
import { checkCongPattern } from '../follow-pattern.js';
import { LU_MAP, REN_MAP } from '../constants.js';
import { getTenGod } from '../calculator.js';

export class PatternDispatcher {
  /**
   * 执行分流决策
   */
  public dispatch(ctx: DetectionContext): PatternInfo {
    // 1. 化气格 (最高优先级)
    const huaQiPattern = checkHuaQiPattern(ctx.fourPillars, ctx.dayMaster);
    if (huaQiPattern) {
      return huaQiPattern;
    }

    // 2. 专旺格 (需要全三合或三会)
    if (ctx.harmony && ctx.recalculatedDistribution) {
      const prosperityPattern = checkProsperityPattern(
        ctx.fourPillars.day.heavenlyStem,
        ctx.fourPillars,
        ctx.harmony,
        ctx.recalculatedDistribution
      );
      if (prosperityPattern) {
        return prosperityPattern;
      }
    }

    // 3. 禄刃格
    const luRenPattern = this.checkLuRenPattern(ctx);
    if (luRenPattern) {
      return luRenPattern;
    }

    // 4. 从格 (日主极弱)
    const congPattern = checkCongPattern(
      ctx.fourPillars,
      ctx.dayMaster,
      ctx.fiveElements.distribution,
      (dayStemChinese, targetStemChinese) => {
        const dayStem = ctx.fourPillars.day.heavenlyStem;
        const targetStem = this.getStemByName(targetStemChinese);
        if (!targetStem) return null;
        return getTenGod(dayStem, targetStem);
      }
    );
    if (congPattern) {
      return congPattern;
    }

    // 5. 普通格局 (兜底)
    return this.dispatchNormalPattern(ctx);
  }

  /**
   * 检查禄刃格
   */
  private checkLuRenPattern(ctx: DetectionContext): PatternInfo | null {
    const dayStem = ctx.fourPillars.day.heavenlyStem.chinese;
    const monthBranch = ctx.fourPillars.month.earthlyBranch.chinese;
    const monthHiddenStems = ctx.fourPillars.month.hiddenStems;

    // 建禄格
    if (monthBranch === LU_MAP[dayStem]) {
      return {
        name: '建禄格',
        category: 'normal',
        description: '月支为日主之禄,主身旺有根,宜见财官食伤',
        monthStem: monthHiddenStems[0]?.chinese,
        isTransparent: false,
      };
    }

    // 羊刃格
    if (monthBranch === REN_MAP[dayStem]) {
      return {
        name: '羊刃格',
        category: 'normal',
        description: '月支为日主之刃,主身强刚烈,宜见官杀制刃',
        monthStem: monthHiddenStems[0]?.chinese,
        isTransparent: false,
      };
    }

    return null;
  }

  /**
   * 普通格局判定 (透干优先)
   */
  public dispatchNormalPattern(ctx: DetectionContext): PatternInfo {
    const dayStem = ctx.fourPillars.day.heavenlyStem;
    const monthBranch = ctx.fourPillars.month.earthlyBranch.chinese;
    const monthHiddenStems = ctx.fourPillars.month.hiddenStems;

    const tianGan = [
      ctx.fourPillars.year.heavenlyStem.chinese,
      ctx.fourPillars.month.heavenlyStem.chinese,
      ctx.fourPillars.hour.heavenlyStem.chinese,
    ];

    // 检查透干
    for (const hiddenStem of monthHiddenStems) {
      if (tianGan.includes(hiddenStem.chinese)) {
        const tenGod = getTenGod(dayStem, hiddenStem);

        if (tenGod === '比肩' || tenGod === '劫财') {
          continue; // 跳过比劫
        }

        const patternName = this.getPatternNameByTenGod(tenGod);
        if (patternName) {
          return {
            name: patternName.name,
            category: 'normal',
            description: patternName.desc,
            monthStem: hiddenStem.chinese,
            monthStemTenGod: tenGod,
            isTransparent: true,
          };
        }
      }
    }

    // 无透干，按月令本气定格
    for (const hiddenStem of monthHiddenStems) {
      const tenGod = getTenGod(dayStem, hiddenStem);

      if (tenGod === '比肩' || tenGod === '劫财') {
        continue;
      }

      const patternName = this.getPatternNameByTenGod(tenGod);
      if (patternName) {
        return {
          name: patternName.name,
          category: 'normal',
          description: patternName.desc,
          monthStem: hiddenStem.chinese,
          monthStemTenGod: tenGod,
          isTransparent: false,
        };
      }
    }

    // 杂格 (兜底)
    return {
      name: '杂格',
      category: 'normal',
      description: '月令无明显成格条件,需综合分析八字整体格局',
    };
  }

  /**
   * 根据十神获取格局名称
   */
  private getPatternNameByTenGod(tenGod: string | null): { name: string; desc: string } | null {
    const map: Record<string, { name: string; desc: string }> = {
      '正官': { name: '正官格', desc: '月令透正官,主贵气端正,宜见财印相生' },
      '七杀': { name: '七杀格', desc: '月令透七杀,主威严果决,宜见食伤制杀或印化杀' },
      '正财': { name: '正财格', desc: '月令透正财,主务实勤俭,宜见官杀护财' },
      '偏财': { name: '偏财格', desc: '月令透偏财,主豪爽大方,宜见官杀护财' },
      '正印': { name: '正印格', desc: '月令透正印,主聪慧仁厚,宜见官杀生印' },
      '偏印': { name: '偏印格', desc: '月令透偏印,主机敏多思,宜见财星制印' },
      '食神': { name: '食神格', desc: '月令透食神,主温和福厚,宜见财星泄秀' },
      '伤官': { name: '伤官格', desc: '月令透伤官,主聪明傲气,宜见财星或印星' },
    };

    return tenGod ? map[tenGod] || null : null;
  }

  /**
   * 根据天干名获取天干对象
   */
  private getStemByName(stemChinese: string): { chinese: string; element: any } | null {
    const elementMap: Record<string, any> = {
      '甲': 'wood', '乙': 'wood',
      '丙': 'fire', '丁': 'fire',
      '戊': 'earth', '己': 'earth',
      '庚': 'metal', '辛': 'metal',
      '壬': 'water', '癸': 'water',
    };
    const element = elementMap[stemChinese];
    return element ? { chinese: stemChinese, element } : null;
  }
}
