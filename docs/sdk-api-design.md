# 八字 SDK API 设计文档

> 完整的接口定义、输入输出规范、使用示例

---

## 📦 包信息

```json
{
  "name": "@your-org/bazi-sdk",
  "version": "0.1.0",
  "description": "八字命理计算 SDK - 专业、准确、易用"
}
```

---

## 🎯 核心功能清单

| 功能 | 接口名称 | 优先级 |
|-----|---------|--------|
| **一键计算** | `calculate()` | P0 |
| **四柱排盘** | `getFourPillars()` | P0 |
| **日主强弱** | `analyzeDayMaster()` | P0 |
| **格局检测** | `detectPattern()` | P0 |
| **五行分析** | `analyzeFiveElements()` | P1 |
| **喜忌用神** | `getFavorableElements()` | P1 |
| **大运流年** | `calculateDayun()` | P1 |
| **真太阳时** | `calculateTrueSolarTime()` | P2 |
| **经纬度查询** | `getCityCoordinates()` | P2 |

---

## 🎨 API 设计

### **1. 主类：BaziSDK**

```typescript
class BaziSDK {
  // 一键计算
  calculate(birthData: BirthInput): BaziResult;
  
  // 分步调用
  getFourPillars(birthData: BirthInput): FourPillars;
  analyzeDayMaster(fourPillars: FourPillars): DayMasterResult;
  detectPattern(fourPillars: FourPillars, dayMaster: DayMasterResult): PatternResult;
  analyzeFiveElements(fourPillars: FourPillars, dayMaster: DayMasterResult): FiveElementsResult;
  
  // 运势
  calculateDayun(fourPillars: FourPillars, birthData: BirthInput): DayunResult;
  
  // 工具
  calculateTrueSolarTime(params: TrueSolarTimeInput): TrueSolarTimeResult;
  getCityCoordinates(cityName: string): Coordinates;
}
```

---

## 📝 接口详细设计

### **接口 1: 一键计算**

#### **方法签名**
```typescript
calculate(birthData: BirthInput): BaziResult
```

#### **输入 (BirthInput)**

```typescript
interface BirthInput {
  // 必填字段
  year: number;              // 年份，例：1990
  month: number;             // 月份，1-12
  day: number;               // 日期，1-31
  hour: number;              // 时，0-23
  minute: number;            // 分，0-59
  
  // 可选字段
  location?: string;         // 地点名称，例："北京"、"上海"
  longitude?: number;        // 经度，例：116.4074（优先使用）
  latitude?: number;         // 纬度，例：39.9042
  calendarType?: 'solar' | 'lunar';  // 历法类型，默认 'solar'
  gender?: 'male' | 'female';        // 性别（用于大运排列）
  isLeapMonth?: boolean;     // 是否闰月（lunar 时使用）
}
```

**字段说明**：
- `location` 和 `longitude/latitude` 二选一
- 如果同时提供，优先使用 `longitude/latitude`
- `calendarType` 默认为阳历 (`solar`)

---

#### **输出 (BaziResult)**

```typescript
interface BaziResult {
  // 核心数据
  fourPillars: FourPillars;           // 四柱八字
  dayMaster: DayMasterResult;         // 日主分析
  pattern: PatternResult;             // 格局信息
  fiveElements: FiveElementsResult;   // 五行分析
  tenGods: TenGodsAnalysis;           // 十神分析
  
  // 可选数据（完整模式）
  dayun?: DayunResult;                // 大运流年
  trueSolarTime?: TrueSolarTimeResult; // 真太阳时信息
  lunarDate?: LunarDateInfo;          // 农历信息
  
  // 辅助信息（完整模式）
  shenSha?: ShenShaInfo;              // 神煞
  xunKong?: FourPillarsXunKongInfo;   // 四柱旬空（空亡）
  directions?: DirectionsInfo;         // 吉神方位
  pengZu?: PengZuInfo;                // 彭祖百忌
  yiJi?: YiJiInfo;                    // 宜忌
  jieQi?: JieQiInfo;                  // 节气
  xingXiu?: XingXiuInfo;              // 星宿
  diShi?: DiShiInfo;                  // 十二长生
  nineStars?: NineStarsInfo;          // 九星
}
```

---

#### **详细类型定义**

##### **1.1 四柱 (FourPillars)**

