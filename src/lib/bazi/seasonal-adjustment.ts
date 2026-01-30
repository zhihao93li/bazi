/**
 * 调候系统核心逻辑
 * Seasonal Adjustment System
 * 
 * 根据出生季节和五行平衡,计算寒暖燥湿对日主的影响
 */

import type {
  FiveElement,
  Season,
  Temperature,
  Humidity,
  SeasonalAdjustment,
  FourPillars,
  HeavenlyStem,
} from './types.js';
import {
  SEASON_MAP,
  TEMPERATURE_MAP,
  HUMIDITY_MAP,
  FIVE_ELEMENTS_GENERATED_BY,
  SEASON_CHINESE,
  TEMPERATURE_CHINESE,
  HUMIDITY_CHINESE,
} from './constants.js';

/**
 * 根据月令地支判定季节
 * 
 * @param monthBranch - 月令地支(如"子"、"丑"等)
 * @returns Season - 'spring' | 'summer' | 'autumn' | 'winter'
 */
export function getSeason(monthBranch: string): Season {
  return SEASON_MAP[monthBranch] || 'spring';
}

/**
 * 根据月令地支细分寒暖燥湿
 * 
 * @param monthBranch - 月令地支
 * @returns 寒暖和燥湿
 */
export function getTemperatureAndHumidity(monthBranch: string): {
  temperature: Temperature;
  humidity: Humidity;
} {
  return {
    temperature: TEMPERATURE_MAP[monthBranch] || 'warm',
    humidity: HUMIDITY_MAP[monthBranch] || 'balanced',
  };
}

/**
 * 根据寒暖燥湿和日主五行,判定调候急需和忌讳的五行
 * 
 * @param temperature - 寒暖
 * @param humidity - 燥湿
 * @param dayElement - 日主五行
 * @param season - 季节
 * @returns 急需五行和忌讳五行
 */
export function determineUrgentElements(
  temperature: Temperature,
  humidity: Humidity,
  dayElement: FiveElement,
  season: Season
): { urgentNeed: FiveElement | null; urgentAvoid: FiveElement | null } {
  let urgentNeed: FiveElement | null = null;
  let urgentAvoid: FiveElement | null = null;

  // 规则1: 寒则喜暖(火)
  if (temperature === 'cold') {
    urgentNeed = 'fire';
    urgentAvoid = 'water'; // 寒忌水,加重寒湿
  }
  // 规则2: 热则喜润(水)
  else if (temperature === 'hot') {
    urgentNeed = 'water';
    urgentAvoid = 'fire'; // 热忌火,加重燥热
  }
  // 规则3: 特殊组合(日主五行与季节不匹配)
  else if (season === 'spring' && dayElement === 'metal') {
    // 春金脆弱,喜火锻炼
    urgentNeed = 'fire';
  } else if (season === 'autumn' && dayElement === 'wood') {
    // 秋木凋零,喜水滋润
    urgentNeed = 'water';
  } else if (season === 'summer' && dayElement === 'water') {
    // 夏水易涸,需金生水
    urgentNeed = 'metal';
  } else if (season === 'winter' && dayElement === 'fire') {
    // 冬火易灭,需木生火
    urgentNeed = 'wood';
  }

  // 规则4: 燥湿调整
  if (humidity === 'dry' && !urgentNeed) {
    urgentNeed = 'water'; // 燥则喜润
  } else if (humidity === 'wet' && !urgentNeed) {
    urgentNeed = 'fire'; // 湿则喜燥
  }

  return { urgentNeed, urgentAvoid };
}

/**
 * 检查五行是否在命局中(天干或地支藏干)
 * 
 * @param element - 目标五行
 * @param fourPillars - 四柱八字
 * @returns boolean
 */
export function checkElementInPillars(
  element: FiveElement | null,
  fourPillars: FourPillars
): boolean {
  if (!element) {
    return false;
  }

  const allStems: HeavenlyStem[] = [
    fourPillars.year.heavenlyStem,
    fourPillars.month.heavenlyStem,
    fourPillars.day.heavenlyStem,
    fourPillars.hour.heavenlyStem,
  ];

  // 检查天干
  for (const stem of allStems) {
    if (stem.element === element) {
      return true;
    }
  }

  // 检查地支藏干(本气和中气)
  const allPillars = [
    fourPillars.year,
    fourPillars.month,
    fourPillars.day,
    fourPillars.hour,
  ];

  for (const pillar of allPillars) {
    const hiddenStems = pillar.hiddenStems;
    // 检查本气(权重最高)
    if (hiddenStems[0]?.element === element) {
      return true;
    }
    // 检查中气(权重次之)
    if (hiddenStems[1]?.element === element) {
      return true;
    }
  }

  return false;
}

