/**
 * 格局判定优化模块
 * 
 * 实现"透干优先"原则:
 * 1. 优先检查月令藏干中哪个透到天干
 * 2. 透干者优先定格,未透干则按本气定格
 * 3. 杂气月(辰戌丑未)的透干应标注为"杂气X格"
 */

import type { 
  FourPillars, 
  PatternInfo, 
  DayMaster,
  FiveElementsAnalysis,
  FiveElement,
  PatternCategory,
  NormalPattern,
  SpecialPattern
} from './types.js';
import { FIVE_ELEMENTS, LU_MAP, REN_MAP } from './constants.js';
import { getTenGod } from './calculator.js';
import { 
  StructuralAnalyzer, 
  ScoreRecalculator,
  type DetectionContext 
} from './detector/index.js';
import { checkProsperityPattern } from './prosperity-pattern.js';
import { checkHuaQiPattern } from './transformation-pattern.js';
import { checkCongPattern } from './follow-pattern.js';

// 杂气月(库墓月)
const MIXED_QI_BRANCHES = ['辰', '戌', '丑', '未'];

/**
 * 检查月令藏干的透干情况
 * 
 * @param monthHiddenStems 月令藏干列表
 * @param tianGan 年干、月干、时干(不含日干)
 * @returns 透出的藏干列表(按本气→中气→余气顺序)
 */
export function checkTransparentStems(
  monthHiddenStems: Array<{ chinese: string; element: FiveElement }>,
  tianGan: string[]
): Array<{ chinese: string; element: FiveElement; index: number }> {
  const transparentStems: Array<{ chinese: string; element: FiveElement; index: number }> = [];
  
  // 遍历藏干,检查是否透到天干
  for (let i = 0; i < monthHiddenStems.length; i++) {
    const hiddenStem = monthHiddenStems[i];
    if (tianGan.includes(hiddenStem.chinese)) {
      transparentStems.push({
        chinese: hiddenStem.chinese,
        element: hiddenStem.element,
        index: i, // 0=本气, 1=中气, 2=余气
      });
    }
  }
  
  return transparentStems;
}

/**
 * 根据透干情况判定格局
 * 
 * @param transparentStems 透出的藏干列表
 * @param dayStem 日主天干
 * @param monthBranch 月令地支
 * @returns 格局信息,如果无法根据透干定格则返回null
 */
export function determinePatternByTransparency(
  transparentStems: Array<{ chinese: string; element: FiveElement; index: number }>,
  dayStem: { chinese: string; element: FiveElement },
  monthBranch: string
): PatternInfo | null {
  if (transparentStems.length === 0) {
    return null; // 无透干,返回null由调用方处理
  }
  
  // 按权重排序(本气>中气>余气)
  const sortedStems = [...transparentStems].sort((a, b) => a.index - b.index);
  
  // 遍历透出的藏干,找第一个非比劫的十神
  for (const transparentStem of sortedStems) {
    const hiddenStem = {
      chinese: transparentStem.chinese,
      element: transparentStem.element,
    };
    const tenGod = getTenGod(dayStem, hiddenStem);
    
    // 比肩、劫财不成格,继续看下一个
    if (tenGod === '比肩' || tenGod === '劫财') {
      continue;
    }
    
    // 判断是否为杂气格
    const isMixedQi = MIXED_QI_BRANCHES.includes(monthBranch);
    const isNotMainQi = transparentStem.index > 0; // 非本气透干
    
    // 根据十神确定格局名称
    const patternMap: Record<string, { name: string; desc: string }> = {
      '正官': { name: '正官格', desc: '月令透正官,主贵气端正,宜见财印相生' },
      '七杀': { name: '七杀格', desc: '月令透七杀,主威严果决,宜见食伤制杀或印化杀' },
      '正财': { name: '正财格', desc: '月令透正财,主务实勤俭,宜见官杀护财' },
      '偏财': { name: '偏财格', desc: '月令透偏财,主豪爽大方,宜见官杀护财' },
      '正印': { name: '正印格', desc: '月令透正印,主聪慧仁厚,宜见官杀生印' },
      '偏印': { name: '偏印格', desc: '月令透偏印,主机敏多思,宜见财星制印' },
      '食神': { name: '食神格', desc: '月令透食神,主温和福厚,宜见财星泄秀' },
      '伤官': { name: '伤官格', desc: '月令透伤官,主聪明傲气,宜见财星或印星' },
    };
    
    if (tenGod && patternMap[tenGod]) {
      // 如果是杂气月且非本气透干,标注为"杂气X格"
      let patternName = patternMap[tenGod].name;
      if (isMixedQi && isNotMainQi) {
        patternName = `杂气${patternMap[tenGod].name}`;
      }
      
      return {
        name: patternName,
        category: 'normal',
        description: patternMap[tenGod].desc,
        monthStem: transparentStem.chinese,
        monthStemTenGod: tenGod,
        isTransparent: true,
        transparentStems: transparentStems.map(s => s.chinese),
        transparentTenGods: transparentStems.map(s => {
          const tg = getTenGod(dayStem, { chinese: s.chinese, element: s.element });
          return tg || '';
        }),
      };
    }
  }
  
  return null; // 所有透干都是比劫,无法定格
}

