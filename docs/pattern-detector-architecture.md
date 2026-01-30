# PatternDetector 架构文档

## 🎯 设计理念

**第一性原理**: 结构 > 纯度 > 分数 (Structure > Purity > Score)

将格局判定从"经验规则堆砌"升级为"物理建模推演"，让算法具有物理意义的能量建模。

---

## 📐 五层架构

```
┌──────────────────────────────────────────────────────────┐
│                    PatternDetector                        │
│                   (主协调引擎)                             │
└──────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
    ┌───────────┐   ┌──────────────┐   ┌──────────┐
    │ Structural│   │ScoreRecalc-  │   │ Purity   │
    │ Analyzer  │──▶│   ulator     │──▶│ Checker  │
    │ (结构层)   │   │  (能量层)     │   │(纯度层)   │
    └───────────┘   └──────────────┘   └──────────┘
         │                  │                  │
         └──────────────────┼──────────────────┘
                            ▼
                    ┌──────────────┐
                    │  Conflict    │
                    │   Engine     │
                    │  (冲突层)     │
                    └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   Pattern    │
                    │  Dispatcher  │
                    │  (决策层)     │
                    └──────────────┘
```

---

## 🔧 核心模块

### 1. StructuralAnalyzer (结构特征层)
**职责**: 识别地支之间的"化学反应"

**功能**:
- ✅ 全三合局检测 (San He): 申子辰、寅午戌等
- ✅ 三会方检测 (San Hui): 亥子丑、寅卯辰等
- ✅ 半三合检测 (Ban San He): 申子、子辰等
- ✅ 空亡衰减 (Void Damping): 核心地支空亡时转化率降至0.6

**物理意义**: "结构决定反应类型"

---

### 2. ScoreRecalculator (能量重算层)
**职责**: 根据合局重定向能量流

**算法**:
```typescript
目标五行得分 += 原五行得分 × 转化率
原五行得分 -= 原五行得分 × 转化率
```

**例子**:
- 申子辰三合水局 (转化率1.0)
- 申(金) 20分 → 转移20分给水
- 辰(土) 15分 → 转移15分给水
- 水: 原60分 → 95分 ✅

**物理意义**: "化学反应导致元素重组"

---

### 3. PurityChecker (纯度检查层)
**职责**: 执行"一票否决"检查

**检查项**:
1. **天干透出禁忌** (Stem Purity)
   - 润下格禁忌土(戊己) ❌
   - 炎上格禁忌水(壬癸) ❌

2. **藏干权重超标** (Hidden Stem Weight)
   - 禁忌元素占比 > 15% → 破格
   - 【优化】库墓(辰戌丑未)中的禁忌权重减半

**物理意义**: "纯度决定真伪"

---

### 4. ConflictEngine (冲突衰减层)
**职责**: 计算现实世界中的能量损耗

**功能**:
1. **刑冲破害扣分** (Clash Penalty)
   - 寅申冲 → 扣20%
   - 最多扣60%

2. **墓库开启判定** (Grave Opening)
   - 辰戌冲 / 丑未冲 → 打开库门
   - 释放藏干能量

3. **合绊状态检测** (Blocking Links)
   - 子丑合不化 → 能量锁定
   - 标记为 Blocked 状态

4. **调候系数应用** (Seasonal Adjustment)
   - 冬月火命 → 系数0.7
   - 夏月水命 → 系数0.8

**物理意义**: "现实有摩擦"

---

### 5. PatternDispatcher (决策中心)
**职责**: 执行格局判定的决策树

**优先级** (从高到低):
```
1. 化气格 (天干五合 + 月令支持)
   ↓
2. 专旺格 (全三合/三会 + 日主同五行 + 分数>75%)
   ↓
3. 禄刃格 (月支直接判定)
   ↓
4. 从格 (日主<20 + 目标五行旺)
   ↓
5. 普通格 (透干优先)
   ↓
6. 杂格 (兜底)
```

**物理意义**: "分层决策,逐级匹配"

---

## 🔄 执行流程

```
Input (四柱 + 日主 + 五行分布 + 旬空)
  │
  ▼
┌─────────────────────────────────────┐
│ 第一层: 结构特征分析                  │
│ - 检测三合局/三会局/半三合            │
│ - 输出: HarmonyCheck                 │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ 第二层: 能量重算                      │
│ - 根据合局重定向能量                  │
│ - 输出: RecalculatedDistribution     │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ 第三层: 冲突与衰减                    │
│ - 计算刑冲破害、墓库、合绊            │
│ - 输出: ConflictReport               │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ 第四层: 格局分流决策                  │
│ - 按优先级匹配格局                    │
│ - 输出: CandidatePattern             │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ 第五层: 纯度验证                      │
│ - 对特殊格局执行一票否决              │
│ - 不通过则降级为普通格局               │
└─────────────────────────────────────┘
  │
  ▼
Output (PatternInfo)
```

