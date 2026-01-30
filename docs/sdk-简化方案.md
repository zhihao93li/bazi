# 八字 SDK 简化方案（单包版）

> 第一期：把当前代码封装成一个包，提供灵活的接口，就这么简单！

---

## 🎯 核心思路

**别搞 Monorepo，别拆分子包，就一个包！**

```
@your-org/bazi-sdk/
├── src/
│   ├── core/           # 当前的 calculator.ts
│   ├── analysis/       # 当前的 strength-calculation.ts 等
│   ├── pattern/        # 当前的 detector/ 和 pattern-*.ts
│   ├── utils/          # 当前的 geo-utils.ts
│   ├── BaziSDK.ts      # 新增：主类（统一门面）
│   └── index.ts        # 导出所有接口
└── package.json
```

**核心改动**：
1. ✅ 把 `src/lib/bazi/` 的代码复制过来
2. ✅ 加一个 `BaziSDK` 类作为门面
3. ✅ 导出各种使用方式的接口
4. ✅ 完事！

---

## 📦 实施步骤（3天完成）

### **Day 1: 创建项目 + 复制代码**

#### **1.1 创建目录**

```bash
mkdir bazi-sdk
cd bazi-sdk
npm init -y
```

#### **1.2 安装依赖**

```bash
npm install lunar-typescript
npm install -D typescript tsup vitest
```

#### **1.3 复制代码**

```bash
# 直接把整个 bazi 目录复制过来
cp -r ../bazi/src/lib/bazi ./src

# 目录结构
src/
├── calculator.ts           # ✅ 直接复制
├── strength-calculation.ts # ✅ 直接复制
├── seasonal-adjustment.ts  # ✅ 直接复制
├── favorable-elements.ts   # ✅ 直接复制
├── pattern-calculation.ts  # ✅ 直接复制
├── prosperity-pattern.ts   # ✅ 直接复制
├── follow-pattern.ts       # ✅ 直接复制
├── transformation-pattern.ts # ✅ 直接复制
├── detector/               # ✅ 整个目录复制
├── geo-utils.ts            # ✅ 直接复制
├── constants.ts            # ✅ 直接复制
├── types.ts                # ✅ 直接复制
└── city-geo-data.json      # ✅ 直接复制
```

---

### **Day 2: 添加门面类**

#### **2.1 创建 BaziSDK 类**

```typescript
// src/BaziSDK.ts
import { calculateBazi } from './calculator';
import { calculateDayMasterOptimized } from './strength-calculation';
import { calculatePatternOptimized } from './pattern-calculation';
import type { BaziBirthData, BaziData, FourPillars, DayMaster, PatternInfo } from './types';

/**
 * 八字 SDK 主类
 * 
 * 提供三种使用方式：
 * 1. 一键计算：calculate()
 * 2. 分步调用：getFourPillars() → analyzeDayMaster() → ...
 * 3. 直接导入函数：import { calculateBazi } from '@your-org/bazi-sdk'
 */
export class BaziSDK {
  /**
   * 方式 1: 一键计算（最简单）
   * 
   * @example
   * const bazi = new BaziSDK();
   * const result = bazi.calculate({
   *   year: 1990,
   *   month: 10,
   *   day: 15,
   *   hour: 14,
   *   location: '北京',
   *   calendarType: 'solar'
   * });
   */
  calculate(birthData: BaziBirthData): BaziData {
    return calculateBazi(birthData);
  }
  
  /**
   * 方式 2: 分步调用 - 获取四柱
   */
  getFourPillars(birthData: BaziBirthData): FourPillars {
    const result = calculateBazi(birthData);
    return result.fourPillars;
  }
  
  /**
   * 方式 2: 分步调用 - 分析日主强弱
   */
  analyzeDayMaster(fourPillars: FourPillars): DayMaster {
    const dayStem = fourPillars.day.heavenlyStem;
    return calculateDayMasterOptimized(dayStem, fourPillars);
  }
  
  /**
   * 方式 2: 分步调用 - 检测格局
   */
  detectPattern(fourPillars: FourPillars, dayMaster: DayMaster): PatternInfo {
    const result = calculateBazi({ /* ... */ }); // 临时实现
    return result.pattern;
  }
}
```

#### **2.2 创建统一导出**

```typescript
// src/index.ts

// 导出主类
export { BaziSDK } from './BaziSDK';

// 导出所有函数（方便直接调用）
export { calculateBazi } from './calculator';
export { calculateDayMasterOptimized } from './strength-calculation';
export { calculateSeasonalAdjustment } from './seasonal-adjustment';
export { calculateFavorableElementsOptimized } from './favorable-elements';
export { calculatePatternOptimized } from './pattern-calculation';

// 导出所有类型
export * from './types';

// 导出工具
export { getLongitudeFromLocation } from './geo-utils';

// 导出 detector（高级用户可能需要）
export * from './detector';
```

---

### **Day 3: 配置构建 + 发布**

#### **3.1 配置 TypeScript**

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

#### **3.2 配置构建工具**

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],  // 同时支持 CommonJS 和 ESM
  dts: true,               // 生成 .d.ts 类型文件
  clean: true,
  sourcemap: true,
  minify: true,
  splitting: false,
});
```

#### **3.3 配置 package.json**

```json
{
  "name": "@your-org/bazi-sdk",
  "version": "0.1.0",
  "description": "八字命理计算 SDK",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "require": "./dist/index.js",
      "import": "./dist/index.mjs",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest"
  },
  "keywords": ["bazi", "八字", "命理", "fortune"],
  "dependencies": {
    "lunar-typescript": "^1.5.19"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "tsup": "^8.0.0",
    "vitest": "^1.0.0"
  }
}
```

#### **3.4 构建 + 发布**

```bash
# 构建
npm run build

