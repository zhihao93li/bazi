/**
 * 喜忌神计算优化模块
 * 
 * 实现"调候为急"原则:
 * 1. 第一优先级:调候需求(寒则喜暖,热则喜润)
 * 2. 第二优先级:身强身弱需求(强则泄耗,弱则生扶)
 * 3. 处理冲突:当调候与身强身弱矛盾时,调候优先
 */

import type {
  DayMaster,
  FiveElement,
  SeasonalAdjustment,
} from './types.js';
import {
  FIVE_ELEMENTS,
  FIVE_ELEMENTS_GENERATED_BY,
  FIVE_ELEMENTS_GENERATION,
  FIVE_ELEMENTS_RESTRICTION,
} from './constants.js';

/**
 * 获取调候层面的首要喜忌五行
 * 
 * 调候为急:
 * - 寒则喜暖(火),忌水(加重寒湿)
 * - 热则喜润(水),忌火(加重燥热)
 * - 调候需求优先于传统身强身弱理论
 * 
 * @param seasonalAdjustment 调候分析结果
 * @returns 首要喜忌五行
 */
export function getPrimaryFavorableElements(
  seasonalAdjustment: SeasonalAdjustment
): { favorable: FiveElement[]; unfavorable: FiveElement[] } {
  const favorable: FiveElement[] = [];
  const unfavorable: FiveElement[] = [];
  
  // 根据调候急需添加首要喜忌
  if (seasonalAdjustment.urgentNeed) {
    favorable.push(seasonalAdjustment.urgentNeed);
    
    // 如果有调候用神,还喜生助调候用神的五行(次一级)
    const helperElement = FIVE_ELEMENTS_GENERATED_BY[seasonalAdjustment.urgentNeed];
    if (helperElement && !favorable.includes(helperElement)) {
      favorable.push(helperElement);
    }
  }
  
  if (seasonalAdjustment.urgentAvoid) {
    unfavorable.push(seasonalAdjustment.urgentAvoid);
    
    // 也忌生助忌神的五行
    const helperOfBad = FIVE_ELEMENTS_GENERATED_BY[seasonalAdjustment.urgentAvoid];
    if (helperOfBad && !unfavorable.includes(helperOfBad)) {
      unfavorable.push(helperOfBad);
    }
  }
  
  return { favorable, unfavorable };
}

/**
 * 获取身强身弱层面的次要喜忌五行
 * 
 * 传统理论:
 * - 身强:喜官杀、食伤、财星(泄耗克)
 * - 身弱:喜印星、比劫(生扶帮)
 * 
 * @param dayMaster 日主分析
 * @param distribution 五行分布(用于平衡状态判断)
 * @returns 次要喜忌五行
 */
export function getSecondaryFavorableElements(
  dayMaster: DayMaster,
  distribution: Record<FiveElement, number>
): { favorable: FiveElement[]; unfavorable: FiveElement[] } {
  const dayElement = dayMaster.stem.element;
  const favorable: FiveElement[] = [];
  const unfavorable: FiveElement[] = [];
  
  // 生日主的元素(印星)
  const yinElement = FIVE_ELEMENTS_GENERATED_BY[dayElement];
  // 日主所生的元素(食伤)
  const shiShangElement = FIVE_ELEMENTS_GENERATION[dayElement];
  // 日主所克的元素(财星)
  const caiElement = FIVE_ELEMENTS_RESTRICTION[dayElement];
  // 克日主的元素(官杀)
  let guanShaElement: FiveElement = 'wood';
  for (const element of FIVE_ELEMENTS) {
    if (FIVE_ELEMENTS_RESTRICTION[element] === dayElement) {
      guanShaElement = element;
      break;
    }
  }
  
  if (dayMaster.strength === 'strong') {
    // 身强:喜官杀、食伤、财星
    // 忌印星、比劫
    favorable.push(guanShaElement, shiShangElement, caiElement);
    unfavorable.push(yinElement, dayElement);
  } else if (dayMaster.strength === 'weak') {
    // 身弱:喜印星、比劫
    // 忌官杀、食伤、财星
    favorable.push(yinElement, dayElement);
    unfavorable.push(guanShaElement, shiShangElement, caiElement);
  } else {
    // 平衡:根据五行分布,补弱抑强
    const sorted = [...FIVE_ELEMENTS].sort((a, b) => distribution[a] - distribution[b]);
    favorable.push(sorted[0], sorted[1]);
    unfavorable.push(sorted[4], sorted[3]);
  }
  
  return { favorable, unfavorable };
}

