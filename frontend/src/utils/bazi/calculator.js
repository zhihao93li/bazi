/**
 * 八字计算器
 * Bazi Calculator
 * 
 * 使用 lunar-javascript 库计算八字四柱
 * 支持真太阳时校正
 * 
 * Ported from backend src/lib/bazi/calculator.ts
 */

import { Solar, Lunar, LunarYear } from 'lunar-typescript';
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
 * 从地点中提取经度
 * 使用完整的城市经纬度数据库
 * @param {string|object} location - 位置字符串或对象 { province, city, district }
 * @returns {number} 经度
 */
function getLongitudeFromLocation(location) {
  return getLongitude(location);
}


/**
 * 计算时差方程（Equation of Time）
 */
function equationOfTime(dayOfYear) {
  const B = (2 * Math.PI * (dayOfYear - 81)) / 365;
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}

/**
 * 获取一年中的第几天
 */
function getDayOfYear(year, month, day) {
  const date = new Date(year, month - 1, day);
  const start = new Date(year, 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * 将北京时间转换为真太阳时
 */
function toTrueSolarTime(
  year,
  month,
  day,
  hour,
  minute,
  longitude
) {
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
 * @param {import('./types.js').BaziBirthData} birthData
 */
export function calculateBazi(birthData) {
  const longitude = getLongitudeFromLocation(birthData.location);

  let solar;
  let lunar;
  // 保存真太阳时用于返回
  let trueSolarTimeResult;

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
  eightChar.setSect(1); // 晚子时日柱算明天

  const fourPillars = {
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

  const lunarDate = {
    year: lunar.getYear(),
    month: lunar.getMonth(),
    day: lunar.getDay(),
    isLeapMonth,
    yearGanZhi: eightChar.getYear(),
    monthGanZhi: eightChar.getMonth(),
    dayGanZhi: eightChar.getDay(),
    yearInChinese: lunar.getYearInChinese?.() || '',
    monthInChinese: lunar.getMonthInChinese?.() || '',
    dayInChinese: lunar.getDayInChinese?.() || '',
  };

  // 计算大运
  const gender = birthData.gender === 'male' ? 1 : 0;

  let yun;
  try {
    const yunObj = eightChar.getYun(gender, 1);
    const daYunList = [];
    const daYunArr = yunObj.getDaYun(12); // 第一个是起运前，所以要 12 才能获取足够的大运

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
        } catch (e) {
          // 忽略错误，使用空字符串
        }
      }

      // 获取流年列表
      const liuNianList = [];
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
            } catch (e) {
              // 忽略错误
            }
          }

          // 获取流月列表
          const liuYueList = [];
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
                } catch (e) {
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
          } catch (e) {
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
      } catch (e) {
        // 忽略流年获取错误
      }

      // 只保留有效的大运（ganZhi 非空），过滤掉起运前的空元素，最多 10 步
      if (ganZhi && daYunList.length < 10) {
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
  let shenSha;
  let directions;
  let pengZu;
  let yiJi;
  let jieQi;
  let xingXiu;

  try {
    shenSha = {
      year: lunar.getYearShenSha?.() || [],
      month: lunar.getMonthShenSha?.() || [],
      day: lunar.getDayShenSha?.() || [],
      hour: lunar.getTimeShenSha?.() || [],
    };
  } catch (e) { /* ignore */ }

  try {
    directions = {
      xi: lunar.getDayPositionXiDesc?.() || '',
      yangGui: lunar.getDayPositionYangGuiDesc?.() || '',
      yinGui: lunar.getDayPositionYinGuiDesc?.() || '',
      fu: lunar.getDayPositionFuDesc?.(1) || '',
      cai: lunar.getDayPositionCaiDesc?.() || '',
    };
  } catch (e) { /* ignore */ }

  try {
    pengZu = {
      gan: lunar.getPengZuGan?.() || '',
      zhi: lunar.getPengZuZhi?.() || '',
    };
  } catch (e) { /* ignore */ }

  try {
    yiJi = {
      yi: lunar.getDayYi?.() || [],
      ji: lunar.getDayJi?.() || [],
    };
  } catch (e) { /* ignore */ }

  try {
    const prevJie = lunar.getPrevJie?.();
    const nextJie = lunar.getNextJie?.();
    jieQi = {
      current: lunar.getJieQi?.() || '',
      next: nextJie?.getName?.() || '',
      nextDate: nextJie?.getSolar?.()?.toYmd?.() || '',
      prev: prevJie?.getName?.() || '',
      prevDate: prevJie?.getSolar?.()?.toYmd?.() || '',
    };
  } catch (e) { /* ignore */ }

  try {
    xingXiu = {
      xiu: lunar.getXiu?.() || '',
      animal: lunar.getAnimal?.() || '',
      gong: lunar.getGong?.() || '',
      shou: lunar.getShou?.() || '',
      luck: lunar.getXiuLuck?.() || '',
      song: lunar.getXiuSong?.() || '',
    };
  } catch (e) { /* ignore */ }

  // 十二长生
  let diShi;
  try {
    diShi = {
      year: eightChar.getYearDiShi?.() || '',
      month: eightChar.getMonthDiShi?.() || '',
      day: eightChar.getDayDiShi?.() || '',
      hour: eightChar.getTimeDiShi?.() || '',
    };
  } catch (e) { /* ignore */ }

  // 九星
  let nineStars;
  try {
    const extractNineStar = (ns) => {
      return {
        number: ns?.getNumber?.() || '',
        color: ns?.getColor?.() || '',
        wuXing: ns?.getWuXing?.() || '',
        name: ns?.getNameInBeiDou?.() || '',
        luck: ns?.getLuckInXuanKong?.() || '',
      };
    };
    nineStars = {
      year: extractNineStar(lunar.getYearNineStar?.()),
      month: extractNineStar(lunar.getMonthNineStar?.()),
      day: extractNineStar(lunar.getDayNineStar?.()),
      hour: extractNineStar(lunar.getTimeNineStar?.()),
    };
  } catch (e) { /* ignore */ }

  // 天神
  let tianShen;
  try {
    tianShen = {
      day: lunar.getDayTianShen?.() || '',
      dayType: lunar.getDayTianShenType?.() || '',
      dayLuck: lunar.getDayTianShenLuck?.() || '',
      hour: lunar.getTimeTianShen?.() || '',
      hourType: lunar.getTimeTianShenType?.() || '',
      hourLuck: lunar.getTimeTianShenLuck?.() || '',
    };
  } catch (e) { /* ignore */ }

  // 吉神凶煞
  let jiXiong;
  try {
    jiXiong = {
      jiShen: lunar.getDayJiShen?.() || [],
      xiongSha: lunar.getDayXiongSha?.() || [],
    };
  } catch (e) { /* ignore */ }

  // 时辰宜忌
  let timeYiJi;
  try {
    timeYiJi = {
      yi: lunar.getTimeYi?.() || [],
      ji: lunar.getTimeJi?.() || [],
    };
  } catch (e) { /* ignore */ }

  // 冲煞
  let chongSha;
  try {
    chongSha = {
      dayChong: lunar.getDayChong?.() || '',
      dayChongDesc: lunar.getDayChongDesc?.() || '',
      daySha: lunar.getDaySha?.() || '',
      timeChong: lunar.getTimeChong?.() || '',
      timeChongDesc: lunar.getTimeChongDesc?.() || '',
      timeSha: lunar.getTimeSha?.() || '',
    };
  } catch (e) { /* ignore */ }

  // 胎神
  let taiShen;
  try {
    taiShen = {
      day: lunar.getDayPositionTai?.() || '',
      month: lunar.getMonthPositionTai?.() || '',
    };
  } catch (e) { /* ignore */ }

  // 四柱旬空
  let fourPillarsXunKong;
  try {
    fourPillarsXunKong = {
      yearXun: eightChar.getYearXun?.() || '',
      yearXunKong: eightChar.getYearXunKong?.() || '',
      monthXun: eightChar.getMonthXun?.() || '',
      monthXunKong: eightChar.getMonthXunKong?.() || '',
      dayXun: eightChar.getDayXun?.() || '',
      dayXunKong: eightChar.getDayXunKong?.() || '',
      hourXun: eightChar.getTimeXun?.() || '',
      hourXunKong: eightChar.getTimeXunKong?.() || '',
    };
  } catch (e) { /* ignore */ }

  // 四柱十神
  let fourPillarsShiShen;
  try {
    fourPillarsShiShen = {
      yearGan: eightChar.getYearShiShenGan?.() || '',
      yearZhi: eightChar.getYearShiShenZhi?.() || [],
      monthGan: eightChar.getMonthShiShenGan?.() || '',
      monthZhi: eightChar.getMonthShiShenZhi?.() || [],
      dayZhi: eightChar.getDayShiShenZhi?.() || [],
      hourGan: eightChar.getTimeShiShenGan?.() || '',
      hourZhi: eightChar.getTimeShiShenZhi?.() || [],
    };
  } catch (e) { /* ignore */ }

  // 命宫身宫纳音
  let gongNaYin;
  try {
    gongNaYin = {
      taiYuan: eightChar.getTaiYuan?.() || '',
      taiYuanNaYin: eightChar.getTaiYuanNaYin?.() || '',
      mingGong: eightChar.getMingGong?.() || '',
      mingGongNaYin: eightChar.getMingGongNaYin?.() || '',
      shenGong: eightChar.getShenGong?.() || '',
      shenGongNaYin: eightChar.getShenGongNaYin?.() || '',
      taiXi: eightChar.getTaiXi?.() || '',
      taiXiNaYin: eightChar.getTaiXiNaYin?.() || '',
    };
  } catch (e) { /* ignore */ }

  // 其他信息
  let otherInfo;
  try {
    otherInfo = {
      liuYao: lunar.getLiuYao?.() || '',
      wuHou: lunar.getWuHou?.() || '',
      hou: lunar.getHou?.() || '',
      dayLu: lunar.getDayLu?.() || '',
      yueXiang: lunar.getYueXiang?.() || '',
      zhiXing: lunar.getZhiXing?.() || '',
      festivals: lunar.getFestivals?.() || [],
      otherFestivals: lunar.getOtherFestivals?.() || [],
    };
  } catch (e) { /* ignore */ }

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
    shengXiao: lunar.getYearShengXiaoExact?.() || '',
    xun: eightChar.getDayXun?.() || '',
    xunKong: eightChar.getDayXunKong?.() || '',
    taiYuan: eightChar.getTaiYuan?.() || '',
    mingGong: eightChar.getMingGong?.() || '',
    shenGong: eightChar.getShenGong?.() || '',
    trueSolarTime: trueSolarTimeResult,
  };
}


