# 八字算法微优化记录

> 基于 cal.md 深度分析后的三个关键优化点

## 优化背景

在完成核心算法重构(透干优先、调候因子、喜忌优先级)后,通过真实案例验证发现三个潜在的"坏味道",需要进行微调优化。

---

## 优化1: 地支冲克检测(寅申冲等)

### 问题描述

**原算法**只计算"点能量"(藏干得分),忽略了地支之间的冲克关系。

**案例**: 甲寅日,年支申金
- 日支寅木是甲木的禄位,本应得 **45分**
- 但年支申金与寅木**相冲**(寅申冲),会削弱寅木作为"禄"的根基
- 原算法未考虑这一削减

### 解决方案

#### 1. 添加地支六冲映射表

```typescript
// constants.ts
export const BRANCH_CLASH_MAP: Record<string, string> = {
  '子': '午', '午': '子',  // 子午冲
  '丑': '未', '未': '丑',  // 丑未冲
  '寅': '申', '申': '寅',  // 寅申冲
  '卯': '酉', '酉': '卯',  // 卯酉冲
  '辰': '戌', '戌': '辰',  // 辰戌冲
  '巳': '亥', '亥': '巳',  // 巳亥冲
};

// 地支六害映射表(穿害)
export const BRANCH_HARM_MAP: Record<string, string> = {
  '子': '未', '未': '子',
  '丑': '午', '午': '丑',
  '寅': '巳', '巳': '寅',
  '卯': '辰', '辰': '卯',
  '申': '亥', '亥': '申',
  '酉': '戌', '戌': '酉',
};
```

#### 2. 优化坐禄检测逻辑

```typescript
// strength-calculation.ts
export function checkLuPosition(
  dayStem: string,
  dayBranch: string,
  fourPillars: FourPillars  // 新增参数,用于检测冲克
): { hasLu: boolean; score: number; description: string } {
  const luBranch = LU_MAP[dayStem];
  
  if (luBranch !== dayBranch) {
    return { hasLu: false, score: 0, description: '' };
  }
  
  // 坐禄,检查是否受冲克
  let score = LU_BASE_SCORE; // 基础45分
  let penaltyDesc = '';
  
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
  return { hasLu: true, score, description: `日支${dayBranch}为${dayStem}之禄位,根基稳固${penaltyDesc}` };
}
```

### 效果验证

| 场景 | 原算法 | 优化后 | 说明 |
|------|-------|--------|------|
| 甲寅日,无冲克 | 45分 | 45分 | 正常 |
| 甲寅日,年支申金 | 45分 | **36分** | 寅申冲,削减20% |
| 甲寅日,月支巳火 | 45分 | **41分** | 寅巳害,削减10% |

**数学公式**:
$$
\text{坐禄最终得分} = \text{基础得分} \times \prod_{i} \text{削减系数}_i
$$

其中:
- 基础得分 = 45
- 削减系数(冲) = 0.8
- 削减系数(害) = 0.9

---

## 优化2: 坐禄得分动态化

### 问题描述

**原算法**将坐禄固定为 **45分**,这在大多数情况下是准确的,但忽略了特殊情况:
- 如果坐下的禄被月令或时支**剧烈冲击**(如寅申冲),这45分应该动态下调
- 硬编码的分数无法反映禄位受损的程度

### 解决方案

#### 1. 定义可调参数

```typescript
// constants.ts
export const LU_BASE_SCORE = 45;           // 坐禄基础得分
export const BRANCH_CLASH_PENALTY = 0.8;   // 受冲削减20%
export const BRANCH_HARM_PENALTY = 0.9;    // 受害削减10%
```

#### 2. 动态计算逻辑

已在"优化1"中实现,坐禄得分会根据冲克情况自动调整:

```typescript
let score = LU_BASE_SCORE; // 45分
// 遍历其他地支,检测冲克
if (BRANCH_CLASH_MAP[dayBranch] === otherBranch) {
  score *= BRANCH_CLASH_PENALTY; // 动态下调
}
```

### 效果验证

**测试用例**:
```typescript
it('甲寅日,年支申金冲击,坐禄得分应下调至36分', () => {
  const result = checkLuPosition('甲', '寅', fourPillars);
  expect(result.score).toBe(36); // 45 * 0.8 = 36
});
```

**实际影响**:
- 对于"甲寅日 壬申年"的八字,原算法会高估日主强度
- 优化后,坐禄得分从45降到36,更符合实际情况

---

## 优化3: 调候系数边界处理(从格检测)

### 问题描述

**原算法**设定了调候系数的下限为 **0.6**,但忽略了极端情况:
- 对于**从格**(日主极弱,如从财格、从官格),全盘能量已经切换到另一种运行模式
- 这时"调候"概念已经失效,不应该再应用调候系数

