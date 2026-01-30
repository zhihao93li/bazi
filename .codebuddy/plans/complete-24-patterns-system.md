# Plan: 完整24种格局判定系统

## 📋 概述

实现传统命理学中的**完整24种格局判定系统**,从当前仅支持普通八格的状态,扩展到支持专旺格、从弱格、禄刃格、化气格的全量覆盖。核心思路从"单一透干逻辑"升级为"多层次结构化判定引擎"。

## ⚠️ 关键逻辑修正(基于专业审查)

### 修正1: 半三合不能定特殊格局
**问题**: 原计划中半三合(如申子)也能触发专旺格  
**纠正**: 半三合仅作为能量加权,**不改变格局分类**。只有**全三合**或**三会局**能触发真格。  
**实现**: 在`checkProsperityPattern()`中添加条件: `if (harmony.type !== 'full' && harmony.type !== 'hui') return null;`

### 修正2: 空亡对合局的削弱
**问题**: 原计划未考虑合局中关键地支空亡的情况  
**纠正**: 若核心地支(中气所在,如申子辰中的"子")逢空,合局力量大幅下降  
**实现**: 在`checkHarmony()`中添加`isVoidCheck`,若核心位空亡,`conversionRate`从1.0降至0.6

### 修正3: 从儿格的禁忌元素
**问题**: 原计划中从儿格禁忌"印比"  
**纠正**: 从儿格遵循"从儿不管身强弱,只要吾儿又见儿",**不怕比劫**(比劫生食伤),**只怕印星**(印克食伤)  
**实现**: 修正配置 `forbiddenElements: ['印']` (删除比劫)

### 修正4: 管道模式流程
**优化**: 采用 **Structure → Score → Purity → Threshold** 的管道模式:
1. **结构层**: 检测地支是否发生"化学反应"(合局)
2. **算分层**: 根据合化结果重算分数
3. **纯度层**: 一票否决(检查禁忌元素)
4. **阈值层**: 验证分数是否达标

**实现**: 在主函数中严格按此顺序执行

## 🎯 目标

### 核心目标
1. **支持全部24种格局判定**,按优先级分层检测
2. **修复润下格等专旺格识别问题**(当前无法识别)
3. **实现三合局/三会局检测**及合化重算
4. **实现化气格判定**(天干五合+月令调候)
5. **完善从格判定**(当前缺失从势格)

### 24种格局分类

#### 1. 普通八格 (✅ 已实现)
- 正官格、七杀格
- 正印格、偏印格
- 正财格、偏财格
- 食神格、伤官格
- 注: 杂气格是这8种的变体

#### 2. 禄刃格 (✅ 已实现)
- 建禄格
- 羊刃格

#### 3. 专旺格 (❌ 未实现)
- 曲直格(木)
- 炎上格(火)
- 稼穑格(土)
- 从革格(金)
- 润下格(水)

#### 4. 从弱格 (⚠️ 部分实现)
- 从财格 (已实现基础逻辑)
- 从杀格 (已实现基础逻辑)
- 从儿格 (已实现基础逻辑)
- 从势格 (❌ 未实现)

#### 5. 化气格 (❌ 未实现)
- 甲己化土格
- 乙庚化金格
- 丙辛化水格
- 丁壬化木格
- 戊癸化火格

### 用户案例验证
- **测试用例**: 乙亥 甲申 壬辰 庚子(日主壬水)
- **预期结果**: 润下格(申子辰水局)
- **当前结果**: 正印格(错误)

## 🔍 现状分析

### 已实现功能

```typescript
// ✅ 当前支持的格局判定流程
1. 建禄格/羊刃格判定 (基于月支直接判定)
2. 透干优先逻辑 (月令藏干透到天干)
3. 普通八格判定 (基于十神)
4. 专旺格/从格判定 (仅基于分数>75或<20,无结构检测)
```

### 缺失功能

```typescript
// ❌ 未实现的核心逻辑
1. 三合局/三会局检测 (如申子辰水局)
2. 合化重算 (三合后能量重新分配)
3. 一票否决机制 (专旺格遇克破格)
4. 化气格判定 (天干五合+月令条件)
5. 从势格判定 (财官伤混旺,无印比)
```

### 问题案例

**乙亥 甲申 壬辰 庚子**:
- 地支: 申子辰 → **三合水局**
- 日主: 壬水 → 应该是润下格
- 当前判定: 月干甲木透出,且甲木是偏印 → 判定为"正印格"(错误)
- 根本原因: **没有检测三合局,没有合化重算**

## 📐 技术方案

### 一、格局判定优先级(决策树)

