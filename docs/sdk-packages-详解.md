# 八字 SDK 包功能详解

## 📦 包体系概览

```
@your-org/bazi-sdk (主包，200KB)
    ↓
包含所有子包 + 统一接口
    ↓
├── @your-org/bazi-sdk-core          (核心包，50KB)  ← 最小依赖
├── @your-org/bazi-sdk-analysis      (分析包，40KB)
├── @your-org/bazi-sdk-pattern       (格局包，60KB)
├── @your-org/bazi-sdk-fortune       (运势包，30KB)
├── @your-org/bazi-sdk-auxiliary     (辅助包，15KB)
└── @your-org/bazi-sdk-utils         (工具包，25KB)
```

---

## 1️⃣ **@your-org/bazi-sdk-core** - 核心包（必需）

**定位**: 八字计算的最小核心，任何项目都必须安装

**体积**: ~50KB (gzip后 ~15KB)

### 📋 包含功能

#### 1.1 **历法转换** (`calendar/`)
```typescript
// 功能：阳历 ↔ 阴历转换
import { CalendarConverter } from '@your-org/bazi-sdk-core';

const converter = new CalendarConverter();

// 阳历转阴历
const lunar = converter.solarToLunar({
  year: 1990,
  month: 10,
  day: 15,
  hour: 14
});
// → { year: 1990, month: 8, day: 27, ... }

// 真太阳时校正（考虑经纬度和均时差）
const trueTime = converter.calculateTrueSolarTime({
  localTime: '2024-01-01 12:00',
  longitude: 116.4074,
  latitude: 39.9042
});
// → { adjustedHour: 11, adjustedMinute: 52 }
```

**包含模块**:
- `converter.ts` - 历法转换算法
- `solar-time.ts` - 真太阳时计算（经度差、均时差）
- `julian-day.ts` - 儒略日计算

---

#### 1.2 **四柱计算** (`calculator/`)
```typescript
// 功能：计算年月日时四柱干支
import { FourPillarsCalculator } from '@your-org/bazi-sdk-core';

const calculator = new FourPillarsCalculator();

const fourPillars = calculator.calculate({
  year: 1990,
  month: 10,
  day: 15,
  hour: 14,
  longitude: 116.4074
});

// 返回：
{
  year: {
    heavenlyStem: { chinese: '庚', element: '金', ... },
    earthlyBranch: { chinese: '午', element: '火', ... }
  },
  month: { ... },
  day: { ... },
  time: { ... }
}
```

**包含模块**:
- `four-pillars.ts` - 排盘算法
- `hidden-stems.ts` - 地支藏干计算
- `stem-branch-utils.ts` - 干支工具函数

---

#### 1.3 **常量数据** (`constants/`)
```typescript
// 功能：所有基础常量（干支、五行、十神等）
import { 
  HEAVENLY_STEMS,   // 十天干
  EARTHLY_BRANCHES, // 十二地支
  FIVE_ELEMENTS,    // 五行数据
  TEN_GODS          // 十神数据
} from '@your-org/bazi-sdk-core/constants';

// 示例数据：
HEAVENLY_STEMS['甲'] // → { element: '木', yinYang: '阳', ... }
EARTHLY_BRANCHES['子'] // → { element: '水', hidden: ['癸'], ... }
```

**包含模块**:
- `stems.ts` - 天干常量
- `branches.ts` - 地支常量 + 藏干表
- `elements.ts` - 五行生克关系
- `ten-gods.ts` - 十神关系表
- `nayin.ts` - 纳音五行表

---

#### 1.4 **类型定义** (`types/`)
```typescript
// 功能：所有 TypeScript 类型
import type {
  BirthData,        // 出生数据
  FourPillars,      // 四柱结构
  Stem,             // 天干
  Branch,           // 地支
  Element,          // 五行
  TenGod            // 十神
} from '@your-org/bazi-sdk-core';
```

---

### 🎯 **Core 包的使用场景**

| 场景 | 适用 |
|-----|------|
| 只需要排盘（四柱干支） | ✅ |
| 微信小程序（体积敏感） | ✅ |
| 嵌入式设备 | ✅ |
| 自定义分析逻辑 | ✅ |
| 需要格局分析 | ❌ (需要 pattern 包) |
| 需要大运流年 | ❌ (需要 fortune 包) |

**安装**:
```bash
npm install @your-org/bazi-sdk-core
```

**使用**:
```typescript
import { FourPillarsCalculator } from '@your-org/bazi-sdk-core';

const calculator = new FourPillarsCalculator();
const result = calculator.calculate({
  year: 1990,
  month: 10,
  day: 15,
  hour: 14,
  longitude: 116.4074
});

console.log(result.day.heavenlyStem.chinese); // "庚"
```

