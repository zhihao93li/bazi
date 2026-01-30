# 八字计算 SDK 设计方案

## 📋 目录
- [设计目标](#设计目标)
- [核心架构](#核心架构)
- [API 设计](#api-设计)
- [使用示例](#使用示例)
- [工程化方案](#工程化方案)
- [发布策略](#发布策略)

---

## 🎯 设计目标

### 1. **灵活性** - 多种使用方式
```typescript
// 方式1: 一次性计算全部
const result = bazi.calculate(birthData);

// 方式2: 分步计算（按需）
const fourPillars = bazi.getFourPillars(birthData);
const dayMaster = bazi.analyzeDayMaster(fourPillars);
const pattern = bazi.detectPattern(fourPillars, dayMaster);

// 方式3: 流式计算（链式调用）
const result = bazi
  .withBirthData(birthData)
  .calculateFourPillars()
  .analyzeDayMaster()
  .detectPattern()
  .getResult();
```

### 2. **可扩展性** - 插件机制
```typescript
// 注册自定义分析器
bazi.registerAnalyzer('custom', new MyCustomAnalyzer());

// 注册自定义格局检测器
bazi.registerPatternDetector('specialPattern', new MyPatternDetector());
```

### 3. **轻量化** - 按需加载
```typescript
// 只加载核心模块（最小体积）
import { BaziCore } from '@your-org/bazi-sdk';

// 加载完整功能
import { BaziSDK } from '@your-org/bazi-sdk';

// 按需加载插件
import { PatternAnalyzer } from '@your-org/bazi-sdk/plugins/pattern';
```

### 4. **类型安全** - 完整的 TypeScript 支持
```typescript
import type { 
  BirthData, 
  FourPillars, 
  PatternInfo 
} from '@your-org/bazi-sdk';
```

---

## 🏗️ 核心架构

### 架构图

```
┌─────────────────────────────────────────────────────────┐
│                     BaziSDK (门面)                        │
│                    统一对外接口                            │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──────┐ ┌──▼───────┐ ┌─▼──────────┐
│  Core 模块   │ │ Plugins  │ │  Utilities │
│   (核心)     │ │  (插件)  │ │   (工具)   │
└──────────────┘ └──────────┘ └────────────┘
```

### 模块划分

```
@your-org/bazi-sdk/
│
├── packages/
│   ├── core/                      ← 核心包（必需）
│   │   ├── calendar/              ← 历法转换
│   │   │   ├── converter.ts
│   │   │   └── solar-time.ts
│   │   ├── calculator/            ← 基础计算
│   │   │   ├── four-pillars.ts
│   │   │   └── hidden-stems.ts
│   │   ├── constants/             ← 常量数据
│   │   │   ├── stems.ts
│   │   │   ├── branches.ts
│   │   │   └── elements.ts
│   │   ├── types/                 ← 类型定义
│   │   │   └── index.ts
│   │   └── index.ts               ← 核心导出
│   │
│   ├── analysis/                  ← 分析包（可选）
│   │   ├── day-master/            ← 日主分析
│   │   │   ├── strength.ts
│   │   │   ├── seasonal.ts
│   │   │   └── index.ts
│   │   ├── five-elements/         ← 五行分析
│   │   │   ├── distribution.ts
│   │   │   ├── favorable.ts
│   │   │   └── index.ts
│   │   ├── ten-gods/              ← 十神分析
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── pattern/                   ← 格局包（可选）
│   │   ├── detector/              ← 格局检测器
│   │   │   ├── structural.ts
│   │   │   ├── purity.ts
│   │   │   ├── score.ts
│   │   │   └── conflict.ts
│   │   ├── types/                 ← 格局类型
│   │   │   ├── prosperity.ts
│   │   │   ├── follow.ts
│   │   │   └── transformation.ts
│   │   ├── registry.ts            ← 格局注册表
│   │   └── index.ts
│   │
│   ├── fortune/                   ← 运势包（可选）
│   │   ├── dayun/                 ← 大运
│   │   ├── liunian/               ← 流年
│   │   └── index.ts
│   │
│   ├── auxiliary/                 ← 辅助包（可选）
│   │   ├── shensha/               ← 神煞
│   │   ├── directions/            ← 方位
│   │   └── index.ts
│   │
│   ├── utils/                     ← 工具包（可选）
│   │   ├── geo/                   ← 地理工具
│   │   │   ├── coordinates.ts
│   │   │   └── city-data.json
│   │   ├── astronomy/             ← 天文工具
│   │   │   ├── julian-day.ts
│   │   │   └── equation-of-time.ts
│   │   └── index.ts
│   │
│   └── sdk/                       ← SDK 主包
│       ├── BaziSDK.ts             ← SDK 主类
│       ├── BaziCore.ts            ← 核心类（最小功能）
│       ├── BaziBuilder.ts         ← 构建器类（链式调用）
│       └── index.ts               ← 统一导出
│
├── examples/                      ← 示例代码
│   ├── basic-usage.ts
│   ├── advanced-usage.ts
│   └── custom-analyzer.ts
│
├── docs/                          ← 文档
│   ├── API.md
│   ├── GUIDE.md
│   └── PLUGINS.md
│
└── package.json
```

---

## 🔌 API 设计

### 1. **核心 API** - BaziCore（最小功能集）

```typescript
/**
 * BaziCore - 核心类（最小功能）
 * 只包含最基础的四柱计算，不依赖任何插件
 */
import { BaziCore } from '@your-org/bazi-sdk/core';

const bazi = new BaziCore();

// 1. 计算四柱
const fourPillars = bazi.calculateFourPillars({
  year: 1990,
  month: 6,
  day: 15,
  hour: 14,
  minute: 30,
  calendarType: 'solar',
  location: '北京市',
});
// 返回: { year, month, day, hour }

// 2. 获取藏干
const hiddenStems = bazi.getHiddenStems(fourPillars.day.earthlyBranch);
// 返回: [{ chinese: '戊', element: 'earth', weight: 0.6 }, ...]

// 3. 计算纳音
const nayin = bazi.getNayin(fourPillars.year);
// 返回: '路旁土'

// 4. 真太阳时校正
const trueSolarTime = bazi.calculateTrueSolarTime({
  year: 1990,
  month: 6,
  day: 15,
  hour: 14,
  minute: 30,
  location: '北京市',
});
// 返回: { year, month, day, hour, minute, dayOffset }
```

**体积**: ~50KB (min+gzip)

---

### 2. **完整 API** - BaziSDK（全功能）

```typescript
/**
 * BaziSDK - 完整功能类
 * 包含所有分析功能，开箱即用
 */
import { BaziSDK } from '@your-org/bazi-sdk';

const bazi = new BaziSDK({
  // 配置选项
  enableCache: true,           // 启用缓存
  locale: 'zh-CN',             // 语言
  precision: 'high',           // 计算精度（high/normal/low）
  plugins: ['pattern', 'fortune'], // 启用的插件
});

// 🔥 方法1: 一次性计算全部
const result = bazi.calculate({
  year: 1990,
  month: 6,
  day: 15,
  hour: 14,
  minute: 30,
  calendarType: 'solar',
  gender: 'male',
  location: '北京市',
});

console.log(result);
// 返回完整结果:
{
  fourPillars: { ... },
  dayMaster: { strength, analysis, ... },
  fiveElements: { distribution, favorable, ... },
  pattern: { category, name, score, ... },
  tenGods: { ... },
  yun: { dayun, liunian, ... },
  auxiliary: { shensha, directions, ... },
  trueSolarTime: { ... },
}

// 🔥 方法2: 分步计算（按需）
const fourPillars = bazi.getFourPillars(birthData);
const dayMaster = bazi.analyzeDayMaster(fourPillars);
const pattern = bazi.detectPattern(fourPillars, dayMaster);

// 🔥 方法3: 链式调用
const result = bazi
  .withBirthData(birthData)
  .calculateFourPillars()
  .analyzeDayMaster()
  .analyzeFiveElements()
  .detectPattern()
  .analyzeTenGods()
  .calculateYun()
  .getResult();
```

**体积**: ~200KB (min+gzip，包含所有功能)

---

### 3. **按需加载 API** - 模块化

```typescript
/**
 * 按需加载 - 只加载需要的模块
 * 适合对体积敏感的场景（如小程序）
 */

// 方式1: 导入具体模块
import { FourPillarsCalculator } from '@your-org/bazi-sdk/core/calculator';
import { DayMasterAnalyzer } from '@your-org/bazi-sdk/analysis/day-master';
import { PatternDetector } from '@your-org/bazi-sdk/pattern';

const calculator = new FourPillarsCalculator();
const fourPillars = calculator.calculate(birthData);

const analyzer = new DayMasterAnalyzer();
const dayMaster = analyzer.analyze(fourPillars);

const detector = new PatternDetector();
const pattern = detector.detect(fourPillars, dayMaster);

// 方式2: 使用工厂函数
import { createBaziCalculator } from '@your-org/bazi-sdk';

const bazi = createBaziCalculator({
  modules: ['core', 'day-master', 'pattern'], // 只加载指定模块
});
```

---

### 4. **插件 API** - 扩展机制

```typescript
/**
 * 插件系统 - 支持自定义分析器
 */

// 1️⃣ 定义插件接口
interface BaziPlugin {
  name: string;
  version: string;
  install(sdk: BaziSDK): void;
}

// 2️⃣ 创建自定义插件
class MyCustomAnalyzer implements BaziPlugin {
  name = 'my-custom-analyzer';
  version = '1.0.0';
  
  install(sdk: BaziSDK) {
    // 注册自定义方法
    sdk.registerMethod('analyzeCustom', (fourPillars) => {
      // 你的分析逻辑
      return { ... };
    });
    
    // 注册格局检测器
    sdk.registerPatternDetector('myPattern', {
      priority: 100,
      detect: (ctx) => {
        // 检测逻辑
        return null;
      },
    });
    
    // 拦截器（中间件）
    sdk.use('beforeAnalyze', (data) => {
      console.log('开始分析:', data);
    });
    
    sdk.use('afterAnalyze', (result) => {
      console.log('分析完成:', result);
    });
  }
}

// 3️⃣ 使用插件
const bazi = new BaziSDK();
bazi.use(new MyCustomAnalyzer());

// 4️⃣ 调用自定义方法
const result = bazi.analyzeCustom(fourPillars);
```

---

### 5. **工具 API** - 独立工具函数

```typescript
/**
 * 工具函数 - 无状态的纯函数
 * 可以独立使用，不需要实例化
 */

// 历法转换
import { 
  solarToLunar, 
  lunarToSolar 
} from '@your-org/bazi-sdk/utils/calendar';

const lunar = solarToLunar(1990, 6, 15);
// 返回: { year: 1990, month: 5, day: 23, isLeapMonth: false }

// 经纬度查询
import { getCoordinates } from '@your-org/bazi-sdk/utils/geo';

const coords = getCoordinates('北京市');
// 返回: { lng: 116.4074, lat: 39.9042 }

// 真太阳时
import { calculateTrueSolarTime } from '@your-org/bazi-sdk/utils/solar-time';

const trueSolar = calculateTrueSolarTime({
  year: 1990, month: 6, day: 15,
  hour: 14, minute: 30,
  longitude: 116.4074,
});
// 返回: { hour: 14, minute: 18, dayOffset: 0 }

// 五行关系
import { 
  generates,   // 相生
  restricts,   // 相克
  getElement   // 获取五行
} from '@your-org/bazi-sdk/utils/elements';

generates('wood', 'fire');  // true
restricts('water', 'fire'); // true
getElement('甲');           // 'wood'
```

---

## 📖 使用示例

### 示例1: 基础使用（最小功能）

```typescript
import { BaziCore } from '@your-org/bazi-sdk/core';

const bazi = new BaziCore();

// 计算四柱
const fourPillars = bazi.calculateFourPillars({
  year: 1990,
  month: 6,
  day: 15,
  hour: 14,
  minute: 30,
  calendarType: 'solar',
  location: '北京市',
});

console.log(fourPillars);
// 输出:
{
  year: { heavenlyStem: '庚', earthlyBranch: '午', naYin: '路旁土' },
  month: { heavenlyStem: '壬', earthlyBranch: '午', naYin: '杨柳木' },
  day: { heavenlyStem: '癸', earthlyBranch: '巳', naYin: '长流水' },
  hour: { heavenlyStem: '己', earthlyBranch: '未', naYin: '天上火' }
}
```

---

### 示例2: 完整分析（全功能）

```typescript
import { BaziSDK } from '@your-org/bazi-sdk';

const bazi = new BaziSDK();

const result = await bazi.calculate({
  year: 1990,
  month: 6,
  day: 15,
  hour: 14,
  minute: 30,
  calendarType: 'solar',
  gender: 'male',
  location: '北京市',
});

// 访问各个分析结果
console.log('日主强弱:', result.dayMaster.strength.rating);
console.log('格局:', result.pattern?.name);
console.log('喜用神:', result.fiveElements.favorable);
console.log('忌神:', result.fiveElements.unfavorable);

// 导出为 JSON
const json = bazi.toJSON(result);
console.log(json);
```

---

### 示例3: 链式调用（流式 API）

```typescript
import { BaziSDK } from '@your-org/bazi-sdk';

const result = new BaziSDK()
  .withBirthData({
    year: 1990, month: 6, day: 15,
    hour: 14, minute: 30,
    calendarType: 'solar',
    gender: 'male',
    location: '北京市',
  })
  .enableTrueSolarTime()      // 启用真太阳时
  .calculateFourPillars()     // 计算四柱
  .analyzeDayMaster()         // 分析日主
  .analyzeFiveElements()      // 分析五行
  .detectPattern()            // 检测格局
  .calculateYun({ years: 10 })// 计算大运
  .getResult();

console.log(result);
```

---

### 示例4: 按需计算（灵活组合）

```typescript
import { BaziSDK } from '@your-org/bazi-sdk';

const bazi = new BaziSDK();

// 场景1: 只需要四柱和日主分析
const fourPillars = bazi.getFourPillars(birthData);
const dayMaster = bazi.analyzeDayMaster(fourPillars);

// 场景2: 只需要格局判定
const pattern = bazi.detectPattern(fourPillars, dayMaster);

// 场景3: 只需要大运流年
const yun = bazi.calculateYun(fourPillars, birthData.gender);

// 场景4: 自定义组合
const customResult = {
  fourPillars: bazi.getFourPillars(birthData),
  dayMaster: bazi.analyzeDayMaster(fourPillars),
  pattern: bazi.detectPattern(fourPillars, dayMaster),
  // 不需要其他分析
};
```

---

### 示例5: 扩展插件（自定义分析）

```typescript
import { BaziSDK, Plugin } from '@your-org/bazi-sdk';

// 1. 创建自定义插件
class ZiweiPlugin implements Plugin {
  name = 'ziwei-analyzer';
  
  install(sdk: BaziSDK) {
    sdk.registerAnalyzer('ziwei', (fourPillars) => {
      // 紫微斗数分析逻辑
      return {
        mingGong: '...',
        shenGong: '...',
        // ...
      };
    });
  }
}

// 2. 使用插件
const bazi = new BaziSDK();
bazi.use(new ZiweiPlugin());

const result = bazi.calculate(birthData);
console.log(result.ziwei); // 紫微斗数分析结果
```

---

### 示例6: 批量计算（性能优化）

```typescript
import { BaziSDK } from '@your-org/bazi-sdk';

const bazi = new BaziSDK({
  enableCache: true,  // 启用缓存
});

// 批量计算
const birthDataList = [
  { year: 1990, month: 6, day: 15, ... },
  { year: 1991, month: 7, day: 16, ... },
  { year: 1992, month: 8, day: 17, ... },
];

const results = await bazi.batchCalculate(birthDataList, {
  parallel: true,    // 并行计算
  maxWorkers: 4,     // 最多4个工作线程
});

console.log(results); // [result1, result2, result3]
```

---

## 🛠️ 工程化方案

### 1. **项目结构** (Monorepo)

```
bazi-sdk/
├── packages/
│   ├── core/              ← @your-org/bazi-sdk-core
│   ├── analysis/          ← @your-org/bazi-sdk-analysis
│   ├── pattern/           ← @your-org/bazi-sdk-pattern
│   ├── fortune/           ← @your-org/bazi-sdk-fortune
│   ├── utils/             ← @your-org/bazi-sdk-utils
│   └── sdk/               ← @your-org/bazi-sdk (主包)
│
├── examples/              ← 示例代码
├── docs/                  ← 文档
├── scripts/               ← 构建脚本
│
├── pnpm-workspace.yaml    ← pnpm 工作区
├── tsconfig.json          ← TypeScript 配置
├── vitest.config.ts       ← 测试配置
└── package.json
```

**使用 pnpm 管理 Monorepo**:
```bash
# 安装依赖
pnpm install

# 构建所有包
pnpm -r build

# 运行测试
pnpm -r test

# 发布
pnpm -r publish
```

---

### 2. **构建配置**

```typescript
// tsup.config.ts - 使用 tsup 构建
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],           // 支持 CommonJS 和 ESM
  dts: true,                         // 生成 .d.ts
  splitting: true,                   // 代码拆分
  sourcemap: true,                   // 生成 sourcemap
  clean: true,                       // 清理输出目录
  treeshake: true,                   // Tree shaking
  minify: true,                      // 压缩代码
  target: 'es2020',                  // 目标环境
  outDir: 'dist',
});
```

**输出结构**:
```
dist/
├── index.js           ← ESM 版本
├── index.cjs          ← CommonJS 版本
├── index.d.ts         ← TypeScript 类型定义
├── index.js.map       ← Sourcemap
└── chunks/            ← 代码拆分后的 chunks
```

---

### 3. **发布配置**

```json
// package.json
{
  "name": "@your-org/bazi-sdk",
  "version": "1.0.0",
  "description": "Professional Bazi (八字) calculation SDK",
  "main": "./dist/index.cjs",           // CommonJS 入口
  "module": "./dist/index.js",          // ESM 入口
  "types": "./dist/index.d.ts",         // 类型定义
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./core": {
      "types": "./dist/core/index.d.ts",
      "import": "./dist/core/index.js",
      "require": "./dist/core/index.cjs"
    },
    "./analysis": {
      "types": "./dist/analysis/index.d.ts",
      "import": "./dist/analysis/index.js",
      "require": "./dist/analysis/index.cjs"
    },
    "./pattern": {
      "types": "./dist/pattern/index.d.ts",
      "import": "./dist/pattern/index.js",
      "require": "./dist/pattern/index.cjs"
    },
    "./utils/*": {
      "types": "./dist/utils/*.d.ts",
      "import": "./dist/utils/*.js",
      "require": "./dist/utils/*.cjs"
    }
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "keywords": [
    "bazi",
    "八字",
    "chinese-astrology",
    "fortune-telling",
    "四柱"
  ],
  "license": "MIT",
  "engines": {
    "node": ">=16"
  }
}
```

---

### 4. **测试策略**

```typescript
// 测试结构
__tests__/
├── unit/                  ← 单元测试
│   ├── core/
│   ├── analysis/
│   └── pattern/
├── integration/           ← 集成测试
│   └── full-calculation.test.ts
├── performance/           ← 性能测试
│   └── benchmark.test.ts
└── fixtures/              ← 测试数据
    └── birth-data.json

// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**'],
    },
    globals: true,
    environment: 'node',
  },
});
```

---

### 5. **文档生成**

```bash
# 使用 TypeDoc 生成 API 文档
npm install typedoc --save-dev

# typedoc.json
{
  "entryPoints": ["src/index.ts"],
  "out": "docs/api",
  "plugin": ["typedoc-plugin-markdown"],
  "theme": "default"
}

# 生成文档
npx typedoc
```

---

## 📦 发布策略

### 1. **版本管理**

使用 **语义化版本** (Semantic Versioning):
```
1.0.0 → 主版本.次版本.修订版本
```

- **主版本**: 不兼容的 API 变更
- **次版本**: 向后兼容的功能新增
- **修订版本**: 向后兼容的问题修正

---

### 2. **发布流程**

```bash
# 1. 更新版本
pnpm version patch  # 修订版本 1.0.0 → 1.0.1
pnpm version minor  # 次版本 1.0.0 → 1.1.0
pnpm version major  # 主版本 1.0.0 → 2.0.0

# 2. 构建
pnpm run build

# 3. 测试
pnpm run test

# 4. 发布到 npm
pnpm publish --access public

# 5. 推送 Git 标签
git push --tags
```

---

### 3. **多包发布策略**

```
发布方式1: 全功能包（推荐）
├─ @your-org/bazi-sdk              ← 主包，包含所有功能
└─ 版本: 1.0.0

发布方式2: 按需包（高级用户）
├─ @your-org/bazi-sdk-core         ← 核心包
├─ @your-org/bazi-sdk-analysis     ← 分析包
├─ @your-org/bazi-sdk-pattern      ← 格局包
├─ @your-org/bazi-sdk-fortune      ← 运势包
└─ @your-org/bazi-sdk-utils        ← 工具包
```

---

### 4. **CDN 发布**

```html
<!-- 通过 CDN 使用（无需构建） -->
<script src="https://unpkg.com/@your-org/bazi-sdk@1.0.0/dist/index.umd.js"></script>
<script>
  const bazi = new BaziSDK.BaziSDK();
  const result = bazi.calculate({
    year: 1990,
    month: 6,
    day: 15,
    // ...
  });
  console.log(result);
</script>
```

---

## 🎯 使用场景

### 场景1: Web 应用

```typescript
// React 示例
import { BaziSDK } from '@your-org/bazi-sdk';
import { useState } from 'react';

function BaziCalculator() {
  const [result, setResult] = useState(null);
  const bazi = new BaziSDK();
  
  const handleCalculate = async (birthData) => {
    const result = await bazi.calculate(birthData);
    setResult(result);
  };
  
  return (
    <div>
      {/* UI */}
    </div>
  );
}
```

---

### 场景2: 小程序

```typescript
// 微信小程序（按需加载，减小体积）
import { BaziCore } from '@your-org/bazi-sdk/core';
import { DayMasterAnalyzer } from '@your-org/bazi-sdk/analysis/day-master';

Page({
  onLoad() {
    const bazi = new BaziCore();
    const fourPillars = bazi.calculateFourPillars({...});
    
    const analyzer = new DayMasterAnalyzer();
    const dayMaster = analyzer.analyze(fourPillars);
    
    this.setData({ fourPillars, dayMaster });
  }
});
```

---

### 场景3: Node.js 后端

```typescript
// Express API
import express from 'express';
import { BaziSDK } from '@your-org/bazi-sdk';

const app = express();
const bazi = new BaziSDK({ enableCache: true });

app.post('/api/bazi/calculate', async (req, res) => {
  try {
    const result = await bazi.calculate(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3000);
```

---

### 场景4: Serverless 函数

```typescript
// Vercel Serverless Function
import { BaziSDK } from '@your-org/bazi-sdk';

export default async function handler(req, res) {
  const bazi = new BaziSDK();
  const result = await bazi.calculate(req.body);
  res.json(result);
}
```

---

## 📊 性能优化

### 1. **缓存策略**

```typescript
class BaziSDK {
  private cache = new Map<string, any>();
  
  calculate(birthData: BirthData) {
    const key = this.getCacheKey(birthData);
    
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const result = this.performCalculation(birthData);
    this.cache.set(key, result);
    
    return result;
  }
  
  private getCacheKey(birthData: BirthData): string {
    return `${birthData.year}-${birthData.month}-${birthData.day}-${birthData.hour}-${birthData.minute}-${birthData.location}`;
  }
}
```

---

### 2. **懒加载**

```typescript
class BaziSDK {
  private patternDetector?: PatternDetector;
  
  detectPattern(fourPillars: FourPillars) {
    // 懒加载：只在需要时才实例化
    if (!this.patternDetector) {
      this.patternDetector = new PatternDetector();
    }
    
    return this.patternDetector.detect(fourPillars);
  }
}
```

---

### 3. **Worker 线程**

```typescript
// 使用 Worker 进行复杂计算（浏览器环境）
class BaziSDK {
  async calculateInWorker(birthData: BirthData) {
    const worker = new Worker('./bazi-worker.js');
    
    return new Promise((resolve) => {
      worker.postMessage(birthData);
      worker.onmessage = (e) => {
        resolve(e.data);
        worker.terminate();
      };
    });
  }
}
```

---

## 🔒 安全考虑

### 1. **输入验证**

```typescript
class BaziSDK {
  calculate(birthData: BirthData) {
    // 验证输入
    this.validateBirthData(birthData);
    
    // 执行计算
    return this.performCalculation(birthData);
  }
  
  private validateBirthData(data: BirthData) {
    if (data.year < 1900 || data.year > 2100) {
      throw new Error('Invalid year');
    }
    
    if (data.month < 1 || data.month > 12) {
      throw new Error('Invalid month');
    }
    
    // 更多验证...
  }
}
```

---

### 2. **错误处理**

```typescript
class BaziCalculationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'BaziCalculationError';
  }
}

class BaziSDK {
  calculate(birthData: BirthData) {
    try {
      return this.performCalculation(birthData);
    } catch (error) {
      throw new BaziCalculationError(
        'Calculation failed',
        'CALCULATION_ERROR',
        { birthData, originalError: error }
      );
    }
  }
}
```

---

## 📝 总结

### 核心优势

| 特性 | 说明 |
|-----|------|
| **灵活性** | 一次性计算、分步计算、链式调用，三种方式任选 |
| **轻量化** | 核心包仅 50KB，按需加载，最小化体积 |
| **可扩展** | 插件机制，支持自定义分析器和格局检测器 |
| **类型安全** | 完整的 TypeScript 支持，类型提示完善 |
| **高性能** | 缓存、懒加载、Worker 线程，多重优化 |
| **易用性** | 开箱即用，文档完善，示例丰富 |

### 推荐实施步骤

```
第1步（1周）:
├─ 设计 API 接口
└─ 确定模块划分

第2步（2周）:
├─ 拆分现有代码为 Monorepo
├─ 实现核心 BaziCore 类
└─ 实现完整 BaziSDK 类

第3步（1周）:
├─ 实现插件系统
└─ 编写示例代码

第4步（1周）:
├─ 完善测试（单元、集成、性能）
├─ 编写文档
└─ 配置构建和发布

第5步（1周）:
├─ 发布到 npm
├─ 发布到 CDN
└─ 推广和收集反馈
```

总计：**6周** 可以完成一个高质量的 SDK

---

## 🚀 下一步

想要我帮你：
1. **创建项目骨架**？
2. **实现核心 BaziCore 类**？
3. **设计插件系统**？
4. **编写使用文档**？

随时告诉我！🎯