```
开始判定
  ↓
1. 化气格判定 (最高优先级)
  - 检查日干与月干/时干是否构成天干五合
  - 检查月令是否支持化气
  - 化气成功 → 返回化气格
  ↓
2. 专旺格判定 (第二优先级)
  - 检查地支是否有三合局/三会局
  - 检查合局五行是否与日主相同
  - 检查一票否决(禁忌元素)
  - 合化重算后分数>75 → 返回专旺格
  ↓
3. 禄刃格判定 (第三优先级)
  - 检查月支是否为日主禄位/刃位
  - 是 → 返回建禄格/羊刃格
  ↓
4. 从弱格判定 (第四优先级)
  - 日主分数<20
  - 检查局中何种五行最强
  - 返回从财格/从杀格/从儿格/从势格
  ↓
5. 普通八格判定 (最低优先级)
  - 检查月令透干情况
  - 按透干十神定格
  - 返回正官格/正印格等
  ↓
6. 杂格
  - 以上都不匹配 → 返回杂格
```

### 二、核心模块设计

#### 模块1: 三合局/三会局检测

```typescript
// constants.ts 新增
export const SAN_HE_PATTERNS = {
  water: { 
    branches: ['申', '子', '辰'], 
    element: 'water',
    name: '申子辰三合水局',
  },
  fire: { 
    branches: ['寅', '午', '戌'], 
    element: 'fire',
    name: '寅午戌三合火局',
  },
  wood: { 
    branches: ['亥', '卯', '未'], 
    element: 'wood',
    name: '亥卯未三合木局',
  },
  metal: { 
    branches: ['巳', '酉', '丑'], 
    element: 'metal',
    name: '巳酉丑三合金局',
  },
};

export const SAN_HUI_PATTERNS = {
  water: { 
    branches: ['亥', '子', '丑'], 
    element: 'water',
    name: '亥子丑北方水局',
  },
  wood: { 
    branches: ['寅', '卯', '辰'], 
    element: 'wood',
    name: '寅卯辰东方木局',
  },
  fire: { 
    branches: ['巳', '午', '未'], 
    element: 'fire',
    name: '巳午未南方火局',
  },
  metal: { 
    branches: ['申', '酉', '戌'], 
    element: 'metal',
    name: '申酉戌西方金局',
  },
};

// 半三合(生地+旺地, 旺地+墓地)
export const BAN_SAN_HE_PATTERNS = {
  water: [
    { branches: ['申', '子'], name: '申子半合', conversionRate: 0.5 },
    { branches: ['子', '辰'], name: '子辰半合', conversionRate: 0.5 },
  ],
  // ... 其他
};
```

**检测函数**:
```typescript
interface HarmonyCheck {
  type: 'full' | 'half' | 'hui' | 'none';
  element?: FiveElement;
  branches: string[];
  name: string;
  conversionRate: number; // 1.0(全三合/三会), 0.6(核心空亡), 0.5(半三合), 0(无)
  isVoid?: boolean;        // 【新增】核心地支是否空亡
  voidBranch?: string;     // 【新增】空亡的地支
}

function checkHarmony(
  fourPillars: FourPillars,
  xunKong?: string  // 【新增】旬空信息
): HarmonyCheck {
  const branches = [
    fourPillars.year.earthlyBranch.chinese,
    fourPillars.month.earthlyBranch.chinese,
    fourPillars.day.earthlyBranch.chinese,
    fourPillars.hour.earthlyBranch.chinese,
  ];
  
  // 1. 检查全三合
  for (const [key, pattern] of Object.entries(SAN_HE_PATTERNS)) {
    const hasAll = pattern.branches.every(b => branches.includes(b));
    if (hasAll) {
      // 【修正2】检查核心地支(中气)是否空亡
      // 申子辰: 核心是"子"(旺位)
      // 寅午戌: 核心是"午"(旺位)
      const coreIndex = 1; // 中间位置是旺位
      const coreBranch = pattern.branches[coreIndex];
      const isVoid = xunKong?.includes(coreBranch) || false;
      
      return {
        type: 'full',
        element: pattern.element,
        branches: pattern.branches,
        name: pattern.name,
        conversionRate: isVoid ? 0.6 : 1.0, // 【修正2】核心空亡则降至60%
        isVoid,
        voidBranch: isVoid ? coreBranch : undefined,
      };
    }
  }
  
  // 2. 检查三会局
  for (const [key, pattern] of Object.entries(SAN_HUI_PATTERNS)) {
    const hasAll = pattern.branches.every(b => branches.includes(b));
    if (hasAll) {
      // 三会局的核心也是中间位置(正气所在)
      const coreIndex = 1;
      const coreBranch = pattern.branches[coreIndex];
      const isVoid = xunKong?.includes(coreBranch) || false;
      
      return {
        type: 'hui',
        element: pattern.element,
        branches: pattern.branches,
        name: pattern.name,
        conversionRate: isVoid ? 0.6 : 1.0,
        isVoid,
        voidBranch: isVoid ? coreBranch : undefined,
      };
    }
  }
  
  // 3. 检查半三合
  // 【修正1】半三合不能定特殊格局,仅用于能量加权
  for (const [key, patterns] of Object.entries(BAN_SAN_HE_PATTERNS)) {
    for (const pattern of patterns) {
      const hasAll = pattern.branches.every(b => branches.includes(b));
      if (hasAll) {
        return {
          type: 'half',
          element: key as FiveElement,
          branches: pattern.branches,
          name: pattern.name,
          conversionRate: 0.5, // 半三合只有50%转化率
        };
      }
    }
  }
  
  return { type: 'none', branches: [], name: '', conversionRate: 0 };
}
        conversionRate: 1.0,
      };
    }
  }
  
  // 3. 检查半三合
  for (const [key, patterns] of Object.entries(BAN_SAN_HE_PATTERNS)) {
    for (const pattern of patterns) {
      const hasAll = pattern.branches.every(b => branches.includes(b));
      if (hasAll) {
        return {
          type: 'half',
          element: key as FiveElement,
          branches: pattern.branches,
          name: pattern.name,
          conversionRate: 0.5,
        };
      }
    }
  }
  
  return { type: 'none', branches: [], name: '', conversionRate: 0 };
}
```