/**
 * 合并并去重喜忌五行列表
 * 
 * 处理冲突:
 * - 如果某五行同时出现在喜和忌中,优先保留在首要列表(调候)中的位置
 * - 调候需求优先级 > 身强身弱需求
 * 
 * @param primary 首要喜忌(调候层面)
 * @param secondary 次要喜忌(身强身弱层面)
 * @returns 合并后的喜忌列表
 */
export function mergeFavorableElements(
  primary: { favorable: FiveElement[]; unfavorable: FiveElement[] },
  secondary: { favorable: FiveElement[]; unfavorable: FiveElement[] }
): { favorable: FiveElement[]; unfavorable: FiveElement[] } {
  const favorable: FiveElement[] = [...primary.favorable];
  const unfavorable: FiveElement[] = [...primary.unfavorable];
  
  // 添加次要喜忌,但要避免冲突
  for (const element of secondary.favorable) {
    // 如果该元素已在主要忌神中,跳过(调候优先)
    if (unfavorable.includes(element)) {
      continue;
    }
    // 如果该元素不在主要喜神中,添加
    if (!favorable.includes(element)) {
      favorable.push(element);
    }
  }
  
  for (const element of secondary.unfavorable) {
    // 如果该元素已在主要喜神中,跳过(调候优先)
    if (favorable.includes(element)) {
      continue;
    }
    // 如果该元素不在主要忌神中,添加
    if (!unfavorable.includes(element)) {
      unfavorable.push(element);
    }
  }
  
  return { favorable, unfavorable };
}

/**
 * 计算喜忌神(优化版)
 * 
 * 核心流程:
 * 1. 获取调候层面的首要喜忌(第一优先级)
 * 2. 获取身强身弱层面的次要喜忌(第二优先级)
 * 3. 合并并处理冲突(调候优先)
 * 
 * @param dayMaster 日主分析(含调候信息)
 * @param distribution 五行分布
 * @returns 喜忌五行列表
 */
export function calculateFavorableElementsOptimized(
  dayMaster: DayMaster,
  distribution: Record<FiveElement, number>
): { favorable: FiveElement[]; unfavorable: FiveElement[] } {
  // 1. 获取调候层面的首要喜忌
  const primaryFavorable = dayMaster.analysis?.seasonalAdjustment
    ? getPrimaryFavorableElements(dayMaster.analysis.seasonalAdjustment)
    : { favorable: [], unfavorable: [] };
  
  // 2. 获取身强身弱层面的次要喜忌
  const secondaryFavorable = getSecondaryFavorableElements(dayMaster, distribution);
  
  // 3. 合并并处理冲突
  const result = mergeFavorableElements(primaryFavorable, secondaryFavorable);
  
  return result;
}

/**
 * 生成喜忌神分析说明
 * 
 * @param favorable 喜用五行
 * @param unfavorable 忌讳五行
 * @param seasonalAdjustment 调候分析(可选)
 * @returns 人类可读的分析说明
 */
export function generateFavorableDescription(
  favorable: FiveElement[],
  unfavorable: FiveElement[],
  seasonalAdjustment?: SeasonalAdjustment
): string {
  const elementChinese: Record<FiveElement, string> = {
    wood: '木',
    fire: '火',
    earth: '土',
    metal: '金',
    water: '水',
  };
  
  let description = '';
  
  // 如果有调候分析,先说明调候需求
  if (seasonalAdjustment && seasonalAdjustment.urgentNeed) {
    const urgentChinese = elementChinese[seasonalAdjustment.urgentNeed];
    description += `调候为急,极喜${urgentChinese}。`;
  }
  
  // 喜用五行
  if (favorable.length > 0) {
    const favorableStr = favorable.map(e => elementChinese[e]).join('、');
    description += `喜用五行:${favorableStr}。`;
  }
  
  // 忌讳五行
  if (unfavorable.length > 0) {
    const unfavorableStr = unfavorable.map(e => elementChinese[e]).join('、');
    description += `忌讳五行:${unfavorableStr}。`;
  }
  
  return description;
}
