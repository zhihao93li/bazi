---
name: bazi-logic-refactor
overview: 重构八字计算核心逻辑:修复格局判定(透干优先)、身强身弱(加入调候)、喜忌神(调候为急)三大模块,使算法符合《子平真诠》原理
todos:
  - id: design-seasonal-system
    content: 使用[skill:backend-patterns]设计调候系统的核心数据结构和算法接口
    status: completed
  - id: implement-seasonal-adjustment
    content: 使用[skill:tdd-workflow]实现调候系统(seasonal-adjustment.ts)及其单元测试
    status: completed
    dependencies:
      - design-seasonal-system
  - id: refactor-pattern-calculation
    content: 使用[skill:tdd-workflow]重构格局判定逻辑(pattern-calculation.ts),实现透干优先原则及测试
    status: completed
    dependencies:
      - implement-seasonal-adjustment
  - id: refactor-strength-calculation
    content: 使用[skill:tdd-workflow]重构身强身弱计算(strength-calculation.ts),集成调候因子及测试
    status: completed
    dependencies:
      - implement-seasonal-adjustment
  - id: refactor-favorable-elements
    content: 使用[skill:tdd-workflow]重构喜忌神计算(favorable-elements.ts),实现调候为急原则及测试
    status: completed
    dependencies:
      - refactor-strength-calculation
  - id: integrate-and-validate
    content: 使用[skill:coding-standards]整合所有模块到calculator.ts,进行集成测试和代码规范检查
    status: completed
    dependencies:
      - refactor-pattern-calculation
      - refactor-strength-calculation
      - refactor-favorable-elements
  - id: document-algorithm
    content: 编写算法文档(bazi-algorithm-v2.md),记录优化逻辑和使用真实案例验证输出准确性
    status: completed
    dependencies:
      - integrate-and-validate
---

## 用户需求

用户要求重构八字计算器中的核心算法逻辑,针对三个关键模块进行深度优化,使算法更符合传统命理学中的第一性原理。

## 产品概述

这是一个AI命理分析产品(Tafu.me)的后端API服务,基于Hono框架和TypeScript构建。当前排盘算法在格局判定、身强身弱分析和喜忌神判定上存在逻辑偏差,需要引入"透干优先"、"调候因子"和"调候为急"三大优化原则,使算法输出比市面上排盘软件更准确。

## 核心功能

### 格局判定优化

- 实现"透干优先"原则:优先检查月令藏干中哪个透到天干,而非直接取月令本气
- 支持杂气格识别:当月令藏干透出时,应能正确判定为"杂气X格"
- 建禄格和羊刃格的判定逻辑保持不变
- 特殊格局(从格、专旺格)判定逻辑保持不变

### 身强身弱优化

- 增加"坐禄"权重:从当前30分提高到40-50分,体现坐禄的稳固性
- 引入"调候因子"系统:根据出生季节和五行缺失,计算寒暖燥湿对日主的影响
- 冬季生人缺火:能量"虚冻",需要乘以调候折扣系数(如0.7-0.8)
- 夏季生人缺水:能量"燥热",需要乘以调候折扣系数
- 春秋生人根据具体五行平衡情况调整
- 最终强弱判定需要综合"得令+得地+天干帮扶+调候因子"四个维度

### 喜忌神优化

- 实现"调候为急"原则:在喜忌神判定中,调候需求优先级最高
- 冬季生人:极喜火(暖局),次喜土(泄火生财),忌水(加重寒湿),慎用金(生水加寒)
- 夏季生人:极喜水(润局),次喜金(生水),忌火(加重燥热),慎用木(生火加燥)
- 调候优先于传统的"身强喜官杀食伤财,身弱喜印比"原则
- 在满足调候前提下,再根据身强身弱选择次级喜忌

## 技术栈

当前项目使用以下技术栈:

- **后端框架**: Hono + Node.js + TypeScript
- **数据库**: PostgreSQL + Prisma ORM
- **八字计算**: lunar-typescript库
- **测试框架**: Vitest
- **核心文件**: `/src/lib/bazi/calculator.ts` (1312行)

## 实现方案

### 整体策略

采用**渐进式重构**策略,在保持现有代码结构和API接口不变的前提下,逐步优化内部算法逻辑。重构过程遵循以下原则:

1. **向后兼容**: 所有公共接口保持不变
2. **单一职责**: 将复杂逻辑拆分为独立的纯函数
3. **可测试性**: 每个新增函数都应有对应的单元测试
4. **渐进优化**: 先实现基础调候系统,再逐步完善细节

### 算法设计

#### 1. 调候系统设计(核心基础设施)

**季节判定逻辑**:

```
根据月令地支确定季节:
- 春季(木旺): 寅、卯、辰
- 夏季(火旺): 巳、午、未
- 秋季(金旺): 申、酉、戌
- 冬季(水旺): 亥、子、丑
```

**寒暖燥湿判定**:

```typescript
// 伪代码示意
interface SeasonalAdjustment {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  temperature: 'cold' | 'cool' | 'warm' | 'hot';  // 寒暖
  humidity: 'dry' | 'balanced' | 'wet';           // 燥湿
  urgentNeed: FiveElement;                        // 调候急需五行
  urgentAvoid: FiveElement;                       // 调候忌讳五行
}
```