```typescript
interface FourPillars {
  year: Pillar;    // 年柱
  month: Pillar;   // 月柱
  day: Pillar;     // 日柱
  hour: Pillar;    // 时柱
}

interface Pillar {
  heavenlyStem: HeavenlyStem;      // 天干
  earthlyBranch: EarthlyBranch;    // 地支
  hiddenStems: HeavenlyStem[];     // 藏干（数组，按本气→中气→余气顺序）
  tenGod?: string;                 // 十神（副星）
  naYin: string;                   // 纳音五行
}

interface HeavenlyStem {
  chinese: string;     // 中文，例："甲"
  pinyin: string;      // 拼音，例："jia"
  element: FiveElement; // 五行，例："wood"
  yinYang: 'yin' | 'yang'; // 阴阳
}

interface EarthlyBranch {
  chinese: string;     // 中文，例："子"
  pinyin: string;      // 拼音，例："zi"
  element: FiveElement; // 五行
  yinYang: 'yin' | 'yang';
  animal: string;      // 生肖，例："鼠"
}

type FiveElement = 'metal' | 'wood' | 'water' | 'fire' | 'earth';
```

**示例输出**：
```json
{
  "fourPillars": {
    "year": {
      "heavenlyStem": { "chinese": "庚", "pinyin": "geng", "element": "metal", "yinYang": "yang" },
      "earthlyBranch": { "chinese": "午", "pinyin": "wu", "element": "fire", "yinYang": "yang", "animal": "马" },
      "hiddenStems": [
        { "chinese": "己", "pinyin": "ji", "element": "earth", "yinYang": "yin" },
        { "chinese": "丁", "pinyin": "ding", "element": "fire", "yinYang": "yin" }
      ],
      "tenGod": "正官",
      "naYin": "路旁土"
    },
    "month": {
      "heavenlyStem": { "chinese": "丙", "element": "fire", ... },
      "earthlyBranch": { "chinese": "戌", "element": "earth", "animal": "狗", ... },
      "hiddenStems": [
        { "chinese": "戊", "element": "earth", ... },  // 本气
        { "chinese": "辛", "element": "metal", ... },  // 中气
        { "chinese": "丁", "element": "fire", ... }    // 余气
      ],
      "tenGod": "偏财",
      "naYin": "屋上土"
    },
    "day": { ... },
    "hour": { ... }
  }
}
```

**藏干说明**：
- `hiddenStems` 是一个数组，包含地支中藏的天干
- 顺序：**本气 → 中气 → 余气**（如果有）
- 例如"戌"藏：戊（本气）、辛（中气）、丁（余气）
- 藏干在五行分析和格局判定中起重要作用

---

##### **1.2 日主分析 (DayMasterResult)**

```typescript
interface DayMasterResult {
  stem: HeavenlyStem;              // 日干
  strength: 'strong' | 'weak' | 'balanced'; // 强弱
  characteristics: string[];        // 特征描述
  
  // 详细分析
  analysis: {
    deLing: number;                // 得令分数（-20~40）
    deLingDesc: string;            // 得令描述
    deDi: number;                  // 得地分数（0~45）
    deDiDesc: string;              // 得地描述
    tianGanHelp: number;           // 天干帮扶（-20~20）
    tianGanHelpDesc: string;       // 天干帮扶描述
    totalScore: number;            // 总分（-40~105）
    
    // 调候分析
    seasonalAdjustment?: {
      season: 'spring' | 'summer' | 'autumn' | 'winter';
      temperature: 'cold' | 'cool' | 'warm' | 'hot';
      humidity: 'dry' | 'balanced' | 'wet';
      urgentNeed: FiveElement | null;      // 调候急需
      urgentAvoid: FiveElement | null;     // 调候忌讳
      adjustmentFactor: number;            // 调候系数（0.6-1.0）
      hasAdjustmentElement: boolean;       // 是否有调候用神
      description: string;                 // 说明
    };
  };
}
```

**示例输出**：
```json
{
  "dayMaster": {
    "stem": { "chinese": "戊", "element": "earth", ... },
    "strength": "strong",
    "characteristics": ["身旺", "得月令生扶", "有根气"],
    "analysis": {
      "deLing": 30,
      "deLingDesc": "生于戌月（土月），日主戊土得令，+30分",
      "deDi": 45,
      "deDiDesc": "日支子中藏癸水（正财），坐正财根，+45分",
      "tianGanHelp": 15,
      "tianGanHelpDesc": "年干庚金生扶日主，+15分",
      "totalScore": 90,
      "seasonalAdjustment": {
        "season": "autumn",
        "temperature": "cool",
        "humidity": "dry",
        "urgentNeed": "water",
        "urgentAvoid": "fire",
        "adjustmentFactor": 0.85,
        "hasAdjustmentElement": true,
        "description": "秋季土旺，气候偏燥，急需水润泽"
      }
    }
  }
}
```

---

##### **1.3 格局 (PatternResult)**