#### 模块2: 合化重算

```typescript
function recalculateWithHarmony(
  originalDistribution: FiveElementsAnalysis['distribution'],
  harmony: HarmonyCheck,
  fourPillars: FourPillars
): FiveElementsAnalysis['distribution'] {
  if (harmony.type === 'none' || !harmony.element) {
    return originalDistribution;
  }
  
  const newDistribution = { ...originalDistribution };
  const targetElement = harmony.element;
  
  // 计算每个参与合局的地支的原始贡献值
  for (const branch of harmony.branches) {
    const branchElement = getBranchMainElement(branch);
    
    // 如果该地支不是目标五行,则转化
    if (branchElement !== targetElement) {
      // 计算该地支在当前分数体系中的贡献
      const branchContribution = calculateBranchContribution(
        branch, 
        fourPillars, 
        originalDistribution
      );
      
      // 按转化率转移能量
      const convertedScore = branchContribution * harmony.conversionRate;
      
      newDistribution[branchElement] = Math.max(
        0, 
        newDistribution[branchElement] - convertedScore
      );
      newDistribution[targetElement] += convertedScore;
    }
  }
  
  return newDistribution;
}
```

#### 模块3: 专旺格判定(带一票否决)

```typescript
// constants.ts 新增
export const PROSPERITY_PATTERN_CONFIG = {
  曲直格: {
    dayElement: 'wood',
    requiredHarmony: ['wood'],
    forbiddenElement: 'metal',
    forbiddenStemLimit: 0,      // 天干不能透
    forbiddenWeightLimit: 0.05, // 地支权重<5%
    thresholdScore: 75,
  },
  炎上格: {
    dayElement: 'fire',
    requiredHarmony: ['fire'],
    forbiddenElement: 'water',
    forbiddenStemLimit: 0,
    forbiddenWeightLimit: 0.05,
    thresholdScore: 75,
  },
  稼穑格: {
    dayElement: 'earth',
    requiredHarmony: ['earth'],
    forbiddenElement: 'wood',
    forbiddenStemLimit: 0,
    forbiddenWeightLimit: 0.05,
    thresholdScore: 75,
  },
  从革格: {
    dayElement: 'metal',
    requiredHarmony: ['metal'],
    forbiddenElement: 'fire',
    forbiddenStemLimit: 0,
    forbiddenWeightLimit: 0.05,
    thresholdScore: 75,
  },
  润下格: {
    dayElement: 'water',
    requiredHarmony: ['water'],
    forbiddenElement: 'earth',
    forbiddenStemLimit: 0,
    forbiddenWeightLimit: 0.05,
    thresholdScore: 75,
  },
};

function checkProsperityPattern(
  dayStem: HeavenlyStem,
  fourPillars: FourPillars,
  harmony: HarmonyCheck,
  recalculatedDistribution: FiveElementsAnalysis['distribution']
): PatternInfo | null {
  // 【修正1】只有全三合或三会局才能触发专旺格
  if (harmony.type !== 'full' && harmony.type !== 'hui') {
    return null; // 半三合不能定特殊格局
  }
  
  // 1. 检查是否有合局
  if (harmony.type === 'none' || !harmony.element) {
    return null;
  }
  
  // 2. 检查合局五行是否与日主相同
  if (harmony.element !== dayStem.element) {
    return null;
  }
  
  // 3. 查找对应的专旺格配置
  const patternName = Object.keys(PROSPERITY_PATTERN_CONFIG).find(
    name => PROSPERITY_PATTERN_CONFIG[name].dayElement === dayStem.element
  );
  
  if (!patternName) return null;
  
  const config = PROSPERITY_PATTERN_CONFIG[patternName];
  
  // 4. 一票否决: 检查天干是否透出禁忌元素
  const heavenlyStems = [
    fourPillars.year.heavenlyStem,
    fourPillars.month.heavenlyStem,
    fourPillars.day.heavenlyStem,
    fourPillars.hour.heavenlyStem,
  ];
  
  for (const stem of heavenlyStems) {
    if (stem.element === config.forbiddenElement) {
      return null; // 破格
    }
  }
  
  // 5. 检查禁忌元素在地支的权重
  const totalScore = Object.values(recalculatedDistribution).reduce((a, b) => a + b, 0);
  const forbiddenWeight = recalculatedDistribution[config.forbiddenElement] / totalScore;
  
  if (forbiddenWeight > config.forbiddenWeightLimit) {
    return null; // 破格
  }
  
  // 6. 检查目标五行分数是否达标
  if (recalculatedDistribution[dayStem.element] < config.thresholdScore) {
    return null;
  }
  
  // 7. 成格!
  return {
    name: patternName,
    category: 'special',
    description: `${harmony.name}成立,${dayStem.element}气专旺成局`,
    harmonyInfo: {
      type: harmony.type,
      name: harmony.name,
      conversionRate: harmony.conversionRate,
    },
  };
}
```