**调候因子计算**:

```
基础逻辑:
1. 判断日主五行在当前季节的状态(旺/相/休/囚/死)
2. 检查命局中是否有"调候用神"(冬季需火、夏季需水等)
3. 计算调候折扣系数:
   - 冬季生人:
     * 有丙火或丁火 → 系数1.0(正常)
     * 无火但有木 → 系数0.85(木能生火,略有补救)
     * 无火无木,水旺 → 系数0.7(寒冻)
   - 夏季生人:
     * 有壬水或癸水 → 系数1.0
     * 无水但有金 → 系数0.85
     * 无水无金,火旺 → 系数0.7(炎燥)
4. 最终身强身弱得分 = 基础得分 × 调候系数
```

#### 2. 格局判定优化

**透干检查算法**:

```typescript
// 优先级顺序:
1. 检查月令藏干中,哪些透到年干、月干、时干
2. 如果有透干:
   - 按本气→中气→余气的顺序检查
   - 以第一个透出的非比劫十神定格
   - 标记isTransparent=true
3. 如果无透干:
   - 按原有逻辑,遍历藏干取第一个非比劫十神
   - 标记isTransparent=false
```

**格局命名规范**:

```
透干情况:
- 本气透干 → 直接定格(如"正印格")
- 中气透干 → 杂气格(如"杂气正印格")
- 余气透干 → 杂气格

多个透干:
- 取权重最高(本气>中气>余气)的那个
- 相同权重时,取对日主影响最大的十神
```

#### 3. 身强身弱优化

**坐禄权重提升**:

```
当前: 日支藏干中有比劫 → 权重×15分,上限30分
优化: 
- 日支为日主之禄(如甲寅、乙卯) → 固定得40分
- 日支藏干中有比劫但非禄位 → 保持原逻辑15分/个
```

**综合计算公式**:

```typescript
最终得分 = (得令分数 + 得地分数 + 天干帮扶) × 调候系数

强弱判定阈值(需根据实际测试调整):
- 得分 >= 55 → 身强
- 得分 <= 30 → 身弱  
- 30 < 得分 < 55 → 中和
```

#### 4. 喜忌神优化

**调候优先策略**:

```typescript
// 伪代码
function calculateFavorableElements(dayMaster, distribution, seasonalAdjustment) {
  const favorable = [];
  const unfavorable = [];
  
  // 第一优先级: 调候
  if (seasonalAdjustment.temperature === 'cold') {
    favorable.push(seasonalAdjustment.urgentNeed);  // 火
    unfavorable.push(seasonalAdjustment.urgentAvoid); // 水
  } else if (seasonalAdjustment.temperature === 'hot') {
    favorable.push(seasonalAdjustment.urgentNeed);  // 水
    unfavorable.push(seasonalAdjustment.urgentAvoid); // 火
  }
  
  // 第二优先级: 根据身强身弱补充次级喜忌
  if (dayMaster.strength === 'strong') {
    // 身强: 喜官杀、食伤、财星(但不与调候冲突)
    // 如果财星为忌(如冬季忌水财),则跳过
  } else if (dayMaster.strength === 'weak') {
    // 身弱: 喜印星、比劫(但不与调候冲突)
  }
  
  return { favorable, unfavorable };
}
```

### 核心数据结构

需要新增以下类型定义到`types.ts`:

```typescript
// 季节类型
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

// 寒暖类型
export type Temperature = 'cold' | 'cool' | 'warm' | 'hot';

// 燥湿类型  
export type Humidity = 'dry' | 'balanced' | 'wet';

// 调候分析结果
export interface SeasonalAdjustment {
  season: Season;
  temperature: Temperature;
  humidity: Humidity;
  urgentNeed: FiveElement;      // 急需五行
  urgentAvoid: FiveElement;     // 忌讳五行
  adjustmentFactor: number;     // 调候系数(0.7-1.0)
  hasAdjustmentElement: boolean; // 是否有调候用神
  description: string;           // 调候说明
}

// 扩展DayMasterAnalysis,增加调候信息
export interface DayMasterAnalysis {
  // ... 原有字段
  seasonalAdjustment?: SeasonalAdjustment; // 新增调候分析
}

// 扩展PatternInfo,增加透干信息
export interface PatternInfo {
  // ... 原有字段
  transparentStems?: string[];  // 透出的藏干列表
  transparentTenGods?: string[]; // 透出藏干对应的十神
}
```

### 核心目录结构