```typescript
interface PatternResult {
  name: string;                    // 格局名称
  category: 'normal' | 'special';  // 正格/特殊格
  description: string;             // 格局描述
  
  // 详细信息
  details?: {
    monthStem?: string;            // 月令本气
    monthStemTenGod?: string;      // 月令本气十神
    isTransparent?: boolean;       // 是否透干
    transparentStems?: string[];   // 透出的藏干
    
    // 特殊格局信息
    subtype?: string;              // 子类型（如"从财格"）
    confidence?: number;           // 置信度（0-1）
    structures?: StructureInfo[];  // 三合、三会等结构
    conflicts?: ConflictInfo[];    // 冲克破害信息
  };
}

interface StructureInfo {
  type: '三合' | '三会' | '方局' | '半合';
  element: FiveElement;            // 合化的五行
  positions: string[];             // 位置（年、月、日、时）
  branches: string[];              // 涉及的地支
}

interface ConflictInfo {
  type: '冲' | '刑' | '害' | '破';
  positions: [string, string];     // 冲突位置
  branches: [string, string];      // 冲突地支
  severity: 'light' | 'medium' | 'heavy'; // 严重程度
}
```

**示例输出**：
```json
{
  "pattern": {
    "name": "曲直格",
    "category": "special",
    "description": "日主甲木，地支寅卯辰三会木局，木气专旺，成曲直格",
    "details": {
      "subtype": "wood-prosperity",
      "confidence": 0.92,
      "structures": [
        {
          "type": "三会",
          "element": "wood",
          "positions": ["年支", "月支", "日支"],
          "branches": ["寅", "卯", "辰"]
        }
      ],
      "conflicts": []
    }
  }
}
```

---

##### **1.4 五行分析 (FiveElementsResult)**

```typescript
interface FiveElementsResult {
  distribution: Record<FiveElement, number>;  // 五行分布（权重）
  counts: Record<FiveElement, number>;        // 五行数量（含藏干）
  strongest: FiveElement;                     // 最旺
  weakest: FiveElement;                       // 最弱
  favorable: FiveElement[];                   // 喜用神
  unfavorable: FiveElement[];                 // 忌神
  
  // 可选
  elementStates?: Record<FiveElement, '旺' | '相' | '休' | '囚' | '死'>;
  monthElement?: FiveElement;                 // 月令五行
}
```

**示例输出**：
```json
{
  "fiveElements": {
    "distribution": {
      "metal": 25,
      "wood": 15,
      "water": 10,
      "fire": 20,
      "earth": 30
    },
    "counts": {
      "metal": 3,
      "wood": 2,
      "water": 1,
      "fire": 2,
      "earth": 4
    },
    "strongest": "earth",
    "weakest": "water",
    "favorable": ["water", "wood"],
    "unfavorable": ["fire", "earth"],
    "elementStates": {
      "metal": "相",
      "wood": "休",
      "water": "囚",
      "fire": "死",
      "earth": "旺"
    },
    "monthElement": "earth"
  }
}
```

---

##### **1.5 大运流年 (DayunResult)**

```typescript
interface DayunResult {
  startAge: number;               // 起运岁数
  forward: boolean;               // 顺排/逆排
  decades: DayunDecade[];         // 大运列表
}

interface DayunDecade {
  age: number;                    // 起运年龄
  stem: string;                   // 天干
  branch: string;                 // 地支
  element: FiveElement;           // 五行
  tenGod: string;                 // 十神
  period: {
    start: number;                // 开始年份
    end: number;                  // 结束年份
  };
  years?: LiunianYear[];          // 流年（10年）
}

interface LiunianYear {
  year: number;                   // 年份
  stem: string;                   // 天干
  branch: string;                 // 地支
  element: FiveElement;           // 五行
  animal: string;                 // 生肖
}
```

**示例输出**：
```json
{
  "dayun": {
    "startAge": 3,
    "forward": true,
    "decades": [
      {
        "age": 3,
        "stem": "甲",
        "branch": "寅",
        "element": "wood",
        "tenGod": "比肩",
        "period": { "start": 1993, "end": 2003 },
        "years": [
          { "year": 1993, "stem": "癸", "branch": "酉", "element": "water", "animal": "鸡" },
          { "year": 1994, "stem": "甲", "branch": "戌", "element": "wood", "animal": "狗" },
          ...
        ]
      },
      {
        "age": 13,
        "stem": "乙",
        "branch": "卯",
        "element": "wood",
        "tenGod": "劫财",
        "period": { "start": 2003, "end": 2013 },
        "years": [ ... ]
      }
    ]
  }
}
```

---

##### **1.6 真太阳时 (TrueSolarTimeResult)**

```typescript
interface TrueSolarTimeResult {
  localTime: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
  };
  trueSolarTime: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    dayOffset: number;  // 日期偏移（-1/0/1）
  };
  adjustment: {
    longitudeDiff: number;      // 经度差（分钟）
    equationOfTime: number;     // 均时差（分钟）
    totalAdjustment: number;    // 总调整（分钟）
  };
}
```

