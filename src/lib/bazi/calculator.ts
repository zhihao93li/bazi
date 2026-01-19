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
  FiveElementsAnalysis,
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
} from './types.js';
import {
  getHeavenlyStem,
  getEarthlyBranch,
  getHiddenStems,
  FIVE_ELEMENTS,
} from './constants.js';
import { getLongitude } from './geo-utils.js';

/**
 * 从地点字符串中提取经度
 * 使用完整的城市经纬度数据库
 */
function getLongitudeFromLocation(location: string): number {
  return getLongitude(location);
}

/**
 * 计算时差方程（Equation of Time）
 */
function equationOfTime(dayOfYear: number): number {
  const B = (2 * Math.PI * (dayOfYear - 81)) / 365;
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}

/**
 * 获取一年中的第几天
 */
function getDayOfYear(year: number, month: number, day: number): number {
  const date = new Date(year, month - 1, day);
  const start = new Date(year, 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
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
  const longitudeCorrection = (longitude - BEIJING_LONGITUDE) * 4;
  const dayOfYear = getDayOfYear(year, month, day);
  const eot = equationOfTime(dayOfYear);
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

  return {
    hour: Math.floor(totalMinutes / 60),
    minute: Math.round(totalMinutes % 60),
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
  let trueSolarTimeResult: { hour: number; minute: number } | undefined;

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
    trueSolarTimeResult = { hour: trueSolar.hour, minute: trueSolar.minute };
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
    trueSolarTimeResult = { hour: trueSolar.hour, minute: trueSolar.minute };
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

  const dayMaster = calculateDayMaster(fourPillars.day.heavenlyStem, fourPillars);
  const fiveElements = calculateFiveElements(fourPillars, dayMaster);
  const tenGods = calculateTenGods(fourPillars, dayMaster.stem);
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eightCharAny = eightChar as any;

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

function calculateDayMaster(dayStem: HeavenlyStem, fourPillars: FourPillars): DayMaster {
  const dayElement = dayStem.element;
  let supportCount = 0;
  let weakenCount = 0;

  const allStems = [
    fourPillars.year.heavenlyStem,
    fourPillars.month.heavenlyStem,
    fourPillars.hour.heavenlyStem,
  ];

  const allBranches = [
    fourPillars.year.earthlyBranch,
    fourPillars.month.earthlyBranch,
    fourPillars.day.earthlyBranch,
    fourPillars.hour.earthlyBranch,
  ];

  for (const stem of allStems) {
    if (stem.element === dayElement) supportCount += 2;
    else if (generatesElement(stem.element, dayElement)) supportCount += 1;
    else if (restrictsElement(stem.element, dayElement)) weakenCount += 1;
  }

  for (const branch of allBranches) {
    if (branch.element === dayElement) supportCount += 1;
    else if (generatesElement(branch.element, dayElement)) supportCount += 0.5;
    else if (restrictsElement(branch.element, dayElement)) weakenCount += 0.5;
  }

  let strength: 'strong' | 'weak' | 'balanced';
  if (supportCount > weakenCount + 3) strength = 'strong';
  else if (weakenCount > supportCount + 2) strength = 'weak';
  else strength = 'balanced';

  return {
    stem: dayStem,
    strength,
    characteristics: getDayMasterCharacteristics(dayStem),
  };
}

function calculateFiveElements(fourPillars: FourPillars, dayMaster: DayMaster): FiveElementsAnalysis {
  const distribution: Record<FiveElement, number> = { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 };

  const stems = [
    fourPillars.year.heavenlyStem,
    fourPillars.month.heavenlyStem,
    fourPillars.day.heavenlyStem,
    fourPillars.hour.heavenlyStem,
  ];
  for (const stem of stems) distribution[stem.element] += 2;

  const branches = [
    fourPillars.year.earthlyBranch,
    fourPillars.month.earthlyBranch,
    fourPillars.day.earthlyBranch,
    fourPillars.hour.earthlyBranch,
  ];
  for (const branch of branches) distribution[branch.element] += 1;

  let strongest: FiveElement = 'wood';
  let weakest: FiveElement = 'wood';
  let maxCount = distribution.wood;
  let minCount = distribution.wood;

  for (const element of FIVE_ELEMENTS) {
    if (distribution[element] > maxCount) { maxCount = distribution[element]; strongest = element; }
    if (distribution[element] < minCount) { minCount = distribution[element]; weakest = element; }
  }

  const { favorable, unfavorable } = calculateFavorableElements(dayMaster, distribution);
  return { distribution, strongest, weakest, favorable, unfavorable };
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

function calculateFavorableElements(
  dayMaster: DayMaster,
  distribution: Record<FiveElement, number>
): { favorable: FiveElement[]; unfavorable: FiveElement[] } {
  const dayElement = dayMaster.stem.element;
  const favorable: FiveElement[] = [];
  const unfavorable: FiveElement[] = [];

  if (dayMaster.strength === 'strong') {
    for (const element of FIVE_ELEMENTS) {
      if (restrictsElement(dayElement, element) || restrictsElement(element, dayElement) || generatesElement(dayElement, element)) {
        favorable.push(element);
      }
    }
    for (const element of FIVE_ELEMENTS) {
      if (element === dayElement || generatesElement(element, dayElement)) unfavorable.push(element);
    }
  } else if (dayMaster.strength === 'weak') {
    for (const element of FIVE_ELEMENTS) {
      if (element === dayElement || generatesElement(element, dayElement)) favorable.push(element);
    }
    for (const element of FIVE_ELEMENTS) {
      if (restrictsElement(dayElement, element) || restrictsElement(element, dayElement) || generatesElement(dayElement, element)) {
        unfavorable.push(element);
      }
    }
  } else {
    const sorted = [...FIVE_ELEMENTS].sort((a, b) => distribution[a] - distribution[b]);
    favorable.push(sorted[0], sorted[1]);
    unfavorable.push(sorted[4], sorted[3]);
  }
  return { favorable, unfavorable };
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

function getTenGod(dayStem: HeavenlyStem, otherStem: HeavenlyStem): string | null {
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