```
src/lib/bazi/
├── calculator.ts              # [MODIFY] 主计算入口,调用新增的辅助函数
├── types.ts                   # [MODIFY] 新增Season、Temperature、Humidity、SeasonalAdjustment等类型
├── constants.ts               # [MODIFY] 新增季节映射表、坐禄映射表等常量
├── seasonal-adjustment.ts     # [NEW] 调候系统核心逻辑。包含:
│                              #   - getSeason(): 根据月令地支判断季节
│                              #   - getTemperatureAndHumidity(): 判断寒暖燥湿
│                              #   - calculateSeasonalAdjustment(): 计算调候因子和急需五行
│                              #   - hasAdjustmentElement(): 检查命局是否有调候用神
│                              #   - 导出纯函数,便于单元测试
├── pattern-calculation.ts     # [NEW] 格局判定优化逻辑。包含:
│                              #   - checkTransparentStems(): 检查月令藏干透出情况
│                              #   - determinePatternByTransparency(): 根据透干判定格局
│                              #   - 重构后的calculatePattern()主函数
│                              #   - 遵循"透干优先,本气次之"原则
├── strength-calculation.ts    # [NEW] 身强身弱优化逻辑。包含:
│                              #   - checkLuPosition(): 检查是否坐禄,返回禄位得分
│                              #   - calculateBaseStrength(): 计算基础得分(得令+得地+天干)
│                              #   - applySeasonalAdjustment(): 应用调候系数
│                              #   - determineStrength(): 最终强弱判定
│                              #   - 更新后的calculateDayMaster()主函数
└── favorable-elements.ts      # [NEW] 喜忌神优化逻辑。包含:
                               #   - calculateFavorableWithSeasonal(): 基于调候优先的喜忌神算法
                               #   - getPrimaryFavorable(): 获取调候层面的首要喜忌
                               #   - getSecondaryFavorable(): 获取身强身弱层面的次要喜忌
                               #   - 更新后的calculateFavorableElements()主函数

__tests__/
├── seasonal-adjustment.test.ts  # [NEW] 调候系统单元测试。测试场景:
│                                #   - 冬季甲木无火 → 调候系数应为0.7
│                                #   - 冬季甲木有丙火 → 调候系数应为1.0
│                                #   - 夏季丙火无水 → 调候系数应为0.7
│                                #   - 各季节的寒暖燥湿判定准确性
├── pattern-calculation.test.ts  # [NEW] 格局判定单元测试。测试场景:
│                                #   - 月令癸丑,癸透月干 → 应判定为"杂气正印格"
│                                #   - 月令己丑,己不透干 → 应判定为"正财格"
│                                #   - 多个藏干透出时的优先级判定
├── strength-calculation.test.ts # [NEW] 身强身弱单元测试。测试场景:
│                                #   - 甲木坐寅(坐禄) → 应得40分以上
│                                #   - 冬季甲木无火 → 最终得分应打折
│                                #   - 边界情况测试(得分临界值)
└── favorable-elements.test.ts   # [NEW] 喜忌神单元测试。测试场景:
                                 #   - 冬季甲木 → 应极喜火,次喜土,忌水
                                 #   - 身强但冬季 → 调候优先于传统身强喜忌
                                 #   - 调候与身强身弱冲突时的处理
```

## 实现细节

### 性能考虑

- **时间复杂度**: 所有新增函数均为O(1)或O(n),n为固定常量(如藏干最多3个),不会影响整体性能
- **空间复杂度**: 新增数据结构占用内存极小,可忽略不计
- **缓存策略**: 无需缓存,每次计算都是实时的,确保数据准确性

### 向后兼容性

- **公共API不变**: `calculateBazi()`函数签名和返回值结构保持完全兼容
- **扩展字段**: 在现有类型中新增可选字段(如`seasonalAdjustment?`),不影响现有代码
- **渐进迁移**: 旧算法逻辑保留在原函数中,新算法通过可选参数或环境变量控制启用

### 日志和调试

- **调试模式**: 在开发环境下,输出详细的调候计算过程和格局判定依据
- **关键节点日志**: 记录调候系数、透干情况、最终得分等关键数据,便于验证算法正确性
- **错误处理**: 对异常情况(如月令地支不合法)进行graceful fallback,不影响整体计算

### 测试覆盖率目标

- **单元测试**: 每个新增函数至少3个测试用例(正常、边界、异常)
- **集成测试**: 使用真实八字案例进行端到端测试,验证算法输出准确性
- **覆盖率要求**: 新增代码测试覆盖率达到85%以上
- **回归测试**: 确保重构不影响现有功能,所有旧测试用例仍然通过

### 文档更新

- **算法说明**: 在`/docs`目录下新增`bazi-algorithm-v2.md`,详细说明优化后的算法逻辑
- **API文档**: 更新类型定义说明,补充新增字段的含义和用途
- **示例对比**: 提供优化前后的八字分析对比案例,展示算法改进效果

## Agent Extensions

### Skill

- **tdd-workflow**
- 目的: 确保所有新增算法函数都有完整的单元测试覆盖
- 预期结果: 测试覆盖率达到85%以上,每个核心函数至少有3个测试用例(正常、边界、异常场景)

- **coding-standards**
- 目的: 保持代码风格一致,遵循TypeScript和函数式编程最佳实践
- 预期结果: 所有新增代码符合项目eslint规则,函数设计遵循单一职责原则,易于测试和维护

- **backend-patterns**
- 目的: 应用后端架构最佳实践,确保算法模块化和可扩展性
- 预期结果: 算法逻辑拆分为独立的纯函数模块,便于单元测试和未来扩展