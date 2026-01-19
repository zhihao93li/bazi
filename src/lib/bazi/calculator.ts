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

  const dayMaster = calculateDayMaster(fourPillars.day.heavenlyStem, fourPillars);
  const fiveElements = calculateFiveElements(fourPillars, dayMaster);
  const tenGods = calculateTenGods(fourPillars, dayMaster.stem);
  const pattern = calculatePattern(fourPillars, dayMaster, fiveElements);
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

function calculateDayMaster(dayStem: HeavenlyStem, fourPillars: FourPillars): DayMaster {
  const dayElement = dayStem.element;
  const monthBranch = fourPillars.month.earthlyBranch.chinese;
  const monthElement = MONTH_BRANCH_ELEMENT[monthBranch] || 'earth';

  // 1. 得令判断（月令支持）- 最高40分
  let deLing = 0;
  let deLingDesc = '';

  if (dayElement === monthElement) {
    // 日主当令（如金日主在申酉月）
    deLing = 40;
    deLingDesc = '日主当令';
  } else if (FIVE_ELEMENTS_GENERATED_BY[dayElement] === monthElement) {
    // 月令生日主（如水日主在金月，金生水）
    deLing = 30;
    deLingDesc = '月令生扶';
  } else if (FIVE_ELEMENTS_GENERATION[dayElement] === monthElement) {
    // 日主生月令（泄气）
    deLing = -10;
    deLingDesc = '月令泄气';
  } else if (FIVE_ELEMENTS_RESTRICTION[monthElement] === dayElement) {
    // 月令克日主
    deLing = -20;
    deLingDesc = '月令克制';
  } else if (FIVE_ELEMENTS_RESTRICTION[dayElement] === monthElement) {
    // 日主克月令（耗气）
    deLing = -5;
    deLingDesc = '日主耗气';
  }

  // 2. 得地判断（藏干中有根）- 最高30分
  let deDi = 0;
  const roots: string[] = [];

  const allPillars = [
    { pillar: fourPillars.year, name: '年支' },
    { pillar: fourPillars.month, name: '月支' },
    { pillar: fourPillars.day, name: '日支' },
    { pillar: fourPillars.hour, name: '时支' },
  ];

  for (const { pillar, name } of allPillars) {
    const branchChinese = pillar.earthlyBranch.chinese;
    const hiddenStems = pillar.hiddenStems;
    const weights = HIDDEN_STEM_WEIGHTS[branchChinese] || [];

    for (let i = 0; i < hiddenStems.length; i++) {
      const hiddenStem = hiddenStems[i];
      const weight = weights[i] || 0.2;

      // 比劫（同元素）
      if (hiddenStem.element === dayElement) {
        const score = weight * 15;
        deDi += score;
        roots.push(`${name}藏${hiddenStem.chinese}`);
      }
      // 印星（生日主的元素）
      else if (FIVE_ELEMENTS_GENERATED_BY[dayElement] === hiddenStem.element) {
        const score = weight * 10;
        deDi += score;
        roots.push(`${name}藏${hiddenStem.chinese}（印）`);
      }
    }
  }

  deDi = Math.min(deDi, 30); // 上限30分
  const deDiDesc = roots.length > 0 ? roots.join('、') : '无根';

  // 3. 天干帮扶判断 - 最高20分
  let tianGanHelp = 0;
  const helpers: string[] = [];

  const otherStems = [
    { stem: fourPillars.year.heavenlyStem, name: '年干' },
    { stem: fourPillars.month.heavenlyStem, name: '月干' },
    { stem: fourPillars.hour.heavenlyStem, name: '时干' },
  ];

  for (const { stem, name } of otherStems) {
    if (stem.element === dayElement) {
      // 比劫（同元素）
      tianGanHelp += 8;
      helpers.push(`${name}${stem.chinese}比劫`);
    } else if (FIVE_ELEMENTS_GENERATED_BY[dayElement] === stem.element) {
      // 印星（生日主）
      tianGanHelp += 6;
      helpers.push(`${name}${stem.chinese}印星`);
    } else if (FIVE_ELEMENTS_RESTRICTION[stem.element] === dayElement) {
      // 官杀（克日主）
      tianGanHelp -= 5;
      helpers.push(`${name}${stem.chinese}官杀`);
    } else if (FIVE_ELEMENTS_GENERATION[dayElement] === stem.element) {
      // 食伤（泄日主）
      tianGanHelp -= 3;
      helpers.push(`${name}${stem.chinese}食伤`);
    }
  }

  tianGanHelp = Math.max(Math.min(tianGanHelp, 20), -20);
  const tianGanHelpDesc = helpers.length > 0 ? helpers.join('、') : '无帮扶';

  // 总分计算
  const totalScore = deLing + deDi + tianGanHelp;

  // 判断强弱
  let strength: 'strong' | 'weak' | 'balanced';
  if (totalScore >= 50) {
    strength = 'strong';
  } else if (totalScore <= 25) {
    strength = 'weak';
  } else {
    strength = 'balanced';
  }

  const analysis: DayMasterAnalysis = {
    deLing,
    deLingDesc,
    deDi,
    deDiDesc,
    tianGanHelp,
    tianGanHelpDesc,
    totalScore,
  };

  return {
    stem: dayStem,
    strength,
    characteristics: getDayMasterCharacteristics(dayStem),
    analysis,
  };
}

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

  const { favorable, unfavorable } = calculateFavorableElements(dayMaster, distribution);

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