#### 模块4: 化气格判定

```typescript
// constants.ts 新增
export const HUA_QI_PATTERNS = {
  甲己化土格: {
    stems: ['甲', '己'],
    element: 'earth',
    requiredMonthBranch: ['辰', '戌', '丑', '未'], // 四季月
    description: '甲己合化土,主中正厚重,宜见火土运',
  },
  乙庚化金格: {
    stems: ['乙', '庚'],
    element: 'metal',
    requiredMonthBranch: ['申', '酉', '戌'], // 秋月
    description: '乙庚合化金,主刚毅果决,宜见土金运',
  },
  丙辛化水格: {
    stems: ['丙', '辛'],
    element: 'water',
    requiredMonthBranch: ['亥', '子', '丑'], // 冬月
    description: '丙辛合化水,主聪慧灵动,宜见金水运',
  },
  丁壬化木格: {
    stems: ['丁', '壬'],
    element: 'wood',
    requiredMonthBranch: ['寅', '卯', '辰'], // 春月
    description: '丁壬合化木,主仁慈正直,宜见水木运',
  },
  戊癸化火格: {
    stems: ['戊', '癸'],
    element: 'fire',
    requiredMonthBranch: ['巳', '午', '未'], // 夏月
    description: '戊癸合化火,主热情礼仪,宜见木火运',
  },
};

function checkHuaQiPattern(
  fourPillars: FourPillars,
  dayMaster: DayMaster
): PatternInfo | null {
  const dayStem = fourPillars.day.heavenlyStem.chinese;
  const monthStem = fourPillars.month.heavenlyStem.chinese;
  const hourStem = fourPillars.hour.heavenlyStem.chinese;
  const monthBranch = fourPillars.month.earthlyBranch.chinese;
  
  // 检查日干与月干或时干是否构成天干五合
  for (const [patternName, config] of Object.entries(HUA_QI_PATTERNS)) {
    const [stem1, stem2] = config.stems;
    
    // 日干与月干合,或日干与时干合
    const hasHarmony = 
      (dayStem === stem1 && (monthStem === stem2 || hourStem === stem2)) ||
      (dayStem === stem2 && (monthStem === stem1 || hourStem === stem1));
    
    if (!hasHarmony) continue;
    
    // 检查月令是否支持化气
    if (!config.requiredMonthBranch.includes(monthBranch)) continue;
    
    // 检查日主是否极弱(化气格需要放弃自我)
    if (dayMaster.analysis?.totalScore > 30) continue;
    
    // 成格!
    return {
      name: patternName,
      category: 'special',
      description: config.description,
      huaQiInfo: {
        stems: config.stems,
        element: config.element,
        monthBranch,
      },
    };
  }
  
  return null;
}
```