**示例输出**：
```json
{
  "trueSolarTime": {
    "localTime": {
      "year": 1990,
      "month": 10,
      "day": 15,
      "hour": 14,
      "minute": 30
    },
    "trueSolarTime": {
      "year": 1990,
      "month": 10,
      "day": 15,
      "hour": 14,
      "minute": 18,
      "dayOffset": 0
    },
    "adjustment": {
      "longitudeDiff": -14,
      "equationOfTime": 2,
      "totalAdjustment": -12
    }
  }
}
```

---

#### **使用示例**

```typescript
import { BaziSDK } from '@your-org/bazi-sdk';

const bazi = new BaziSDK();

// 一键计算
const result = bazi.calculate({
  year: 1990,
  month: 10,
  day: 15,
  hour: 14,
  minute: 30,
  location: '北京',
  calendarType: 'solar',
  gender: 'male'
});

// 访问结果
console.log('日主:', result.dayMaster.stem.chinese);        // "戊"
console.log('强弱:', result.dayMaster.strength);            // "strong"
console.log('格局:', result.pattern.name);                  // "曲直格"
console.log('喜用神:', result.fiveElements.favorable);      // ["water", "wood"]
console.log('起运岁数:', result.dayun?.startAge);           // 3
```

---

### **接口 2: 分步调用**

#### **2.1 获取四柱**

```typescript
getFourPillars(birthData: BirthInput): FourPillars
```

**示例**：
```typescript
const fourPillars = bazi.getFourPillars({
  year: 1990,
  month: 10,
  day: 15,
  hour: 14,
  minute: 30,
  location: '北京'
});

console.log(fourPillars.day.heavenlyStem.chinese); // "戊"
```

---

#### **2.2 分析日主**

```typescript
analyzeDayMaster(fourPillars: FourPillars): DayMasterResult
```

**示例**：
```typescript
const dayMaster = bazi.analyzeDayMaster(fourPillars);

console.log(dayMaster.strength);              // "strong"
console.log(dayMaster.analysis.totalScore);   // 90
```

---

#### **2.3 检测格局**

```typescript
detectPattern(
  fourPillars: FourPillars,
  dayMaster: DayMasterResult
): PatternResult
```

**示例**：
```typescript
const pattern = bazi.detectPattern(fourPillars, dayMaster);

console.log(pattern.name);        // "曲直格"
console.log(pattern.category);    // "special"
```

---

#### **2.4 分析五行**

```typescript
analyzeFiveElements(
  fourPillars: FourPillars,
  dayMaster: DayMasterResult
): FiveElementsResult
```

**示例**：
```typescript
const fiveElements = bazi.analyzeFiveElements(fourPillars, dayMaster);

console.log(fiveElements.strongest);    // "earth"
console.log(fiveElements.favorable);    // ["water", "wood"]
```

---

### **接口 3: 工具函数**

#### **3.1 真太阳时计算**

```typescript
calculateTrueSolarTime(params: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  longitude: number;
  latitude: number;
}): TrueSolarTimeResult
```

**示例**：
```typescript
const trueTime = bazi.calculateTrueSolarTime({
  year: 1990,
  month: 10,
  day: 15,
  hour: 14,
  minute: 30,
  longitude: 116.4074,
  latitude: 39.9042
});

console.log(trueTime.trueSolarTime.hour);   // 14
console.log(trueTime.trueSolarTime.minute); // 18
```

---

#### **3.2 经纬度查询**

```typescript
getCityCoordinates(cityName: string): Coordinates | null

interface Coordinates {
  longitude: number;
  latitude: number;
  city: string;
}
```

**示例**：
```typescript
const coords = bazi.getCityCoordinates('北京');
console.log(coords);
// { longitude: 116.4074, latitude: 39.9042, city: '北京' }

const coords2 = bazi.getCityCoordinates('上海');
// { longitude: 121.4737, latitude: 31.2304, city: '上海' }
```

---

### **接口 4: 函数式调用**

除了类方法，SDK 也导出所有底层函数，供高级用户直接使用：

```typescript
// 从包中直接导入函数
import {
  calculateBazi,
  calculateDayMasterOptimized,
  calculatePatternOptimized,
  calculateFavorableElementsOptimized,
  calculateSeasonalAdjustment,
  getLongitudeFromLocation
} from '@your-org/bazi-sdk';

// 直接调用
const result = calculateBazi({
  year: 1990,
  month: 10,
  day: 15,
  hour: 14,
  location: '北京'
});

// 或单独使用某个功能
const dayMaster = calculateDayMasterOptimized(
  result.fourPillars.day.heavenlyStem,
  result.fourPillars
);
```

---

## 📚 完整使用示例

### **示例 1: 基础使用**

