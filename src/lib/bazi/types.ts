/**
 * 八字算命类型定义
 * Bazi Fortune Telling Type Definitions
 * 
 * 复用自 https://github.com/zhihao93li/human_design2
 */

// ============================================================================
// 五行 (Five Elements)
// ============================================================================

export type FiveElement = 'metal' | 'wood' | 'water' | 'fire' | 'earth';

export type YinYang = 'yin' | 'yang';

// ============================================================================
// 天干 (Heavenly Stems)
// ============================================================================

export interface HeavenlyStem {
  chinese: string;      // 甲乙丙丁戊己庚辛壬癸
  pinyin: string;       // jia yi bing ding wu ji geng xin ren gui
  element: FiveElement;
  yinYang: YinYang;
}

// ============================================================================
// 地支 (Earthly Branches)
// ============================================================================

export interface EarthlyBranch {
  chinese: string;      // 子丑寅卯辰巳午未申酉戌亥
  pinyin: string;
  element: FiveElement;
  yinYang: YinYang;
  animal: string;       // 生肖 (Chinese Zodiac Animal)
}

// ============================================================================
// 柱 (Pillar)
// ============================================================================

export interface Pillar {
  heavenlyStem: HeavenlyStem;   // 天干
  earthlyBranch: EarthlyBranch; // 地支
  hiddenStems: HeavenlyStem[];  // 藏干
  tenGod?: string;              // 十神
  naYin: string;                // 纳音
}

// ============================================================================
// 四柱 (Four Pillars)
// ============================================================================

export interface FourPillars {
  year: Pillar;   // 年柱
  month: Pillar;  // 月柱
  day: Pillar;    // 日柱
  hour: Pillar;   // 时柱
}

// ============================================================================
// 日主 (Day Master)
// ============================================================================

export interface DayMaster {
  stem: HeavenlyStem;
  strength: 'strong' | 'weak' | 'balanced';
  characteristics: string[];
}

// ============================================================================
// 五行分析 (Five Elements Analysis)
// ============================================================================

export interface FiveElementsAnalysis {
  distribution: Record<FiveElement, number>;
  strongest: FiveElement;
  weakest: FiveElement;
  favorable: FiveElement[];    // 喜用神
  unfavorable: FiveElement[];  // 忌神
}

// ============================================================================
// 十神 (Ten Gods)
// ============================================================================

export interface TenGodInfo {
  name: string;      // 比肩、劫财、食神、伤官、偏财、正财、七杀、正官、偏印、正印
  count: number;
  positions: string[];
}

export interface TenGodsAnalysis {
  gods: Record<string, TenGodInfo>;
}

// ============================================================================
// 藏干 (Hidden Stems)
// ============================================================================

export interface HiddenStemsData {
  [branchChinese: string]: HeavenlyStem[];
}

// ============================================================================
// 农历日期 (Lunar Date)
// ============================================================================

export interface LunarDateInfo {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
  yearGanZhi: string;
  monthGanZhi: string;
  dayGanZhi: string;
  yearInChinese: string;    // 一九九三
  monthInChinese: string;   // 正月
  dayInChinese: string;     // 十一
}


// ============================================================================
// 大运 (Major Luck Cycles / Da Yun)
// ============================================================================

// ============================================================================
// 流月 (Monthly Fortune / Liu Yue)
// ============================================================================

export interface LiuYueInfo {
  index: number;          // 月份索引 (0-11)
  monthInChinese: string; // 中文月份 (正月、二月...)
  ganZhi: string;         // 干支
  xun: string;            // 旬
  xunKong: string;        // 旬空
}

// ============================================================================
// 流年 (Yearly Fortune / Liu Nian)
// ============================================================================

export interface LiuNianInfo {
  index: number;          // 索引
  year: number;           // 公历年份
  age: number;            // 虚岁
  ganZhi: string;         // 干支
  xun: string;            // 旬
  xunKong: string;        // 旬空
  liuYue: LiuYueInfo[];   // 流月列表
}

export interface DaYunInfo {
  index: number;          // 第几步大运
  startAge: number;       // 起运年龄
  endAge: number;         // 结束年龄
  startYear: number;      // 起运公历年份
  endYear: number;        // 结束公历年份
  ganZhi: string;         // 干支
  gan: string;            // 天干
  zhi: string;            // 地支
  xun: string;            // 旬
  xunKong: string;        // 旬空
  liuNian: LiuNianInfo[]; // 流年列表
}

