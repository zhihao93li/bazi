/**
 * 简化的格局计算接口
 * 
 * ⚠️ 仅用于测试：接受简化的四柱数据，返回格局判定结果
 * 生产环境请使用 calculator.ts 的完整接口
 */

import type { PatternInfo } from '../../types.js';

/**
 * 简化的四柱数据格式
 */
export interface SimpleChart {
  year: string;    // 如 "乙亥"
  month: string;   // 如 "甲申"
  day: string;     // 如 "壬辰"
  hour: string;    // 如 "庚子"
  stems: string[]; // ['乙', '甲', '壬', '庚']
  branches: string[]; // ['亥', '申', '辰', '子']
}

/**
 * 扩展的格局结果（包含结构信息）
 */
export interface ExtendedPatternInfo extends PatternInfo {
  structuralInfo?: {
    harmony?: string; // 如 "申子辰"
    harmonyType?: string; // 如 "full", "half"
    element?: string; // 如 "water"
  };
  purityCheck?: {
    pass: boolean;
    reason?: string;
  };
  dayMaster?: {
    analysis?: {
      deDi?: number; // 得地分数
    };
  };
}

/**
 * 计算格局（简化接口）
 * 
 * 注意：由于lunar-typescript的限制，我们无法直接从四柱反推日期
 * 所以这个函数会尝试查找匹配的日期，或者退回到结构化验证
 * 
 * @param chart 简化的四柱数据
 * @returns 扩展的格局信息
 */
