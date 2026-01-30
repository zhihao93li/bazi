/**
 * 格局判定优化逻辑单元测试
 */

import { describe, it, expect } from 'vitest';
import { 
  checkTransparentStems, 
  determinePatternByTransparency,
  calculatePatternOptimized 
} from '../pattern-calculation.js';
import type { FourPillars, DayMaster, FiveElementsAnalysis, FiveElement } from '../types.js';

describe('checkTransparentStems', () => {
  it('应该正确识别透出的藏干', () => {
    const monthHiddenStems = [
      { chinese: '己', element: 'earth' as FiveElement },
      { chinese: '辛', element: 'metal' as FiveElement },
      { chinese: '癸', element: 'water' as FiveElement },
    ];
    const tianGan = ['壬', '癸', '乙'];
    
    const result = checkTransparentStems(monthHiddenStems, tianGan);
    
    expect(result).toHaveLength(1);
    expect(result[0].chinese).toBe('癸');
    expect(result[0].index).toBe(2); // 余气
  });
  
  it('当无藏干透出时应返回空数组', () => {
    const monthHiddenStems = [
      { chinese: '己', element: 'earth' as FiveElement },
      { chinese: '辛', element: 'metal' as FiveElement },
      { chinese: '癸', element: 'water' as FiveElement },
    ];
    const tianGan = ['壬', '丙', '乙'];
    
    const result = checkTransparentStems(monthHiddenStems, tianGan);
    
    expect(result).toHaveLength(0);
  });
  
  it('当多个藏干透出时应全部返回', () => {
    const monthHiddenStems = [
      { chinese: '己', element: 'earth' as FiveElement },
      { chinese: '辛', element: 'metal' as FiveElement },
      { chinese: '癸', element: 'water' as FiveElement },
    ];
    const tianGan = ['己', '癸', '辛'];
    
    const result = checkTransparentStems(monthHiddenStems, tianGan);
    
    expect(result).toHaveLength(3);
    expect(result.map(s => s.chinese)).toEqual(['己', '辛', '癸']);
    expect(result.map(s => s.index)).toEqual([0, 1, 2]);
  });
});

describe('determinePatternByTransparency', () => {
  it('癸透月干(丑月余气)应判定为杂气正印格', () => {
    const transparentStems = [
      { chinese: '癸', element: 'water' as FiveElement, index: 2 },
    ];
    const dayStem = { chinese: '甲', element: 'wood' as FiveElement };
    const monthBranch = '丑';
    
    const result = determinePatternByTransparency(transparentStems, dayStem, monthBranch);
    
    expect(result).not.toBeNull();
    expect(result?.name).toBe('杂气正印格');
    expect(result?.monthStemTenGod).toBe('正印');
    expect(result?.isTransparent).toBe(true);
  });
  
  it('本气透干应判定为正格(不加"杂气"前缀)', () => {
    const transparentStems = [
      { chinese: '己', element: 'earth' as FiveElement, index: 0 },
    ];
    const dayStem = { chinese: '甲', element: 'wood' as FiveElement };
    const monthBranch = '丑';
    
    const result = determinePatternByTransparency(transparentStems, dayStem, monthBranch);
    
    expect(result).not.toBeNull();
    expect(result?.name).toBe('正财格'); // 不是"杂气正财格"
    expect(result?.isTransparent).toBe(true);
  });
  
  it('非杂气月的中气透出不应加"杂气"前缀', () => {
    const transparentStems = [
      { chinese: '丁', element: 'fire' as FiveElement, index: 1 },
    ];
    const dayStem = { chinese: '庚', element: 'metal' as FiveElement };
    const monthBranch = '午';
    
    const result = determinePatternByTransparency(transparentStems, dayStem, monthBranch);
    
    expect(result).not.toBeNull();
    expect(result?.name).toBe('正官格'); // 不是"杂气正官格"
  });
  
  it('透出的全是比劫应返回null', () => {
    const transparentStems = [
      { chinese: '甲', element: 'wood' as FiveElement, index: 0 },
    ];
    const dayStem = { chinese: '甲', element: 'wood' as FiveElement };
    const monthBranch = '寅';
    
    const result = determinePatternByTransparency(transparentStems, dayStem, monthBranch);
    
    expect(result).toBeNull();
  });
  
  it('多个藏干透出应优先取本气', () => {
    const transparentStems = [
      { chinese: '癸', element: 'water' as FiveElement, index: 2 },
      { chinese: '己', element: 'earth' as FiveElement, index: 0 },
    ];
    const dayStem = { chinese: '甲', element: 'wood' as FiveElement };
    const monthBranch = '丑';
    
    const result = determinePatternByTransparency(transparentStems, dayStem, monthBranch);
    
    expect(result).not.toBeNull();
    // 应该优先取本气(己),而非余气(癸)
    expect(result?.monthStem).toBe('己');
    expect(result?.name).toBe('正财格');
  });
});

