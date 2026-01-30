/**
 * 八字计算器
 * Bazi Calculator
 * 
 * 使用 lunar-javascript 库计算八字四柱
 * 支持真太阳时校正
 * 
 * 复用自 https://github.com/zhihao93li/human_design2
 */

import { Solar, Lunar, LunarYear } from 'lunar-typescript';
import type {
  BaziBirthData,
  BaziData,
  FourPillars,
  Pillar,
  HeavenlyStem,
  DayMaster,
  DayMasterAnalysis,
  FiveElementsAnalysis,
  FiveElementState,
  TenGodsAnalysis,
  HiddenStemsData,
  LunarDateInfo,
  FiveElement,
  YunInfo,
  DaYunInfo,
  LiuNianInfo,
  LiuYueInfo,
  ShenShaInfo,
  DirectionsInfo,
  PengZuInfo,
  YiJiInfo,
  JieQiInfo,
  XingXiuInfo,
  DiShiInfo,
  NineStarsInfo,
  NineStarInfo,
  TianShenInfo,
  JiXiongInfo,
  TimeYiJiInfo,
  ChongShaInfo,
  TaiShenInfo,
  FourPillarsXunKongInfo,
  FourPillarsShiShenInfo,
  GongNaYinInfo,
  OtherLunarInfo,
  PatternInfo,
} from './types.js';
import {
  getHeavenlyStem,
  getEarthlyBranch,
  getHiddenStems,
  FIVE_ELEMENTS,
  HIDDEN_STEM_WEIGHTS,
  MONTH_BRANCH_ELEMENT,
  FIVE_ELEMENT_STATE_WEIGHTS,
  FIVE_ELEMENTS_GENERATION,
  FIVE_ELEMENTS_GENERATED_BY,
  FIVE_ELEMENTS_RESTRICTION,
} from './constants.js';
import { getLongitude } from './geo-utils.js';

// ============================================================================
// 优化后的算法模块
// ============================================================================
import { calculateDayMasterOptimized } from './strength-calculation.js';
import { calculatePatternOptimized } from './pattern-calculation.js';
import { calculateFavorableElementsOptimized } from './favorable-elements.js';

/**
 * 从地点字符串中提取经度
 * 使用完整的城市经纬度数据库
 */
function getLongitudeFromLocation(location: string): number {
  return getLongitude(location);
}

/**
 * 计算儒略日 (Julian Day)
 * 精确天文计算的基础
 */
function getJulianDay(year: number, month: number, day: number, hour: number = 12, minute: number = 0): number {
  // 如果月份是1或2，当作上一年的13或14月
  if (month <= 2) {
    year -= 1;
    month += 12;
  }

  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);

  const dayFraction = (hour + minute / 60) / 24;

  return Math.floor(365.25 * (year + 4716)) +
         Math.floor(30.6001 * (month + 1)) +
         day + dayFraction + B - 1524.5;
}

/**
 * 计算儒略世纪数 (Julian Century)
 * 从 J2000.0 (2000年1月1日12:00 TT) 起算的世纪数
 */
function getJulianCentury(jd: number): number {
  return (jd - 2451545.0) / 36525.0;
}

/**
 * 计算太阳几何平黄经 (Geometric Mean Longitude of the Sun)
 * 单位：度
 */
function getSunMeanLongitude(T: number): number {
  let L0 = 280.46646 + T * (36000.76983 + T * 0.0003032);
  // 归算到 0-360 度
  while (L0 > 360) L0 -= 360;
  while (L0 < 0) L0 += 360;
  return L0;
}

/**
 * 计算太阳平近点角 (Mean Anomaly of the Sun)
 * 单位：度
 */
function getSunMeanAnomaly(T: number): number {
  return 357.52911 + T * (35999.05029 - T * 0.0001537);
}

/**
 * 计算地球轨道偏心率 (Eccentricity of Earth's Orbit)
 */
function getEarthOrbitEccentricity(T: number): number {
  return 0.016708634 - T * (0.000042037 + T * 0.0000001267);
}

/**
 * 计算太阳中心方程 (Sun's Equation of Center)
 * 单位：度
 */
function getSunEquationOfCenter(T: number, M: number): number {
  const Mrad = M * Math.PI / 180;
  return Math.sin(Mrad) * (1.914602 - T * (0.004817 + T * 0.000014)) +
         Math.sin(2 * Mrad) * (0.019993 - T * 0.000101) +
         Math.sin(3 * Mrad) * 0.000289;
}