export interface YunInfo {
  startYear: number;      // 起运年份
  startMonth: number;     // 起运月份
  startDay: number;       // 起运日
  startAge: number;       // 起运年龄（岁）
  forward: boolean;       // 是否顺行
  daYunList: DaYunInfo[]; // 大运列表
}

// ============================================================================
// 神煞 (Shen Sha / Spirits)
// ============================================================================

export interface ShenShaInfo {
  year: string[];         // 年柱神煞
  month: string[];        // 月柱神煞
  day: string[];          // 日柱神煞
  hour: string[];         // 时柱神煞
}

// ============================================================================
// 吉神方位 (Auspicious Directions)
// ============================================================================

export interface DirectionsInfo {
  xi: string;             // 喜神方位
  yangGui: string;        // 阳贵神方位
  yinGui: string;         // 阴贵神方位
  fu: string;             // 福神方位
  cai: string;            // 财神方位
}

// ============================================================================
// 彭祖百忌 (Peng Zu Taboos)
// ============================================================================

export interface PengZuInfo {
  gan: string;            // 天干忌
  zhi: string;            // 地支忌
}

// ============================================================================
// 宜忌 (Suitable/Unsuitable Activities)
// ============================================================================

export interface YiJiInfo {
  yi: string[];           // 宜
  ji: string[];           // 忌
}

// ============================================================================
// 节气 (Solar Terms)
// ============================================================================

export interface JieQiInfo {
  current: string;        // 当前节气
  next: string;           // 下一个节气
  nextDate: string;       // 下一个节气日期
  prev: string;           // 上一个节气
  prevDate: string;       // 上一个节气日期
}

// ============================================================================
// 星宿 (Star Mansion)
// ============================================================================

export interface XingXiuInfo {
  xiu: string;            // 星宿名
  animal: string;         // 星宿动物
  gong: string;           // 宫
  shou: string;           // 兽
  luck: string;           // 吉凶
  song: string;           // 星宿歌诀
}

// ============================================================================
// 十二长生 (Twelve Stages of Life)
// ============================================================================

export interface DiShiInfo {
  year: string;           // 年柱地势
  month: string;          // 月柱地势
  day: string;            // 日柱地势
  hour: string;           // 时柱地势
}

// ============================================================================
// 九星 (Nine Stars)
// ============================================================================

export interface NineStarInfo {
  number: string;         // 数字
  color: string;          // 颜色
  wuXing: string;         // 五行
  name: string;           // 名称
  luck: string;           // 吉凶
}

export interface NineStarsInfo {
  year: NineStarInfo;     // 年九星
  month: NineStarInfo;    // 月九星
  day: NineStarInfo;      // 日九星
  hour: NineStarInfo;     // 时九星
}

// ============================================================================
// 天神 (Heavenly God)
// ============================================================================

export interface TianShenInfo {
  day: string;            // 日天神
  dayType: string;        // 日天神类型
  dayLuck: string;        // 日天神吉凶
  hour: string;           // 时天神
  hourType: string;       // 时天神类型
  hourLuck: string;       // 时天神吉凶
}

// ============================================================================
// 吉神凶煞 (Auspicious/Inauspicious Spirits)
// ============================================================================

export interface JiXiongInfo {
  jiShen: string[];       // 日吉神
  xiongSha: string[];     // 日凶煞
}

// ============================================================================
// 时辰宜忌 (Hourly Suitable/Unsuitable)
// ============================================================================

export interface TimeYiJiInfo {
  yi: string[];           // 时辰宜
  ji: string[];           // 时辰忌
}

// ============================================================================
// 冲煞 (Clash and Evil)
// ============================================================================

export interface ChongShaInfo {
  dayChong: string;       // 日冲
  dayChongDesc: string;   // 日冲描述
  daySha: string;         // 日煞
  timeChong: string;      // 时冲
  timeChongDesc: string;  // 时冲描述
  timeSha: string;        // 时煞
}

// ============================================================================
// 胎神 (Fetal God)
// ============================================================================

export interface TaiShenInfo {
  day: string;            // 日胎神方位
  month: string;          // 月胎神方位
}

// ============================================================================
// 其他信息 (Other Info)
// ============================================================================

