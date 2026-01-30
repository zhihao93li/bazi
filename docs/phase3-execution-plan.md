# Phase 3 执行计划：提取纯度检查逻辑

**目标**: 将 `prosperity-pattern.ts` 中内联的纯度检查逻辑提取到 `detector/purity-checker.ts`，实现统一的纯度验证接口。

**预计收益**:
- 删除约 **100行** 重复/内联代码
- 代码重复率从 10% → **5%**
- 模块职责更清晰
- 纯度检查逻辑可复用

---

## 📋 执行步骤

### Phase 3.1: 分析纯度检查逻辑 ✅

**目标**: 对比分析两处纯度检查实现

**文件对比**:
1. `prosperity-pattern.ts` - 内联的藏干纯度检查（行 70-117）
2. `detector/purity-checker.ts` - 独立的纯度检查器

**分析要点**:
- 检查逻辑是否完全一致
- 是否有差异化的判断条件
- 合并策略

---

### Phase 3.2: 完善 PurityChecker 类 ⏳

**目标**: 让 `PurityChecker` 支持专旺格的纯度检查

**需要添加的方法**:

```typescript
/**
 * 检查专旺格的纯度（藏干检查）
 * @param fourPillars 四柱
 * @param targetElement 目标五行（日主五行）
 * @param weightLimit 禁忌权重上限（默认5%）
 * @returns 是否通过纯度检查
 */
public checkProsperityPurity(
  fourPillars: FourPillars,
  targetElement: FiveElement,
  weightLimit: number = 0.05
): {
  passed: boolean;
  forbiddenWeight: number;
  details: string;
}
```

**实现要点**:
1. 遍历四柱地支
2. 计算非目标五行的藏干权重
3. 判断是否超过阈值（默认5%）

---

### Phase 3.3: 重构 prosperity-pattern.ts ⏳

**目标**: 使用 `PurityChecker` 替代内联逻辑

**修改前** (内联检查):
```typescript
// 5. 【纯度层·地支】检查藏干纯度
let forbiddenWeight = 0;
for (const pillar of pillars) {
  const branch = pillar.earthlyBranch.chinese;
  const hiddenStems = HIDDEN_STEMS_MAP[branch] || [];
  const weights = HIDDEN_STEM_WEIGHTS[branch] || [];
  
  for (let i = 0; i < hiddenStems.length; i++) {
    const stem = hiddenStems[i];
    const weight = weights[i];
    
    if (stem.element !== dayStem.element) {
      forbiddenWeight += weight;
    }
  }
}

if (forbiddenWeight > PROSPERITY_FORBIDDEN_WEIGHT_LIMIT) {
  return null; // 纯度不足
}
```

**修改后** (统一接口):
```typescript
// 5. 【纯度层·地支】使用 PurityChecker
const purityChecker = new PurityChecker();
const purityResult = purityChecker.checkProsperityPurity(
  fourPillars,
  dayStem.element,
  PROSPERITY_FORBIDDEN_WEIGHT_LIMIT
);

if (!purityResult.passed) {
  if (DEBUG) console.log('  ❌ 纯度检查失败:', purityResult.details);
  return null;
}
```

**删除代码**: 约 **48行**

---

### Phase 3.4: 完善 PurityChecker 的从格检查 ⏳

**目标**: 实现从格的十神禁忌检查

**新增方法**:
```typescript
/**
 * 检查从格的十神禁忌
 * @param ctx 检测上下文
 * @param followType 从格类型（'wealth' | 'power' | 'children'）
 * @returns 是否有禁忌十神
 */
public checkFollowPatternForbidden(
  ctx: DetectionContext,
  followType: 'wealth' | 'power' | 'children'
): {
  hasForbidden: boolean;
  forbiddenTenGods: string[];
  details: string;
}
```

**实现逻辑**:
- 从财格: 禁忌比劫、印星透干
- 从官格: 禁忌比劫、食伤透干
- 从儿格: 禁忌印星、官杀透干

---

### Phase 3.5: 创建统一导出模块 ⏳

**目标**: 创建 `detector/index.ts` 简化外部调用

**文件内容**:
```typescript
// detector/index.ts - 统一模块导出

export { StructuralAnalyzer } from './structural-analyzer.js';
export { ScoreRecalculator } from './score-recalculator.js';
export { PurityChecker } from './purity-checker.js';
export { PatternDetector } from './pattern-detector.js';

// 类型导出
export type {
  DetectionContext,
  HarmonyCheck,
  RecalculatedDistribution,
  PurityResult,
} from '../types.js';
```

**收益**:
- 简化导入路径
- 统一对外接口
- 更好的模块封装

---

### Phase 3.6: 更新调用方 ⏳

**目标**: 更新所有引用 detector 模块的文件

**需要更新的文件**:
1. `pattern-calculation.ts` - 主系统
2. `follow-pattern.ts` - 从格检测
3. `transformation-pattern.ts` - 化气格检测

**修改示例**:
```typescript
// 修改前
import { StructuralAnalyzer } from './detector/structural-analyzer.js';
import { ScoreRecalculator } from './detector/score-recalculator.js';
import { PurityChecker } from './detector/purity-checker.js';

// 修改后
import { 
  StructuralAnalyzer, 
  ScoreRecalculator, 
  PurityChecker 
} from './detector/index.js';
```

---

### Phase 3.7: 测试验证 ⏳

**目标**: 确保所有功能正常

**测试清单**:
```bash
# 1. 单元测试
npm test -- src/lib/bazi/__tests__/special-patterns.test.ts
npm test -- src/lib/bazi/__tests__/pattern-original-format.test.ts

# 2. 类型检查
npx tsc --noEmit

# 3. Linter检查
npm run lint

# 4. 开发服务器
npm run dev
```

---

## 📊 预期成果

### 代码减少
| 文件 | 删除行数 | 说明 |
|-----|---------|------|
| `prosperity-pattern.ts` | ~48行 | 删除内联纯度检查 |
| 重复逻辑消除 | ~52行 | 统一到 PurityChecker |
| **总计** | **~100行** | **代码重复率 10% → 5%** |

### 架构优化
| 指标 | 优化前 | 优化后 |
|-----|--------|--------|
| 纯度检查位置 | 分散在各个模块 | 统一在 `purity-checker.ts` |
| 复用性 | 无法复用 | 高度复用 |
| 测试覆盖 | 困难 | 易于测试 |
| 维护成本 | 高 | 低 |

---

## 🎯 关键里程碑

- [x] **Phase 1**: 文件重组，删除 723行
- [x] **Phase 2**: 合并重复检测，删除 343行
- [ ] **Phase 3**: 提取纯度检查，删除 100行
- [ ] **Total**: 累计删除 **1166行** 代码

---

## 💡 技术要点

### 1. 单一职责原则
- `PurityChecker` 只负责纯度验证
- 不涉及格局判定逻辑
- 返回结构化的检查结果

### 2. 可扩展性
```typescript
// 未来可以轻松添加新的纯度检查
purityChecker.checkProsperityPurity()   // 专旺格
purityChecker.checkFollowPatternPurity() // 从格
purityChecker.checkTransformationPurity() // 化气格
```

### 3. 调试友好
```typescript
const result = purityChecker.checkProsperityPurity(...);
console.log(result.details); // "禁忌权重3.2%（丙火0.2%+戊土3.0%），阈值5%"
```

---

## 🚀 开始执行

准备好了吗？让我们开始 Phase 3.1：分析纯度检查逻辑！

**预计时间**: 30-45分钟
**风险等级**: 低（逻辑清晰，测试覆盖好）