---

## 2️⃣ **@your-org/bazi-sdk-analysis** - 分析包（可选）

**定位**: 日主强弱、五行分析、十神分析

**体积**: ~40KB

**依赖**: `@your-org/bazi-sdk-core`

### 📋 包含功能

#### 2.1 **日主强弱分析** (`day-master/`)
```typescript
// 功能：分析日主旺衰程度
import { DayMasterAnalyzer } from '@your-org/bazi-sdk-analysis';

const analyzer = new DayMasterAnalyzer();

const result = analyzer.analyze(fourPillars);

// 返回：
{
  strength: 'strong',           // weak/medium/strong/very-strong
  score: 75,                    // 0-100分
  details: {
    rootStrength: 30,           // 通根得分
    stemSupport: 20,            // 透干得分
    seasonalAdjustment: 0.9,    // 调候系数
    monthSupport: 25            // 月令得分
  },
  analysis: '日主偏强，得月令生助...'
}
```

**包含模块**:
- `strength.ts` - 旺衰计算主逻辑
- `seasonal.ts` - 调候分析（寒暖燥湿）
- `root-calculation.ts` - 通根计算
- `stem-support.ts` - 透干计算

**对应你当前代码**:
- 👉 `src/lib/bazi/strength-calculation.ts`
- 👉 `src/lib/bazi/seasonal-adjustment.ts`

---

#### 2.2 **五行分析** (`five-elements/`)
```typescript
// 功能：五行分布、喜忌用神
import { FiveElementsAnalyzer } from '@your-org/bazi-sdk-analysis';

const analyzer = new FiveElementsAnalyzer();

const result = analyzer.analyze(fourPillars, dayMasterStrength);

// 返回：
{
  distribution: {
    wood: 25,
    fire: 15,
    earth: 20,
    metal: 30,
    water: 10
  },
  favorable: ['水', '木'],    // 喜用神
  unfavorable: ['火', '土'],  // 忌神
  reasoning: '日主金旺，需水泄秀...'
}
```

**包含模块**:
- `distribution.ts` - 五行统计（权重计算）
- `favorable.ts` - 喜忌用神推算
- `balance-analysis.ts` - 五行平衡度分析

**对应你当前代码**:
- 👉 `src/lib/bazi/favorable-elements.ts`
- 👉 `src/lib/bazi/calculator.ts` 中的五行统计部分

---

#### 2.3 **十神分析** (`ten-gods/`)
```typescript
// 功能：十神关系分析
import { TenGodsAnalyzer } from '@your-org/bazi-sdk-analysis';

const analyzer = new TenGodsAnalyzer();

const result = analyzer.analyze(fourPillars);

// 返回：
{
  distribution: {
    year: '正官',
    month: '偏财',
    day: '日主',
    hour: '食神'
  },
  characteristics: {
    dominantGods: ['偏财', '食神'],
    personality: '善于理财，表达力强...',
    career: '适合金融、艺术行业...'
  }
}
```

**包含模块**:
- `calculator.ts` - 十神计算
- `interpretation.ts` - 十神含义解读

**对应你当前代码**:
- 👉 `src/lib/bazi/calculator.ts` 中的 `getTenGod()` 函数

---

### 🎯 **Analysis 包的使用场景**

| 场景 | 适用 |
|-----|------|
| 需要日主强弱分析 | ✅ |
| 需要喜忌用神 | ✅ |
| 需要五行建议 | ✅ |
| 只需要排盘 | ❌ (用 core 包就够) |

**安装**:
```bash
npm install @your-org/bazi-sdk-core @your-org/bazi-sdk-analysis
```

---

## 3️⃣ **@your-org/bazi-sdk-pattern** - 格局包（可选）

**定位**: 格局检测（专旺、从格、化气等）

**体积**: ~60KB

**依赖**: `@your-org/bazi-sdk-core`, `@your-org/bazi-sdk-analysis`

### 📋 包含功能

#### 3.1 **格局检测引擎** (`detector/`)
```typescript
// 功能：检测八字格局
import { PatternDetector } from '@your-org/bazi-sdk-pattern';

const detector = new PatternDetector();

const result = detector.detect(fourPillars, dayMasterAnalysis);

// 返回：
{
  type: 'prosperity',           // 格局类型
  subtype: 'wood-prosperity',   // 子类型
  confidence: 0.85,             // 置信度
  characteristics: {
    structure: '三合木局',
    purity: 0.9,
    conflicts: []
  },
  explanation: '命局木气旺盛，构成曲直格...'
}
```