```typescript
import { BaziSDK } from '@your-org/bazi-sdk';

const bazi = new BaziSDK();

// 最简单的使用
const result = bazi.calculate({
  year: 1990,
  month: 10,
  day: 15,
  hour: 14,
  minute: 30,
  location: '北京'
});

// 输出关键信息
console.log(`四柱: ${result.fourPillars.year.heavenlyStem.chinese}${result.fourPillars.year.earthlyBranch.chinese}年`);
console.log(`日主: ${result.dayMaster.stem.chinese} (${result.dayMaster.strength})`);
console.log(`格局: ${result.pattern.name}`);
console.log(`喜用神: ${result.fiveElements.favorable.join('、')}`);
```

---

### **示例 2: 分步调用（更灵活）**

```typescript
import { BaziSDK } from '@your-org/bazi-sdk';

const bazi = new BaziSDK();

// 第 1 步：排盘
const fourPillars = bazi.getFourPillars({
  year: 1990,
  month: 10,
  day: 15,
  hour: 14,
  location: '北京'
});

console.log('四柱:', {
  year: fourPillars.year.heavenlyStem.chinese + fourPillars.year.earthlyBranch.chinese,
  month: fourPillars.month.heavenlyStem.chinese + fourPillars.month.earthlyBranch.chinese,
  day: fourPillars.day.heavenlyStem.chinese + fourPillars.day.earthlyBranch.chinese,
  hour: fourPillars.hour.heavenlyStem.chinese + fourPillars.hour.earthlyBranch.chinese
});

// 第 2 步：分析日主
const dayMaster = bazi.analyzeDayMaster(fourPillars);

console.log('日主分析:', {
  强弱: dayMaster.strength,
  得分: dayMaster.analysis.totalScore,
  调候: dayMaster.analysis.seasonalAdjustment?.description
});

// 第 3 步：检测格局
const pattern = bazi.detectPattern(fourPillars, dayMaster);

console.log('格局:', {
  名称: pattern.name,
  类型: pattern.category,
  描述: pattern.description
});

// 第 4 步：五行分析
const fiveElements = bazi.analyzeFiveElements(fourPillars, dayMaster);

console.log('五行:', {
  分布: fiveElements.distribution,
  最旺: fiveElements.strongest,
  喜用神: fiveElements.favorable,
  忌神: fiveElements.unfavorable
});
```

---

### **示例 3: 函数式调用**

```typescript
import { 
  calculateBazi,
  calculateDayMasterOptimized,
  getLongitudeFromLocation 
} from '@your-org/bazi-sdk';

// 先查经纬度
const longitude = getLongitudeFromLocation('北京');
console.log('经度:', longitude); // 116.4074

// 直接计算
const result = calculateBazi({
  year: 1990,
  month: 10,
  day: 15,
  hour: 14,
  longitude: longitude,
  latitude: 39.9042
});

// 单独使用某个功能
const dayMaster = calculateDayMasterOptimized(
  result.fourPillars.day.heavenlyStem,
  result.fourPillars
);

console.log('日主强弱:', dayMaster.strength);
```

---

### **示例 4: 处理农历输入**

```typescript
const result = bazi.calculate({
  year: 1990,
  month: 8,      // 农历八月
  day: 27,       // 农历廿七
  hour: 14,
  calendarType: 'lunar',  // 指定农历
  isLeapMonth: false,     // 非闰月
  location: '北京'
});

console.log('对应阳历:', result.lunarDate);
```

---

### **示例 5: 真太阳时计算**

```typescript
// 单独使用真太阳时功能
const trueTime = bazi.calculateTrueSolarTime({
  year: 1990,
  month: 10,
  day: 15,
  hour: 14,
  minute: 30,
  longitude: 116.4074,
  latitude: 39.9042
});

console.log('当地时间:', `${trueTime.localTime.hour}:${trueTime.localTime.minute}`);
console.log('真太阳时:', `${trueTime.trueSolarTime.hour}:${trueTime.trueSolarTime.minute}`);
console.log('调整量:', `${trueTime.adjustment.totalAdjustment} 分钟`);
```

---

## 🔧 高级功能

### **导出 detector 模块（供专业用户）**

```typescript
import { 
  StructuralAnalyzer,
  PurityChecker,
  ScoreRecalculator,
  ConflictEngine 
} from '@your-org/bazi-sdk/detector';

// 使用底层检测器
const analyzer = new StructuralAnalyzer();
const structures = analyzer.detectStructures(fourPillars);

console.log('检测到的结构:', structures);
// [{ type: '三合', element: 'wood', branches: ['寅', '午', '戌'] }]
```

---

## 📦 完整导出清单

