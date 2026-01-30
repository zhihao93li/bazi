# 八字 SDK 化实施计划（务实版）

> 基于当前项目的**实际功能**，制定的可执行 SDK 化方案

---

## 📋 项目背景

### **当前状态**
- ✅ 核心命理算法 100% 自己实现（强弱、格局、喜忌）
- ✅ 代码架构优秀（detector/ 五层设计）
- ⚠️ 四柱排盘依赖 `lunar-typescript`
- ⚠️ 大运流年、神煞依赖 `lunar-typescript`
- 📦 代码耦合在当前项目中，无法跨项目复用

### **目标**
- 🎯 将核心逻辑封装成 SDK，可在其他项目中使用
- 🎯 提供灵活的 API，支持分步调用和一键计算
- 🎯 保持轻量，按需加载（50KB-200KB）
- 🎯 对外隐藏 `lunar-typescript` 依赖

---

## 🎯 实施策略

### **核心原则**

1. **先提取，后优化** - 优先把已有代码变成 SDK，别追求完美
2. **保持依赖** - 短期内保留 `lunar-typescript`，别重复造轮子
3. **分步发布** - 先发布核心功能，再逐步增强
4. **向后兼容** - 保证当前项目可以平滑迁移到 SDK

---

## 📦 包结构设计（简化版）

```
packages/
├── core/                           # 50KB - 核心包
│   ├── src/
│   │   ├── calendar/               # 历法转换（封装 lunar）
│   │   ├── solar-time/             # ✅ 真太阳时（你的代码）
│   │   ├── constants/              # ✅ 常量数据（你的代码）
│   │   └── types/                  # ✅ 类型定义（你的代码）
│   └── package.json
│
├── analysis/                       # 40KB - 分析包
│   ├── src/
│   │   ├── strength/               # ✅ 日主强弱（你的代码）
│   │   ├── seasonal/               # ✅ 调候分析（你的代码）
│   │   ├── favorable/              # ✅ 喜忌用神（你的代码）
│   │   └── ten-gods/               # ✅ 十神分析（你的代码）
│   └── package.json
│
├── pattern/                        # 60KB - 格局包
│   ├── src/
│   │   ├── detector/               # ✅ 你的 5 层架构
│   │   ├── types/                  # ✅ 格局类型（专旺/从格/化气）
│   │   └── calculator.ts           # ✅ 格局计算主入口
│   └── package.json
│
├── fortune/                        # 30KB - 运势包
│   ├── src/
│   │   └── dayun/                  # ⚠️ 封装 lunar
│   └── package.json
│
├── utils/                          # 25KB - 工具包
│   ├── src/
│   │   ├── geo/                    # ✅ 地理工具（你的代码）
│   │   └── astronomy/              # ✅ 天文工具（你的代码）
│   └── package.json
│
└── bazi-sdk/                       # 200KB - 主包（聚合所有子包）
    ├── src/
    │   ├── BaziSDK.ts              # 统一门面
    │   └── index.ts
    └── package.json
```

---

## 🚀 实施阶段（6周计划）

### **阶段 0: 准备工作**（3天）

#### **任务清单**

- [ ] 创建 Monorepo 结构
  ```bash
  mkdir -p packages/{core,analysis,pattern,fortune,utils,bazi-sdk}
  ```

- [ ] 配置工具链
  - [ ] pnpm workspace 配置
  - [ ] tsup 构建配置
  - [ ] TypeScript 配置（tsconfig.json）
  - [ ] ESLint + Prettier

- [ ] 准备测试环境
  - [ ] Vitest 配置
  - [ ] 准备测试用例数据

#### **deliverable**

```
bazi-sdk/
├── pnpm-workspace.yaml
├── tsconfig.json
├── .eslintrc.js
└── packages/
    └── (空目录，已创建)
```

---

### **阶段 1: Core 包**（1周）

#### **目标**: 提取基础功能，封装 lunar 依赖

#### **任务 1.1: 提取真太阳时模块**

- [ ] 复制 `calculator.ts` 中的真太阳时函数
- [ ] 创建 `packages/core/src/solar-time/`
  - `calculator.ts` - 真太阳时计算
  - `julian-day.ts` - 儒略日计算
  - `equation-of-time.ts` - 均时差计算

**代码示例**:
```typescript
// packages/core/src/solar-time/calculator.ts
export function calculateTrueSolarTime(params: {
  localTime: Date;
  longitude: number;
  latitude: number;
}): TrueSolarTimeResult {
  // ✅ 直接复制你的代码
  const julianDay = calculateJulianDay(...);
  const equationOfTime = getEquationOfTime(julianDay);
  // ...
}
```