#### 模块5: 从格判定(含从势格和修正后的从儿格)

```typescript
// constants.ts 新增
export const FOLLOW_PATTERN_CONFIG = {
  从财格: {
    dayMasterThreshold: 20,
    targetTenGods: ['正财', '偏财'],
    targetElementMin: 65,
    forbiddenTenGods: ['正印', '偏印', '比肩', '劫财'], // 禁忌印比
  },
  从杀格: {
    dayMasterThreshold: 20,
    targetTenGods: ['正官', '七杀'],
    targetElementMin: 65,
    forbiddenTenGods: ['食神', '伤官', '正印', '偏印'], // 禁忌食伤印
  },
  从儿格: {
    dayMasterThreshold: 20,
    targetTenGods: ['食神', '伤官'],
    targetElementMin: 65,
    forbiddenTenGods: ['正印', '偏印'], // 【修正3】仅禁忌印,不怕比劫
  },
  从势格: {
    dayMasterThreshold: 20,
    mixedRequired: true, // 需要财官伤混旺
    forbiddenTenGods: ['正印', '偏印', '比肩', '劫财'],
  },
};

/**
 * 检测从格(含从势格)
 */
function checkCongPattern(
  fourPillars: FourPillars,
  dayMaster: DayMaster,
  distribution: FiveElementsAnalysis['distribution']
): PatternInfo | null {
  // 1. 日主必须极弱
  if (dayMaster.analysis?.totalScore >= 20) {
    return null;
  }
  
  const dayStem = fourPillars.day.heavenlyStem;
  
  // 统计所有十神
  const tenGodCount: Record<string, number> = {};
  for (const pillar of [fourPillars.year, fourPillars.month, fourPillars.hour]) {
    const tenGod = getTenGod(dayStem, pillar.heavenlyStem);
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
        reason: `财${hasCai?'旺':''}官${hasGuan?'旺':''}伤${hasShang?'旺':''}混旺`,
      },
    };
  }
  
  // 3. 检测从财格/从杀格/从儿格
  for (const [patternName, config] of Object.entries(FOLLOW_PATTERN_CONFIG)) {
    if (config.mixedRequired) continue; // 跳过从势格(已处理)
    
    // 检查目标十神是否旺
    const targetCount = config.targetTenGods.reduce(
      (sum, tg) => sum + (tenGodCount[tg] || 0), 
      0
    );
    
    if (targetCount === 0) continue; // 目标十神不存在
    
    // 检查禁忌十神
    const hasForbidden = config.forbiddenTenGods.some(
      tg => (tenGodCount[tg] || 0) > 0
    );
    
    if (hasForbidden) continue; // 有禁忌,不能从
    
    // 检查目标五行分数
    // (这里需要根据十神反推五行,简化处理)
    // 实际实现中需要更精确的逻辑
    
    return {
      name: patternName,
      category: 'special',
      description: getFollowPatternDescription(patternName),
      congInfo: {
        type: patternName.replace('格', ''),
        reason: `${config.targetTenGods.join('/')}旺,日主弃命从之`,
      },
    };
  }
  
  return null;
}

function getFollowPatternDescription(patternName: string): string {
  const descMap: Record<string, string> = {
    从财格: '日主极弱,弃命从财,主善于理财经商,宜财运',
    从杀格: '日主极弱,弃命从官,主顺从权威,宜官运',
    从儿格: '日主极弱,从儿不管身强弱,主才华外露,宜食伤运',
    从势格: '财官伤混旺,日主弃命从势,主多才多艺,宜顺势而为',
  };
  return descMap[patternName] || '';
}
```
}
```

### 三、重构主函数 `calculatePatternOptimized` (采用管道模式)

```typescript
/**
 * 【修正4】采用管道模式(Pipeline Pattern):
 * Structure → Score → Purity → Threshold
 * 
 * 1. 结构层: 检测地支是否发生"化学反应"(合局)
 * 2. 算分层: 根据合化结果重算分数
 * 3. 纯度层: 一票否决(检查禁忌元素)
 * 4. 阈值层: 验证分数是否达标
 */