```typescript
// src/index.ts

// 主类
export { BaziSDK } from './BaziSDK';

// 核心函数
export { calculateBazi } from './calculator';
export { calculateDayMasterOptimized } from './strength-calculation';
export { calculateSeasonalAdjustment } from './seasonal-adjustment';
export { calculateFavorableElementsOptimized } from './favorable-elements';
export { calculatePatternOptimized } from './pattern-calculation';

// 工具函数
export { getLongitudeFromLocation } from './geo-utils';

// 类型定义
export type * from './types';

// detector 模块（高级）
export * from './detector';
```

---

## 📌 藏干信息详解

### **什么是藏干？**

藏干是地支中所藏的天干。每个地支根据其五行属性，内藏1-3个天干：
- **本气**：地支的主要五行对应的天干
- **中气**：地支包含的次要五行对应的天干
- **余气**：地支包含的其他五行对应的天干

### **藏干在四柱中的位置**

```typescript
fourPillars.year.hiddenStems   // 年支藏干
fourPillars.month.hiddenStems  // 月支藏干
fourPillars.day.hiddenStems    // 日支藏干
fourPillars.hour.hiddenStems   // 时支藏干
```

### **藏干示例**

| 地支 | 本气 | 中气 | 余气 | 数组表示 |
|-----|------|------|------|---------|
| 子 | 癸(水) | - | - | `["癸"]` |
| 丑 | 己(土) | 癸(水) | 辛(金) | `["己", "癸", "辛"]` |
| 寅 | 甲(木) | 丙(火) | 戊(土) | `["甲", "丙", "戊"]` |
| 卯 | 乙(木) | - | - | `["乙"]` |
| 辰 | 戊(土) | 乙(木) | 癸(水) | `["戊", "乙", "癸"]` |
| 巳 | 丙(火) | 戊(土) | 庚(金) | `["丙", "戊", "庚"]` |
| 午 | 丁(火) | 己(土) | - | `["丁", "己"]` |
| 未 | 己(土) | 丁(火) | 乙(木) | `["己", "丁", "乙"]` |
| 申 | 庚(金) | 壬(水) | 戊(土) | `["庚", "壬", "戊"]` |
| 酉 | 辛(金) | - | - | `["辛"]` |
| 戌 | 戊(土) | 辛(金) | 丁(火) | `["戊", "辛", "丁"]` |
| 亥 | 壬(水) | 甲(木) | - | `["壬", "甲"]` |

### **藏干的作用**

1. **通根判断**：日主在地支中找到同类五行，称为"通根"，增强日主力量
2. **格局判定**：月令藏干透出天干，决定格局类型
3. **五行统计**：藏干也计入五行分布，影响喜忌用神
4. **能量计算**：
   - 本气：权重最高（如戌土中的戊土）
   - 中气：权重中等（如戌土中的辛金）
   - 余气：权重最低（如戌土中的丁火）

### **使用示例**

```typescript
const result = bazi.calculate({
  year: 1990,
  month: 10,
  day: 15,
  hour: 14,
  location: '北京'
});

// 获取日支藏干
const dayBranchHiddenStems = result.fourPillars.day.hiddenStems;

console.log('日支:', result.fourPillars.day.earthlyBranch.chinese);
console.log('日支藏干:', dayBranchHiddenStems.map(s => s.chinese).join('、'));

// 输出示例：
// 日支: 子
// 日支藏干: 癸

// 检查日主是否通根
const dayStem = result.fourPillars.day.heavenlyStem.chinese;  // "戊"
const dayStemElement = result.fourPillars.day.heavenlyStem.element; // "earth"

// 遍历四柱所有藏干，查找与日主同五行的
const roots = [];
['year', 'month', 'day', 'hour'].forEach(pillar => {
  const hidden = result.fourPillars[pillar].hiddenStems;
  hidden.forEach((stem, index) => {
    if (stem.element === dayStemElement) {
      roots.push({
        position: pillar,
        stem: stem.chinese,
        type: index === 0 ? '本气' : index === 1 ? '中气' : '余气'
      });
    }
  });
});

console.log('日主通根情况:', roots);
// 输出示例：
// [
//   { position: 'month', stem: '戊', type: '本气' },
//   { position: 'hour', stem: '己', type: '本气' }
// ]
```

### **藏干数据结构**

```typescript
interface HeavenlyStem {
  chinese: string;      // 天干中文名
  pinyin: string;       // 拼音
  element: FiveElement; // 五行
  yinYang: 'yin' | 'yang'; // 阴阳
}

// 藏干数组顺序
hiddenStems: [
  { chinese: "本气天干", ... },  // [0] 本气（权重最高）
  { chinese: "中气天干", ... },  // [1] 中气（如有）
  { chinese: "余气天干", ... }   // [2] 余气（如有）
]
```

---

## 📌 辅助信息详解

除了核心的四柱、日主、格局、五行分析之外，SDK 还提供以下辅助信息：

### **1. 十神（副星）- tenGod**

**位置**: 每个柱（年月时柱）都有 `tenGod` 字段