#### **任务 1.2: 提取常量数据**

- [ ] 复制 `constants.ts` → `packages/core/src/constants/`
  - `stems.ts` - 天干
  - `branches.ts` - 地支
  - `elements.ts` - 五行
  - `ten-gods.ts` - 十神

#### **任务 1.3: 提取类型定义**

- [ ] 复制 `types.ts` → `packages/core/src/types/`
- [ ] 只保留核心类型（BirthData, FourPillars, Stem, Branch 等）

#### **任务 1.4: 封装 lunar-typescript**

- [ ] 创建 `packages/core/src/calendar/lunar-adapter.ts`

**代码示例**:
```typescript
// packages/core/src/calendar/lunar-adapter.ts
import { Solar, Lunar } from 'lunar-typescript';

/**
 * 封装 lunar-typescript，对外隐藏实现细节
 */
export class LunarAdapter {
  /**
   * 计算四柱
   */
  static calculateFourPillars(birthData: BirthData): FourPillars {
    // 内部调用 lunar-typescript
    const solar = Solar.fromYmdHms(...);
    const lunar = solar.getLunar();
    const eightChar = lunar.getEightChar();
    
    // 转换为统一的数据结构
    return this.convertToFourPillars(eightChar);
  }
  
  private static convertToFourPillars(eightChar: any): FourPillars {
    // 数据转换逻辑
    // ...
  }
}
```

#### **任务 1.5: 创建 Core API**

- [ ] 创建 `packages/core/src/index.ts`

```typescript
// packages/core/src/index.ts
export { calculateTrueSolarTime } from './solar-time/calculator';
export { LunarAdapter } from './calendar/lunar-adapter';
export * from './constants';
export * from './types';

/**
 * Core 包的主类（可选，提供面向对象接口）
 */
export class BaziCore {
  calculateFourPillars(birthData: BirthData): FourPillars {
    return LunarAdapter.calculateFourPillars(birthData);
  }
  
  calculateTrueSolarTime(params: TrueSolarTimeParams) {
    return calculateTrueSolarTime(params);
  }
}
```

#### **任务 1.6: 测试**

- [ ] 编写单元测试
- [ ] 对比原项目，确保输出一致

#### **Deliverable**

```
packages/core/
├── src/
│   ├── solar-time/
│   ├── calendar/
│   ├── constants/
│   ├── types/
│   └── index.ts
├── package.json
└── dist/ (构建后)
```

**可以发布**: `npm publish @your-org/bazi-sdk-core@0.1.0`

---

### **阶段 2: Analysis 包**（1周）

#### **目标**: 提取你的核心命理算法

#### **任务 2.1: 提取日主强弱模块**

- [ ] 复制 `strength-calculation.ts` → `packages/analysis/src/strength/`
- [ ] 移除对当前项目的依赖，改为依赖 `@your-org/bazi-sdk-core`

**代码示例**:
```typescript
// packages/analysis/src/strength/calculator.ts
import type { FourPillars, HeavenlyStem } from '@your-org/bazi-sdk-core';

export function calculateDayMasterStrength(
  dayStem: HeavenlyStem,
  fourPillars: FourPillars
): DayMasterAnalysis {
  // ✅ 直接复制你的代码
  const baseAnalysis = calculateBaseStrength(dayStem, fourPillars);
  // ...
}
```

#### **任务 2.2: 提取调候模块**

- [ ] 复制 `seasonal-adjustment.ts` → `packages/analysis/src/seasonal/`

#### **任务 2.3: 提取喜忌用神模块**

- [ ] 复制 `favorable-elements.ts` → `packages/analysis/src/favorable/`

#### **任务 2.4: 提取十神模块**

- [ ] 从 `calculator.ts` 提取 `getTenGod()` → `packages/analysis/src/ten-gods/`

#### **任务 2.5: 创建 Analysis API**

```typescript
// packages/analysis/src/index.ts
export { calculateDayMasterStrength } from './strength';
export { calculateSeasonalAdjustment } from './seasonal';
export { calculateFavorableElements } from './favorable';
export { calculateTenGods } from './ten-gods';

/**
 * Analysis 包的主类
 */
export class BaziAnalyzer {
  analyzeDayMaster(fourPillars: FourPillars): DayMasterAnalysis {
    // ...
  }
  
  analyzeFavorableElements(dayMaster: DayMaster): FavorableElements {
    // ...
  }
}
```

#### **Deliverable**

```
packages/analysis/
├── src/
│   ├── strength/
│   ├── seasonal/
│   ├── favorable/
│   ├── ten-gods/
│   └── index.ts
└── package.json
```

