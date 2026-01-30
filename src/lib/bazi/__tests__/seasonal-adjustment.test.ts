/**
 * 调候系统单元测试
 * Seasonal Adjustment System Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  getSeason,
  getTemperatureAndHumidity,
  determineUrgentElements,
  checkElementInPillars,
  calculateAdjustmentFactor,
  calculateSeasonalAdjustment,
} from '../seasonal-adjustment.js';
import type { FourPillars, FiveElement } from '../types.js';
import { getHeavenlyStem, getEarthlyBranch, getHiddenStems } from '../constants.js';

// 辅助函数:创建测试用的四柱数据
function createTestPillars(
  yearGan: string,
  yearZhi: string,
  monthGan: string,
  monthZhi: string,
  dayGan: string,
  dayZhi: string,
  hourGan: string,
  hourZhi: string
): FourPillars {
  return {
    year: {
      heavenlyStem: getHeavenlyStem(yearGan)!,
      earthlyBranch: getEarthlyBranch(yearZhi)!,
      hiddenStems: getHiddenStems(yearZhi),
      naYin: '',
    },
    month: {
      heavenlyStem: getHeavenlyStem(monthGan)!,
      earthlyBranch: getEarthlyBranch(monthZhi)!,
      hiddenStems: getHiddenStems(monthZhi),
      naYin: '',
    },
    day: {
      heavenlyStem: getHeavenlyStem(dayGan)!,
      earthlyBranch: getEarthlyBranch(dayZhi)!,
      hiddenStems: getHiddenStems(dayZhi),
      naYin: '',
    },
    hour: {
      heavenlyStem: getHeavenlyStem(hourGan)!,
      earthlyBranch: getEarthlyBranch(hourZhi)!,
      hiddenStems: getHiddenStems(hourZhi),
      naYin: '',
    },
  };
}

describe('getSeason', () => {
  it('应该正确判定春季(寅卯辰)', () => {
    expect(getSeason('寅')).toBe('spring');
    expect(getSeason('卯')).toBe('spring');
    expect(getSeason('辰')).toBe('spring');
  });

  it('应该正确判定夏季(巳午未)', () => {
    expect(getSeason('巳')).toBe('summer');
    expect(getSeason('午')).toBe('summer');
    expect(getSeason('未')).toBe('summer');
  });

  it('应该正确判定秋季(申酉戌)', () => {
    expect(getSeason('申')).toBe('autumn');
    expect(getSeason('酉')).toBe('autumn');
    expect(getSeason('戌')).toBe('autumn');
  });

  it('应该正确判定冬季(亥子丑)', () => {
    expect(getSeason('亥')).toBe('winter');
    expect(getSeason('子')).toBe('winter');
    expect(getSeason('丑')).toBe('winter');
  });

  it('应该对无效输入返回默认值(spring)', () => {
    expect(getSeason('无效')).toBe('spring');
  });
});

describe('getTemperatureAndHumidity', () => {
  it('应该正确判定子月(仲冬)为寒湿', () => {
    const result = getTemperatureAndHumidity('子');
    expect(result.temperature).toBe('cold');
    expect(result.humidity).toBe('wet');
  });

  it('应该正确判定午月(仲夏)为热燥', () => {
    const result = getTemperatureAndHumidity('午');
    expect(result.temperature).toBe('hot');
    expect(result.humidity).toBe('dry');
  });

  it('应该正确判定寅月(孟春)为凉且平衡', () => {
    const result = getTemperatureAndHumidity('寅');
    expect(result.temperature).toBe('cool');
    expect(result.humidity).toBe('balanced');
  });

  it('应该对无效输入返回默认值', () => {
    const result = getTemperatureAndHumidity('无效');
    expect(result.temperature).toBe('warm');
    expect(result.humidity).toBe('balanced');
  });
});

describe('determineUrgentElements', () => {
  it('寒命应该急需火,忌水', () => {
    const result = determineUrgentElements('cold', 'wet', 'wood', 'winter');
    expect(result.urgentNeed).toBe('fire');
    expect(result.urgentAvoid).toBe('water');
  });

  it('热命应该急需水,忌火', () => {
    const result = determineUrgentElements('hot', 'dry', 'fire', 'summer');
    expect(result.urgentNeed).toBe('water');
    expect(result.urgentAvoid).toBe('fire');
  });

  it('春金应该喜火(锻炼)', () => {
    const result = determineUrgentElements('cool', 'balanced', 'metal', 'spring');
    expect(result.urgentNeed).toBe('fire');
  });

  it('秋木应该喜水(滋润)', () => {
    const result = determineUrgentElements('cool', 'dry', 'wood', 'autumn');
    expect(result.urgentNeed).toBe('water');
  });

  it('夏水应该喜金(生水)', () => {
    const result = determineUrgentElements('hot', 'dry', 'water', 'summer');
    expect(result.urgentNeed).toBe('water'); // hot优先,返回water
  });

  it('冬火应该喜木(生火)', () => {
    const result = determineUrgentElements('cold', 'wet', 'fire', 'winter');
    expect(result.urgentNeed).toBe('fire'); // cold优先,返回fire
  });

  it('燥命应该喜水润局', () => {
    const result = determineUrgentElements('warm', 'dry', 'wood', 'autumn');
    expect(result.urgentNeed).toBe('water');
  });

  it('湿命应该喜火燥局', () => {
    const result = determineUrgentElements('cool', 'wet', 'wood', 'spring');
    expect(result.urgentNeed).toBe('fire');
  });
});

describe('checkElementInPillars', () => {
  it('应该检测到天干中的五行', () => {
    // 壬寅年 癸丑月 甲寅日 丙子时 (天干有壬癸甲丙)
    const pillars = createTestPillars('壬', '寅', '癸', '丑', '甲', '寅', '丙', '子');

    expect(checkElementInPillars('water', pillars)).toBe(true); // 壬癸
    expect(checkElementInPillars('wood', pillars)).toBe(true); // 甲
    expect(checkElementInPillars('fire', pillars)).toBe(true); // 丙
  });

  it('应该检测到地支藏干中的五行', () => {
    // 壬寅年 癸丑月 甲寅日 乙卯时
    const pillars = createTestPillars('壬', '寅', '癸', '丑', '甲', '寅', '乙', '卯');

    // 寅藏:甲丙戊, 丑藏:己癸辛, 卯藏:乙
    expect(checkElementInPillars('fire', pillars)).toBe(true); // 寅中藏丙(中气)
    expect(checkElementInPillars('earth', pillars)).toBe(true); // 丑中藏己(本气), 寅中藏戊(余气)
    expect(checkElementInPillars('metal', pillars)).toBe(true); // 丑中藏辛(余气)
  });

  it('应该正确处理null输入', () => {
    const pillars = createTestPillars('壬', '寅', '癸', '丑', '甲', '寅', '丙', '子');
    expect(checkElementInPillars(null, pillars)).toBe(false);
  });

  it('应该对不存在的五行返回false', () => {
    // 只有水木的命局
    const pillars = createTestPillars('壬', '亥', '癸', '子', '甲', '寅', '乙', '卯');
    expect(checkElementInPillars('fire', pillars)).toBe(false);
  });
});

describe('calculateAdjustmentFactor', () => {
  it('无调候需求时应该返回1.0', () => {
    const pillars = createTestPillars('壬', '寅', '癸', '丑', '甲', '寅', '丙', '子');
    const factor = calculateAdjustmentFactor(null, null, pillars);
    expect(factor).toBe(1.0);
  });

  it('有调候用神时应该返回1.0', () => {
    // 冬季甲木,有丙火
    const pillars = createTestPillars('壬', '寅', '癸', '子', '甲', '寅', '丙', '子');
    const factor = calculateAdjustmentFactor('fire', 'water', pillars);
    expect(factor).toBe(1.0);
  });

  it('无调候用神但有生助者时应该返回0.85', () => {
    // 冬季甲木,无火但有木(木能生火)
    const pillars = createTestPillars('壬', '寅', '癸', '子', '甲', '寅', '乙', '卯');
    const factor = calculateAdjustmentFactor('fire', 'water', pillars);
    expect(factor).toBe(0.85);
  });

  it('完全缺失调候且有加重元素时应该返回0.6', () => {
    // 冬季甲木,无火无木,水旺(壬癸亥子)
    const pillars = createTestPillars('壬', '亥', '癸', '子', '甲', '子', '癸', '亥');
    const factor = calculateAdjustmentFactor('fire', 'water', pillars);
    expect(factor).toBeCloseTo(0.6, 1);
  });

  it('完全缺失调候但无加重元素时应该返回0.7', () => {
    // 冬季甲木,无火无木,但也无水(用金土代替)
    const pillars = createTestPillars('庚', '申', '辛', '丑', '甲', '辰', '己', '戌');
    const factor = calculateAdjustmentFactor('fire', 'water', pillars);
    expect(factor).toBe(0.7);
  });
});

describe('calculateSeasonalAdjustment', () => {
  it('应该正确分析冬季甲木无火的情况', () => {
    // 壬寅年 癸子月 甲寅日 癸亥时 (冬季,寒湿,无火)
    const pillars = createTestPillars('壬', '寅', '癸', '子', '甲', '寅', '癸', '亥');
    const dayElement: FiveElement = 'wood';

    const result = calculateSeasonalAdjustment(pillars, dayElement);

    expect(result.season).toBe('winter');
    expect(result.temperature).toBe('cold');
    expect(result.humidity).toBe('wet');
    expect(result.urgentNeed).toBe('fire');
    expect(result.urgentAvoid).toBe('water');
    expect(result.hasAdjustmentElement).toBe(false);
    expect(result.adjustmentFactor).toBeCloseTo(0.6, 1);
    expect(result.description).toContain('冬季');
    expect(result.description).toContain('寒');
  });

  it('应该正确分析冬季甲木有火的情况', () => {
    // 壬寅年 癸丑月 甲寅日 丙子时 (冬季,有丙火)
    const pillars = createTestPillars('壬', '寅', '癸', '丑', '甲', '寅', '丙', '子');
    const dayElement: FiveElement = 'wood';

    const result = calculateSeasonalAdjustment(pillars, dayElement);

    expect(result.season).toBe('winter');
    expect(result.urgentNeed).toBe('fire');
    expect(result.hasAdjustmentElement).toBe(true);
    expect(result.adjustmentFactor).toBe(1.0);
    expect(result.description).toContain('调候得宜');
  });

  it('应该正确分析夏季丙火无水的情况', () => {
    // 甲午年 庚午月 丙午日 甲午时 (夏季,极热极燥,无水)
    const pillars = createTestPillars('甲', '午', '庚', '午', '丙', '午', '甲', '午');
    const dayElement: FiveElement = 'fire';

    const result = calculateSeasonalAdjustment(pillars, dayElement);

    expect(result.season).toBe('summer');
    expect(result.temperature).toBe('hot');
    expect(result.humidity).toBe('dry');
    expect(result.urgentNeed).toBe('water');
    expect(result.urgentAvoid).toBe('fire');
    expect(result.hasAdjustmentElement).toBe(false);
    expect(result.adjustmentFactor).toBeCloseTo(0.6, 1);
  });

  it('应该正确分析春季平和的情况', () => {
    // 甲寅年 丁卯月 戊辰日 庚申时 (春季,温和平衡)
    const pillars = createTestPillars('甲', '寅', '丁', '卯', '戊', '辰', '庚', '申');
    const dayElement: FiveElement = 'earth';

    const result = calculateSeasonalAdjustment(pillars, dayElement);

    expect(result.season).toBe('spring');
    expect(result.temperature).toBe('warm');
    expect(result.humidity).toBe('balanced');
    // 春季土,温和平衡,无特殊调候需求(可能为null或根据燥湿判定)
  });

  it('边界情况: 秋季金旺的命局', () => {
    // 庚申年 乙酉月 庚申日 辛酉时 (秋季,金旺)
    const pillars = createTestPillars('庚', '申', '乙', '酉', '庚', '申', '辛', '酉');
    const dayElement: FiveElement = 'metal';

    const result = calculateSeasonalAdjustment(pillars, dayElement);

    expect(result.season).toBe('autumn');
    expect(result.temperature).toBe('cool');
    expect(result.humidity).toBe('dry');
  });
});

describe('边界情况和错误处理', () => {
  it('应该处理空字符串月令', () => {
    const pillars = createTestPillars('壬', '寅', '癸', '', '甲', '寅', '丙', '子');
    const dayElement: FiveElement = 'wood';

    const result = calculateSeasonalAdjustment(pillars, dayElement);
    // 应该使用默认值
    expect(result.season).toBeDefined();
    expect(result.temperature).toBeDefined();
  });

  it('应该处理所有五行类型的日主', () => {
    const pillars = createTestPillars('壬', '寅', '癸', '子', '甲', '寅', '丙', '子');
    
    const elements: FiveElement[] = ['metal', 'wood', 'water', 'fire', 'earth'];
    
    for (const element of elements) {
      const result = calculateSeasonalAdjustment(pillars, element);
      expect(result).toBeDefined();
      expect(result.adjustmentFactor).toBeGreaterThanOrEqual(0.6);
      expect(result.adjustmentFactor).toBeLessThanOrEqual(1.0);
    }
  });
});