**包含模块**:
- `structural-analyzer.ts` - 结构分析（三合、三会、方局）
- `purity-checker.ts` - 纯度检查
- `score-recalculator.ts` - 能量重算
- `conflict-engine.ts` - 冲克破害检测
- `pattern-dispatcher.ts` - 格局分发器

**对应你当前代码**:
- 👉 `src/lib/bazi/detector/` 整个目录（你的教科书级设计！）

---

#### 3.2 **格局类型库** (`types/`)
```typescript
// 功能：各种格局的具体实现
import { 
  ProsperityPattern,    // 专旺格
  FollowPattern,        // 从格
  TransformPattern      // 化气格
} from '@your-org/bazi-sdk-pattern/types';

// 支持自定义格局
class MyCustomPattern extends BasePattern {
  detect(ctx) { ... }
}
```

**包含模块**:
- `prosperity.ts` - 专旺格（曲直、炎上、稼穑等）
- `follow.ts` - 从格（从强、从弱、从儿等）
- `transformation.ts` - 化气格
- `balanced.ts` - 中和格
- `base-pattern.ts` - 格局基类

**对应你当前代码**:
- 👉 `src/lib/bazi/patterns/prosperity-pattern.ts`
- 👉 `src/lib/bazi/patterns/follow-pattern.ts`

---

#### 3.3 **格局注册表** (`registry.ts`)
```typescript
// 功能：动态注册和管理格局
import { PatternRegistry } from '@your-org/bazi-sdk-pattern';

const registry = PatternRegistry.getInstance();

// 注册自定义格局
registry.register('myPattern', MyPatternDetector);

// 查询所有格局
const patterns = registry.getAll();

// 按优先级排序
const sorted = registry.getSorted();
```

---

### 🎯 **Pattern 包的使用场景**

| 场景 | 适用 |
|-----|------|
| 需要判断格局 | ✅ |
| 需要格局详细解释 | ✅ |
| 只需要强弱分析 | ❌ (用 analysis 包) |
| 只需要排盘 | ❌ (用 core 包) |

**安装**:
```bash
npm install @your-org/bazi-sdk-core @your-org/bazi-sdk-analysis @your-org/bazi-sdk-pattern
```

---

## 4️⃣ **@your-org/bazi-sdk-fortune** - 运势包（可选）

**定位**: 大运、流年、流月、流日分析

**体积**: ~30KB

**依赖**: `@your-org/bazi-sdk-core`, `@your-org/bazi-sdk-analysis`

### 📋 包含功能

#### 4.1 **大运计算** (`dayun/`)
```typescript
// 功能：计算一生大运
import { DayunCalculator } from '@your-org/bazi-sdk-fortune';

const calculator = new DayunCalculator();

const dayun = calculator.calculate(fourPillars, birthData);

// 返回：
{
  startAge: 3,                  // 起运岁数
  direction: 'forward',         // 顺/逆排
  decades: [
    {
      age: 3,
      stem: '甲',
      branch: '寅',
      element: '木',
      tenGod: '比肩',
      period: { start: 1993, end: 2003 },
      analysis: '此大运木旺，利于事业发展...'
    },
    // ... 后续大运
  ]
}
```

**包含模块**:
- `calculator.ts` - 大运计算算法
- `analyzer.ts` - 大运吉凶分析

---

#### 4.2 **流年分析** (`liunian/`)
```typescript
// 功能：分析指定年份运势
import { LiunianAnalyzer } from '@your-org/bazi-sdk-fortune';

const analyzer = new LiunianAnalyzer();

const result = analyzer.analyze({
  fourPillars,
  year: 2024
});

// 返回：
{
  year: 2024,
  stem: '甲',
  branch: '辰',
  tenGod: '偏印',
  rating: 75,                    // 0-100分
  favorable: true,
  events: ['职业变动', '贵人相助'],
  advice: '适合学习新技能，注意财务管理...'
}
```

**包含模块**:
- `calculator.ts` - 流年计算
- `event-predictor.ts` - 事件预测

---

#### 4.3 **流月流日** (`lunar-month/`, `solar-day/`)
```typescript
// 功能：更细粒度的运势分析
import { LunarMonthAnalyzer, SolarDayAnalyzer } from '@your-org/bazi-sdk-fortune';

// 流月
const monthResult = monthAnalyzer.analyze(fourPillars, '2024-03');

// 流日
const dayResult = dayAnalyzer.analyze(fourPillars, '2024-03-15');
```