export function calculatePatternOptimized(
  fourPillars: FourPillars,
  dayMaster: DayMaster,
  fiveElements: FiveElementsAnalysis,
  xunKong?: string // 【新增】旬空信息
): PatternInfo {
  const dayStem = fourPillars.day.heavenlyStem;
  const monthBranch = fourPillars.month.earthlyBranch;
  
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
  
  // 【管道阶段1】结构层: 检测三合局/三会局
  const harmony = checkHarmony(fourPillars, xunKong);
  
  // 【管道阶段2】算分层: 合化重算
  const recalculatedDistribution = recalculateWithHarmony(
    fiveElements.distribution,
    harmony,
    fourPillars
  );
  
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
    };
  }
  
  if (monthBranch.chinese === REN_MAP[dayStem.chinese]) {
    return {
      name: '羊刃格',
      category: 'normal',
      description: '月支为日主之刃,主身强刚烈,宜见官杀制刃',
    };
  }
  
  // ========================================
  // 第四层: 从弱格判定
  // ========================================
  if (dayMaster.analysis?.totalScore < 20) {
    // 1. 从势格(优先)
    const congShiPattern = checkCongShiPattern(fourPillars, dayMaster, recalculatedDistribution);
    if (congShiPattern) {
      return congShiPattern;
    }
    
    // 2. 从财格/从杀格/从儿格
    const congPattern = checkCongPattern(fourPillars, dayMaster, recalculatedDistribution);
    if (congPattern) {
      return congPattern;
    }
  }
  
  // ========================================
  // 第五层: 普通八格判定(原逻辑)
  // ========================================
  const monthHiddenStems = fourPillars.month.hiddenStems;
  const tianGan = [
    fourPillars.year.heavenlyStem.chinese,
    fourPillars.month.heavenlyStem.chinese,
    fourPillars.hour.heavenlyStem.chinese,
  ];
  
  const transparentStems = checkTransparentStems(monthHiddenStems, tianGan);
  const patternByTransparency = determinePatternByTransparency(
    transparentStems,
    dayStem,
    monthBranch.chinese
  );
  
  if (patternByTransparency) {
    return patternByTransparency;
  }
  
  // ... 原有的无透干逻辑
  
  // ========================================
  // 兜底: 杂格
  // ========================================
  return {
    name: '杂格',
    category: 'normal',
    description: '月令无明显成格条件,需综合分析八字整体格局',
  };
}
```

## 📝 实施任务清单

### Task 1: 基础配置与类型定义 (2小时)
- [ ] 在 `constants.ts` 添加 `SAN_HE_PATTERNS`、`SAN_HUI_PATTERNS`、`BAN_SAN_HE_PATTERNS`
- [ ] 在 `constants.ts` 添加 `PROSPERITY_PATTERN_CONFIG`
- [ ] 在 `constants.ts` 添加 `HUA_QI_PATTERNS`
- [ ] 在 `types.ts` 添加 `HarmonyCheck`、`HuaQiInfo`、`CongInfo` 接口
- [ ] 扩展 `PatternInfo` 接口,添加 `harmonyInfo`、`huaQiInfo`、`congInfo` 可选字段

### Task 2: 三合局/三会局检测 (3小时)
- [ ] 实现 `checkHarmony(fourPillars)` - 统一检测接口
- [ ] 实现 `checkSanHe(branches)` - 全三合检测
- [ ] 实现 `checkSanHui(branches)` - 三会局检测
- [ ] 实现 `checkBanSanHe(branches)` - 半三合检测
- [ ] 添加单元测试(申子辰、寅午戌等)

### Task 3: 合化重算模块 (3小时)
- [ ] 实现 `getBranchMainElement(branch)` - 获取地支主五行
- [ ] 实现 `calculateBranchContribution(branch, fourPillars, distribution)` - 计算地支贡献
- [ ] 实现 `recalculateWithHarmony(distribution, harmony, fourPillars)` - 合化重算
- [ ] 验证重算结果(申子辰案例: 水分从70→85)

### Task 4: 专旺格判定 (2小时)
- [ ] 实现 `checkProsperityPattern()` - 专旺格检测(含一票否决)
- [ ] 实现 `calculateForbiddenWeight()` - 禁忌元素权重计算
- [ ] 添加测试用例(润下格、炎上格、破格案例)

### Task 5: 化气格判定 (2小时)
- [ ] 实现 `checkHuaQiPattern()` - 天干五合检测
- [ ] 验证月令调候条件
- [ ] 添加测试用例(甲己化土等5种)

### Task 6: 从势格判定 (1小时)
- [ ] 实现 `checkCongShiPattern()` - 财官伤混旺检测
- [ ] 优化现有的 `checkCongPattern()` (从财/从杀/从儿)
- [ ] 添加测试用例

### Task 7: 重构主函数 (2小时)
- [ ] 按优先级重新组织 `calculatePatternOptimized()`
- [ ] 确保向后兼容(普通八格逻辑不变)
- [ ] 添加日志输出(调试用)

### Task 8: 前端验证 (1小时)
- [ ] 验证 `HeaderSection.jsx` 显示所有新格局
- [ ] 确认特殊格局的紫色样式生效
- [ ] 在格局描述中添加"三合局"、"化气"等提示

### Task 9: 完整测试(含关键逻辑验证) (4小时)
- [ ] **关键逻辑测试**(针对4个修正点)
  - [ ] 修正1: 半三合不能定特殊格局
    - 测试用例: 日主壬水,仅有"申子"(无辰) → 不应返回润下格
    - 预期: 返回普通格局(如正印格)
  - [ ] 修正2: 核心地支空亡削弱合局
    - 测试用例: 申子辰水局,但"子"逢空 → conversionRate=0.6
    - 预期: 水分增加较少,可能不足75分而不成润下格
  - [ ] 修正3: 从儿格不怕比劫
    - 测试用例: 日主<20,食伤旺,有比劫但无印 → 应判定为从儿格
    - 预期: 成功识别从儿格
  - [ ] 修正4: 管道模式流程验证
    - 验证执行顺序: Structure → Score → Purity → Threshold
    - 日志输出中间结果
    
- [ ] **24种格局全覆盖测试**
  - 普通八格: 8个测试用例(已有)
  - 禄刃格: 2个测试用例(已有)
  - 专旺格: 5个测试用例 + 5个破格用例
  - 从弱格: 4个测试用例(含从势格)
  - 化气格: 5个测试用例
  
- [ ] **边界情况测试**
  - 双格局冲突(如同时满足润下格和从财格) → 按优先级返回
  - 空亡+合局(如申子辰中子空) → 正确降低转化率
  - 天干透禁忌但地支合局 → 正确破格
  
- [ ] **回归测试**
  - 确保普通八格的判定不受影响
  - 性能测试: 单次计算<50ms

### Task 10: 文档与优化 (2小时)
- [ ] 更新算法文档,绘制决策树流程图
- [ ] 添加24种格局示例命盘
- [ ] 性能优化(缓存合局检测结果)
- [ ] 代码注释完善

## 🎯 预期效果

### 用户案例验证

**输入**: 乙亥 甲申 壬辰 庚子 (1995年8月28日)

**当前输出**:
```json
{
  "pattern": {
    "name": "正印格",
    "category": "normal"
  }
}
```

**修复后输出**:
```json
{
  "pattern": {
    "name": "润下格",
    "category": "special",
    "description": "申子辰三合水局成立,水气润下成局,主聪慧灵活,宜金水运",
    "harmonyInfo": {
      "type": "full",
      "name": "申子辰三合水局",
      "conversionRate": 1.0
    }
  },
  "dayMaster": {
    "totalScore": 92,
    "distribution": {
      "water": 85,
      "metal": 10,
      "earth": 5
    }
  }
}
```

### 24种格局覆盖示意

| 分类 | 格局名称 | 判定条件 | 实现状态 |
|------|---------|---------|---------|
| 普通八格 | 正官格 | 月令透正官 | ✅ 已实现 |
| 普通八格 | 七杀格 | 月令透七杀 | ✅ 已实现 |
| 普通八格 | 正印格 | 月令透正印 | ✅ 已实现 |
| 普通八格 | 偏印格 | 月令透偏印 | ✅ 已实现 |
| 普通八格 | 正财格 | 月令透正财 | ✅ 已实现 |
| 普通八格 | 偏财格 | 月令透偏财 | ✅ 已实现 |
| 普通八格 | 食神格 | 月令透食神 | ✅ 已实现 |
| 普通八格 | 伤官格 | 月令透伤官 | ✅ 已实现 |
| 禄刃格 | 建禄格 | 月支为禄 | ✅ 已实现 |
| 禄刃格 | 羊刃格 | 月支为刃 | ✅ 已实现 |
| 专旺格 | 曲直格 | 木局+日主木+分数>75 | 🔨 待实现 |
| 专旺格 | 炎上格 | 火局+日主火+分数>75 | 🔨 待实现 |
| 专旺格 | 稼穑格 | 土局+日主土+分数>75 | 🔨 待实现 |
| 专旺格 | 从革格 | 金局+日主金+分数>75 | 🔨 待实现 |
| 专旺格 | 润下格 | 水局+日主水+分数>75 | 🔨 待实现 |
| 从弱格 | 从财格 | 日主<20+财旺 | ⚠️ 需优化 |
| 从弱格 | 从杀格 | 日主<20+杀旺 | ⚠️ 需优化 |
| 从弱格 | 从儿格 | 日主<20+食伤旺 | ⚠️ 需优化 |
| 从弱格 | 从势格 | 日主<20+财官伤混旺 | 🔨 待实现 |
| 化气格 | 甲己化土格 | 甲己合+四季月 | 🔨 待实现 |
| 化气格 | 乙庚化金格 | 乙庚合+秋月 | 🔨 待实现 |
| 化气格 | 丙辛化水格 | 丙辛合+冬月 | 🔨 待实现 |
| 化气格 | 丁壬化木格 | 丁壬合+春月 | 🔨 待实现 |
| 化气格 | 戊癸化火格 | 戊癸合+夏月 | 🔨 待实现 |

## ⚠️ 风险与注意事项(基于专业审查)

### 1. 半三合的"定格"权限风险 ✅ 已修正
- **风险**: 半三合(如申子)不足以独立支撑特殊格局
- **修正**: 在`checkProsperityPattern()`中强制要求`harmony.type === 'full' || 'hui'`
- **影响**: 避免假格被误判为真格

### 2. 空亡对结构层的干预 ✅ 已修正
- **风险**: 合局中核心地支空亡会大幅削弱合局力量
- **修正**: 在`checkHarmony()`中检测核心位(旺位)空亡,转化率降至0.6
- **影响**: 更真实地反映合局的有效性

### 3. 从儿格的特例处理 ✅ 已修正
- **风险**: 原逻辑误将比劫列为从儿格禁忌
- **修正**: 从儿格配置中删除比劫,仅禁印星
- **理论依据**: "从儿不管身强弱,只要吾儿又见儿"

### 4. 管道模式流程 ✅ 已实现
- **优化**: 采用 Structure → Score → Purity → Threshold 流程
- **好处**: 逻辑清晰,易于调试和扩展
- **实现**: 在主函数中明确标注各阶段

### 2. 合化重算的副作用
- 五行分布改变会影响前端图表
- 解决方案: 在返回数据中同时提供"原始分布"和"合化后分布"

### 3. 一票否决的严格性
- 传统流派对"破格"标准有争议
- 解决方案: 配置化,允许调整 `forbiddenStemLimit`

### 4. 化气格的罕见性
- 化气格在实际命盘中极少出现
- 解决方案: 严格验证条件(日主极弱+月令支持+天干合)

### 5. 向后兼容
- 确保普通八格的判定不受影响
- 解决方案: 新逻辑放在最前面,原逻辑作为兜底

### 6. 性能考虑
- 多层检测可能增加计算时间
- 解决方案: 缓存中间结果(如 `HarmonyCheck`)

## 📊 成功标准

1. ✅ 用户案例"乙亥 甲申 壬辰 庚子"正确识别为润下格
2. ✅ 24种格局都有对应的测试用例通过
3. ✅ 破格场景能够正确回退到次优格局
4. ✅ 前端正确显示所有格局名称和样式
5. ✅ 现有普通八格的判定不受影响(回归测试通过)
6. ✅ 性能不明显下降(单次计算<50ms)

## 📅 估算工时(含修正逻辑)

- **Task 1**: 2小时(配置与类型,新增修正字段)
- **Task 2**: 4小时(三合局检测,**含空亡检测逻辑**)
- **Task 3**: 3小时(合化重算)
- **Task 4**: 3小时(专旺格,**含半三合过滤**)
- **Task 5**: 2小时(化气格)
- **Task 6**: 2小时(从格,**含从儿格修正**)
- **Task 7**: 2小时(重构主函数,**实现管道模式**)
- **Task 8**: 1小时(前端验证)
- **Task 9**: 4小时(全量测试,**含4个修正点验证**)
- **Task 10**: 2小时(文档优化)

**总计**: 25小时(原21小时 + 4小时修正逻辑)

## 🔗 相关文档

- [pattern-calculation.ts](../src/lib/bazi/pattern-calculation.ts) - 当前格局判定代码
- [深入讨论.md](../docs/深入讨论.md) - 合化、空亡等高级逻辑讨论
- [cal.md](../docs/cal.md) - 原始算法详细说明

## 📝 备注

此Plan实现传统命理学的**完整24种格局体系**,采用**多层决策树**架构:

**优先级排序**: 化气格 > 专旺格 > 禄刃格 > 从弱格 > 普通八格 > 杂格

核心技术突破:
1. **三合局检测** - 解决润下格等专旺格识别问题
2. **合化重算** - 重新分配五行能量
3. **一票否决** - 专旺格破格机制
4. **天干五合** - 化气格判定

此为**架构级重构**,但保持向后兼容,不会破坏现有功能。
