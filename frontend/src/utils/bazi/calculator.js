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

  let strength;
  if (supportCount > weakenCount + 3) strength = 'strong';
  else if (weakenCount > supportCount + 2) strength = 'weak';
  else strength = 'balanced';

  return {
    stem: dayStem,
    strength,
    characteristics: getDayMasterCharacteristics(dayStem),
  };
}

function calculateFiveElements(fourPillars, dayMaster) {
  const distribution = { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 };

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

  let strongest = 'wood';
  let weakest = 'wood';
  let maxCount = distribution.wood;
  let minCount = distribution.wood;

  for (const element of FIVE_ELEMENTS) {
    if (distribution[element] > maxCount) { maxCount = distribution[element]; strongest = element; }
    if (distribution[element] < minCount) { minCount = distribution[element]; weakest = element; }
  }

  const { favorable, unfavorable } = calculateFavorableElements(dayMaster, distribution);
  return { distribution, strongest, weakest, favorable, unfavorable };
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