**可以发布**: `npm publish @your-org/bazi-sdk-analysis@0.1.0`

---

### **阶段 3: Pattern 包**（1.5周）

#### **目标**: 提取你的格局检测系统（最有价值的部分！）

#### **任务 3.1: 复制 detector 目录**

- [ ] 整个 `detector/` 目录 → `packages/pattern/src/detector/`
- [ ] 修改导入路径，指向 core 和 analysis 包

```typescript
// 修改前
import { BRANCH_CLASH_MAP } from '../constants.js';

// 修改后
import { BRANCH_CLASH_MAP } from '@your-org/bazi-sdk-core';
```

#### **任务 3.2: 提取格局类型**

- [ ] 复制 `prosperity-pattern.ts` → `packages/pattern/src/types/prosperity.ts`
- [ ] 复制 `follow-pattern.ts` → `packages/pattern/src/types/follow.ts`
- [ ] 复制 `transformation-pattern.ts` → `packages/pattern/src/types/transformation.ts`

#### **任务 3.3: 提取格局计算主逻辑**

- [ ] 复制 `pattern-calculation.ts` → `packages/pattern/src/calculator.ts`

#### **任务 3.4: 创建 Pattern API**

```typescript
// packages/pattern/src/index.ts
export * from './detector';
export * from './types';
export { calculatePattern } from './calculator';

/**
 * Pattern 包的主类
 */
export class PatternDetector {
  detect(
    fourPillars: FourPillars,
    dayMaster: DayMasterAnalysis,
    fiveElements: FiveElementsAnalysis
  ): PatternInfo {
    return calculatePattern(fourPillars, dayMaster, fiveElements);
  }
}
```

#### **Deliverable**

```
packages/pattern/
├── src/
│   ├── detector/              # ✅ 你的 5 层架构
│   │   ├── structural-analyzer.ts
│   │   ├── purity-checker.ts
│   │   ├── score-recalculator.ts
│   │   ├── conflict-engine.ts
│   │   └── pattern-dispatcher.ts
│   ├── types/                 # ✅ 格局类型
│   │   ├── prosperity.ts
│   │   ├── follow.ts
│   │   └── transformation.ts
│   ├── calculator.ts
│   └── index.ts
└── package.json
```

**可以发布**: `npm publish @your-org/bazi-sdk-pattern@0.1.0`

---

### **阶段 4: Fortune & Utils 包**（3天）

#### **任务 4.1: Fortune 包（封装 lunar）**

```typescript
// packages/fortune/src/dayun/calculator.ts
import { LunarAdapter } from '@your-org/bazi-sdk-core';

export class DayunCalculator {
  calculate(fourPillars: FourPillars, birthData: BirthData) {
    // 内部调用 lunar
    const yunObj = LunarAdapter.getYun(fourPillars);
    
    // 格式化输出
    return this.formatYun(yunObj);
  }
}
```

#### **任务 4.2: Utils 包**

- [ ] 复制 `geo-utils.ts` → `packages/utils/src/geo/`
- [ ] 复制 `city-geo-data.json` → `packages/utils/src/geo/data/`

```typescript
// packages/utils/src/index.ts
export { getLongitudeFromLocation } from './geo/calculator';
export { CITY_GEO_DATA } from './geo/data';
```

#### **Deliverable**

- `@your-org/bazi-sdk-fortune@0.1.0`
- `@your-org/bazi-sdk-utils@0.1.0`

---

### **阶段 5: 主包（BaziSDK）**（3天）

#### **目标**: 创建统一的门面 API，聚合所有子包

#### **任务 5.1: 创建主类**

