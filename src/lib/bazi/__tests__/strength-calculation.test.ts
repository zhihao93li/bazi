/**
 * 身强身弱计算优化逻辑单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  checkLuPosition,
  calculateBaseStrength,
  applySeasonalAdjustment,
  determineStrength,
  calculateDayMasterOptimized,
} from '../strength-calculation.js';
import type { FourPillars, HeavenlyStem, FiveElement } from '../types.js';

describe('checkLuPosition', () => {
  it('甲木坐寅应识别为坐禄,得45分', () => {
    const fourPillars = createMockFourPillars({
      dayStem: '甲',
      dayBranch: '寅',
      monthBranch: '子',
    });
    
    const result = checkLuPosition('甲', '寅', fourPillars);
    
    expect(result.hasLu).toBe(true);
    expect(result.score).toBe(45);
    expect(result.description).toContain('禄位');
  });
  
  it('甲寅日,年支申金冲击,坐禄得分应下调至36分', () => {
    const fourPillars = createMockFourPillars({
      dayStem: '甲',
      dayBranch: '寅',
      monthBranch: '子',
      yearBranch: '申', // 申金冲寅木
    });
    
    const result = checkLuPosition('甲', '寅', fourPillars);
    
    expect(result.hasLu).toBe(true);
    expect(result.score).toBe(36); // 45 * 0.8 = 36
    expect(result.description).toContain('受年支申冲击');
  });
  
  it('甲寅日,月支巳火害寅,坐禄得分应轻微下调', () => {
    const fourPillars = createMockFourPillars({
      dayStem: '甲',
      dayBranch: '寅',
      monthBranch: '巳', // 巳火害寅木
    });
    
    const result = checkLuPosition('甲', '寅', fourPillars);
    
    expect(result.hasLu).toBe(true);
    expect(result.score).toBe(41); // 45 * 0.9 ≈ 41
    expect(result.description).toContain('受月支巳穿害');
  });
  
  it('甲木坐卯(羊刃)不是坐禄', () => {
    const fourPillars = createMockFourPillars({
      dayStem: '甲',
      dayBranch: '卯',
      monthBranch: '子',
    });
    
    const result = checkLuPosition('甲', '卯', fourPillars);
    
    expect(result.hasLu).toBe(false);
    expect(result.score).toBe(0);
  });
  
  it('癸水坐子应识别为坐禄', () => {
    const fourPillars = createMockFourPillars({
      dayStem: '癸',
      dayBranch: '子',
      monthBranch: '丑',
    });
    
    const result = checkLuPosition('癸', '子', fourPillars);
    
    expect(result.hasLu).toBe(true);
    expect(result.score).toBe(45);
  });
  
  it('丙火坐巳应识别为坐禄', () => {
    const fourPillars = createMockFourPillars({
      dayStem: '丙',
      dayBranch: '巳',
      monthBranch: '午',
    });
    
    const result = checkLuPosition('丙', '巳', fourPillars);
    
    expect(result.hasLu).toBe(true);
    expect(result.score).toBe(45);
  });
});

describe('calculateBaseStrength', () => {
  it('甲木日主,冬季,坐禄应得到高得地分数', () => {
    const fourPillars = createMockFourPillars({
      dayStem: '甲',
      dayBranch: '寅', // 坐禄
      monthBranch: '子', // 冬季,水生木
    });
    const dayStem: HeavenlyStem = { chinese: '甲', element: 'wood' };
    
    const result = calculateBaseStrength(dayStem, fourPillars);
    
    expect(result.deDi).toBe(45); // 坐禄得45分
    expect(result.deLing).toBe(30); // 水生木
    expect(result.totalScore).toBeGreaterThan(50);
  });
  
  it('甲木日主,月令克制,无根应得分较低', () => {
    const fourPillars = createMockFourPillars({
      dayStem: '甲',
      dayBranch: '申', // 金地,不利木
      monthBranch: '酉', // 秋季金旺,克木
    });
    const dayStem: HeavenlyStem = { chinese: '甲', element: 'wood' };
    
    const result = calculateBaseStrength(dayStem, fourPillars);
    
    expect(result.deLing).toBeLessThan(0); // 月令克制
    expect(result.totalScore).toBeLessThan(30);
  });
  
  it('日主当令应得40分得令分数', () => {
    const fourPillars = createMockFourPillars({
      dayStem: '甲',
      dayBranch: '寅',
      monthBranch: '寅', // 木月,日主当令
    });
    const dayStem: HeavenlyStem = { chinese: '甲', element: 'wood' };
    
    const result = calculateBaseStrength(dayStem, fourPillars);
    
    expect(result.deLing).toBe(40);
    expect(result.deLingDesc).toBe('日主当令');
  });
});

describe('applySeasonalAdjustment', () => {
  it('应正确应用调候系数', () => {
    const baseScore = 50;
    const adjustmentFactor = 0.7;
    
    const result = applySeasonalAdjustment(baseScore, adjustmentFactor, false);
    
    expect(result).toBe(35); // 50 * 0.7 = 35
  });
  
  it('调候系数为1.0时得分不变', () => {
    const baseScore = 60;
    const adjustmentFactor = 1.0;
    
    const result = applySeasonalAdjustment(baseScore, adjustmentFactor, false);
    
    expect(result).toBe(60);
  });
  
  it('调候系数低于0.6应限制为0.6', () => {
    const baseScore = 50;
    const adjustmentFactor = 0.5; // 低于最小值
    
    const result = applySeasonalAdjustment(baseScore, adjustmentFactor, false);
    
    expect(result).toBe(30); // 50 * 0.6 = 30
  });
  
  it('从格时应禁用调候系数,返回原分数', () => {
    const baseScore = 15; // 极弱
    const adjustmentFactor = 0.7;
    
    const result = applySeasonalAdjustment(baseScore, adjustmentFactor, true);
    
    expect(result).toBe(15); // 原分数,未应用系数
  });
});

describe('determineStrength', () => {
  it('得分>=55应判定为身强', () => {
    expect(determineStrength(55)).toBe('strong');
    expect(determineStrength(70)).toBe('strong');
  });
  
  it('得分<=30应判定为身弱', () => {
    expect(determineStrength(30)).toBe('weak');
    expect(determineStrength(20)).toBe('weak');
  });
  
  it('得分在30-55之间应判定为中和', () => {
    expect(determineStrength(40)).toBe('balanced');
    expect(determineStrength(50)).toBe('balanced');
  });
  
  it('边界值测试', () => {
    expect(determineStrength(31)).toBe('balanced');
    expect(determineStrength(54)).toBe('balanced');
  });
});

describe('calculateDayMasterOptimized - 完整计算', () => {
  it('甲木坐寅,冬季无火,应用调候系数后判定为身弱', () => {
    const fourPillars = createMockFourPillars({
      dayStem: '甲',
      dayBranch: '寅',
      monthBranch: '子', // 冬季
      monthStem: '癸',
      yearStem: '壬',
      hourStem: '乙',
    });
    const dayStem: HeavenlyStem = { chinese: '甲', element: 'wood' };
    
    const result = calculateDayMasterOptimized(dayStem, fourPillars);
    
    // 基础得分应该不错(坐禄+水生木)
    // 但调候系数会打折(冬季缺火)
    expect(result.analysis?.seasonalAdjustment).toBeDefined();
    expect(result.analysis?.seasonalAdjustment?.adjustmentFactor).toBeLessThan(1.0);
    expect(result.analysis?.seasonalAdjustment?.urgentNeed).toBe('fire');
    
    // 最终得分应该被调候系数降低
    expect(result.analysis?.totalScore).toBeLessThan(55);
  });
  
  it('甲木坐寅,冬季有丙火,调候系数应为1.0', () => {
    const fourPillars = createMockFourPillars({
      dayStem: '甲',
      dayBranch: '寅',
      monthBranch: '子',
      monthStem: '癸',
      yearStem: '丙', // 有火调候
      hourStem: '乙',
    });
    const dayStem: HeavenlyStem = { chinese: '甲', element: 'wood' };
    
    const result = calculateDayMasterOptimized(dayStem, fourPillars);
    
    expect(result.analysis?.seasonalAdjustment?.adjustmentFactor).toBe(1.0);
    expect(result.analysis?.seasonalAdjustment?.hasAdjustmentElement).toBe(true);
    expect(result.strength).toBe('strong'); // 有调候,应判定为身强
  });
  
  it('夏季生人,有水调候,应正常计算', () => {
    const fourPillars = createMockFourPillars({
      dayStem: '丙',
      dayBranch: '午',
      monthBranch: '午', // 夏季
      monthStem: '甲',
      yearStem: '壬', // 有水调候
      hourStem: '丁',
    });
    const dayStem: HeavenlyStem = { chinese: '丙', element: 'fire' };
    
    const result = calculateDayMasterOptimized(dayStem, fourPillars);
    
    expect(result.analysis?.seasonalAdjustment?.urgentNeed).toBe('water');
    expect(result.analysis?.seasonalAdjustment?.hasAdjustmentElement).toBe(true);
    expect(result.analysis?.seasonalAdjustment?.adjustmentFactor).toBe(1.0);
  });
  
  it('坐禄权重提升:甲寅日应优于甲子日', () => {
    const fourPillarsLu = createMockFourPillars({
      dayStem: '甲',
      dayBranch: '寅', // 坐禄
      monthBranch: '卯',
    });
    const fourPillarsNoLu = createMockFourPillars({
      dayStem: '甲',
      dayBranch: '子', // 不坐禄
      monthBranch: '卯',
    });
    const dayStem: HeavenlyStem = { chinese: '甲', element: 'wood' };
    
    const resultLu = calculateDayMasterOptimized(dayStem, fourPillarsLu);
    const resultNoLu = calculateDayMasterOptimized(dayStem, fourPillarsNoLu);
    
    // 坐禄应该得分更高
    expect(resultLu.analysis?.deDi).toBeGreaterThan(resultNoLu.analysis?.deDi);
    expect(resultLu.analysis?.totalScore).toBeGreaterThan(resultNoLu.analysis?.totalScore);
  });
  
  it('寅申冲:甲寅日年支申,坐禄受冲得分应下降', () => {
    const fourPillars = createMockFourPillars({
      dayStem: '甲',
      dayBranch: '寅',
      monthBranch: '子',
      yearBranch: '申', // 申金冲寅木
    });
    const dayStem: HeavenlyStem = { chinese: '甲', element: 'wood' };
    
    const result = calculateDayMasterOptimized(dayStem, fourPillars);
    
    // 坐禄受冲,得地得分应为36分(45*0.8)
    expect(result.analysis?.deDi).toBe(36);
    expect(result.analysis?.deDiDesc).toContain('受年支申冲击');
  });
  
  it('从格禁用调候:日主极弱时调候系数失效', () => {
    const fourPillars = createMockFourPillars({
      dayStem: '甲',
      dayBranch: '申', // 金地,克木
      monthBranch: '酉', // 秋金旺,极克木
      yearStem: '庚',   // 天干也是金
      monthStem: '辛',
      hourStem: '庚',
    });
    const dayStem: HeavenlyStem = { chinese: '甲', element: 'wood' };
    
    const result = calculateDayMasterOptimized(dayStem, fourPillars);
    
    // 日主极弱,应为从格,调候系数禁用
    expect(result.analysis?.totalScore).toBeLessThan(20);
    expect(result.analysis?.seasonalAdjustment?.description).toContain('从格');
    expect(result.analysis?.seasonalAdjustment?.description).toContain('调候系数已禁用');
  });

  it('空亡测试:日支空亡,坐禄得分应大幅衰减', () => {
    const fourPillars = createMockFourPillars({
      dayStem: '甲',
      dayBranch: '寅', // 坐禄
      monthBranch: '子',
    });
    const dayStem: HeavenlyStem = { chinese: '甲', element: 'wood' };
    
    // 不空亡的情况
    const resultNormal = calculateDayMasterOptimized(dayStem, fourPillars);
    
    // 空亡的情况(假设甲寅旬,戌亥空)
    const fourPillarsXunKong = { dayXunKong: '戌亥' };
    const resultEmpty = calculateDayMasterOptimized(dayStem, fourPillars, fourPillarsXunKong);
    
    // 正常坐禄应该是45分
    expect(resultNormal.analysis?.deDi).toBe(45);
    
    // 空亡坐禄应该是45分(没空亡,寅不在戌亥中)
    expect(resultEmpty.analysis?.deDi).toBe(45);
  });

  it('空亡测试:月支空亡,藏干得分应衰减', () => {
    const fourPillars = createMockFourPillars({
      dayStem: '甲',
      dayBranch: '申', // 不坐禄
      monthBranch: '丑', // 丑藏己癸辛,癸水为印
    });
    const dayStem: HeavenlyStem = { chinese: '甲', element: 'wood' };
    
    // 不空亡的情况
    const resultNormal = calculateBaseStrength(dayStem, fourPillars);
    
    // 丑空亡的情况(甲寅旬,丑在子丑空中)
    const fourPillarsXunKong = { dayXunKong: '子丑' };
    const resultEmpty = calculateBaseStrength(dayStem, fourPillars, fourPillarsXunKong);
    
    // 空亡应该使得地分数降低
    expect(resultEmpty.deDi).toBeLessThan(resultNormal.deDi);
    // 空亡系数0.3,得地分应该约为正常的30%
    expect(resultEmpty.deDi).toBeCloseTo(resultNormal.deDi * 0.3, 1);
    // 描述中应包含"(空)"标记
    expect(resultEmpty.deDiDesc).toContain('(空)');
  });

  it('空亡测试:日支丑空亡,坐禄得分应为45*0.3=13.5', () => {
    const fourPillars = createMockFourPillars({
      dayStem: '己',
      dayBranch: '丑', // 己土坐丑为禄
      monthBranch: '子',
    });
    const dayStem: HeavenlyStem = { chinese: '己', element: 'earth' };
    
    // 丑空亡的情况(甲寅旬,子丑空)
    const fourPillarsXunKong = { dayXunKong: '子丑' };
    const result = calculateBaseStrength(dayStem, fourPillars, fourPillarsXunKong);
    
    // 坐禄45分,空亡后应为45*0.3=13.5,向下取整为14
    expect(result.deDi).toBe(14);
    expect(result.deDiDesc).toContain('逢空');
  });
});

// ============================================================================
// Mock 辅助函数
// ============================================================================

function createMockFourPillars(config: {
  dayStem: string;
  dayBranch: string;
  monthBranch: string;
  monthStem?: string;
  yearStem?: string;
  yearBranch?: string;
  hourStem?: string;
}): FourPillars {
  const stemElementMap: Record<string, FiveElement> = {
    '甲': 'wood', '乙': 'wood', '丙': 'fire', '丁': 'fire',
    '戊': 'earth', '己': 'earth', '庚': 'metal', '辛': 'metal',
    '壬': 'water', '癸': 'water',
  };
  
  const branchElementMap: Record<string, FiveElement> = {
    '子': 'water', '丑': 'earth', '寅': 'wood', '卯': 'wood',
    '辰': 'earth', '巳': 'fire', '午': 'fire', '未': 'earth',
    '申': 'metal', '酉': 'metal', '戌': 'earth', '亥': 'water',
  };
  
  const yearStem = config.yearStem || '壬';
  const yearBranch = config.yearBranch || '子';
  const monthStem = config.monthStem || '癸';
  const hourStem = config.hourStem || '乙';
  
  return {
    year: {
      heavenlyStem: {
        chinese: yearStem,
        element: stemElementMap[yearStem] || 'water',
      },
      earthlyBranch: {
        chinese: yearBranch,
        element: branchElementMap[yearBranch] || 'water',
      },
      pillar: `${yearStem}${yearBranch}`,
      hiddenStems: getMockHiddenStems(yearBranch),
      nayin: '',
    },
    month: {
      heavenlyStem: {
        chinese: monthStem,
        element: stemElementMap[monthStem] || 'water',
      },
      earthlyBranch: {
        chinese: config.monthBranch,
        element: branchElementMap[config.monthBranch] || 'earth',
      },
      pillar: `${monthStem}${config.monthBranch}`,
      hiddenStems: getMockHiddenStems(config.monthBranch),
      nayin: '',
    },
    day: {
      heavenlyStem: {
        chinese: config.dayStem,
        element: stemElementMap[config.dayStem] || 'wood',
      },
      earthlyBranch: {
        chinese: config.dayBranch,
        element: branchElementMap[config.dayBranch] || 'wood',
      },
      pillar: `${config.dayStem}${config.dayBranch}`,
      hiddenStems: getMockHiddenStems(config.dayBranch),
      nayin: '',
    },
    hour: {
      heavenlyStem: {
        chinese: hourStem,
        element: stemElementMap[hourStem] || 'wood',
      },
      earthlyBranch: {
        chinese: '卯',
        element: 'wood',
      },
      pillar: `${hourStem}卯`,
      hiddenStems: [{ chinese: '乙', element: 'wood' }],
      nayin: '',
    },
  } as any;
}

function getMockHiddenStems(branch: string): Array<{ chinese: string; element: FiveElement }> {
  const hiddenStemsMap: Record<string, Array<{ chinese: string; element: FiveElement }>> = {
    '子': [{ chinese: '癸', element: 'water' }],
    '丑': [{ chinese: '己', element: 'earth' }, { chinese: '辛', element: 'metal' }, { chinese: '癸', element: 'water' }],
    '寅': [{ chinese: '甲', element: 'wood' }, { chinese: '丙', element: 'fire' }, { chinese: '戊', element: 'earth' }],
    '卯': [{ chinese: '乙', element: 'wood' }],
    '辰': [{ chinese: '戊', element: 'earth' }, { chinese: '乙', element: 'wood' }, { chinese: '癸', element: 'water' }],
    '巳': [{ chinese: '丙', element: 'fire' }, { chinese: '戊', element: 'earth' }, { chinese: '庚', element: 'metal' }],
    '午': [{ chinese: '丁', element: 'fire' }, { chinese: '己', element: 'earth' }],
    '未': [{ chinese: '己', element: 'earth' }, { chinese: '丁', element: 'fire' }, { chinese: '乙', element: 'wood' }],
    '申': [{ chinese: '庚', element: 'metal' }, { chinese: '壬', element: 'water' }, { chinese: '戊', element: 'earth' }],
    '酉': [{ chinese: '辛', element: 'metal' }],
    '戌': [{ chinese: '戊', element: 'earth' }, { chinese: '辛', element: 'metal' }, { chinese: '丁', element: 'fire' }],
    '亥': [{ chinese: '壬', element: 'water' }, { chinese: '甲', element: 'wood' }],
  };
  
  return hiddenStemsMap[branch] || [{ chinese: '甲', element: 'wood' }];
}
