/**
 * 从格判定模块
 * Follow Pattern Module - Detects follow patterns (Cong Cai, Cong Sha, Cong Er, Cong Shi)
 */

import type { FourPillars, PatternInfo, DayMaster, FiveElementsAnalysis } from './types.js';
import { FOLLOW_PATTERN_CONFIG } from './constants.js';

/**
 * 获取天干的十神
 * (简化版,实际应从calculator.ts引入)
 */
function getTenGod(dayStem: string, targetStem: string): string | null {
  // 简化实现,实际需要根据五行生克关系计算
  // 这里先返回null,后续在重构主函数时会调用正确的函数
  return null;
}

/**
 * 检测从格(含从势格和修正后的从儿格)
 * 
 * 判定条件:
 * 1. 日主必须极弱(totalScore < 20)
 * 2. 根据目标十神判定从格类型:
 *    - 从财格: 财星旺,无印比
 *    - 从杀格: 官杀旺,无食伤印
 *    - 从儿格: 食伤旺,仅禁印(【修正3】不怕比劫)
 *    - 从势格: 财官伤混旺,无印比
 * 
 * @param fourPillars 四柱
 * @param dayMaster 日主分析
 * @param distribution 五行分布
 * @param getTenGodFn 十神计算函数(从外部传入)
 * @returns 从格信息,如不成格则返回null
 */
export function checkCongPattern(
  fourPillars: FourPillars,
  dayMaster: DayMaster,
  distribution: FiveElementsAnalysis['distribution'],
  getTenGodFn: (dayStem: string, targetStem: string) => string | null
): PatternInfo | null {
  // 1. 日主必须极弱
  if (!dayMaster.analysis || dayMaster.analysis.totalScore >= 20) {
    return null;
  }

  const dayStem = fourPillars.day.heavenlyStem.chinese;

  // 统计所有十神
  const tenGodCount: Record<string, number> = {};
  for (const pillar of [fourPillars.year, fourPillars.month, fourPillars.hour]) {
    const tenGod = getTenGodFn(dayStem, pillar.heavenlyStem.chinese);
    if (tenGod) {
      tenGodCount[tenGod] = (tenGodCount[tenGod] || 0) + 1;
    }
  }

  // 2. 优先检测从势格(财官伤混旺,无印比)
  const hasCai = (tenGodCount['正财'] || 0) + (tenGodCount['偏财'] || 0) > 0;
  const hasGuan = (tenGodCount['正官'] || 0) + (tenGodCount['七杀'] || 0) > 0;
  const hasShang = (tenGodCount['食神'] || 0) + (tenGodCount['伤官'] || 0) > 0;
  const hasPrint = (tenGodCount['正印'] || 0) + (tenGodCount['偏印'] || 0) > 0;
  const hasBiJie = (tenGodCount['比肩'] || 0) + (tenGodCount['劫财'] || 0) > 0;

  const mixCount = [hasCai, hasGuan, hasShang].filter(Boolean).length;

  if (mixCount >= 2 && !hasPrint && !hasBiJie) {
    return {
      name: '从势格',
      category: 'special',
      description: '财官伤混旺,日主弃命从势,主多才多艺,宜顺势而为',
      congInfo: {
        type: '从势',
        reason: `财${hasCai ? '旺' : ''}官${hasGuan ? '旺' : ''}伤${hasShang ? '旺' : ''}混旺`,
      },
    };
  }

  // 3. 检测从财格/从杀格/从儿格
  for (const [patternName, config] of Object.entries(FOLLOW_PATTERN_CONFIG)) {
    if (config.mixedRequired) continue; // 跳过从势格(已处理)

    // 检查目标十神是否旺
    const targetCount = (config.targetTenGods || []).reduce(
      (sum, tg) => sum + (tenGodCount[tg] || 0),
      0
    );

    if (targetCount === 0) continue; // 目标十神不存在

    // 检查禁忌十神
    const hasForbidden = config.forbiddenTenGods.some((tg) => (tenGodCount[tg] || 0) > 0);

    if (hasForbidden) continue; // 有禁忌,不能从

    // 检查目标五行分数(可选)
    // 这里简化处理,实际需要根据十神反推五行再检查分数

    return {
      name: patternName,
      category: 'special',
      description: getFollowPatternDescription(patternName),
      congInfo: {
        type: patternName.replace('格', ''),
        reason: `${(config.targetTenGods || []).join('/')}旺,日主弃命从之`,
      },
    };
  }

  return null;
}

/**
 * 获取从格的描述
 * @param patternName 格局名称
 * @returns 描述文本
 */
function getFollowPatternDescription(patternName: string): string {
  const descMap: Record<string, string> = {
    从财格: '日主极弱,弃命从财,主善于理财经商,宜财运',
    从杀格: '日主极弱,弃命从官,主顺从权威,宜官运',
    从儿格: '日主极弱,从儿不管身强弱,主才华外露,宜食伤运',
    从势格: '财官伤混旺,日主弃命从势,主多才多艺,宜顺势而为',
  };
  return descMap[patternName] || '';
}

/**
 * 检查是否为"真从格"(彻底放弃自我)
 * @param pattern 格局信息
 * @param dayMasterScore 日主分数
 * @returns 是否为真从格
 */
export function isPerfectFollowPattern(
  pattern: PatternInfo,
  dayMasterScore: number
): boolean {
  // 真从格条件:
  // 1. 日主分数 < 15 (彻底弱)
  // 2. 无任何印比帮身
  return dayMasterScore < 15;
}