---

### 🎯 **Fortune 包的使用场景**

| 场景 | 适用 |
|-----|------|
| 需要大运流年 | ✅ |
| 需要运势预测 | ✅ |
| 只分析命局 | ❌ (不需要此包) |

**对应你当前代码**:
- 👉 `src/lib/bazi/calculator.ts` 中的大运流年部分

**安装**:
```bash
npm install @your-org/bazi-sdk-core @your-org/bazi-sdk-analysis @your-org/bazi-sdk-fortune
```

---

## 5️⃣ **@your-org/bazi-sdk-auxiliary** - 辅助包（可选）

**定位**: 神煞、方位、宜忌等辅助功能

**体积**: ~15KB

**依赖**: `@your-org/bazi-sdk-core`

### 📋 包含功能

#### 5.1 **神煞分析** (`shensha/`)
```typescript
// 功能：计算神煞（天乙贵人、桃花等）
import { ShenshaAnalyzer } from '@your-org/bazi-sdk-auxiliary';

const analyzer = new ShenshaAnalyzer();

const result = analyzer.analyze(fourPillars);

// 返回：
{
  favorable: ['天乙贵人', '文昌贵人'],
  unfavorable: ['劫煞', '孤辰寡宿'],
  details: {
    '天乙贵人': {
      location: '年支',
      effect: '一生多贵人相助'
    }
  }
}
```

---

#### 5.2 **方位分析** (`directions/`)
```typescript
// 功能：吉凶方位计算
import { DirectionAnalyzer } from '@your-org/bazi-sdk-auxiliary';

const result = analyzer.analyze(fourPillars);

// 返回：
{
  favorable: ['东方', '北方'],
  unfavorable: ['南方'],
  details: {
    '东方': '木方，利事业发展'
  }
}
```

---

#### 5.3 **宜忌分析** (`suitable-actions/`)
```typescript
// 功能：日常宜忌
import { SuitableActionsAnalyzer } from '@your-org/bazi-sdk-auxiliary';

const result = analyzer.analyze(fourPillars, date);

// 返回：
{
  suitable: ['开市', '出行', '求财'],
  unsuitable: ['动土', '嫁娶'],
  warnings: ['避开午时']
}
```

---

### 🎯 **Auxiliary 包的使用场景**

| 场景 | 适用 |
|-----|------|
| 需要神煞分析 | ✅ |
| 需要方位建议 | ✅ |
| 核心命理分析 | ❌ (用其他包) |

**对应你当前代码**:
- 👉 `src/lib/bazi/calculator.ts` 中的神煞部分

**安装**:
```bash
npm install @your-org/bazi-sdk-core @your-org/bazi-sdk-auxiliary
```

---

## 6️⃣ **@your-org/bazi-sdk-utils** - 工具包（可选）

**定位**: 通用工具函数

**体积**: ~25KB

**依赖**: 无（独立）

### 📋 包含功能

#### 6.1 **地理工具** (`geo/`)
```typescript
// 功能：城市坐标查询、时区计算
import { GeoUtils } from '@your-org/bazi-sdk-utils';

const coords = GeoUtils.getCityCoordinates('北京');
// → { longitude: 116.4074, latitude: 39.9042 }

const timezone = GeoUtils.getTimezone('北京');
// → 'Asia/Shanghai'
```

**包含数据**:
- 中国3000+城市坐标
- 全球主要城市时区

**对应你当前代码**:
- 👉 `src/lib/bazi/geo-utils.ts`
- 👉 `data/city-coordinates.json`

---

#### 6.2 **天文工具** (`astronomy/`)
```typescript
// 功能：天文计算（儒略日、均时差等）
import { AstronomyUtils } from '@your-org/bazi-sdk-utils';

const julianDay = AstronomyUtils.toJulianDay(2024, 1, 1);
const equationOfTime = AstronomyUtils.getEquationOfTime(julianDay);
```

---

#### 6.3 **格式化工具** (`formatters/`)
```typescript
// 功能：数据格式化
import { BaziFormatter } from '@your-org/bazi-sdk-utils';

const text = BaziFormatter.toText(fourPillars);
// → "庚午年 丙戌月 戊子日 己未时"

const html = BaziFormatter.toHTML(fourPillars);
// → 带样式的 HTML
```

---

### 🎯 **Utils 包的使用场景**

| 场景 | 适用 |
|-----|------|
| 需要城市坐标 | ✅ |
| 需要数据格式化 | ✅ |
| 不需要辅助功能 | ❌ |