```typescript
// packages/bazi-sdk/src/BaziSDK.ts
import { BaziCore } from '@your-org/bazi-sdk-core';
import { BaziAnalyzer } from '@your-org/bazi-sdk-analysis';
import { PatternDetector } from '@your-org/bazi-sdk-pattern';
import { DayunCalculator } from '@your-org/bazi-sdk-fortune';

/**
 * 八字 SDK 主类 - 提供统一的门面 API
 */
export class BaziSDK {
  private core: BaziCore;
  private analyzer: BaziAnalyzer;
  private patternDetector: PatternDetector;
  private dayunCalculator: DayunCalculator;
  
  constructor() {
    this.core = new BaziCore();
    this.analyzer = new BaziAnalyzer();
    this.patternDetector = new PatternDetector();
    this.dayunCalculator = new DayunCalculator();
  }
  
  /**
   * 方式 1: 一键计算（最简单）
   */
  calculate(birthData: BirthData): BaziResult {
    const fourPillars = this.core.calculateFourPillars(birthData);
    const dayMaster = this.analyzer.analyzeDayMaster(fourPillars);
    const fiveElements = this.analyzer.analyzeFiveElements(fourPillars, dayMaster);
    const pattern = this.patternDetector.detect(fourPillars, dayMaster, fiveElements);
    const dayun = this.dayunCalculator.calculate(fourPillars, birthData);
    
    return {
      fourPillars,
      dayMaster,
      fiveElements,
      pattern,
      dayun
    };
  }
  
  /**
   * 方式 2: 分步调用（灵活控制）
   */
  getFourPillars(birthData: BirthData): FourPillars {
    return this.core.calculateFourPillars(birthData);
  }
  
  analyzeDayMaster(fourPillars: FourPillars): DayMasterAnalysis {
    return this.analyzer.analyzeDayMaster(fourPillars);
  }
  
  detectPattern(
    fourPillars: FourPillars,
    dayMaster: DayMasterAnalysis,
    fiveElements: FiveElementsAnalysis
  ): PatternInfo {
    return this.patternDetector.detect(fourPillars, dayMaster, fiveElements);
  }
}
```

#### **任务 5.2: 导出所有子包内容**

```typescript
// packages/bazi-sdk/src/index.ts

// 导出主类
export { BaziSDK } from './BaziSDK';

// 重新导出所有子包（方便用户直接从主包导入）
export * from '@your-org/bazi-sdk-core';
export * from '@your-org/bazi-sdk-analysis';
export * from '@your-org/bazi-sdk-pattern';
export * from '@your-org/bazi-sdk-fortune';
export * from '@your-org/bazi-sdk-utils';
```

#### **Deliverable**

**可以发布**: `npm publish @your-org/bazi-sdk@0.1.0`

---

### **阶段 6: 文档和示例**（3天）

#### **任务 6.1: 编写 README**

每个包都需要独立的 README：

```markdown
# @your-org/bazi-sdk

八字命理计算 SDK - 专业、准确、易用

## 安装

```bash
npm install @your-org/bazi-sdk
```

## 快速开始

```typescript
import { BaziSDK } from '@your-org/bazi-sdk';

const bazi = new BaziSDK();

const result = bazi.calculate({
  year: 1990,
  month: 10,
  day: 15,
  hour: 14,
  minute: 30,
  location: '北京',
  calendarType: 'solar'
});

console.log(result.dayMaster.strength); // "strong"
console.log(result.pattern.type); // "prosperity"
```

## API 文档

...
```

#### **任务 6.2: 编写使用示例**

创建 `examples/` 目录：

```
examples/
├── 01-basic-calculation.ts       # 基础计算
├── 02-step-by-step.ts            # 分步调用
├── 03-pattern-detection.ts       # 格局检测
├── 04-favorable-elements.ts      # 喜忌用神
└── 05-dayun-analysis.ts          # 大运分析
```

#### **任务 6.3: 生成 API 文档**

使用 TypeDoc 生成 API 文档：

```bash
pnpm add -D typedoc
npx typedoc --out docs packages/bazi-sdk/src/index.ts
```

---

## 📊 交付物清单

### **核心产出**

| 包 | 版本 | 体积 | 功能 |
|----|------|------|------|
| `@your-org/bazi-sdk-core` | 0.1.0 | ~50KB | 四柱计算、真太阳时 |
| `@your-org/bazi-sdk-analysis` | 0.1.0 | ~40KB | 强弱分析、喜忌用神 |
| `@your-org/bazi-sdk-pattern` | 0.1.0 | ~60KB | 格局检测 |
| `@your-org/bazi-sdk-fortune` | 0.1.0 | ~30KB | 大运流年 |
| `@your-org/bazi-sdk-utils` | 0.1.0 | ~25KB | 地理工具 |
| `@your-org/bazi-sdk` | 0.1.0 | ~200KB | 主包（全功能） |

### **文档产出**

- [ ] 每个包的 README.md
- [ ] API 文档（TypeDoc 生成）
- [ ] 使用示例（5+ 个场景）
- [ ] 迁移指南（帮助当前项目迁移到 SDK）

---

## 🔧 技术栈

### **构建工具**

```json
{
  "devDependencies": {
    "typescript": "^5.3.0",
    "tsup": "^8.0.0",           // 构建工具
    "vitest": "^1.0.0",         // 测试框架
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

### **Monorepo 管理**

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
```

### **构建配置**

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],       // CommonJS + ESM
  dts: true,                     // 生成 .d.ts
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: true,                  // 压缩
  treeshake: true,               // Tree-shaking
});
```

---

## 📈 迁移路径

### **当前项目如何使用 SDK**

#### **方案 1: 渐进式迁移**

```typescript
// 第 1 步：先安装 SDK
npm install @your-org/bazi-sdk