**案例**: 甲木从财格(全盘皆土)
- 日主极弱(得分 < 20)
- 原算法仍会应用调候系数,可能错误地降低得分
- 但从格的逻辑是"顺从财势",调候已不重要

### 解决方案

#### 1. 定义从格阈值

```typescript
// constants.ts
export const FOLLOW_PATTERN_THRESHOLD = 20;  // 日主得分低于20视为从格
export const MIN_ADJUSTMENT_FACTOR = 0.6;     // 正常格局的调候系数下限
```

#### 2. 优化调候系数应用逻辑

```typescript
// strength-calculation.ts
export function applySeasonalAdjustment(
  baseScore: number,
  adjustmentFactor: number,
  isFollowPattern: boolean = false  // 新增参数
): number {
  // 从格禁用调候系数
  if (isFollowPattern) {
    return baseScore;
  }
  
  // 正常格局限制最小值
  const factor = Math.max(adjustmentFactor, MIN_ADJUSTMENT_FACTOR);
  return Math.round(baseScore * factor);
}
```

#### 3. 在主计算函数中添加从格判定

```typescript
export function calculateDayMasterOptimized(
  dayStem: HeavenlyStem,
  fourPillars: FourPillars
): DayMaster {
  // 1. 计算基础得分
  const baseAnalysis = calculateBaseStrength(dayStem, fourPillars);
  
  // 2. 判断是否为从格
  const isFollowPattern = baseAnalysis.totalScore < FOLLOW_PATTERN_THRESHOLD;
  
  // 3. 计算调候分析
  const seasonalAdjustment = calculateSeasonalAdjustment(dayStem, fourPillars);
  
  // 4. 应用调候系数(从格禁用)
  const adjustedScore = applySeasonalAdjustment(
    baseAnalysis.totalScore,
    seasonalAdjustment.adjustmentFactor,
    isFollowPattern
  );
  
  // 5. 标注从格状态
  if (isFollowPattern) {
    seasonalAdjustment.description += '(日主从格,调候系数已禁用)';
  }
  
  return { /* ... */ };
}
```

### 效果验证

| 场景 | 基础得分 | 调候系数 | 原算法最终得分 | 优化后最终得分 | 说明 |
|------|---------|---------|-------------|-------------|------|
| 正常格局 | 50 | 0.7 | 35 | 35 | 正常应用 |
| 调候极差 | 50 | 0.5 | 25 | **30** | 限制最小值0.6 |
| 从财格 | 15 | 0.7 | 11 | **15** | 禁用调候,保持原分 |

**测试用例**:
```typescript
it('从格禁用调候:日主极弱时调候系数失效', () => {
  const result = calculateDayMasterOptimized(dayStem, fourPillars);
  expect(result.analysis?.totalScore).toBe(15); // 原得分,未应用系数
  expect(result.analysis?.seasonalAdjustment?.description).toContain('从格');
});
```

---

## 优化总结

### 优化对比表

| 优化点 | 影响范围 | 典型场景 | 得分变化 |
|-------|---------|---------|---------|
| **地支冲克** | 坐禄判定 | 甲寅日+年支申 | 45 → 36 (-20%) |
| **动态坐禄** | 身强身弱 | 禄位受冲 | 动态调整 |
| **从格处理** | 调候系数 | 日主极弱 | 禁用调候折扣 |

### 参数配置

所有算法参数均可在 `constants.ts` 中统一调整:

```typescript
export const LU_BASE_SCORE = 45;              // 坐禄基础分
export const BRANCH_CLASH_PENALTY = 0.8;      // 冲克削减系数
export const BRANCH_HARM_PENALTY = 0.9;       // 穿害削减系数
export const MIN_ADJUSTMENT_FACTOR = 0.6;     // 调候系数下限
export const FOLLOW_PATTERN_THRESHOLD = 20;   // 从格判定阈值
```

### 测试覆盖

新增测试用例:
- ✅ 寅申冲削减坐禄得分
- ✅ 寅巳害轻微削减
- ✅ 调候系数下限保护
- ✅ 从格禁用调候系数
- ✅ 完整案例:甲寅日+年支申

---

## 未来扩展建议

1. **地支三合、三会**:当前只处理了冲害,未来可扩展三合(寅午戌火局)和三会(亥子丑北方水局),这会增强地支能量

2. **刑害关系**:除了冲害,还有刑(如寅巳申三刑)和破(子酉破),可进一步细化

3. **从格细分**:当前只判断"是否从格",未来可细分从财、从官、从儿、从势等不同类型,调候策略可能不同

4. **动态阈值**:从格阈值(20分)可根据季节和五行分布动态调整

---

## 参考资料

- 《子平真诠》- 地支冲合理论
- cal.md - 真实案例深度分析
- algorithm-v2.md - 核心算法设计文档