export interface OtherLunarInfo {
  liuYao: string;         // 六曜
  wuHou: string;          // 物候
  hou: string;            // 候
  dayLu: string;          // 日禄
  yueXiang: string;       // 月相
  zhiXing: string;        // 执星（建除十二神）
  festivals: string[];    // 农历节日
  otherFestivals: string[]; // 其他节日
}

// ============================================================================
// 四柱旬空 (Four Pillars Xun Kong)
// ============================================================================

export interface FourPillarsXunKongInfo {
  yearXun: string;
  yearXunKong: string;
  monthXun: string;
  monthXunKong: string;
  dayXun: string;
  dayXunKong: string;
  hourXun: string;
  hourXunKong: string;
}

// ============================================================================
// 四柱十神 (Four Pillars Ten Gods)
// ============================================================================

export interface FourPillarsShiShenInfo {
  yearGan: string;        // 年干十神
  yearZhi: string[];      // 年支藏干十神
  monthGan: string;       // 月干十神
  monthZhi: string[];     // 月支藏干十神
  dayZhi: string[];       // 日支藏干十神
  hourGan: string;        // 时干十神
  hourZhi: string[];      // 时支藏干十神
}

// ============================================================================
// 胎息 (Tai Xi)
// ============================================================================

export interface TaiXiInfo {
  ganZhi: string;         // 胎息干支
  naYin: string;          // 胎息纳音
}

// ============================================================================
// 命宫身宫纳音 (Ming Gong / Shen Gong Na Yin)
// ============================================================================

export interface GongNaYinInfo {
  taiYuan: string;        // 胎元
  taiYuanNaYin: string;   // 胎元纳音
  mingGong: string;       // 命宫
  mingGongNaYin: string;  // 命宫纳音
  shenGong: string;       // 身宫
  shenGongNaYin: string;  // 身宫纳音
  taiXi: string;          // 胎息
  taiXiNaYin: string;     // 胎息纳音
}

// ============================================================================
// 八字数据 (Bazi Data)
// ============================================================================

export interface BaziData {
  fourPillars: FourPillars;
  dayMaster: DayMaster;
  fiveElements: FiveElementsAnalysis;
  tenGods: TenGodsAnalysis;
  hiddenStems: HiddenStemsData;
  lunarDate: LunarDateInfo;
  // 大运信息
  yun?: YunInfo;
  // 神煞
  shenSha?: ShenShaInfo;
  // 吉神方位
  directions?: DirectionsInfo;
  // 彭祖百忌
  pengZu?: PengZuInfo;
  // 宜忌
  yiJi?: YiJiInfo;
  // 节气
  jieQi?: JieQiInfo;
  // 星宿
  xingXiu?: XingXiuInfo;
  // 十二长生
  diShi?: DiShiInfo;
  // 九星
  nineStars?: NineStarsInfo;
  // 天神
  tianShen?: TianShenInfo;
  // 吉神凶煞
  jiXiong?: JiXiongInfo;
  // 时辰宜忌
  timeYiJi?: TimeYiJiInfo;
  // 冲煞
  chongSha?: ChongShaInfo;
  // 胎神
  taiShen?: TaiShenInfo;
  // 四柱旬空
  fourPillarsXunKong?: FourPillarsXunKongInfo;
  // 四柱十神
  fourPillarsShiShen?: FourPillarsShiShenInfo;
  // 命宫身宫纳音
  gongNaYin?: GongNaYinInfo;
  // 其他信息
  otherInfo?: OtherLunarInfo;
  // 基础信息
  shengXiao: string;            // 生肖
  xun: string;                  // 旬
  xunKong: string;              // 旬空
  taiYuan: string;              // 胎元
  mingGong: string;             // 命宫
  shenGong: string;             // 身宫
}

// ============================================================================
// 出生信息 (Birth Data)
// ============================================================================

export interface BaziBirthData {
  gender: 'male' | 'female';       // 性别
  calendarType: 'solar' | 'lunar'; // 公历/农历
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  isLeapMonth?: boolean;           // 农历闰月标记
  location: string;                // 出生城市（必填）
}

// ============================================================================
// AI 解读 (AI Interpretation)
// ============================================================================

export interface BaziInterpretation {
  overview: string;           // 总体概述
  personality: string;        // 性格分析
  career: string;             // 事业运势
  wealth: string;             // 财运分析
  relationships: string;      // 感情婚姻
  health: string;             // 健康提示
  favorableElements: string;  // 喜用神建议
  yearlyFortune?: string;     // 流年运势
}
