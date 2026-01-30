/**
 * 身强身弱计算优化模块
 * 
 * 核心优化:
 * 1. 提高"坐禄"权重(从30分提到40-50分)
 * 2. 集成"调候因子"系统,根据季节寒暖计算折扣系数
 * 3. 最终得分 = 基础得分 × 调候系数
 */

import type {
  FourPillars,
  DayMaster,
  DayMasterAnalysis,
  HeavenlyStem,
  FiveElement,
  SeasonalAdjustment,
} from './types.js';
import {
  FIVE_ELEMENTS_GENERATED_BY,
  FIVE_ELEMENTS_GENERATION,
  FIVE_ELEMENTS_RESTRICTION,
  MONTH_BRANCH_ELEMENT,
  HIDDEN_STEM_WEIGHTS,
  LU_MAP,
  BRANCH_CLASH_MAP,
  BRANCH_HARM_MAP,
  LU_BASE_SCORE,
  BRANCH_CLASH_PENALTY,
  BRANCH_HARM_PENALTY,
  KONG_WANG_ATTENUATION,
  FOLLOW_PATTERN_THRESHOLD,
  MIN_ADJUSTMENT_FACTOR,
} from './constants.js';
import { calculateSeasonalAdjustment } from './seasonal-adjustment.js';

/**
 * 检查地支是否空亡
 * @param branch 地支(如'丑')
 * @param dayXunKong 日柱旬空(如'戌亥')
 * @returns 是否空亡
 */
function isEmptyBranch(branch: string, dayXunKong?: string): boolean {
  if (!dayXunKong) return false;
  return dayXunKong.includes(branch);
}

/**
 * 检查日主是否坐禄,并检测禄位是否受冲克
 * 
 * 坐禄是最强的"得地"支撑,应给予更高权重。
 * 但如果禄位受到冲击(如寅申冲),得分应动态下调。
 * 
 * @param dayStem 日主天干
 * @param dayBranch 日支地支
 * @param fourPillars 四柱数据(用于检测冲克)
 * @returns 坐禄得分和详细说明
 */
export function checkLuPosition(
  dayStem: string,
  dayBranch: string,
  fourPillars: FourPillars
): { hasLu: boolean; score: number; description: string } {
  const luBranch = LU_MAP[dayStem];
  
  if (luBranch !== dayBranch) {
    return {
      hasLu: false,
      score: 0,
      description: '',
    };
  }
  
  // 坐禄,检查是否受冲克
  let score = LU_BASE_SCORE; // 基础45分
  let penaltyDesc = '';
  
  // 检查与其他地支的冲害关系
  const otherBranches = [
    { branch: fourPillars.year.earthlyBranch.chinese, name: '年支' },
    { branch: fourPillars.month.earthlyBranch.chinese, name: '月支' },
    { branch: fourPillars.hour.earthlyBranch.chinese, name: '时支' },
  ];
  
  for (const { branch, name } of otherBranches) {
    // 检查六冲
    if (BRANCH_CLASH_MAP[dayBranch] === branch) {
      score *= BRANCH_CLASH_PENALTY; // 削减20%
      penaltyDesc += `,受${name}${branch}冲击`;
    }
    // 检查六害
    else if (BRANCH_HARM_MAP[dayBranch] === branch) {
      score *= BRANCH_HARM_PENALTY; // 削减10%
      penaltyDesc += `,受${name}${branch}穿害`;
    }
  }
  
  score = Math.round(score);
  
  const baseDesc = `日支${dayBranch}为${dayStem}之禄位,根基稳固`;
  const fullDesc = penaltyDesc ? `${baseDesc}${penaltyDesc}` : baseDesc;
  
  return {
    hasLu: true,
    score,
    description: fullDesc,
  };
}

/**
 * 计算基础身强身弱得分(不含调候因子)
 * 
 * 计算逻辑:
 * 1. 得令分数(月令支持): -20 ~ 40分
 * 2. 得地分数(藏干中的根): 0 ~ 30分 (如坐禄则直接给45分)
 * 3. 天干帮扶分数: -20 ~ 20分
 * 
 * @param dayStem 日主天干
 * @param fourPillars 四柱数据
 * @param fourPillarsXunKong 四柱旬空信息(可选)
 * @returns 基础得分和详细分析
 */