/**
 * 判定格局(优化版 - 采用管道模式)
 * 
 * 【修正4】管道模式流程:
 * Structure → Score → Purity → Threshold
 * 
 * 决策树优先级:
 * 1. 化气格(最高优先级) → 天干五合
 * 2. 专旺格 → 三合局 + 合化重算 + 一票否决
 * 3. 禄刃格 → 月支直接判定
 * 4. 从弱格 → 日主<20 + 目标五行旺
 * 5. 普通八格 → 透干优先
 * 6. 杂格(兜底)
 * 
 * @param fourPillars 四柱数据
 * @param dayMaster 日主分析
 * @param fiveElements 五行分析
 * @param xunKong 旬空信息(可选,如"戌亥")
 * @returns 格局信息
 */
export function calculatePatternOptimized(
  fourPillars: FourPillars,
  dayMaster: DayMaster,
  fiveElements: FiveElementsAnalysis,
  xunKong?: string
): PatternInfo {
  const dayStem = fourPillars.day.heavenlyStem;
  const monthBranch = fourPillars.month.earthlyBranch;
  const monthHiddenStems = fourPillars.month.hiddenStems;
  
  // ========================================
  // 第一层: 化气格判定(最高优先级)
  // ========================================
  const huaQiPattern = checkHuaQiPattern(fourPillars, dayMaster);
  if (huaQiPattern) {
    return huaQiPattern;
  }
  
  // ========================================
  // 第二层: 专旺格判定(管道模式)
  // ========================================
  
  // 创建检测上下文
  const structuralAnalyzer = new StructuralAnalyzer();
  const scoreRecalculator = new ScoreRecalculator();
  
  // 构建检测上下文
  const ctx: DetectionContext = {
    fourPillars,
    dayMaster,
    fiveElements,
    xunKong: xunKong || '',
    harmony: { type: 'none', branches: [], name: '', conversionRate: 0 },
  };
  
  // 【管道阶段1】结构层: 检测三合局/三会局
  const harmony = structuralAnalyzer.analyze(ctx);
  ctx.harmony = harmony;
  
  // 【管道阶段2】算分层: 合化重算
  const recalculatedDistribution = scoreRecalculator.recalculate(ctx);
  
  // 【管道阶段3+4】纯度层+阈值层: 专旺格判定(内含一票否决)
  const prosperityPattern = checkProsperityPattern(
    dayStem,
    fourPillars,
    harmony,
    recalculatedDistribution
  );
  if (prosperityPattern) {
    return prosperityPattern;
  }
  
  // ========================================
  // 第三层: 禄刃格判定
  // ========================================
  if (monthBranch.chinese === LU_MAP[dayStem.chinese]) {
    return {
      name: '建禄格',
      category: 'normal',
      description: '月支为日主之禄,主身旺有根,宜见财官食伤',
      monthStem: monthHiddenStems[0]?.chinese,
      isTransparent: false,
    };
  }
  
  if (monthBranch.chinese === REN_MAP[dayStem.chinese]) {
    return {
      name: '羊刃格',
      category: 'normal',
      description: '月支为日主之刃,主身强刚烈,宜见官杀制刃',
      monthStem: monthHiddenStems[0]?.chinese,
      isTransparent: false,
    };
  }
  
  // ========================================
  // 第四层: 从格判定
  // ========================================
  const congPattern = checkCongPattern(
    fourPillars,
    dayMaster,
    fiveElements.distribution,
    (dayStemChinese, targetStemChinese) => {
      // 传入getTenGod函数的wrapper
      const dayStemObj = { chinese: dayStemChinese, element: dayStem.element };
      const targetStemObj = getStemByName(targetStemChinese);
      if (!targetStemObj) return null;
      return getTenGod(dayStemObj, targetStemObj);
    }
  );
  if (congPattern) {
    return congPattern;
  }
  
  // ========================================
  // 第五层: 普通八格(透干优先)
  // ========================================
  const tianGan = [
    fourPillars.year.heavenlyStem.chinese,
    fourPillars.month.heavenlyStem.chinese,
    fourPillars.hour.heavenlyStem.chinese,
  ];
  
  // 检查透干情况
  const transparentStems = checkTransparentStems(monthHiddenStems, tianGan);
  const patternByTransparency = determinePatternByTransparency(
    transparentStems,
    dayStem,
    monthBranch.chinese
  );
  
  if (patternByTransparency) {
    return patternByTransparency;
  }
  
  // 无透干或透干全是比劫,按月令藏干遍历
  if (monthHiddenStems.length > 0) {
    for (let i = 0; i < monthHiddenStems.length; i++) {
      const hiddenStem = monthHiddenStems[i];
      const tenGod = getTenGod(dayStem, hiddenStem);
      
      if (tenGod === '比肩' || tenGod === '劫财') {
        continue;
      }
      
      const patternMap: Record<string, { name: string; desc: string }> = {
        '正官': { name: '正官格', desc: '月令透正官,主贵气端正,宜见财印相生' },
        '七杀': { name: '七杀格', desc: '月令透七杀,主威严果决,宜见食伤制杀或印化杀' },
        '正财': { name: '正财格', desc: '月令透正财,主务实勤俭,宜见官杀护财' },
        '偏财': { name: '偏财格', desc: '月令透偏财,主豪爽大方,宜见官杀护财' },
        '正印': { name: '正印格', desc: '月令透正印,主聪慧仁厚,宜见官杀生印' },
        '偏印': { name: '偏印格', desc: '月令透偏印,主机敏多思,宜见财星制印' },
        '食神': { name: '食神格', desc: '月令透食神,主温和福厚,宜见财星泄秀' },
        '伤官': { name: '伤官格', desc: '月令透伤官,主聪明傲气,宜见财星或印星' },
      };
      
      if (tenGod && patternMap[tenGod]) {
        return {
          name: patternMap[tenGod].name,
          category: 'normal',
          description: patternMap[tenGod].desc,
          monthStem: hiddenStem.chinese,
          monthStemTenGod: tenGod,
          isTransparent: false,
        };
      }
    }
  }
  
  // ========================================
  // 第六层: 杂格(兜底)
  // ========================================
  return {
    name: '杂格',
    category: 'normal',
    description: '月令无明显成格条件,需综合分析八字整体格局',
  };
}

/**
 * 根据天干名称获取天干对象
 * @param stemChinese 天干中文名
 * @returns 天干对象
 */
function getStemByName(stemChinese: string): { chinese: string; element: FiveElement } | null {
  const elementMap: Record<string, FiveElement> = {
    '甲': 'wood', '乙': 'wood',
    '丙': 'fire', '丁': 'fire',
    '戊': 'earth', '己': 'earth',
    '庚': 'metal', '辛': 'metal',
    '壬': 'water', '癸': 'water',
  };
  const element = elementMap[stemChinese];
  if (!element) return null;
  return { chinese: stemChinese, element };
}