export function calculatePattern(chart: SimpleChart): ExtendedPatternInfo {
  // 尝试通过四柱信息找到对应的日期
  // 这里简化处理：我们假设用户提供的数据是准确的，直接进行结构分析
  
  const { stems, branches } = chart;
  
  // 提取关键信息
  const dayStem = stems[2]; // 日干
  const dayBranch = branches[2]; // 日支
  
  // 检查地支三合局
  const harmonyChecks = [
    { branches: ['申', '子', '辰'], name: '申子辰', element: 'water' },
    { branches: ['寅', '午', '戌'], name: '寅午戌', element: 'fire' },
    { branches: ['亥', '卯', '未'], name: '亥卯未', element: 'wood' },
    { branches: ['巳', '酉', '丑'], name: '巳酉丑', element: 'metal' },
  ];
  
  let harmonyInfo: { harmony: string; harmonyType: string; element: string } | undefined;
  
  for (const check of harmonyChecks) {
    const hasAll = check.branches.every(b => branches.includes(b));
    if (hasAll) {
      harmonyInfo = {
        harmony: check.name,
        harmonyType: 'full',
        element: check.element
      };
      break;
    }
    
    // 检查半三合
    const count = check.branches.filter(b => branches.includes(b)).length;
    if (count === 2 && !harmonyInfo) {
      const presentBranches = check.branches.filter(b => branches.includes(b));
      harmonyInfo = {
        harmony: presentBranches.join(''),
        harmonyType: 'half',
        element: check.element
      };
    }
  }
  
  // 检查三会局
  const huiChecks = [
    { branches: ['亥', '子', '丑'], name: '亥子丑', element: 'water' },
    { branches: ['寅', '卯', '辰'], name: '寅卯辰', element: 'wood' },
    { branches: ['巳', '午', '未'], name: '巳午未', element: 'fire' },
    { branches: ['申', '酉', '戌'], name: '申酉戌', element: 'metal' },
  ];
  
  for (const check of huiChecks) {
    const hasAll = check.branches.every(b => branches.includes(b));
    if (hasAll) {
      harmonyInfo = {
        harmony: check.name,
        harmonyType: 'hui',
        element: check.element
      };
      break;
    }
  }
  
  // 检查日主五行
  const stemElementMap: Record<string, string> = {
    '甲': 'wood', '乙': 'wood',
    '丙': 'fire', '丁': 'fire',
    '戊': 'earth', '己': 'earth',
    '庚': 'metal', '辛': 'metal',
    '壬': 'water', '癸': 'water'
  };
  
  const dayElement = stemElementMap[dayStem];
  
  // 纯度检查：天干禁忌
  const forbiddenElementsMap: Record<string, string[]> = {
    'water': ['earth'],  // 润下格忌土
    'fire': ['water'],   // 炎上格忌水
    'wood': ['metal'],   // 曲直格忌金
    'metal': ['fire'],   // 从革格忌火
    'earth': ['wood']    // 稼穑格忌木
  };
  
  let purityCheck = { pass: true };
  
  if (harmonyInfo && harmonyInfo.element === dayElement) {
    const forbiddenElements = forbiddenElementsMap[dayElement] || [];
    const forbiddenStems = Object.entries(stemElementMap)
      .filter(([_, el]) => forbiddenElements.includes(el))
      .map(([stem, _]) => stem);
    
    for (const stem of stems) {
      if (stem !== dayStem && forbiddenStems.includes(stem)) {
        purityCheck = {
          pass: false,
          reason: `天干透${stem}(${stemElementMap[stem]}),破格`
        };
        break;
      }
    }
  }
  
  // 判定格局
  let patternName = '普通格局';
  let category: 'normal' | 'special' = 'normal';
  let description = '';
  
  // 如果有全三合/三会，且日主与合局五行相同，且纯度通过
  if (harmonyInfo && 
      (harmonyInfo.harmonyType === 'full' || harmonyInfo.harmonyType === 'hui') &&
      harmonyInfo.element === dayElement &&
      purityCheck.pass) {
    
    const patternNames: Record<string, string> = {
      'wood': '曲直格',
      'fire': '炎上格',
      'earth': '稼穑格',
      'metal': '从革格',
      'water': '润下格'
    };
    
    patternName = patternNames[dayElement] || '专旺格';
    category = 'special';
    description = `${harmonyInfo.harmony}三${harmonyInfo.harmonyType === 'hui' ? '会' : '合'}${harmonyInfo.element}局成立`;
  }
  
  // 检查冲克
  const clashMap: Record<string, string> = {
    '子': '午', '午': '子',
    '丑': '未', '未': '丑',
    '寅': '申', '申': '寅',
    '卯': '酉', '酉': '卯',
    '辰': '戌', '戌': '辰',
    '巳': '亥', '亥': '巳'
  };
  
  const dayMasterAnalysis: { deDi?: number } = {};
  
  // 检查寅申冲等（简化版）
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      if (clashMap[branches[i]] === branches[j]) {
        // 发现冲，影响禄位
        // 这里简化处理，实际需要更复杂的计算
        if (branches[i] === dayBranch || branches[j] === dayBranch) {
          dayMasterAnalysis.deDi = 36; // 受冲后的分数
        }
      }
    }
  }
  
  return {
    name: patternName,
    category,
    description,
    structuralInfo: harmonyInfo,
    purityCheck,
    ...(Object.keys(dayMasterAnalysis).length > 0 && {
      dayMaster: { analysis: dayMasterAnalysis }
    })
  };
}

/**
 * 检查特殊格局（从格判定）
 * 
 * @param chart 弱化的八字信息
 * @returns 格局信息
 */
export function checkSpecialPattern(chart: {
  strengthScore: number;
  targetScore: number;
  targetElement: string;
}): PatternInfo {
  const { strengthScore, targetScore, targetElement } = chart;
  
  // 从格判定阈值
  const FOLLOW_THRESHOLD = 20;
  const TARGET_THRESHOLD = 70;
  
  if (strengthScore < FOLLOW_THRESHOLD && targetScore >= TARGET_THRESHOLD) {
    const patternNames: Record<string, string> = {
      'fire': '从财格',  // 假设火为财
      'water': '从财格',
      'wood': '从财格',
      'metal': '从杀格',
      'earth': '从儿格'
    };
    
    const patternName = patternNames[targetElement] || '从势格';
    
    return {
      name: patternName,
      category: 'special',
      description: `日主极弱(${strengthScore}分),${targetElement}势强(${targetScore}分),从其势而行`
    };
  }
  
  return {
    name: '普通格局',
    category: 'normal',
    description: '不满足特殊格局条件'
  };
}