**安装**:
```bash
npm install @your-org/bazi-sdk-utils
```

---

## 🎯 包组合使用示例

### 示例 1: 最小化安装（只排盘）
```bash
npm install @your-org/bazi-sdk-core
```

```typescript
import { FourPillarsCalculator } from '@your-org/bazi-sdk-core';

const calculator = new FourPillarsCalculator();
const result = calculator.calculate(birthData);
// ✅ 只有 50KB
```

---

### 示例 2: 命理分析（无格局）
```bash
npm install @your-org/bazi-sdk-core @your-org/bazi-sdk-analysis
```

```typescript
import { FourPillarsCalculator } from '@your-org/bazi-sdk-core';
import { DayMasterAnalyzer, FiveElementsAnalyzer } from '@your-org/bazi-sdk-analysis';

const fourPillars = calculator.calculate(birthData);
const strength = dayMasterAnalyzer.analyze(fourPillars);
const elements = elementsAnalyzer.analyze(fourPillars, strength);
// ✅ 共 90KB
```

---

### 示例 3: 完整功能（格局+运势）
```bash
npm install @your-org/bazi-sdk-core \
            @your-org/bazi-sdk-analysis \
            @your-org/bazi-sdk-pattern \
            @your-org/bazi-sdk-fortune
```

```typescript
import { FourPillarsCalculator } from '@your-org/bazi-sdk-core';
import { DayMasterAnalyzer } from '@your-org/bazi-sdk-analysis';
import { PatternDetector } from '@your-org/bazi-sdk-pattern';
import { DayunCalculator } from '@your-org/bazi-sdk-fortune';

// 完整分析流程
const fourPillars = calculator.calculate(birthData);
const strength = dayMasterAnalyzer.analyze(fourPillars);
const pattern = patternDetector.detect(fourPillars, strength);
const dayun = dayunCalculator.calculate(fourPillars, birthData);
// ✅ 共 180KB
```

---

### 示例 4: 一键安装（主包）
```bash
npm install @your-org/bazi-sdk
```

```typescript
import { BaziSDK } from '@your-org/bazi-sdk';

const bazi = new BaziSDK();
const result = bazi.calculate(birthData);
// ✅ 包含所有功能，200KB
```

---

## 📊 包大小对比

| 包组合 | 总大小 | 包含功能 | 适用场景 |
|--------|--------|---------|---------|
| core | 50KB | 四柱排盘 | 小程序 |
| core + analysis | 90KB | + 强弱分析 | 简单命理App |
| core + analysis + pattern | 150KB | + 格局检测 | 专业命理App |
| 主包（全功能） | 200KB | 所有功能 | Web应用 |

---

## 🎨 依赖关系图

```
                    主包 @your-org/bazi-sdk
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
    ┌───▼────┐         ┌────▼────┐        ┌────▼────┐
    │ core   │         │ utils   │        │auxiliary│
    └───┬────┘         └─────────┘        └────┬────┘
        │                                       │
    ┌───▼────────┐                         ┌───▼──────┐
    │ analysis   │◄────────────────────────┤          │
    └───┬────────┘                         │          │
        │                                  │          │
    ┌───▼────────┐                         │          │
    │ pattern    │◄────────────────────────┤          │
    └───┬────────┘                         │          │
        │                                  │          │
    ┌───▼────────┐                         │          │
    │ fortune    │◄─────────────────────────          │
    └────────────┘                                    │
```

**依赖规则**:
- ✅ `core` 无依赖（基础包）
- ✅ `utils` 无依赖（工具包）
- ✅ `auxiliary` 只依赖 `core`
- ✅ `analysis` 只依赖 `core`
- ✅ `pattern` 依赖 `core` + `analysis`
- ✅ `fortune` 依赖 `core` + `analysis`

---

## 💡 总结

### 🎯 **包设计的核心思想**

1. **分层架构** - 从基础到高级逐层递进
2. **按需加载** - 只安装需要的功能
3. **单一职责** - 每个包职责明确
4. **低耦合** - 包之间依赖关系清晰
5. **易扩展** - 可以轻松添加新包

### ✅ **对比你当前代码的优势**

| 维度 | 当前代码 | SDK 化后 |
|-----|---------|---------|
| **复用性** | 单项目 | 跨项目 |
| **体积** | 全量加载 | 按需加载（50KB起） |
| **扩展性** | 修改源码 | 插件机制 |
| **维护性** | 耦合 | 独立维护 |
| **文档** | 内部 | 公开文档 |

---

需要我详细解释某个具体包的实现细节吗？或者你想看某个功能的代码示例？🎯
