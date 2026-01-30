/**
 * 喜忌神计算优化逻辑单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  getPrimaryFavorableElements,
  getSecondaryFavorableElements,
  mergeFavorableElements,
  calculateFavorableElementsOptimized,
  generateFavorableDescription,
} from '../favorable-elements.js';
import type { DayMaster, SeasonalAdjustment, FiveElement } from '../types.js';

describe('getPrimaryFavorableElements', () => {
  it('冬季寒冷应极喜火,忌水', () => {
    const seasonalAdjustment: SeasonalAdjustment = {
      season: 'winter',
      temperature: 'cold',
      humidity: 'wet',
      urgentNeed: 'fire',
      urgentAvoid: 'water',
      adjustmentFactor: 0.7,
      hasAdjustmentElement: false,
      description: '冬季寒冻',
    };
    
    const result = getPrimaryFavorableElements(seasonalAdjustment);
    
    expect(result.favorable).toContain('fire');
    expect(result.favorable).toContain('wood'); // 木生火,次喜
    expect(result.unfavorable).toContain('water');
    expect(result.unfavorable).toContain('metal'); // 金生水,也忌
  });
  
  it('夏季炎热应极喜水,忌火', () => {
    const seasonalAdjustment: SeasonalAdjustment = {
      season: 'summer',
      temperature: 'hot',
      humidity: 'dry',
      urgentNeed: 'water',
      urgentAvoid: 'fire',
      adjustmentFactor: 0.7,
      hasAdjustmentElement: false,
      description: '夏季燥热',
    };
    
    const result = getPrimaryFavorableElements(seasonalAdjustment);
    
    expect(result.favorable).toContain('water');
    expect(result.favorable).toContain('metal'); // 金生水
    expect(result.unfavorable).toContain('fire');
    expect(result.unfavorable).toContain('wood'); // 木生火
  });
  
  it('无调候需求时应返回空列表', () => {
    const seasonalAdjustment: SeasonalAdjustment = {
      season: 'spring',
      temperature: 'warm',
      humidity: 'balanced',
      urgentNeed: null,
      urgentAvoid: null,
      adjustmentFactor: 1.0,
      hasAdjustmentElement: true,
      description: '春季适宜',
    };
    
    const result = getPrimaryFavorableElements(seasonalAdjustment);
    
    expect(result.favorable).toHaveLength(0);
    expect(result.unfavorable).toHaveLength(0);
  });
});

describe('getSecondaryFavorableElements', () => {
  it('身强应喜官杀食伤财,忌印比', () => {
    const dayMaster = createMockDayMaster('strong', 'wood');
    const distribution = createMockDistribution();
    
    const result = getSecondaryFavorableElements(dayMaster, distribution);
    
    // 甲木身强:喜金(官杀)、火(食伤)、土(财)
    expect(result.favorable).toContain('metal'); // 官杀
    expect(result.favorable).toContain('fire');  // 食伤
    expect(result.favorable).toContain('earth'); // 财
    
    // 忌水(印)、木(比)
    expect(result.unfavorable).toContain('water');
    expect(result.unfavorable).toContain('wood');
  });
  
  it('身弱应喜印比,忌官杀食伤财', () => {
    const dayMaster = createMockDayMaster('weak', 'wood');
    const distribution = createMockDistribution();
    
    const result = getSecondaryFavorableElements(dayMaster, distribution);
    
    // 甲木身弱:喜水(印)、木(比)
    expect(result.favorable).toContain('water');
    expect(result.favorable).toContain('wood');
    
    // 忌金(官杀)、火(食伤)、土(财)
    expect(result.unfavorable).toContain('metal');
    expect(result.unfavorable).toContain('fire');
    expect(result.unfavorable).toContain('earth');
  });
  
  it('中和应补弱抑强', () => {
    const dayMaster = createMockDayMaster('balanced', 'wood');
    const distribution: Record<FiveElement, number> = {
      wood: 30,
      fire: 40, // 最强
      earth: 10, // 最弱
      metal: 15,
      water: 5,  // 次弱
    };
    
    const result = getSecondaryFavorableElements(dayMaster, distribution);
    
    // 应喜最弱的两个
    expect(result.favorable).toContain('water');
    expect(result.favorable).toContain('earth');
    
    // 应忌最强的两个
    expect(result.unfavorable).toContain('fire');
    expect(result.unfavorable).toContain('wood');
  });
});

describe('mergeFavorableElements', () => {
  it('应正确合并无冲突的喜忌', () => {
    const primary = {
      favorable: ['fire' as FiveElement, 'wood' as FiveElement],
      unfavorable: ['water' as FiveElement, 'metal' as FiveElement],
    };
    const secondary = {
      favorable: ['earth' as FiveElement],
      unfavorable: [],
    };
    
    const result = mergeFavorableElements(primary, secondary);
    
    expect(result.favorable).toContain('fire');
    expect(result.favorable).toContain('wood');
    expect(result.favorable).toContain('earth');
    expect(result.unfavorable).toContain('water');
    expect(result.unfavorable).toContain('metal');
  });
  
  it('冲突时调候优先:主要喜神优先于次要忌神', () => {
    const primary = {
      favorable: ['fire' as FiveElement], // 调候喜火
      unfavorable: ['water' as FiveElement],
    };
    const secondary = {
      favorable: [],
      unfavorable: ['fire' as FiveElement], // 身强忌火(冲突!)
    };
    
    const result = mergeFavorableElements(primary, secondary);
    
    // 调候优先,火应该在喜神中
    expect(result.favorable).toContain('fire');
    expect(result.unfavorable).not.toContain('fire');
  });
  
  it('冲突时调候优先:主要忌神优先于次要喜神', () => {
    const primary = {
      favorable: ['fire' as FiveElement],
      unfavorable: ['water' as FiveElement], // 调候忌水
    };
    const secondary = {
      favorable: ['water' as FiveElement], // 身弱喜水(冲突!)
      unfavorable: [],
    };
    
    const result = mergeFavorableElements(primary, secondary);
    
    // 调候优先,水应该在忌神中
    expect(result.unfavorable).toContain('water');
    expect(result.favorable).not.toContain('water');
  });
});

describe('calculateFavorableElementsOptimized - 完整计算', () => {
  it('冬季甲木身强:调候为急,极喜火,次喜土', () => {
    const dayMaster = createMockDayMaster('strong', 'wood', {
      season: 'winter',
      temperature: 'cold',
      humidity: 'wet',
      urgentNeed: 'fire',
      urgentAvoid: 'water',
      adjustmentFactor: 0.7,
      hasAdjustmentElement: false,
      description: '冬季寒冻',
    });
    const distribution = createMockDistribution();
    
    const result = calculateFavorableElementsOptimized(dayMaster, distribution);
    
    // 应极喜火(调候第一)
    expect(result.favorable[0]).toBe('fire');
    
    // 应忌水(调候忌,同时身强也不需要印)
    expect(result.unfavorable).toContain('water');
    
    // 身强应喜土(财),且不与调候冲突
    expect(result.favorable).toContain('earth');
  });
  
  it('冬季甲木身弱:调候为急,火优先于水', () => {
    const dayMaster = createMockDayMaster('weak', 'wood', {
      season: 'winter',
      temperature: 'cold',
      humidity: 'wet',
      urgentNeed: 'fire',
      urgentAvoid: 'water',
      adjustmentFactor: 0.7,
      hasAdjustmentElement: false,
      description: '冬季寒冻',
    });
    const distribution = createMockDistribution();
    
    const result = calculateFavorableElementsOptimized(dayMaster, distribution);
    
    // 火(调候)应优先于水(身弱喜印)
    expect(result.favorable[0]).toBe('fire');
    
    // 水虽然是身弱喜印,但调候忌水,应该被过滤掉
    expect(result.favorable).not.toContain('water');
    expect(result.unfavorable).toContain('water');
  });
  
  it('夏季丙火身强:调候喜水,与身强泄耗需求一致', () => {
    const dayMaster = createMockDayMaster('strong', 'fire', {
      season: 'summer',
      temperature: 'hot',
      humidity: 'dry',
      urgentNeed: 'water',
      urgentAvoid: 'fire',
      adjustmentFactor: 0.7,
      hasAdjustmentElement: false,
      description: '夏季燥热',
    });
    const distribution = createMockDistribution();
    
    const result = calculateFavorableElementsOptimized(dayMaster, distribution);
    
    // 水(调候)和金(官杀,身强喜)应该都在喜神中
    expect(result.favorable).toContain('water');
    expect(result.favorable).toContain('metal');
    
    // 火既是调候忌,又是身强忌(比劫)
    expect(result.unfavorable).toContain('fire');
  });
  
  it('无调候需求时应退化为传统身强身弱理论', () => {
    const dayMaster = createMockDayMaster('strong', 'wood', null);
    const distribution = createMockDistribution();
    
    const result = calculateFavorableElementsOptimized(dayMaster, distribution);
    
    // 无调候,退化为传统理论:身强喜官杀食伤财
    expect(result.favorable).toContain('metal');
    expect(result.favorable).toContain('fire');
    expect(result.favorable).toContain('earth');
  });
});

describe('generateFavorableDescription', () => {
  it('应生成包含调候说明的描述', () => {
    const seasonalAdjustment: SeasonalAdjustment = {
      season: 'winter',
      temperature: 'cold',
      humidity: 'wet',
      urgentNeed: 'fire',
      urgentAvoid: 'water',
      adjustmentFactor: 0.7,
      hasAdjustmentElement: false,
      description: '冬季寒冻',
    };
    
    const result = generateFavorableDescription(
      ['fire', 'earth'],
      ['water', 'metal'],
      seasonalAdjustment
    );
    
    expect(result).toContain('调候为急');
    expect(result).toContain('极喜火');
    expect(result).toContain('喜用五行:火、土');
    expect(result).toContain('忌讳五行:水、金');
  });
  
  it('无调候时应只包含喜忌说明', () => {
    const result = generateFavorableDescription(
      ['fire', 'earth'],
      ['water', 'metal']
    );
    
    expect(result).not.toContain('调候');
    expect(result).toContain('喜用五行:火、土');
    expect(result).toContain('忌讳五行:水、金');
  });
});

// ============================================================================
// Mock 辅助函数
// ============================================================================

function createMockDayMaster(
  strength: 'strong' | 'weak' | 'balanced',
  element: FiveElement,
  seasonalAdjustment?: SeasonalAdjustment | null
): DayMaster {
  const stemMap: Record<FiveElement, string> = {
    wood: '甲',
    fire: '丙',
    earth: '戊',
    metal: '庚',
    water: '壬',
  };
  
  return {
    stem: {
      chinese: stemMap[element],
      element,
    },
    strength,
    characteristics: ['待分析'],
    analysis: seasonalAdjustment === null ? {
      deLing: 20,
      deLingDesc: '',
      deDi: 20,
      deDiDesc: '',
      tianGanHelp: 10,
      tianGanHelpDesc: '',
      totalScore: 50,
    } : {
      deLing: 20,
      deLingDesc: '',
      deDi: 20,
      deDiDesc: '',
      tianGanHelp: 10,
      tianGanHelpDesc: '',
      totalScore: 50,
      seasonalAdjustment: seasonalAdjustment,
    },
  };
}

function createMockDistribution(): Record<FiveElement, number> {
  return {
    wood: 30,
    fire: 20,
    earth: 20,
    metal: 15,
    water: 15,
  };
}