/**
 * 计算调候系数
 * 
 * @param urgentNeed - 调候急需五行
 * @param urgentAvoid - 调候忌讳五行
 * @param fourPillars - 四柱八字
 * @returns 调候系数(0.6-1.0)
 */
export function calculateAdjustmentFactor(
  urgentNeed: FiveElement | null,
  urgentAvoid: FiveElement | null,
  fourPillars: FourPillars
): number {
  // 如果无调候需求,返回1.0(正常)
  if (!urgentNeed) {
    return 1.0;
  }

  // 检查命局中是否有调候用神
  const hasUrgentElement = checkElementInPillars(urgentNeed, fourPillars);

  // 检查是否有生助调候用神的元素
  const helperElement = FIVE_ELEMENTS_GENERATED_BY[urgentNeed];
  const hasHelper = checkElementInPillars(helperElement, fourPillars);

  // 检查是否有加重病症的元素
  const hasAvoidElement = checkElementInPillars(urgentAvoid, fourPillars);

  // 计算基础系数
  let factor: number;

  if (hasUrgentElement) {
    // 情况A: 有调候用神 → 完美
    factor = 1.0;
  } else if (hasHelper) {
    // 情况B: 无调候用神,但有生助者 → 可接受
    factor = 0.85;
  } else {
    // 情况C: 完全缺失调候 → 严重
    factor = 0.7;
  }

  // 加重惩罚
  if (hasAvoidElement && factor < 1.0) {
    // 如果有加重元素,且本身已经有问题,进一步折扣
    factor = factor * 0.857; // 0.7 * 0.857 ≈ 0.6
  }

  return Math.max(0.6, factor); // 下限0.6,避免过度惩罚
}

/**
 * 生成调候说明文本
 * 
 * @param seasonalAdjustment - 调候分析结果
 * @returns 描述文本
 */
export function generateSeasonalDescription(
  seasonalAdjustment: Omit<SeasonalAdjustment, 'description'>
): string {
  const {
    season,
    temperature,
    humidity,
    urgentNeed,
    urgentAvoid,
    adjustmentFactor,
    hasAdjustmentElement,
  } = seasonalAdjustment;

  const seasonName = SEASON_CHINESE[season];
  const tempName = TEMPERATURE_CHINESE[temperature];
  const humidityName = HUMIDITY_CHINESE[humidity];

  let desc = `${seasonName}季出生,命局${tempName}${humidityName}。`;

  if (urgentNeed) {
    const needChinese = urgentNeed === 'fire' ? '火' : urgentNeed === 'water' ? '水' : urgentNeed === 'wood' ? '木' : urgentNeed === 'metal' ? '金' : '土';

    if (hasAdjustmentElement) {
      desc += `命中有${needChinese},调候得宜。`;
    } else {
      desc += `调候急需${needChinese}暖局/润局,但命中缺${needChinese}。`;
    }
  }

  if (urgentAvoid) {
    const avoidChinese = urgentAvoid === 'water' ? '水' : urgentAvoid === 'fire' ? '火' : '其他';
    desc += `忌${avoidChinese}加重病症。`;
  }

  if (adjustmentFactor < 1.0) {
    desc += `调候系数${adjustmentFactor.toFixed(2)},能量${adjustmentFactor < 0.7 ? '严重' : '略有'}折扣。`;
  }

  return desc;
}

/**
 * 计算完整的调候分析
 * 
 * @param fourPillars - 四柱八字
 * @param dayElement - 日主五行
 * @returns 调候分析结果
 */
export function calculateSeasonalAdjustment(
  fourPillars: FourPillars,
  dayElement: FiveElement
): SeasonalAdjustment {
  // 第1步: 判定季节
  const monthBranch = fourPillars.month.earthlyBranch.chinese;
  const season = getSeason(monthBranch);

  // 第2步: 判定寒暖燥湿
  const { temperature, humidity } = getTemperatureAndHumidity(monthBranch);

  // 第3步: 确定调候用神和忌神
  const { urgentNeed, urgentAvoid } = determineUrgentElements(
    temperature,
    humidity,
    dayElement,
    season
  );

  // 第4步: 检查是否有调候用神
  const hasAdjustmentElement = checkElementInPillars(urgentNeed, fourPillars);

  // 第5步: 计算调候系数
  const adjustmentFactor = calculateAdjustmentFactor(
    urgentNeed,
    urgentAvoid,
    fourPillars
  );

  // 第6步: 生成描述
  const description = generateSeasonalDescription({
    season,
    temperature,
    humidity,
    urgentNeed,
    urgentAvoid,
    adjustmentFactor,
    hasAdjustmentElement,
  });

  return {
    season,
    temperature,
    humidity,
    urgentNeed,
    urgentAvoid,
    adjustmentFactor,
    hasAdjustmentElement,
    description,
  };
}