```typescript
fourPillars.year.tenGod   // 年柱十神，如 "正官"
fourPillars.month.tenGod  // 月柱十神，如 "正印"
fourPillars.hour.tenGod   // 时柱十神，如 "偏财"
// 注：日柱的十神是 "比肩"（日主自己）
```

**十神类型**：
- 比肩、劫财（同类）
- 食神、伤官（我生者）
- 偏财、正财（我克者）
- 七杀、正官（克我者）
- 偏印、正印（生我者）

**统计分析**：
```typescript
result.tenGods.gods  // 十神统计
{
  "正官": { name: "正官", count: 1, positions: ["年干"] },
  "正印": { name: "正印", count: 2, positions: ["月干", "时干"] },
  "偏财": { name: "偏财", count: 1, positions: ["年干"] }
}
```

---

### **2. 纳音五行 - naYin**

**位置**: 每个柱都有 `naYin` 字段

```typescript
fourPillars.year.naYin   // 年柱纳音，如 "路旁土"
fourPillars.month.naYin  // 月柱纳音，如 "屋上土"
fourPillars.day.naYin    // 日柱纳音，如 "大海水"
fourPillars.hour.naYin   // 时柱纳音，如 "剑锋金"
```

**纳音说明**：
- 60 甲子纳音，每两年一个纳音五行
- 如：甲子乙丑 → 海中金，丙寅丁卯 → 炉中火
- 用途：看命宫、身宫的纳音，辅助分析

---

### **3. 空亡（旬空）- xunKong**

**位置**: `result.xunKong`

```typescript
interface FourPillarsXunKongInfo {
  yearXun: string;      // 年柱所在旬，如 "甲子"
  yearXunKong: string;  // 年柱旬空地支，如 "戌亥"
  monthXun: string;     // 月柱所在旬
  monthXunKong: string; // 月柱旬空地支
  dayXun: string;       // 日柱所在旬（最重要！）
  dayXunKong: string;   // 日柱旬空地支
  hourXun: string;      // 时柱所在旬
  hourXunKong: string;  // 时柱旬空地支
}
```

**示例**：
```json
{
  "yearXun": "甲子",
  "yearXunKong": "戌亥",
  "dayXun": "甲寅",
  "dayXunKong": "子丑"  // 说明日柱所在旬中，子、丑地支为空亡
}
```

**空亡的作用**：
- 若月支或日支逢空亡，该支的能量减弱
- 影响日主强弱计算、格局判定
- 流年或大运可以"填实"空亡

---

### **4. 神煞 - shenSha**

**位置**: `result.shenSha`

```typescript
interface ShenShaInfo {
  year: string[];   // 年柱神煞，如 ["天乙贵人", "文昌贵人"]
  month: string[];  // 月柱神煞
  day: string[];    // 日柱神煞
  hour: string[];   // 时柱神煞
}
```

**示例**：
```json
{
  "year": ["天乙贵人", "月德贵人"],
  "month": ["文昌贵人"],
  "day": ["桃花", "华盖"],
  "hour": ["天德贵人"]
}
```

**常见神煞**：
- **吉神**: 天乙贵人、文昌、天德、月德、福星、禄神
- **凶煞**: 羊刃、劫煞、灾煞、孤辰、寡宿、桃花

---

### **5. 吉神方位 - directions**

**位置**: `result.directions`

```typescript
interface DirectionsInfo {
  xi: string;       // 喜神方位，如 "东北"
  yangGui: string;  // 阳贵神方位，如 "西南"
  yinGui: string;   // 阴贵神方位，如 "正北"
  fu: string;       // 福神方位，如 "西北"
  cai: string;      // 财神方位，如 "正东"
}
```

**用途**: 出行、办公、选择方位时参考

---

### **6. 彭祖百忌 - pengZu**

**位置**: `result.pengZu`

```typescript
interface PengZuInfo {
  gan: string;  // 天干忌，如 "甲不开仓财物耗散"
  zhi: string;  // 地支忌，如 "子不问卜自惹祸殃"
}
```

---

### **7. 宜忌 - yiJi**

**位置**: `result.yiJi`

```typescript
interface YiJiInfo {
  yi: string[];   // 宜做的事，如 ["嫁娶", "出行", "祭祀"]
  ji: string[];   // 忌做的事，如 ["动土", "破土", "安葬"]
}
```

---

### **8. 节气 - jieQi**

**位置**: `result.jieQi`

```typescript
interface JieQiInfo {
  current: string;    // 当前节气，如 "立春"
  prev: string;       // 上一节气，如 "大寒"
  prevDate: string;   // 上一节气日期
  next: string;       // 下一节气，如 "雨水"
  nextDate: string;   // 下一节气日期
}
```

---

### **9. 星宿 - xingXiu**