describe('calculatePatternOptimized - 完整格局判定', () => {
  it('建禄格判定:月支为日主之禄', () => {
    const fourPillars = createMockFourPillars({
      dayStem: '甲',
      monthBranch: '寅',
      monthHiddenStems: [
        { chinese: '甲', element: 'wood' },
        { chinese: '丙', element: 'fire' },
        { chinese: '戊', element: 'earth' },
      ],
    });
    const dayMaster = createMockDayMaster(50);
    const fiveElements = createMockFiveElements();
    
    const result = calculatePatternOptimized(fourPillars, dayMaster, fiveElements);
    
    expect(result.name).toBe('建禄格');
    expect(result.category).toBe('normal');
  });
  
  it('羊刃格判定:月支为日主之刃', () => {
    const fourPillars = createMockFourPillars({
      dayStem: '甲',
      monthBranch: '卯',
      monthHiddenStems: [
        { chinese: '乙', element: 'wood' },
      ],
    });
    const dayMaster = createMockDayMaster(60);
    const fiveElements = createMockFiveElements();
    
    const result = calculatePatternOptimized(fourPillars, dayMaster, fiveElements);
    
    expect(result.name).toBe('羊刃格');
    expect(result.category).toBe('normal');
  });
  
  it('透干优先:癸透月干应判定为杂气正印格', () => {
    const fourPillars = createMockFourPillars({
      dayStem: '甲',
      monthBranch: '丑',
      monthStem: '癸',
      monthHiddenStems: [
        { chinese: '己', element: 'earth' },
        { chinese: '辛', element: 'metal' },
        { chinese: '癸', element: 'water' },
      ],
    });
    const dayMaster = createMockDayMaster(45);
    const fiveElements = createMockFiveElements();
    
    const result = calculatePatternOptimized(fourPillars, dayMaster, fiveElements);
    
    expect(result.name).toBe('杂气正印格');
    expect(result.isTransparent).toBe(true);
    expect(result.monthStemTenGod).toBe('正印');
  });
  
  it('无透干:应按月令本气定格', () => {
    const fourPillars = createMockFourPillars({
      dayStem: '甲',
      monthBranch: '丑',
      monthStem: '丙', // 丙火不在丑的藏干中
      monthHiddenStems: [
        { chinese: '己', element: 'earth' },
        { chinese: '辛', element: 'metal' },
        { chinese: '癸', element: 'water' },
      ],
    });
    const dayMaster = createMockDayMaster(45);
    const fiveElements = createMockFiveElements();
    
    const result = calculatePatternOptimized(fourPillars, dayMaster, fiveElements);
    
    expect(result.name).toBe('正财格'); // 己土正财(本气)
    expect(result.isTransparent).toBe(false);
  });
  
  it('从财格判定:日主极弱且财星极旺', () => {
    const fourPillars = createMockFourPillars({
      dayStem: '甲',
      monthBranch: '戌',
      monthHiddenStems: [
        { chinese: '戊', element: 'earth' },
      ],
    });
    const dayMaster = createMockDayMaster(15); // 极弱
    const fiveElements = createMockFiveElements({
      distribution: { wood: 10, fire: 5, earth: 60, metal: 15, water: 10 },
    });
    
    const result = calculatePatternOptimized(fourPillars, dayMaster, fiveElements);
    
    expect(result.name).toBe('从财格');
    expect(result.category).toBe('special');
  });
  
  it('专旺格判定:日主极强', () => {
    const fourPillars = createMockFourPillars({
      dayStem: '甲',
      monthBranch: '寅',
      monthHiddenStems: [
        { chinese: '甲', element: 'wood' },
      ],
    });
    const dayMaster = createMockDayMaster(80); // 极强
    const fiveElements = createMockFiveElements({
      distribution: { wood: 70, fire: 10, earth: 5, metal: 5, water: 10 },
    });
    
    const result = calculatePatternOptimized(fourPillars, dayMaster, fiveElements);
    
    expect(result.name).toBe('曲直格');
    expect(result.category).toBe('special');
  });
});

// ============================================================================
// Mock 辅助函数
// ============================================================================

function createMockFourPillars(config: {
  dayStem: string;
  monthBranch: string;
  monthStem?: string;
  monthHiddenStems: Array<{ chinese: string; element: FiveElement }>;
}): FourPillars {
  return {
    year: {
      heavenlyStem: { chinese: '壬', element: 'water' as FiveElement },
      earthlyBranch: { chinese: '子', element: 'water' as FiveElement },
      pillar: '壬子',
      hiddenStems: [],
      nayin: '',
    },
    month: {
      heavenlyStem: { chinese: config.monthStem || '癸', element: 'water' as FiveElement },
      earthlyBranch: { chinese: config.monthBranch, element: 'earth' as FiveElement },
      pillar: `${config.monthStem || '癸'}${config.monthBranch}`,
      hiddenStems: config.monthHiddenStems,
      nayin: '',
    },
    day: {
      heavenlyStem: { chinese: config.dayStem, element: 'wood' as FiveElement },
      earthlyBranch: { chinese: '寅', element: 'wood' as FiveElement },
      pillar: `${config.dayStem}寅`,
      hiddenStems: [],
      nayin: '',
    },
    hour: {
      heavenlyStem: { chinese: '乙', element: 'wood' as FiveElement },
      earthlyBranch: { chinese: '卯', element: 'wood' as FiveElement },
      pillar: '乙卯',
      hiddenStems: [],
      nayin: '',
    },
  } as any;
}

function createMockDayMaster(totalScore: number): DayMaster {
  return {
    stem: { chinese: '甲', element: 'wood' as FiveElement },
    strength: totalScore >= 55 ? 'strong' : totalScore <= 30 ? 'weak' : 'balanced',
    analysis: {
      deLing: 20,
      deLingDesc: '',
      deDi: 20,
      deDiDesc: '',
      tianGanHelp: 10,
      tianGanHelpDesc: '',
      totalScore,
    },
  };
}

function createMockFiveElements(config?: {
  distribution?: Record<FiveElement, number>;
}): FiveElementsAnalysis {
  const defaultDist = {
    wood: 30,
    fire: 20,
    earth: 20,
    metal: 15,
    water: 15,
  };
  
  const distribution = config?.distribution || defaultDist;
  
  return {
    distribution,
    counts: { wood: 3, fire: 2, earth: 2, metal: 1, water: 2 },
    strongest: 'wood' as FiveElement,
    weakest: 'metal' as FiveElement,
    favorable: ['fire', 'earth'],
    unfavorable: ['metal', 'water'],
  };
}