export function calculateBaseStrength(
  dayStem: HeavenlyStem,
  fourPillars: FourPillars,
  fourPillarsXunKong?: { dayXunKong?: string }
): Omit<DayMasterAnalysis, 'seasonalAdjustment'> {
  const dayElement = dayStem.element;
  const monthBranch = fourPillars.month.earthlyBranch.chinese;
  const monthElement = MONTH_BRANCH_ELEMENT[monthBranch] || 'earth';
  
  // 1. 得令判断(月令支持) - 最高40分
  let deLing = 0;
  let deLingDesc = '';
  
  if (dayElement === monthElement) {
    deLing = 40;
    deLingDesc = '日主当令';
  } else if (FIVE_ELEMENTS_GENERATED_BY[dayElement] === monthElement) {
    deLing = 30;
    deLingDesc = '月令生扶';
  } else if (FIVE_ELEMENTS_GENERATION[dayElement] === monthElement) {
    deLing = -10;
    deLingDesc = '月令泄气';
  } else if (FIVE_ELEMENTS_RESTRICTION[monthElement] === dayElement) {
    deLing = -20;
    deLingDesc = '月令克制';
  } else if (FIVE_ELEMENTS_RESTRICTION[dayElement] === monthElement) {
    deLing = -5;
    deLingDesc = '日主耗气';
  }
  
  // 2. 得地判断(藏干中有根) - 最高30分(坐禄则45分,受冲可能更低)
  let deDi = 0;
  const roots: string[] = [];
  
  // 先检查是否坐禄
  const luCheck = checkLuPosition(
    dayStem.chinese, 
    fourPillars.day.earthlyBranch.chinese,
    fourPillars
  );
  if (luCheck.hasLu) {
    // 检查禄位是否空亡
    const dayBranch = fourPillars.day.earthlyBranch.chinese;
    const isEmpty = isEmptyBranch(dayBranch, fourPillarsXunKong?.dayXunKong);
    
    deDi = isEmpty ? Math.round(luCheck.score * KONG_WANG_ATTENUATION) : luCheck.score;
    const emptyNote = isEmpty ? '(逢空)' : '';
    roots.push(luCheck.description + emptyNote);
  } else {
    // 非坐禄,按原逻辑计算藏干得分
    const allPillars = [
      { pillar: fourPillars.year, name: '年支' },
      { pillar: fourPillars.month, name: '月支' },
      { pillar: fourPillars.day, name: '日支' },
      { pillar: fourPillars.hour, name: '时支' },
    ];
    
    for (const { pillar, name } of allPillars) {
      const branchChinese = pillar.earthlyBranch.chinese;
      const hiddenStems = pillar.hiddenStems;
      const weights = HIDDEN_STEM_WEIGHTS[branchChinese] || [];
      
      // 检查该地支是否空亡
      const isEmpty = isEmptyBranch(branchChinese, fourPillarsXunKong?.dayXunKong);
      const emptyFactor = isEmpty ? KONG_WANG_ATTENUATION : 1.0;
      
      for (let i = 0; i < hiddenStems.length; i++) {
        const hiddenStem = hiddenStems[i];
        const weight = weights[i] || 0.2;
        
        // 比劫(同元素)
        if (hiddenStem.element === dayElement) {
          const baseScore = weight * 15;
          const score = baseScore * emptyFactor;
          deDi += score;
          const emptyNote = isEmpty ? '(空)' : '';
          roots.push(`${name}藏${hiddenStem.chinese}${emptyNote}`);
        }
        // 印星(生日主的元素)
        else if (FIVE_ELEMENTS_GENERATED_BY[dayElement] === hiddenStem.element) {
          const baseScore = weight * 10;
          const score = baseScore * emptyFactor;
          deDi += score;
          const emptyNote = isEmpty ? '(空)' : '';
          roots.push(`${name}藏${hiddenStem.chinese}(印)${emptyNote}`);
        }
      }
    }
    
    deDi = Math.min(deDi, 30); // 非坐禄情况上限30分
  }
  
  const deDiDesc = roots.length > 0 ? roots.join('、') : '无根';
  
  // 3. 天干帮扶判断 - 最高20分
  let tianGanHelp = 0;
  const helpers: string[] = [];
  
  const otherStems = [
    { stem: fourPillars.year.heavenlyStem, name: '年干' },
    { stem: fourPillars.month.heavenlyStem, name: '月干' },
    { stem: fourPillars.hour.heavenlyStem, name: '时干' },
  ];
  
  for (const { stem, name } of otherStems) {
    if (stem.element === dayElement) {
      tianGanHelp += 8;
      helpers.push(`${name}${stem.chinese}比劫`);
    } else if (FIVE_ELEMENTS_GENERATED_BY[dayElement] === stem.element) {
      tianGanHelp += 6;
      helpers.push(`${name}${stem.chinese}印星`);
    } else if (FIVE_ELEMENTS_RESTRICTION[stem.element] === dayElement) {
      tianGanHelp -= 5;
      helpers.push(`${name}${stem.chinese}官杀`);
    } else if (FIVE_ELEMENTS_GENERATION[dayElement] === stem.element) {
      tianGanHelp -= 3;
      helpers.push(`${name}${stem.chinese}食伤`);
    }
  }
  
  tianGanHelp = Math.max(Math.min(tianGanHelp, 20), -20);
  const tianGanHelpDesc = helpers.length > 0 ? helpers.join('、') : '无帮扶';
  
  // 基础总分(未应用调候系数)
  const totalScore = deLing + deDi + tianGanHelp;
  
  return {
    deLing,
    deLingDesc,
    deDi,
    deDiDesc,
    tianGanHelp,
    tianGanHelpDesc,
    totalScore,
  };
}