# 测试
npm test

# 发布
npm login
npm publish --access public
```

---

## 🎯 三种使用方式

### **方式 1: 一键计算（适合新手）**

```typescript
import { BaziSDK } from '@your-org/bazi-sdk';

const bazi = new BaziSDK();

const result = bazi.calculate({
  year: 1990,
  month: 10,
  day: 15,
  hour: 14,
  location: '北京',
  calendarType: 'solar'
});

console.log(result.dayMaster.strength);  // "strong"
console.log(result.pattern.type);        // "prosperity"
console.log(result.favorableElements);   // ["水", "木"]
```

---

### **方式 2: 分步调用（适合需要灵活控制）**

```typescript
import { BaziSDK } from '@your-org/bazi-sdk';

const bazi = new BaziSDK();

// 第 1 步：获取四柱
const fourPillars = bazi.getFourPillars({
  year: 1990,
  month: 10,
  day: 15,
  hour: 14,
  location: '北京',
  calendarType: 'solar'
});

// 第 2 步：分析日主（可以加入自己的逻辑）
const dayMaster = bazi.analyzeDayMaster(fourPillars);

// 第 3 步：检测格局
const pattern = bazi.detectPattern(fourPillars, dayMaster);

console.log(pattern.type);  // "prosperity"
```

---

### **方式 3: 直接调用函数（适合高级用户）**

```typescript
import { 
  calculateBazi,
  calculateDayMasterOptimized,
  calculatePatternOptimized
} from '@your-org/bazi-sdk';

// 直接使用底层函数
const result = calculateBazi({
  year: 1990,
  month: 10,
  day: 15,
  hour: 14,
  location: '北京',
  calendarType: 'solar'
});

// 或者单独使用某个功能
const dayMaster = calculateDayMasterOptimized(
  result.fourPillars.day.heavenlyStem,
  result.fourPillars
);
```

---

### **方式 4: 使用高级模块（适合专业用户）**

```typescript
import { 
  StructuralAnalyzer,
  PurityChecker,
  ConflictEngine 
} from '@your-org/bazi-sdk';

// 直接使用 detector 的各个组件
const analyzer = new StructuralAnalyzer();
const structures = analyzer.detectStructures(fourPillars);
```

---

## 📚 简单的 README

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
  location: '北京',
  calendarType: 'solar'
});

console.log(result);
```

## 功能特性

- ✅ 四柱排盘（支持真太阳时）
- ✅ 日主强弱分析
- ✅ 调候分析（寒暖燥湿）
- ✅ 格局检测（专旺、从格、化气格）
- ✅ 喜忌用神
- ✅ 大运流年
- ✅ 3000+ 城市地理数据

## 使用方式

### 1. 一键计算
```typescript
const bazi = new BaziSDK();
const result = bazi.calculate(birthData);
```

### 2. 分步调用
```typescript
const fourPillars = bazi.getFourPillars(birthData);
const dayMaster = bazi.analyzeDayMaster(fourPillars);
```

### 3. 直接调用函数
```typescript
import { calculateBazi } from '@your-org/bazi-sdk';
const result = calculateBazi(birthData);
```

## API 文档

查看完整 API 文档：[链接]

## License

MIT
```

---

## ✅ 总结

### **这个方案的优势**

| 特点 | 说明 |
|-----|------|
| **超级简单** | 3 天完成，不需要 Monorepo |
| **零重构** | 直接复制当前代码 |
| **灵活使用** | 4 种使用方式，满足不同用户 |
| **快速发布** | 一个包，直接 npm publish |
| **易于维护** | 代码结构清晰，和当前项目一致 |

### **对比之前的复杂方案**

| 维度 | 复杂方案（6周） | 简化方案（3天） |
|-----|---------------|---------------|
| **包数量** | 6 个子包 | 1 个包 |
| **时间** | 6 周 | 3 天 |
| **复杂度** | Monorepo + 拆分 | 直接复制 |
| **功能** | 完全相同 | 完全相同 |
| **灵活性** | 按需安装 | 一次安装全功能 |

### **实际工作量**

```
Day 1 (4小时):
  - 创建项目 (30分钟)
  - 复制代码 (30分钟)
  - 安装依赖 (30分钟)
  - 测试编译 (2.5小时)

Day 2 (4小时):
  - 创建 BaziSDK 类 (2小时)
  - 创建导出文件 (1小时)
  - 写简单测试 (1小时)

Day 3 (4小时):
  - 配置构建 (1小时)
  - 写 README (1小时)
  - 测试发布 (1小时)
  - 正式发布 (1小时)

总计: 12 小时（1.5 个工作日）
```

---

## 🚀 下一步

如果你想现在就开始，我可以帮你：

1. **创建项目骨架** - 初始化项目结构
2. **复制代码** - 把当前代码复制过去
3. **创建 BaziSDK 类** - 写门面类
4. **配置构建** - tsup 配置
5. **发布到 npm** - 手把手发布

---

**总结**: 这个方案**超级简单**：

- ✅ **3 天完成**（而不是 6 周）
- ✅ **1 个包**（而不是 6 个子包）
- ✅ **零重构**（直接复制代码）
- ✅ **功能完全相同**（所有接口都有）
- ✅ **易于维护**（代码结构不变）

你说得对，第一期真的不需要搞那么复杂！准备开始吗？🎯