/**
 * 计算太阳真黄经 (Sun's True Longitude)
 * 单位：度
 */
function getSunTrueLongitude(T: number): number {
  const L0 = getSunMeanLongitude(T);
  const M = getSunMeanAnomaly(T);
  const C = getSunEquationOfCenter(T, M);
  return L0 + C;
}

/**
 * 计算太阳视黄经 (Sun's Apparent Longitude)
 * 考虑章动和光行差修正
 * 单位：度
 */
function getSunApparentLongitude(T: number): number {
  const trueLong = getSunTrueLongitude(T);
  const omega = 125.04 - 1934.136 * T;
  return trueLong - 0.00569 - 0.00478 * Math.sin(omega * Math.PI / 180);
}

/**
 * 计算黄赤交角 (Mean Obliquity of the Ecliptic)
 * 单位：度
 */
function getMeanObliquity(T: number): number {
  const seconds = 21.448 - T * (46.8150 + T * (0.00059 - T * 0.001813));
  return 23 + (26 + seconds / 60) / 60;
}

/**
 * 计算修正后的黄赤交角 (Corrected Obliquity)
 * 单位：度
 */
function getCorrectedObliquity(T: number): number {
  const epsilon0 = getMeanObliquity(T);
  const omega = 125.04 - 1934.136 * T;
  return epsilon0 + 0.00256 * Math.cos(omega * Math.PI / 180);
}

/**
 * 计算精确均时差 (Equation of Time)
 * 使用 NOAA 太阳计算器算法
 * 返回值单位：分钟
 */
function equationOfTime(year: number, month: number, day: number, hour: number = 12): number {
  const jd = getJulianDay(year, month, day, hour);
  const T = getJulianCentury(jd);

  const epsilon = getCorrectedObliquity(T);
  const L0 = getSunMeanLongitude(T);
  const e = getEarthOrbitEccentricity(T);
  const M = getSunMeanAnomaly(T);

  // 转换为弧度
  const epsilonRad = epsilon * Math.PI / 180;
  const L0rad = L0 * Math.PI / 180;
  const Mrad = M * Math.PI / 180;

  let y = Math.tan(epsilonRad / 2);
  y = y * y;

  const sin2L0 = Math.sin(2 * L0rad);
  const sinM = Math.sin(Mrad);
  const cos2L0 = Math.cos(2 * L0rad);
  const sin4L0 = Math.sin(4 * L0rad);
  const sin2M = Math.sin(2 * Mrad);

  const Etime = y * sin2L0 - 2 * e * sinM + 4 * e * y * sinM * cos2L0 -
                0.5 * y * y * sin4L0 - 1.25 * e * e * sin2M;

  // 转换为分钟 (弧度 -> 度 -> 分钟)
  return Etime * 180 / Math.PI * 4;
}

/**
 * 将北京时间转换为真太阳时
 */
function toTrueSolarTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  longitude: number
): { hour: number; minute: number; dayOffset: number } {
  const BEIJING_LONGITUDE = 120;
  // 经度修正：每度经度差4分钟
  const longitudeCorrection = (longitude - BEIJING_LONGITUDE) * 4;
  // 精确均时差计算
  const eot = equationOfTime(year, month, day, hour);
  const totalCorrection = longitudeCorrection + eot;

  let totalMinutes = hour * 60 + minute + totalCorrection;
  let dayOffset = 0;

  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
    dayOffset = -1;
  } else if (totalMinutes >= 24 * 60) {
    totalMinutes -= 24 * 60;
    dayOffset = 1;
  }

  let resultHour = Math.floor(totalMinutes / 60);
  let resultMinute = Math.round(totalMinutes % 60);

  // 处理四舍五入导致分钟为60的边界情况
  if (resultMinute >= 60) {
    resultMinute = 0;
    resultHour += 1;
    if (resultHour >= 24) {
      resultHour = 0;
      dayOffset += 1;
    }
  }

  return {
    hour: resultHour,
    minute: resultMinute,
    dayOffset
  };
}


/**
 * 计算八字
 */