---

## 📊 数据流

### DetectionContext (贯穿整个流程)
```typescript
interface DetectionContext {
  // 输入数据
  fourPillars: FourPillars;
  dayMaster: DayMaster;
  fiveElements: FiveElementsAnalysis;
  xunKong?: string;
  
  // 结构层输出
  harmony?: HarmonyCheck;
  
  // 能量层输出
  recalculatedDistribution?: RecalculatedDistribution;
  
  // 冲突层输出
  clashPenalty?: number;
  seasonalAdjustment?: number;
  graveOpened?: boolean;
  blockingLinks?: Array<{branch1: string; branch2: string}>;
}
```

---

## 🎯 核心优势

### 1. 可解释性 (Explainability)
每一步决策都有明确的物理意义:
- ❌ "分数够了就是润下格" (旧逻辑)
- ✅ "申子辰三合水局成立 → 水分重算至90% → 天干无土透 → 润下格成立" (新逻辑)

### 2. 可扩展性 (Extensibility)
新增格局只需:
1. 在 `PatternDispatcher` 中添加判定逻辑
2. 在 `PurityChecker` 中添加纯度规则

### 3. 可测试性 (Testability)
每个子系统独立可测:
```typescript
const analyzer = new StructuralAnalyzer();
const harmony = analyzer.analyze(ctx);
expect(harmony.type).toBe('full');
```

### 4. 可调试性 (Debuggability)
每层输出都记录到 `DetectionContext`:
```typescript
console.log(ctx.harmony);           // 结构层输出
console.log(ctx.recalculatedDistribution);  // 能量层输出
console.log(ctx.clashPenalty);      // 冲突层输出
```

---

## 📁 文件结构

```
src/lib/bazi/
├── pattern-detector.ts              # 主引擎
├── detector/
│   ├── structural-analyzer.ts       # 结构层
│   ├── score-recalculator.ts        # 能量层
│   ├── purity-checker.ts            # 纯度层
│   ├── conflict-engine.ts           # 冲突层
│   └── pattern-dispatcher.ts        # 决策层
├── types.ts                         # 类型定义
└── constants.ts                     # 配置常量
```

---

## 🚀 使用示例

```typescript
import { PatternDetector } from './pattern-detector';

const detector = new PatternDetector();
const pattern = detector.detect(
  fourPillars,
  dayMaster,
  fiveElements,
  xunKong
);

console.log(pattern.name);        // "润下格"
console.log(pattern.category);    // "special"
console.log(pattern.harmonyInfo); // { type: 'full', element: 'water', ... }
```

---

## 🔬 与旧系统对比

| 维度 | 旧系统 (pattern-calculation.ts) | 新系统 (PatternDetector) |
|------|--------------------------------|-------------------------|
| **架构** | 单一函数 (1000+ 行) | 五层架构 (5个子系统) |
| **逻辑** | 数值堆砌 | 物理建模 |
| **可读性** | if-else 地狱 | 分层清晰 |
| **可测试性** | 难以单元测试 | 每层独立可测 |
| **可扩展性** | 修改困难 | 插件化扩展 |
| **调试** | 黑盒 | 白盒 (每层可追踪) |

---

## 🎓 核心概念

### 第一性原理 (First Principles)
1. **结构先于分数**: 先看有没有三合局,再看分数够不够
2. **纯度决定真伪**: 天干透土,润下格立刻破格
3. **能量守恒**: 合化后的能量总和不变,只是重新分配
4. **现实有摩擦**: 冲克会损耗能量,调候会影响发挥

### 物理类比
- **三合局** = 化学反应 (元素重组)
- **空亡** = 阻尼器 (削弱反应)
- **透出** = 催化剂 (加速/破坏反应)
- **冲克** = 摩擦力 (能量损耗)

---

## 📌 TODO (后续优化)

- [ ] 实现墓库开启的能量释放逻辑
- [ ] 实现合绊状态的分数锁定
- [ ] 优化 `estimateBranchContribution` 算法 (考虑藏干权重)
- [ ] 添加单元测试覆盖所有子系统
- [ ] 添加性能基准测试
- [ ] 前端可视化调试工具 (展示每层输出)

---

## 🎉 总结

**PatternDetector** 是 Tafu.me 的"大脑升级"，将格局判定从：
- ❌ "数数游戏" → ✅ "逻辑推演"
- ❌ "黑盒算法" → ✅ "白盒建模"
- ❌ "经验堆砌" → ✅ "第一性原理"

它不仅能识别出"润下格"，还能告诉你**为什么它是真格**，以及**哪里差一点就破格了**。
