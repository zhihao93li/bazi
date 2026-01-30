/**
 * 化气格判定模块
 * Transformation Pattern Module - Detects Hua Qi (Five Transformation) patterns
 */

import type { FourPillars, PatternInfo, DayMaster } from './types.js';
import { HUA_QI_PATTERN_CONFIG } from './constants.js';

/**
 * 检测化气格
 * 
 * 化气格是五种天干五合的变化,极为罕见:
 * - 甲己化土: 需土月(辰戌丑未)
 * - 乙庚化金: 需金月(巳酉丑申)
 * - 丙辛化水: 需水月(亥子丑申)
 * - 丁壬化木: 需木月(寅卯辰亥)
 * - 戊癸化火: 需火月(巳午未寅)
 * 
 * 判定条件:
 * 1. 日主与月干/年干/时干之一形成天干五合
 * 2. 月支符合化气要求(如甲己化土需要土月)
 * 3. 日主必须处于合适的强度(不能太旺或太弱)
 * 
 * @param fourPillars 四柱
 * @param dayMaster 日主分析
 * @returns 化气格信息,如不成格则返回null
 */
export function checkHuaQiPattern(
  fourPillars: FourPillars,
  dayMaster: DayMaster
): PatternInfo | null {
  const dayStem = fourPillars.day.heavenlyStem.chinese;
  const monthBranch = fourPillars.month.earthlyBranch.chinese;

  // 提取其他天干(年干、月干、时干)
  const otherStems = [
    fourPillars.year.heavenlyStem.chinese,
    fourPillars.month.heavenlyStem.chinese,
    fourPillars.hour.heavenlyStem.chinese,
  ];

  // 遍历化气格配置,检查是否满足条件
  for (const [patternName, config] of Object.entries(HUA_QI_PATTERN_CONFIG)) {
    // 1. 检查日干是否在合对中
    if (!config.stemPair.includes(dayStem)) {
      continue;
    }

    // 2. 查找另一个天干
    const otherStem = config.stemPair.find((s) => s !== dayStem);
    if (!otherStem) continue;

    // 3. 检查其他柱是否有合对的另一干
    if (!otherStems.includes(otherStem)) {
      continue;
    }

    // 4. 检查月支是否符合要求
    if (!config.requiredMonths.includes(monthBranch)) {
      continue;
    }

    // 5. 检查日主强度(可选): 化气格要求日主不能太强
    // 简化处理: 如果日主>80分,则不能化气(过强则不愿放弃自我)
    if (dayMaster.analysis && dayMaster.analysis.totalScore > 80) {
      continue;
    }

    // 6. 成格!
    return {
      name: patternName,
      category: 'special',
      description: config.description,
    };
  }

  return null;
}

/**
 * 获取天干五合的关系
 * @param stem1 天干1
 * @param stem2 天干2
 * @returns 如果五合则返回合化后的五行,否则返回null
 */
export function getHarmonyRelation(
  stem1: string,
  stem2: string
): string | null {
  const pairs: Record<string, string> = {
    甲己: '土',
    己甲: '土',
    乙庚: '金',
    庚乙: '金',
    丙辛: '水',
    辛丙: '水',
    丁壬: '木',
    壬丁: '木',
    戊癸: '火',
    癸戊: '火',
  };

  return pairs[stem1 + stem2] || null;
}

/**
 * 检查两个天干是否五合
 * @param stem1 天干1
 * @param stem2 天干2
 * @returns 是否五合
 */
export function isHarmonyPair(stem1: string, stem2: string): boolean {
  return getHarmonyRelation(stem1, stem2) !== null;
}