export function calculateBazi(birthData: BaziBirthData): BaziData {
  const longitude = getLongitudeFromLocation(birthData.location);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let solar: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lunar: any;
  // 保存真太阳时用于返回
  let trueSolarTimeResult: { year: number; month: number; day: number; hour: number; minute: number } | undefined;

  if (birthData.calendarType === 'solar') {
    const trueSolar = toTrueSolarTime(
      birthData.year, birthData.month, birthData.day,
      birthData.hour, birthData.minute, longitude
    );

    let adjustedDay = birthData.day + trueSolar.dayOffset;
    let adjustedMonth = birthData.month;
    let adjustedYear = birthData.year;

    if (adjustedDay < 1) {
      adjustedMonth -= 1;
      if (adjustedMonth < 1) { adjustedMonth = 12; adjustedYear -= 1; }
      adjustedDay = new Date(adjustedYear, adjustedMonth, 0).getDate();
    } else if (adjustedDay > new Date(adjustedYear, adjustedMonth, 0).getDate()) {
      adjustedDay = 1;
      adjustedMonth += 1;
      if (adjustedMonth > 12) { adjustedMonth = 1; adjustedYear += 1; }
    }

    solar = Solar.fromYmdHms(adjustedYear, adjustedMonth, adjustedDay, trueSolar.hour, trueSolar.minute, 0);
    lunar = solar.getLunar();
    trueSolarTimeResult = {
      year: adjustedYear,
      month: adjustedMonth,
      day: adjustedDay,
      hour: trueSolar.hour,
      minute: trueSolar.minute
    };
  } else {
    // 农历输入 - 使用 Lunar.fromYmd 处理闰月
    let lunarMonth = birthData.month;
    if (birthData.isLeapMonth) {
      lunarMonth = -birthData.month; // lunar-typescript 用负数表示闰月
    }
    const tempLunar = Lunar.fromYmd(birthData.year, lunarMonth, birthData.day);
    const tempSolar = tempLunar.getSolar();

    const solarYear = tempSolar.getYear();
    const solarMonth = tempSolar.getMonth();
    const solarDay = tempSolar.getDay();

    const trueSolar = toTrueSolarTime(solarYear, solarMonth, solarDay, birthData.hour, birthData.minute, longitude);

    let adjustedDay = solarDay + trueSolar.dayOffset;
    let adjustedMonth = solarMonth;
    let adjustedYear = solarYear;

    if (adjustedDay < 1) {
      adjustedMonth -= 1;
      if (adjustedMonth < 1) { adjustedMonth = 12; adjustedYear -= 1; }
      adjustedDay = new Date(adjustedYear, adjustedMonth, 0).getDate();
    } else if (adjustedDay > new Date(adjustedYear, adjustedMonth, 0).getDate()) {
      adjustedDay = 1;
      adjustedMonth += 1;
      if (adjustedMonth > 12) { adjustedMonth = 1; adjustedYear += 1; }
    }

    solar = Solar.fromYmdHms(adjustedYear, adjustedMonth, adjustedDay, trueSolar.hour, trueSolar.minute, 0);
    lunar = solar.getLunar();
    trueSolarTimeResult = {
      year: adjustedYear,
      month: adjustedMonth,
      day: adjustedDay,
      hour: trueSolar.hour,
      minute: trueSolar.minute
    };
  }

  const eightChar = lunar.getEightChar();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (eightChar as any).setSect(1); // 晚子时日柱算明天

  const fourPillars: FourPillars = {
    year: createPillar(eightChar.getYearGan(), eightChar.getYearZhi(), eightChar.getYearNaYin()),
    month: createPillar(eightChar.getMonthGan(), eightChar.getMonthZhi(), eightChar.getMonthNaYin()),
    day: createPillar(eightChar.getDayGan(), eightChar.getDayZhi(), eightChar.getDayNaYin()),
    hour: createPillar(eightChar.getTimeGan(), eightChar.getTimeZhi(), eightChar.getTimeNaYin()),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eightCharAny = eightChar as any;

  // 提前计算四柱旬空信息(用于日主强弱计算)
  let fourPillarsXunKongEarly: { dayXunKong?: string } | undefined;
  try {
    fourPillarsXunKongEarly = {
      dayXunKong: eightCharAny.getDayXunKong?.() || '',
    };
  } catch { /* ignore */ }

  const dayMaster = calculateDayMasterOptimized(fourPillars.day.heavenlyStem, fourPillars, fourPillarsXunKongEarly);
  const fiveElements = calculateFiveElements(fourPillars, dayMaster);
  const tenGods = calculateTenGods(fourPillars, dayMaster.stem);
  
  // 传入旬空信息到格局判定
  const xunKong = fourPillarsXunKongEarly?.dayXunKong || '';
  const pattern = calculatePatternOptimized(fourPillars, dayMaster, fiveElements, xunKong);
  
  const hiddenStems = extractHiddenStems(fourPillars);

  const lunarYear = LunarYear.fromYear(lunar.getYear());
  const isLeapMonth = lunar.getMonth() === lunarYear.getLeapMonth();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lunarAny = lunar as any;

  const lunarDate: LunarDateInfo = {
    year: lunar.getYear(),
    month: lunar.getMonth(),
    day: lunar.getDay(),
    isLeapMonth,
    yearGanZhi: eightChar.getYear(),
    monthGanZhi: eightChar.getMonth(),
    dayGanZhi: eightChar.getDay(),
    yearInChinese: lunarAny.getYearInChinese?.() || '',
    monthInChinese: lunarAny.getMonthInChinese?.() || '',
    dayInChinese: lunarAny.getDayInChinese?.() || '',
  };

  // 计算大运
  const gender = birthData.gender === 'male' ? 1 : 0;

  let yun: YunInfo | undefined;
  try {
    const yunObj = eightCharAny.getYun(gender, 1);
    const daYunList: DaYunInfo[] = [];
    const daYunArr = yunObj.getDaYun(10);

    for (let i = 0; i < daYunArr.length; i++) {
      const dy = daYunArr[i];
      const ganZhi = dy.getGanZhi?.() || '';
      // 只有当 ganZhi 非空时才调用 getXun/getXunKong，否则会因为空字符串导致 LunarUtil.find 返回 null
      let xunValue = '';
      let xunKongValue = '';
      if (ganZhi) {
        try {
          xunValue = dy.getXun?.() ?? '';
          xunKongValue = dy.getXunKong?.() ?? '';
        } catch {
          // 忽略错误，使用空字符串
        }
      }

      // 获取流年列表
      const liuNianList: LiuNianInfo[] = [];
      try {
        const liuNianArr = dy.getLiuNian?.() || [];
        for (let j = 0; j < liuNianArr.length; j++) {
          const ln = liuNianArr[j];
          const lnGanZhi = ln.getGanZhi?.() || '';
          let lnXun = '';
          let lnXunKong = '';
          if (lnGanZhi) {
            try {
              lnXun = ln.getXun?.() ?? '';
              lnXunKong = ln.getXunKong?.() ?? '';
            } catch {
              // 忽略错误
            }
          }

          // 获取流月列表
          const liuYueList: LiuYueInfo[] = [];
          try {
            const liuYueArr = ln.getLiuYue?.() || [];
            for (let k = 0; k < liuYueArr.length; k++) {
              const ly = liuYueArr[k];
              const lyGanZhi = ly.getGanZhi?.() || '';
              let lyXun = '';
              let lyXunKong = '';
              if (lyGanZhi) {
                try {
                  lyXun = ly.getXun?.() ?? '';
                  lyXunKong = ly.getXunKong?.() ?? '';
                } catch {
                  // 忽略错误
                }
              }
              liuYueList.push({
                index: ly.getIndex?.() ?? k,
                monthInChinese: ly.getMonthInChinese?.() || '',
                ganZhi: lyGanZhi,
                xun: lyXun,
                xunKong: lyXunKong,
              });
            }
          } catch {
            // 忽略流月获取错误
          }

          liuNianList.push({
            index: ln.getIndex?.() ?? j,
            year: ln.getYear?.() ?? 0,
            age: ln.getAge?.() ?? 0,
            ganZhi: lnGanZhi,
            xun: lnXun,
            xunKong: lnXunKong,
            liuYue: liuYueList,
          });
        }
      } catch {
        // 忽略流年获取错误
      }

      daYunList.push({
        index: dy.getIndex?.() ?? i,
        startAge: dy.getStartAge?.() ?? 0,
        endAge: dy.getEndAge?.() ?? 0,
        startYear: dy.getStartYear?.() ?? 0,
        endYear: dy.getEndYear?.() ?? 0,
        ganZhi,
        gan: ganZhi.charAt(0) || '',
        zhi: ganZhi.charAt(1) || '',
        xun: xunValue,
        xunKong: xunKongValue,
        liuNian: liuNianList,
      });
    }

    const startSolar = yunObj.getStartSolar();
    yun = {
      startYear: startSolar?.getYear?.() ?? 0,
      startMonth: startSolar?.getMonth?.() ?? 0,
      startDay: startSolar?.getDay?.() ?? 0,
      startAge: Math.floor(yunObj.getStartYear?.() ?? 0),
      forward: yunObj.isForward?.() ?? true,
      daYunList,
    };
  } catch (error) {
    console.warn('Failed to calculate dayun:', error);
  }

  // 提取其他信息
  let shenSha: ShenShaInfo | undefined;
  let directions: DirectionsInfo | undefined;
  let pengZu: PengZuInfo | undefined;
  let yiJi: YiJiInfo | undefined;
  let jieQi: JieQiInfo | undefined;
  let xingXiu: XingXiuInfo | undefined;

  try {
    shenSha = {
      year: lunarAny.getYearShenSha?.() || [],
      month: lunarAny.getMonthShenSha?.() || [],
      day: lunarAny.getDayShenSha?.() || [],
      hour: lunarAny.getTimeShenSha?.() || [],
    };
  } catch { /* ignore */ }

  try {
    directions = {
      xi: lunarAny.getDayPositionXiDesc?.() || '',
      yangGui: lunarAny.getDayPositionYangGuiDesc?.() || '',
      yinGui: lunarAny.getDayPositionYinGuiDesc?.() || '',
      fu: lunarAny.getDayPositionFuDesc?.(1) || '',
      cai: lunarAny.getDayPositionCaiDesc?.() || '',
    };
  } catch { /* ignore */ }

  try {
    pengZu = {
      gan: lunarAny.getPengZuGan?.() || '',
      zhi: lunarAny.getPengZuZhi?.() || '',
    };
  } catch { /* ignore */ }

  try {
    yiJi = {
      yi: lunarAny.getDayYi?.() || [],
      ji: lunarAny.getDayJi?.() || [],
    };
  } catch { /* ignore */ }

  try {
    const prevJie = lunarAny.getPrevJie?.();
    const nextJie = lunarAny.getNextJie?.();
    jieQi = {
      current: lunarAny.getJieQi?.() || '',
      next: nextJie?.getName?.() || '',
      nextDate: nextJie?.getSolar?.()?.toYmd?.() || '',
      prev: prevJie?.getName?.() || '',
      prevDate: prevJie?.getSolar?.()?.toYmd?.() || '',
    };
  } catch { /* ignore */ }

  try {
    xingXiu = {
      xiu: lunarAny.getXiu?.() || '',
      animal: lunarAny.getAnimal?.() || '',
      gong: lunarAny.getGong?.() || '',
      shou: lunarAny.getShou?.() || '',
      luck: lunarAny.getXiuLuck?.() || '',
      song: lunarAny.getXiuSong?.() || '',
    };
  } catch { /* ignore */ }

  // 十二长生
  let diShi: DiShiInfo | undefined;
  try {
    diShi = {
      year: eightCharAny.getYearDiShi?.() || '',
      month: eightCharAny.getMonthDiShi?.() || '',
      day: eightCharAny.getDayDiShi?.() || '',
      hour: eightCharAny.getTimeDiShi?.() || '',
    };
  } catch { /* ignore */ }

  // 九星
  let nineStars: NineStarsInfo | undefined;
  try {
    const extractNineStar = (ns: unknown): NineStarInfo => {
      const nsAny = ns as { getNumber?: () => string; getColor?: () => string; getWuXing?: () => string; getNameInBeiDou?: () => string; getLuckInXuanKong?: () => string };
      return {
        number: nsAny?.getNumber?.() || '',
        color: nsAny?.getColor?.() || '',
        wuXing: nsAny?.getWuXing?.() || '',
        name: nsAny?.getNameInBeiDou?.() || '',
        luck: nsAny?.getLuckInXuanKong?.() || '',
      };
    };
    nineStars = {
      year: extractNineStar(lunarAny.getYearNineStar?.()),
      month: extractNineStar(lunarAny.getMonthNineStar?.()),
      day: extractNineStar(lunarAny.getDayNineStar?.()),
      hour: extractNineStar(lunarAny.getTimeNineStar?.()),
    };
  } catch { /* ignore */ }

  // 天神
  let tianShen: TianShenInfo | undefined;
  try {
    tianShen = {
      day: lunarAny.getDayTianShen?.() || '',
      dayType: lunarAny.getDayTianShenType?.() || '',
      dayLuck: lunarAny.getDayTianShenLuck?.() || '',
      hour: lunarAny.getTimeTianShen?.() || '',
      hourType: lunarAny.getTimeTianShenType?.() || '',
      hourLuck: lunarAny.getTimeTianShenLuck?.() || '',
    };
  } catch { /* ignore */ }

  // 吉神凶煞
  let jiXiong: JiXiongInfo | undefined;
  try {
    jiXiong = {
      jiShen: lunarAny.getDayJiShen?.() || [],
      xiongSha: lunarAny.getDayXiongSha?.() || [],
    };
  } catch { /* ignore */ }

  // 时辰宜忌
  let timeYiJi: TimeYiJiInfo | undefined;
  try {
    timeYiJi = {
      yi: lunarAny.getTimeYi?.() || [],
      ji: lunarAny.getTimeJi?.() || [],
    };
  } catch { /* ignore */ }

  // 冲煞
  let chongSha: ChongShaInfo | undefined;
  try {
    chongSha = {
      dayChong: lunarAny.getDayChong?.() || '',
      dayChongDesc: lunarAny.getDayChongDesc?.() || '',
      daySha: lunarAny.getDaySha?.() || '',
      timeChong: lunarAny.getTimeChong?.() || '',
      timeChongDesc: lunarAny.getTimeChongDesc?.() || '',
      timeSha: lunarAny.getTimeSha?.() || '',
    };
  } catch { /* ignore */ }

  // 胎神
  let taiShen: TaiShenInfo | undefined;
  try {
    taiShen = {
      day: lunarAny.getDayPositionTai?.() || '',
      month: lunarAny.getMonthPositionTai?.() || '',
    };
  } catch { /* ignore */ }

  // 四柱旬空
  let fourPillarsXunKong: FourPillarsXunKongInfo | undefined;
  try {
    fourPillarsXunKong = {
      yearXun: eightCharAny.getYearXun?.() || '',
      yearXunKong: eightCharAny.getYearXunKong?.() || '',
      monthXun: eightCharAny.getMonthXun?.() || '',
      monthXunKong: eightCharAny.getMonthXunKong?.() || '',
      dayXun: eightCharAny.getDayXun?.() || '',
      dayXunKong: eightCharAny.getDayXunKong?.() || '',
      hourXun: eightCharAny.getTimeXun?.() || '',
      hourXunKong: eightCharAny.getTimeXunKong?.() || '',
    };
  } catch { /* ignore */ }

  // 四柱十神
  let fourPillarsShiShen: FourPillarsShiShenInfo | undefined;
  try {
    fourPillarsShiShen = {
      yearGan: eightCharAny.getYearShiShenGan?.() || '',
      yearZhi: eightCharAny.getYearShiShenZhi?.() || [],
      monthGan: eightCharAny.getMonthShiShenGan?.() || '',
      monthZhi: eightCharAny.getMonthShiShenZhi?.() || [],
      dayZhi: eightCharAny.getDayShiShenZhi?.() || [],
      hourGan: eightCharAny.getTimeShiShenGan?.() || '',
      hourZhi: eightCharAny.getTimeShiShenZhi?.() || [],
    };
  } catch { /* ignore */ }

  // 命宫身宫纳音
  let gongNaYin: GongNaYinInfo | undefined;
  try {
    gongNaYin = {
      taiYuan: eightCharAny.getTaiYuan?.() || '',
      taiYuanNaYin: eightCharAny.getTaiYuanNaYin?.() || '',
      mingGong: eightCharAny.getMingGong?.() || '',
      mingGongNaYin: eightCharAny.getMingGongNaYin?.() || '',
      shenGong: eightCharAny.getShenGong?.() || '',
      shenGongNaYin: eightCharAny.getShenGongNaYin?.() || '',
      taiXi: eightCharAny.getTaiXi?.() || '',
      taiXiNaYin: eightCharAny.getTaiXiNaYin?.() || '',
    };
  } catch { /* ignore */ }

  // 其他信息
  let otherInfo: OtherLunarInfo | undefined;
  try {
    otherInfo = {
      liuYao: lunarAny.getLiuYao?.() || '',
      wuHou: lunarAny.getWuHou?.() || '',
      hou: lunarAny.getHou?.() || '',
      dayLu: lunarAny.getDayLu?.() || '',
      yueXiang: lunarAny.getYueXiang?.() || '',
      zhiXing: lunarAny.getZhiXing?.() || '',
      festivals: lunarAny.getFestivals?.() || [],
      otherFestivals: lunarAny.getOtherFestivals?.() || [],
    };
  } catch { /* ignore */ }

  return {
    fourPillars,
    dayMaster,
    fiveElements,
    tenGods,
    pattern,
    hiddenStems,
    lunarDate,
    yun,
    shenSha,
    directions,
    pengZu,
    yiJi,
    jieQi,
    xingXiu,
    diShi,
    nineStars,
    tianShen,
    jiXiong,
    timeYiJi,
    chongSha,
    taiShen,
    fourPillarsXunKong,
    fourPillarsShiShen,
    gongNaYin,
    otherInfo,
    shengXiao: lunarAny.getYearShengXiaoExact?.() || '',
    xun: eightCharAny.getDayXun?.() || '',
    xunKong: eightCharAny.getDayXunKong?.() || '',
    taiYuan: eightCharAny.getTaiYuan?.() || '',
    mingGong: eightCharAny.getMingGong?.() || '',
    shenGong: eightCharAny.getShenGong?.() || '',
    trueSolarTime: trueSolarTimeResult,
  };
}


function createPillar(ganChinese: string, zhiChinese: string, nayin: string): Pillar {
  const heavenlyStem = getHeavenlyStem(ganChinese);
  const earthlyBranch = getEarthlyBranch(zhiChinese);
  if (!heavenlyStem || !earthlyBranch) {
    throw new Error(`Invalid gan/zhi: ${ganChinese}/${zhiChinese}`);
  }
  return {
    heavenlyStem,
    earthlyBranch,
    hiddenStems: getHiddenStems(zhiChinese),
    naYin: nayin,
  };
}

// ============================================================================
// 旧版算法(已废弃,保留用于向后兼容)
// ============================================================================

function calculateFiveElements(fourPillars: FourPillars, dayMaster: DayMaster): FiveElementsAnalysis {
  const distribution: Record<FiveElement, number> = { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 };
  const counts: Record<FiveElement, number> = { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 };

  // 获取月令五行
  const monthBranch = fourPillars.month.earthlyBranch.chinese;
  const monthElement = MONTH_BRANCH_ELEMENT[monthBranch] || 'earth';

  // 计算五行状态（旺相休囚死）
  const elementStates = getElementStates(monthElement);

  // 天干权重：1.5
  const stems = [
    fourPillars.year.heavenlyStem,
    fourPillars.month.heavenlyStem,
    fourPillars.day.heavenlyStem,
    fourPillars.hour.heavenlyStem,
  ];
  for (const stem of stems) {
    const stateWeight = FIVE_ELEMENT_STATE_WEIGHTS[elementStates[stem.element]];
    distribution[stem.element] += 1.5 * stateWeight;
    counts[stem.element] += 1;  // 天干计数
  }

  // 地支藏干权重：根据藏干位置不同
  const allPillars = [
    fourPillars.year,
    fourPillars.month,
    fourPillars.day,
    fourPillars.hour,
  ];

  for (const pillar of allPillars) {
    const branchChinese = pillar.earthlyBranch.chinese;
    const hiddenStems = pillar.hiddenStems;
    const weights = HIDDEN_STEM_WEIGHTS[branchChinese] || [];

    for (let i = 0; i < hiddenStems.length; i++) {
      const hiddenStem = hiddenStems[i];
      const hiddenWeight = weights[i] || 0.2;
      const stateWeight = FIVE_ELEMENT_STATE_WEIGHTS[elementStates[hiddenStem.element]];
      distribution[hiddenStem.element] += hiddenWeight * stateWeight;

      // 只统计本气（第一个藏干）
      if (i === 0) {
        counts[hiddenStem.element] += 1;
      }
    }
  }

  // 找出最强和最弱的五行
  let strongest: FiveElement = 'wood';
  let weakest: FiveElement = 'wood';
  let maxCount = distribution.wood;
  let minCount = distribution.wood;

  for (const element of FIVE_ELEMENTS) {
    if (distribution[element] > maxCount) {
      maxCount = distribution[element];
      strongest = element;
    }
    if (distribution[element] < minCount) {
      minCount = distribution[element];
      weakest = element;
    }
  }

  const { favorable, unfavorable } = calculateFavorableElementsOptimized(dayMaster, distribution);

  return {
    distribution,
    counts,
    strongest,
    weakest,
    favorable,
    unfavorable,
    elementStates,
    monthElement,
  };
}

/**
 * 根据月令计算五行的旺相休囚死状态
 * 旺：当令之行
 * 相：当令所生之行
 * 休：生当令之行
 * 囚：克当令之行
 * 死：被当令所克之行
 */
function getElementStates(monthElement: FiveElement): Record<FiveElement, FiveElementState> {
  const states: Record<FiveElement, FiveElementState> = {
    metal: 'xiu',
    wood: 'xiu',
    water: 'xiu',
    fire: 'xiu',
    earth: 'xiu',
  };

  // 旺：当令
  states[monthElement] = 'wang';

  // 相：当令所生（如木旺则火相）
  const generated = FIVE_ELEMENTS_GENERATION[monthElement];
  states[generated] = 'xiang';

  // 休：生当令者（如木旺则水休）
  const generator = FIVE_ELEMENTS_GENERATED_BY[monthElement];
  states[generator] = 'xiu';

  // 囚：克当令者（如木旺则金囚）
  // 找出克月令的元素
  for (const element of FIVE_ELEMENTS) {
    if (FIVE_ELEMENTS_RESTRICTION[element] === monthElement) {
      states[element] = 'qiu';
      break;
    }
  }

  // 死：被当令所克（如木旺则土死）
  const restricted = FIVE_ELEMENTS_RESTRICTION[monthElement];
  states[restricted] = 'si';

  return states;
}

function calculateTenGods(fourPillars: FourPillars, dayStem: HeavenlyStem): TenGodsAnalysis {
  const gods: Record<string, { name: string; count: number; positions: string[] }> = {};
  const positions = [
    { stem: fourPillars.year.heavenlyStem, position: '年干' },
    { stem: fourPillars.month.heavenlyStem, position: '月干' },
    { stem: fourPillars.hour.heavenlyStem, position: '时干' },
  ];

  for (const { stem, position } of positions) {
    const tenGod = getTenGod(dayStem, stem);
    if (tenGod) {
      if (!gods[tenGod]) gods[tenGod] = { name: tenGod, count: 0, positions: [] };
      gods[tenGod].count += 1;
      gods[tenGod].positions.push(position);
    }
  }
  return { gods };
}

function extractHiddenStems(fourPillars: FourPillars): HiddenStemsData {
  return {
    [fourPillars.year.earthlyBranch.chinese]: fourPillars.year.hiddenStems,
    [fourPillars.month.earthlyBranch.chinese]: fourPillars.month.hiddenStems,
    [fourPillars.day.earthlyBranch.chinese]: fourPillars.day.hiddenStems,
    [fourPillars.hour.earthlyBranch.chinese]: fourPillars.hour.hiddenStems,
  };
}

function generatesElement(from: FiveElement, to: FiveElement): boolean {
  const generation: Record<FiveElement, FiveElement> = {
    wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood',
  };
  return generation[from] === to;
}

function restrictsElement(from: FiveElement, to: FiveElement): boolean {
  const restriction: Record<FiveElement, FiveElement> = {
    wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood',
  };
  return restriction[from] === to;
}

function getDayMasterCharacteristics(dayStem: HeavenlyStem): string[] {
  const characteristics: Record<string, string[]> = {
    '甲': ['积极进取', '有领导力', '刚直不阿', '富有创造力'],
    '乙': ['温和柔顺', '适应力强', '善于协调', '注重细节'],
    '丙': ['热情开朗', '光明磊落', '富有激情', '善于表达'],
    '丁': ['细腻敏感', '文雅有礼', '富有艺术气质', '善解人意'],
    '戊': ['稳重踏实', '诚实守信', '包容大度', '责任心强'],
    '己': ['温和谦逊', '细心周到', '善于理财', '注重实际'],
    '庚': ['刚毅果断', '正直坦率', '意志坚定', '富有正义感'],
    '辛': ['细腻敏锐', '追求完美', '善于分析', '注重品质'],
    '壬': ['聪明灵活', '善于变通', '富有智慧', '适应力强'],
    '癸': ['温柔体贴', '富有想象力', '善于思考', '内敛含蓄'],
  };
  return characteristics[dayStem.chinese] || ['性格特征待分析'];
}

export function getTenGod(dayStem: HeavenlyStem, otherStem: HeavenlyStem): string | null {
  if (dayStem.chinese === otherStem.chinese) return '比肩';

  const dayElement = dayStem.element;
  const dayYinYang = dayStem.yinYang;
  const otherElement = otherStem.element;
  const otherYinYang = otherStem.yinYang;

  if (dayElement === otherElement && dayYinYang !== otherYinYang) return '劫财';
  if (generatesElement(dayElement, otherElement)) return dayYinYang === otherYinYang ? '食神' : '伤官';
  if (restrictsElement(dayElement, otherElement)) return dayYinYang === otherYinYang ? '偏财' : '正财';
  if (restrictsElement(otherElement, dayElement)) return dayYinYang === otherYinYang ? '七杀' : '正官';
  if (generatesElement(otherElement, dayElement)) return dayYinYang === otherYinYang ? '偏印' : '正印';
  return null;
}