function createPillar(ganChinese, zhiChinese, nayin) {
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

function calculateDayMaster(dayStem, fourPillars) {
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
  const roots = [];

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
  const helpers = [];

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
  let strength;
  if (totalScore >= 50) {
    strength = 'strong';
  } else if (totalScore <= 25) {
    strength = 'weak';
  } else {
    strength = 'balanced';
  }

  const analysis = {
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

function calculateFiveElements(fourPillars, dayMaster) {
  const distribution = { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 };
  const counts = { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 };

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
  let strongest = 'wood';
  let weakest = 'wood';
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
function getElementStates(monthElement) {
  const states = {
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

function calculateTenGods(fourPillars, dayStem) {
  const gods = {};
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

function extractHiddenStems(fourPillars) {
  return {
    [fourPillars.year.earthlyBranch.chinese]: fourPillars.year.hiddenStems,
    [fourPillars.month.earthlyBranch.chinese]: fourPillars.month.hiddenStems,
    [fourPillars.day.earthlyBranch.chinese]: fourPillars.day.hiddenStems,
    [fourPillars.hour.earthlyBranch.chinese]: fourPillars.hour.hiddenStems,
  };
}

function generatesElement(from, to) {
  const generation = {
    wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood',
  };
  return generation[from] === to;
}

function restrictsElement(from, to) {
  const restriction = {
    wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood',
  };
  return restriction[from] === to;
}

function calculateFavorableElements(dayMaster, distribution) {
  const dayElement = dayMaster.stem.element;
  const favorable = [];
  const unfavorable = [];

  // 生日主的元素（印星）
  const yinElement = FIVE_ELEMENTS_GENERATED_BY[dayElement];
  // 日主所生的元素（食伤）
  const shiShangElement = FIVE_ELEMENTS_GENERATION[dayElement];
  // 日主所克的元素（财星）
  const caiElement = FIVE_ELEMENTS_RESTRICTION[dayElement];
  // 克日主的元素（官杀）
  let guanShaElement = 'wood';
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

function getDayMasterCharacteristics(dayStem) {
  const characteristics = {
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

function getTenGod(dayStem, otherStem) {
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