function calculateFavorableElements(
  dayMaster: DayMaster,
  distribution: Record<FiveElement, number>
): { favorable: FiveElement[]; unfavorable: FiveElement[] } {
  const dayElement = dayMaster.stem.element;
  const favorable: FiveElement[] = [];
  const unfavorable: FiveElement[] = [];

  // 生日主的元素（印星）
  const yinElement = FIVE_ELEMENTS_GENERATED_BY[dayElement];
  // 日主所生的元素（食伤）
  const shiShangElement = FIVE_ELEMENTS_GENERATION[dayElement];
  // 日主所克的元素（财星）
  const caiElement = FIVE_ELEMENTS_RESTRICTION[dayElement];
  // 克日主的元素（官杀）
  let guanShaElement: FiveElement = 'wood';
  for (const element of FIVE_ELEMENTS) {
    if (FIVE_ELEMENTS_RESTRICTION[element] === dayElement) {
      guanShaElement = element;
      break;
    }
  }

  if (dayMaster.strength === 'strong') {
    // 身强：喜官杀（克我）、食伤（我生）、财星（我克）
    // 忌印星（生我）、比劫（同我）
    favorable.push(guanShaElement, shiShangElement, caiElement);
    unfavorable.push(yinElement, dayElement);
  } else if (dayMaster.strength === 'weak') {
    // 身弱：喜印星（生我）、比劫（同我）
    // 忌官杀（克我）、食伤（我生）、财星（我克）
    favorable.push(yinElement, dayElement);
    unfavorable.push(guanShaElement, shiShangElement, caiElement);
  } else {
    // 平衡：根据五行分布，补弱抑强
    const sorted = [...FIVE_ELEMENTS].sort((a, b) => distribution[a] - distribution[b]);
    // 最弱的两个为喜
    favorable.push(sorted[0], sorted[1]);
    // 最强的两个为忌
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

/**
 * 计算八字格局
 *
 * 格局判断规则：
 * 1. 正格：以月令本气定格，如月令本气为正官则为正官格
 * 2. 建禄格/羊刃格：月支为日主之禄或刃
 * 3. 特殊格局：从格、专旺格等（基于日主强弱极端情况）
 */
function calculatePattern(
  fourPillars: FourPillars,
  dayMaster: DayMaster,
  fiveElements: FiveElementsAnalysis
): PatternInfo {
  const dayStem = fourPillars.day.heavenlyStem;
  const monthBranch = fourPillars.month.earthlyBranch;
  const monthHiddenStems = fourPillars.month.hiddenStems;

  // 获取四柱天干（用于检查透干）
  const tianGan = [
    fourPillars.year.heavenlyStem.chinese,
    fourPillars.month.heavenlyStem.chinese,
    fourPillars.hour.heavenlyStem.chinese,
  ];

  // 日主禄位和刃位映射
  const luMap: Record<string, string> = {
    '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳',
    '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子',
  };
  const renMap: Record<string, string> = {
    '甲': '卯', '乙': '寅', '丙': '午', '丁': '巳', '戊': '午',
    '己': '巳', '庚': '酉', '辛': '申', '壬': '子', '癸': '亥',
  };

  // 1. 检查建禄格
  if (monthBranch.chinese === luMap[dayStem.chinese]) {
    return {
      name: '建禄格',
      category: 'normal',
      description: '月支为日主之禄，主身旺有根，宜见财官食伤',
      monthStem: monthHiddenStems[0]?.chinese,
      isTransparent: false,
    };
  }

  // 2. 检查羊刃格
  if (monthBranch.chinese === renMap[dayStem.chinese]) {
    return {
      name: '羊刃格',
      category: 'normal',
      description: '月支为日主之刃，主身强刚烈，宜见官杀制刃',
      monthStem: monthHiddenStems[0]?.chinese,
      isTransparent: false,
    };
  }

  // 3. 检查特殊格局（基于日主强弱）
  const dayMasterScore = dayMaster.analysis?.totalScore ?? 50;

  // 从格判断：日主极弱（分数低于20）
  if (dayMasterScore < 20) {
    const dist = fiveElements.distribution;
    const dayElement = dayStem.element;

    // 找出最强的非我五行
    let strongestElement = dayElement;
    let strongestValue = 0;
    for (const el of FIVE_ELEMENTS) {
      if (el !== dayElement && dist[el] > strongestValue) {
        strongestValue = dist[el];
        strongestElement = el;
      }
    }

    // 根据最强五行确定从格类型
    if (strongestElement === 'metal' || strongestElement === 'wood' ||
        strongestElement === 'water' || strongestElement === 'fire' || strongestElement === 'earth') {
      // 判断是财、官、还是食伤
      const isWealth = restrictsElement(dayElement, strongestElement);
      const isPower = restrictsElement(strongestElement, dayElement);
      const isOutput = generatesElement(dayElement, strongestElement);

      if (isWealth) {
        return {
          name: '从财格',
          category: 'special',
          description: '日主极弱而财星极旺，弃命从财，宜顺从财势',
        };
      }
      if (isPower) {
        return {
          name: '从官格',
          category: 'special',
          description: '日主极弱而官杀极旺，弃命从官，宜顺从官势',
        };
      }
      if (isOutput) {
        return {
          name: '从儿格',
          category: 'special',
          description: '日主极弱而食伤极旺，弃命从儿，宜顺从食伤之势',
        };
      }
    }
  }

  // 专旺格判断：日主极强（分数高于75）
  if (dayMasterScore > 75) {
    const dayElement = dayStem.element;
    const elementMap: Record<FiveElement, string> = {
      wood: '曲直格',
      fire: '炎上格',
      earth: '稼穑格',
      metal: '从革格',
      water: '润下格',
    };
    const descMap: Record<FiveElement, string> = {
      wood: '木气专旺成局，主仁慈正直，宜水木运',
      fire: '火气炎上成局，主热情礼仪，宜木火运',
      earth: '土气稼穑成局，主忠厚信实，宜火土运',
      metal: '金气从革成局，主刚毅果决，宜土金运',
      water: '水气润下成局，主聪慧灵活，宜金水运',
    };

    return {
      name: elementMap[dayElement],
      category: 'special',
      description: descMap[dayElement],
    };
  }

  // 4. 正格判断：以月令本气定格
  if (monthHiddenStems.length > 0) {
    // 遍历藏干，找第一个非比劫的十神
    for (let i = 0; i < monthHiddenStems.length; i++) {
      const hiddenStem = monthHiddenStems[i];
      const tenGod = getTenGod(dayStem, hiddenStem);

      // 比肩、劫财不成格，继续看下一个
      if (tenGod === '比肩' || tenGod === '劫财') {
        continue;
      }

      // 检查是否透干
      const isTransparent = tianGan.includes(hiddenStem.chinese);

      // 根据十神确定格局
      const patternMap: Record<string, { name: string; desc: string }> = {
        '正官': { name: '正官格', desc: '月令透正官，主贵气端正，宜见财印相生' },
        '七杀': { name: '七杀格', desc: '月令透七杀，主威严果决，宜见食伤制杀或印化杀' },
        '正财': { name: '正财格', desc: '月令透正财，主务实勤俭，宜见官杀护财' },
        '偏财': { name: '偏财格', desc: '月令透偏财，主豪爽大方，宜见官杀护财' },
        '正印': { name: '正印格', desc: '月令透正印，主聪慧仁厚，宜见官杀生印' },
        '偏印': { name: '偏印格', desc: '月令透偏印，主机敏多思，宜见财星制印' },
        '食神': { name: '食神格', desc: '月令透食神，主温和福厚，宜见财星泄秀' },
        '伤官': { name: '伤官格', desc: '月令透伤官，主聪明傲气，宜见财星或印星' },
      };

      if (tenGod && patternMap[tenGod]) {
        return {
          name: patternMap[tenGod].name,
          category: 'normal',
          description: patternMap[tenGod].desc,
          monthStem: hiddenStem.chinese,
          monthStemTenGod: tenGod,
          isTransparent,
        };
      }
    }
  }

  // 如果没有匹配到任何格局，返回杂格
  return {
    name: '杂格',
    category: 'normal',
    description: '月令无明显成格条件，需综合分析八字整体格局',
  };
}