/**
 * 应用调候系数到基础得分
 * 
 * 特殊处理:
 * - 如果日主极弱(从格),调候系数应失效,返回原得分
 * - 从格的逻辑是"全盘皆冰"或"全盘皆火",已切换到另一种运行模式
 * 
 * @param baseScore 基础得分
 * @param adjustmentFactor 调候系数(0.6-1.0)
 * @param isFollowPattern 是否为从格
 * @returns 最终得分
 */
export function applySeasonalAdjustment(
  baseScore: number,
  adjustmentFactor: number,
  isFollowPattern: boolean = false
): number {
  // 从格禁用调候系数
  if (isFollowPattern) {
    return baseScore;
  }
  
  // 限制调候系数不低于最小值
  const factor = Math.max(adjustmentFactor, MIN_ADJUSTMENT_FACTOR);
  
  return Math.round(baseScore * factor);
}

/**
 * 根据最终得分判断身强身弱
 * 
 * 判定阈值:
 * - 得分 >= 55 → 身强
 * - 得分 <= 30 → 身弱
 * - 30 < 得分 < 55 → 中和
 * 
 * @param adjustedScore 最终得分(已应用调候系数)
 * @returns 身强/身弱/中和
 */
export function determineStrength(adjustedScore: number): 'strong' | 'weak' | 'balanced' {
  if (adjustedScore >= 55) {
    return 'strong';
  } else if (adjustedScore <= 30) {
    return 'weak';
  } else {
    return 'balanced';
  }
}

/**
 * 计算日主身强身弱(优化版)
 * 
 * 核心流程:
 * 1. 计算基础得分(得令+得地+天干帮扶)
 * 2. 判断是否为从格(日主极弱)
 * 3. 计算调候分析(季节、寒暖、调候因子)
 * 4. 应用调候系数得到最终得分(从格禁用调候)
 * 5. 根据最终得分判定身强身弱
 * 
 * @param dayStem 日主天干
 * @param fourPillars 四柱数据
 * @param fourPillarsXunKong 四柱旬空信息(可选)
 * @returns 日主分析结果(含调候信息)
 */
export function calculateDayMasterOptimized(
  dayStem: HeavenlyStem,
  fourPillars: FourPillars,
  fourPillarsXunKong?: { dayXunKong?: string }
): DayMaster {
  // 1. 计算基础得分
  const baseAnalysis = calculateBaseStrength(dayStem, fourPillars, fourPillarsXunKong);
  
  // 2. 判断是否为从格(日主极弱时,调候系数应失效)
  const isFollowPattern = baseAnalysis.totalScore < FOLLOW_PATTERN_THRESHOLD;
  
  // 3. 计算调候分析
  const seasonalAdjustment = calculateSeasonalAdjustment(fourPillars, dayStem.element);
  
  // 4. 应用调候系数(从格禁用)
  const adjustedScore = applySeasonalAdjustment(
    baseAnalysis.totalScore,
    seasonalAdjustment.adjustmentFactor,
    isFollowPattern
  );
  
  // 5. 判定强弱
  const strength = determineStrength(adjustedScore);
  
  // 6. 组装完整分析结果
  const analysis: DayMasterAnalysis = {
    ...baseAnalysis,
    totalScore: adjustedScore, // 用最终得分覆盖基础得分
    seasonalAdjustment: {
      ...seasonalAdjustment,
      description: isFollowPattern 
        ? `${seasonalAdjustment.description}(日主从格,调候系数已禁用)`
        : seasonalAdjustment.description,
    },
  };
  
  return {
    stem: dayStem,
    strength,
    characteristics: getDayMasterCharacteristics(dayStem),
    analysis,
  };
}

/**
 * 获取日主性格特质(复用原有逻辑)
 */
function getDayMasterCharacteristics(stem: HeavenlyStem): string[] {
  const characteristics: Record<string, string[]> = {
    '甲': ['仁慈', '正直', '固执', '有主见'],
    '乙': ['柔和', '细腻', '善变', '有韧性'],
    '丙': ['热情', '光明', '急躁', '有表现力'],
    '丁': ['温和', '内敛', '敏感', '有创造力'],
    '戊': ['厚重', '稳重', '固执', '有责任感'],
    '己': ['温柔', '包容', '多虑', '有同理心'],
    '庚': ['刚毅', '果决', '强势', '有执行力'],
    '辛': ['细腻', '敏锐', '挑剔', '有品味'],
    '壬': ['智慧', '灵活', '多变', '有适应力'],
    '癸': ['柔和', '聪慧', '敏感', '有洞察力'],
  };
  
  return characteristics[stem.chinese] || ['待分析'];
}