**位置**: `result.xingXiu`

```typescript
interface XingXiuInfo {
  xiu: string;     // 星宿名，如 "角宿"
  animal: string;  // 星宿动物，如 "蛟"
  gong: string;    // 宫，如 "东方"
  shou: string;    // 兽，如 "青龙"
  luck: string;    // 吉凶，如 "吉"
  song: string;    // 星宿歌诀
}
```

---

### **10. 十二长生 - diShi**

**位置**: `result.diShi`

```typescript
interface DiShiInfo {
  year: string;   // 年柱地势，如 "临官"
  month: string;  // 月柱地势，如 "帝旺"
  day: string;    // 日柱地势，如 "长生"
  hour: string;   // 时柱地势，如 "沐浴"
}
```

**十二长生**：长生、沐浴、冠带、临官、帝旺、衰、病、死、墓、绝、胎、养

---

### **11. 九星 - nineStars**

**位置**: `result.nineStars`

```typescript
interface NineStarsInfo {
  year: NineStarInfo;   // 年九星
  month: NineStarInfo;  // 月九星
  day: NineStarInfo;    // 日九星
  hour: NineStarInfo;   // 时九星
}

interface NineStarInfo {
  number: string;  // 数字，如 "一"
  color: string;   // 颜色，如 "白"
  wuXing: string;  // 五行，如 "水"
  name: string;    // 名称，如 "贪狼星"
  luck: string;    // 吉凶，如 "吉"
}
```

---

### **使用示例**

```typescript
const result = bazi.calculate({
  year: 1990,
  month: 10,
  day: 15,
  hour: 14,
  location: '北京'
});

// 1. 查看纳音
console.log('日柱纳音:', result.fourPillars.day.naYin);  // "大海水"

// 2. 查看十神
console.log('月柱十神:', result.fourPillars.month.tenGod);  // "正印"
console.log('十神统计:', result.tenGods.gods);

// 3. 检查空亡
const dayXunKong = result.xunKong?.dayXunKong;  // "子丑"
const dayBranch = result.fourPillars.day.earthlyBranch.chinese;  // "子"
const isDayBranchEmpty = dayXunKong?.includes(dayBranch);  // true
if (isDayBranchEmpty) {
  console.log('⚠️ 日支逢空，能量减弱');
}

// 4. 查看神煞
console.log('年柱神煞:', result.shenSha?.year);  // ["天乙贵人", "月德贵人"]

// 5. 查看吉神方位
console.log('今日财神方位:', result.directions?.cai);  // "正东"

// 6. 查看宜忌
console.log('今日宜:', result.yiJi?.yi);  // ["嫁娶", "出行"]
console.log('今日忌:', result.yiJi?.ji);  // ["动土", "安葬"]

// 7. 查看节气
console.log('当前节气:', result.jieQi?.current);  // "立春"
console.log('下一节气:', result.jieQi?.next, result.jieQi?.nextDate);

// 8. 查看十二长生
console.log('日柱地势:', result.diShi?.day);  // "帝旺"
```

---

### **数据来源说明**

| 信息 | 数据来源 | 说明 |
|-----|---------|------|
| **藏干** | ✅ 内置数据 | 12 地支藏干规则 |
| **十神** | ✅ 自己计算 | 基于五行生克关系 |
| **纳音** | ✅ 内置数据 | 60 甲子纳音表 |
| **空亡** | ✅ 自己计算 | 基于日柱所在旬 |
| **神煞** | ⚠️ lunar-typescript | 封装 lunar 库 |
| **方位宜忌** | ⚠️ lunar-typescript | 封装 lunar 库 |
| **节气星宿** | ⚠️ lunar-typescript | 封装 lunar 库 |

---

## 🎯 总结

### **核心接口（3个）**

1. **一键计算**: `calculate()` - 最常用
2. **分步调用**: `getFourPillars()` → `analyzeDayMaster()` → `detectPattern()` - 灵活控制
3. **函数式调用**: 直接导入函数 - 高级用户

### **输入参数**

```typescript
{
  year, month, day, hour, minute,  // 必填
  location / longitude/latitude,    // 二选一
  calendarType, gender, isLeapMonth // 可选
}
```

### **输出结果**

```typescript
{
  fourPillars,      // 四柱八字
  dayMaster,        // 日主强弱
  pattern,          // 格局信息
  fiveElements,     // 五行分析
  dayun,            // 大运流年
  trueSolarTime,    // 真太阳时
  lunarDate         // 农历信息
}
```

---

**这个 API 设计的优势**：
- ✅ 简单易用（一行代码搞定）
- ✅ 灵活强大（支持分步调用）
- ✅ 类型完整（TypeScript 支持）
- ✅ 文档清晰（每个字段都有说明）

准备好开始实施了吗？🚀