// 第 2 步：逐步替换旧代码
// 修改前
import { calculateBazi } from './lib/bazi/calculator';

// 修改后
import { BaziSDK } from '@your-org/bazi-sdk';
const bazi = new BaziSDK();

// 第 3 步：验证输出一致
// 第 4 步：删除旧代码
```

#### **方案 2: 保持双版本**

```typescript
// 短期内保持两套代码并存
// 1. 旧代码继续维护（用于当前项目）
// 2. SDK 独立演进（用于新项目）
// 3. 逐步收敛
```

---

## ✅ 验收标准

### **功能验收**

- [ ] 所有核心功能都能正常工作
- [ ] 输出结果与原项目一致（通过测试验证）
- [ ] 支持三种使用方式（一键、分步、链式）
- [ ] 所有包都能独立安装和使用

### **质量验收**

- [ ] 单元测试覆盖率 > 80%
- [ ] 所有包都有 TypeScript 类型定义
- [ ] 所有包都有 README 文档
- [ ] 构建产物体积符合预期

### **发布验收**

- [ ] 所有包都能成功发布到 npm
- [ ] 包之间的依赖关系正确
- [ ] 版本号统一（0.1.0）

---

## 🎯 成功指标

### **短期目标**（6周后）

- ✅ 6 个包全部发布到 npm
- ✅ 完整的 API 文档
- ✅ 5+ 个使用示例
- ✅ 当前项目成功迁移到 SDK

### **中期目标**（3个月后）

- ✅ 在 2-3 个新项目中使用
- ✅ 收集用户反馈，迭代优化
- ✅ 性能优化（体积、速度）
- ✅ 添加更多测试用例

### **长期目标**（6个月后）

- ✅ 开源到 GitHub
- ✅ 社区采用（10+ stars）
- ✅ 持续维护和更新

---

## 📅 时间表

| 周 | 阶段 | 主要任务 | 交付物 |
|----|------|---------|--------|
| **W1** | 准备 + Core 包 | 项目搭建、提取 core | Core 包 0.1.0 |
| **W2** | Analysis 包 | 提取分析模块 | Analysis 包 0.1.0 |
| **W3-W4** | Pattern 包 | 提取格局检测 | Pattern 包 0.1.0 |
| **W5** | Fortune + Utils | 提取运势和工具 | Fortune/Utils 包 0.1.0 |
| **W6** | 主包 + 文档 | 统一门面、文档 | 主包 0.1.0 + 完整文档 |

---

## 💡 注意事项

### **关键风险**

| 风险 | 应对措施 |
|-----|---------|
| **导入路径混乱** | 使用 path mapping，统一管理 |
| **类型定义不一致** | 创建统一的 types 包 |
| **测试覆盖不足** | 每个阶段都写测试 |
| **构建失败** | 提前配置好 tsup |
| **版本依赖冲突** | 使用 pnpm workspace 统一管理 |

### **最佳实践**

1. **每个阶段都提交代码** - 防止丢失进度
2. **每个包独立测试** - 确保可以单独使用
3. **保持向后兼容** - 不要破坏当前项目
4. **及时写文档** - 别等到最后
5. **小步快跑** - 先发布基础版本，再迭代

---

## 🚀 后续优化方向

### **Version 0.2.0** (SDK 发布后)

- [ ] 添加插件系统
- [ ] 添加格局注册表（动态注册）
- [ ] 性能优化（lazy loading）
- [ ] 添加更多格局类型

### **Version 0.3.0**

- [ ] 支持浏览器直接使用（UMD）
- [ ] 添加 CDN 支持
- [ ] 国际化支持（英文文档）

### **Version 1.0.0**

- [ ] API 稳定
- [ ] 完整的测试覆盖
- [ ] 生产级性能
- [ ] 社区验证

---

## 📞 需要帮助？

如果在实施过程中遇到问题：

1. **技术问题** - 检查各包的 README
2. **API 使用** - 查看 examples/ 目录
3. **迁移问题** - 参考迁移指南

---

**总结**: 这是一个 **6 周完成 MVP** 的务实计划。重点是：

1. ✅ **先提取已有代码**（别重写）
2. ✅ **保留 lunar 依赖**（别造轮子）
3. ✅ **小步快跑**（先发布，再优化）
4. ✅ **向后兼容**（当前项目能平滑迁移）

每个阶段都有明确的交付物和验收标准，执行起来比较清晰。准备好开始了吗？🎯
