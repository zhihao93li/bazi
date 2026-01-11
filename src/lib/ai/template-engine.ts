/**
 * Prompt 模板引擎
 * 实现占位符变量替换功能
 */

import type { BaziData, TenGodsAnalysis, DaYunInfo, YunInfo, ShenShaInfo, DirectionsInfo, JieQiInfo, XingXiuInfo, PengZuInfo, YiJiInfo, DiShiInfo, NineStarsInfo, TianShenInfo, JiXiongInfo, TimeYiJiInfo, ChongShaInfo, TaiShenInfo, FourPillarsXunKongInfo, FourPillarsShiShenInfo, GongNaYinInfo, OtherLunarInfo } from '../bazi/types.js';
import { FIVE_ELEMENTS_CHINESE } from '../bazi/constants.js';

/**
 * 模板变量上下文
 */
export interface TemplateContext {
  baziData: BaziData;
  gender?: string;
}

/**
 * 格式化十神关系为字符串
 */
function formatTenGods(tenGods: TenGodsAnalysis): string {
  return Object.values(tenGods.gods)
    .map((god) => `${god.positions.join('、')}：${god.name}`)
    .join('\n');
}

/**
 * 格式化大运信息为字符串（简略版）
 */
function formatDaYunSimple(daYunList: DaYunInfo[] | undefined): string {
  if (!daYunList || daYunList.length === 0) {
    return '暂无大运信息';
  }

  return daYunList
    .filter(dy => dy.ganZhi) // 跳过空的第一个大运
    .slice(0, 8)
    .map((dy) => `${dy.startAge}-${dy.endAge}岁：${dy.ganZhi}`)
    .join('\n');
}

/**
 * 格式化大运信息为字符串（详细版，包含流年）
 */
function formatDaYunDetailed(yun: YunInfo | undefined): string {
  if (!yun || !yun.daYunList || yun.daYunList.length === 0) {
    return '暂无大运信息';
  }

  const lines: string[] = [];
  lines.push(`起运：${yun.startYear}年${yun.startMonth}月${yun.startDay}日（${yun.startAge}岁起运）`);
  lines.push(`运行方向：${yun.forward ? '顺行' : '逆行'}`);
  lines.push('');

  for (const dy of yun.daYunList.filter(d => d.ganZhi)) {
    lines.push(`【${dy.ganZhi}】${dy.startAge}-${dy.endAge}岁（${dy.startYear}-${dy.endYear}年）`);
    
    // 添加流年信息
    if (dy.liuNian && dy.liuNian.length > 0) {
      const liuNianStr = dy.liuNian
        .map(ln => `${ln.year}年(${ln.age}岁):${ln.ganZhi}`)
        .join('、');
      lines.push(`  流年：${liuNianStr}`);
    }
  }

  return lines.join('\n');
}

/**
 * 格式化当前流年流月（用于流年运势分析）
 */
function formatCurrentLiuNian(yun: YunInfo | undefined): string {
  if (!yun || !yun.daYunList) return '暂无流年信息';

  const currentYear = new Date().getFullYear();
  
  for (const dy of yun.daYunList) {
    if (dy.liuNian) {
      const currentLiuNian = dy.liuNian.find(ln => ln.year === currentYear);
      if (currentLiuNian) {
        const lines: string[] = [];
        lines.push(`当前大运：${dy.ganZhi}（${dy.startAge}-${dy.endAge}岁）`);
        lines.push(`当前流年：${currentYear}年 ${currentLiuNian.ganZhi}（${currentLiuNian.age}岁）`);
        
        if (currentLiuNian.liuYue && currentLiuNian.liuYue.length > 0) {
          const liuYueStr = currentLiuNian.liuYue
            .map(ly => `${ly.monthInChinese}:${ly.ganZhi}`)
            .join('、');
          lines.push(`流月：${liuYueStr}`);
        }
        
        return lines.join('\n');
      }
    }
  }
  
  return '暂无当前流年信息';
}

/**
 * 格式化神煞信息
 */
function formatShenSha(shenSha: ShenShaInfo | undefined): string {
  if (!shenSha) return '暂无神煞信息';
  
  const lines: string[] = [];
  if (shenSha.year?.length) lines.push(`年柱神煞：${shenSha.year.join('、')}`);
  if (shenSha.month?.length) lines.push(`月柱神煞：${shenSha.month.join('、')}`);
  if (shenSha.day?.length) lines.push(`日柱神煞：${shenSha.day.join('、')}`);
  if (shenSha.hour?.length) lines.push(`时柱神煞：${shenSha.hour.join('、')}`);
  
  return lines.length > 0 ? lines.join('\n') : '暂无神煞信息';
}

/**
 * 格式化吉神方位
 */
function formatDirections(directions: DirectionsInfo | undefined): string {
  if (!directions) return '暂无方位信息';
  
  const lines: string[] = [];
  if (directions.xi) lines.push(`喜神方位：${directions.xi}`);
  if (directions.yangGui) lines.push(`阳贵神方位：${directions.yangGui}`);
  if (directions.yinGui) lines.push(`阴贵神方位：${directions.yinGui}`);
  if (directions.fu) lines.push(`福神方位：${directions.fu}`);
  if (directions.cai) lines.push(`财神方位：${directions.cai}`);
  
  return lines.length > 0 ? lines.join('\n') : '暂无方位信息';
}

/**
 * 格式化节气信息
 */
function formatJieQi(jieQi: JieQiInfo | undefined): string {
  if (!jieQi) return '暂无节气信息';
  
  const lines: string[] = [];
  if (jieQi.current) lines.push(`当前节气：${jieQi.current}`);
  if (jieQi.prev) lines.push(`上一节气：${jieQi.prev}（${jieQi.prevDate}）`);
  if (jieQi.next) lines.push(`下一节气：${jieQi.next}（${jieQi.nextDate}）`);
  
  return lines.length > 0 ? lines.join('\n') : '暂无节气信息';
}

/**
 * 格式化星宿信息
 */
function formatXingXiu(xingXiu: XingXiuInfo | undefined): string {
  if (!xingXiu) return '暂无星宿信息';
  
  const lines: string[] = [];
  if (xingXiu.xiu) lines.push(`星宿：${xingXiu.xiu}`);
  if (xingXiu.animal) lines.push(`星宿动物：${xingXiu.animal}`);
  if (xingXiu.gong) lines.push(`宫：${xingXiu.gong}`);
  if (xingXiu.shou) lines.push(`兽：${xingXiu.shou}`);
  if (xingXiu.luck) lines.push(`吉凶：${xingXiu.luck}`);
  
  return lines.length > 0 ? lines.join('\n') : '暂无星宿信息';
}

/**
 * 格式化彭祖百忌
 */
function formatPengZu(pengZu: PengZuInfo | undefined): string {
  if (!pengZu) return '暂无彭祖百忌信息';
  
  const lines: string[] = [];
  if (pengZu.gan) lines.push(`天干忌：${pengZu.gan}`);
  if (pengZu.zhi) lines.push(`地支忌：${pengZu.zhi}`);
  
  return lines.length > 0 ? lines.join('\n') : '暂无彭祖百忌信息';
}

/**
 * 格式化宜忌
 */
function formatYiJi(yiJi: YiJiInfo | undefined): string {
  if (!yiJi) return '暂无宜忌信息';
  
  const lines: string[] = [];
  if (yiJi.yi?.length) lines.push(`宜：${yiJi.yi.join('、')}`);
  if (yiJi.ji?.length) lines.push(`忌：${yiJi.ji.join('、')}`);
  
  return lines.length > 0 ? lines.join('\n') : '暂无宜忌信息';
}

/**
 * 格式化藏干信息
 */
function formatHiddenStems(baziData: BaziData): string {
  const pillars = [
    { name: '年支', pillar: baziData.fourPillars.year },
    { name: '月支', pillar: baziData.fourPillars.month },
    { name: '日支', pillar: baziData.fourPillars.day },
    { name: '时支', pillar: baziData.fourPillars.hour },
  ];
  
  return pillars
    .map(({ name, pillar }) => {
      const stems = pillar.hiddenStems.map(s => s.chinese).join('、');
      return `${name}（${pillar.earthlyBranch.chinese}）藏干：${stems}`;
    })
    .join('\n');
}

/**
 * 格式化纳音信息
 */
function formatNaYin(baziData: BaziData): string {
  return [
    `年柱纳音：${baziData.fourPillars.year.naYin}`,
    `月柱纳音：${baziData.fourPillars.month.naYin}`,
    `日柱纳音：${baziData.fourPillars.day.naYin}`,
    `时柱纳音：${baziData.fourPillars.hour.naYin}`,
  ].join('\n');
}

/**
 * 格式化十二长生
 */
function formatDiShi(diShi: DiShiInfo | undefined): string {
  if (!diShi) return '暂无十二长生信息';
  return [
    `年柱地势：${diShi.year}`,
    `月柱地势：${diShi.month}`,
    `日柱地势：${diShi.day}`,
    `时柱地势：${diShi.hour}`,
  ].join('\n');
}

/**
 * 格式化九星信息
 */
function formatNineStars(nineStars: NineStarsInfo | undefined): string {
  if (!nineStars) return '暂无九星信息';
  
  const formatStar = (name: string, star: { number: string; color: string; wuXing: string; name: string; luck: string }) => {
    return `${name}：${star.number}${star.color}${star.name}（${star.wuXing}，${star.luck}）`;
  };
  
  return [
    formatStar('年九星', nineStars.year),
    formatStar('月九星', nineStars.month),
    formatStar('日九星', nineStars.day),
    formatStar('时九星', nineStars.hour),
  ].join('\n');
}

/**
 * 格式化天神信息
 */
function formatTianShen(tianShen: TianShenInfo | undefined): string {
  if (!tianShen) return '暂无天神信息';
  
  const lines: string[] = [];
  if (tianShen.day) lines.push(`日天神：${tianShen.day}（${tianShen.dayType}，${tianShen.dayLuck}）`);
  if (tianShen.hour) lines.push(`时天神：${tianShen.hour}（${tianShen.hourType}，${tianShen.hourLuck}）`);
  
  return lines.length > 0 ? lines.join('\n') : '暂无天神信息';
}

/**
 * 格式化吉神凶煞
 */
function formatJiXiong(jiXiong: JiXiongInfo | undefined): string {
  if (!jiXiong) return '暂无吉神凶煞信息';
  
  const lines: string[] = [];
  if (jiXiong.jiShen?.length) lines.push(`吉神：${jiXiong.jiShen.join('、')}`);
  if (jiXiong.xiongSha?.length) lines.push(`凶煞：${jiXiong.xiongSha.join('、')}`);
  
  return lines.length > 0 ? lines.join('\n') : '暂无吉神凶煞信息';
}

/**
 * 格式化时辰宜忌
 */
function formatTimeYiJi(timeYiJi: TimeYiJiInfo | undefined): string {
  if (!timeYiJi) return '暂无时辰宜忌信息';
  
  const lines: string[] = [];
  if (timeYiJi.yi?.length) lines.push(`时辰宜：${timeYiJi.yi.join('、')}`);
  if (timeYiJi.ji?.length) lines.push(`时辰忌：${timeYiJi.ji.join('、')}`);
  
  return lines.length > 0 ? lines.join('\n') : '暂无时辰宜忌信息';
}

/**
 * 格式化冲煞信息
 */
function formatChongSha(chongSha: ChongShaInfo | undefined): string {
  if (!chongSha) return '暂无冲煞信息';
  
  const lines: string[] = [];
  if (chongSha.dayChong) lines.push(`日冲：${chongSha.dayChongDesc || chongSha.dayChong}`);
  if (chongSha.daySha) lines.push(`日煞：${chongSha.daySha}`);
  if (chongSha.timeChong) lines.push(`时冲：${chongSha.timeChongDesc || chongSha.timeChong}`);
  if (chongSha.timeSha) lines.push(`时煞：${chongSha.timeSha}`);
  
  return lines.length > 0 ? lines.join('\n') : '暂无冲煞信息';
}

/**
 * 格式化胎神信息
 */
function formatTaiShen(taiShen: TaiShenInfo | undefined): string {
  if (!taiShen) return '暂无胎神信息';
  
  const lines: string[] = [];
  if (taiShen.day) lines.push(`日胎神：${taiShen.day}`);
  if (taiShen.month) lines.push(`月胎神：${taiShen.month}`);
  
  return lines.length > 0 ? lines.join('\n') : '暂无胎神信息';
}

/**
 * 格式化四柱旬空
 */
function formatFourPillarsXunKong(xunKong: FourPillarsXunKongInfo | undefined): string {
  if (!xunKong) return '暂无四柱旬空信息';
  
  return [
    `年柱：${xunKong.yearXun}旬，空亡${xunKong.yearXunKong}`,
    `月柱：${xunKong.monthXun}旬，空亡${xunKong.monthXunKong}`,
    `日柱：${xunKong.dayXun}旬，空亡${xunKong.dayXunKong}`,
    `时柱：${xunKong.hourXun}旬，空亡${xunKong.hourXunKong}`,
  ].join('\n');
}

/**
 * 格式化四柱十神
 */
function formatFourPillarsShiShen(shiShen: FourPillarsShiShenInfo | undefined): string {
  if (!shiShen) return '暂无四柱十神信息';
  
  return [
    `年干十神：${shiShen.yearGan}，年支藏干十神：${shiShen.yearZhi?.join('、') || ''}`,
    `月干十神：${shiShen.monthGan}，月支藏干十神：${shiShen.monthZhi?.join('、') || ''}`,
    `日支藏干十神：${shiShen.dayZhi?.join('、') || ''}`,
    `时干十神：${shiShen.hourGan}，时支藏干十神：${shiShen.hourZhi?.join('、') || ''}`,
  ].join('\n');
}

/**
 * 格式化命宫身宫纳音
 */
function formatGongNaYin(gongNaYin: GongNaYinInfo | undefined): string {
  if (!gongNaYin) return '暂无命宫身宫信息';
  
  return [
    `胎元：${gongNaYin.taiYuan}（${gongNaYin.taiYuanNaYin}）`,
    `命宫：${gongNaYin.mingGong}（${gongNaYin.mingGongNaYin}）`,
    `身宫：${gongNaYin.shenGong}（${gongNaYin.shenGongNaYin}）`,
    `胎息：${gongNaYin.taiXi}（${gongNaYin.taiXiNaYin}）`,
  ].join('\n');
}

/**
 * 格式化其他信息
 */
function formatOtherInfo(otherInfo: OtherLunarInfo | undefined): string {
  if (!otherInfo) return '暂无其他信息';
  
  const lines: string[] = [];
  if (otherInfo.liuYao) lines.push(`六曜：${otherInfo.liuYao}`);
  if (otherInfo.zhiXing) lines.push(`执星：${otherInfo.zhiXing}`);
  if (otherInfo.yueXiang) lines.push(`月相：${otherInfo.yueXiang}`);
  if (otherInfo.wuHou) lines.push(`物候：${otherInfo.wuHou}`);
  if (otherInfo.hou) lines.push(`候：${otherInfo.hou}`);
  if (otherInfo.dayLu) lines.push(`日禄：${otherInfo.dayLu}`);
  if (otherInfo.festivals?.length) lines.push(`节日：${otherInfo.festivals.join('、')}`);
  if (otherInfo.otherFestivals?.length) lines.push(`其他节日：${otherInfo.otherFestivals.join('、')}`);
  
  return lines.length > 0 ? lines.join('\n') : '暂无其他信息';
}

/**
 * 获取嵌套对象的值
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

/**
 * 将值转换为字符串
 */
function valueToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map((v) => valueToString(v)).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * 构建模板变量映射 - 包含所有八字信息
 */
function buildVariableMap(context: TemplateContext): Record<string, unknown> {
  const { baziData, gender } = context;
  const dist = baziData.fiveElements.distribution;

  return {
    // ==================== 四柱信息 ====================
    yearPillar: {
      heavenlyStem: baziData.fourPillars.year.heavenlyStem.chinese,
      earthlyBranch: baziData.fourPillars.year.earthlyBranch.chinese,
      naYin: baziData.fourPillars.year.naYin,
      hiddenStems: baziData.fourPillars.year.hiddenStems.map(s => s.chinese).join('、'),
    },
    monthPillar: {
      heavenlyStem: baziData.fourPillars.month.heavenlyStem.chinese,
      earthlyBranch: baziData.fourPillars.month.earthlyBranch.chinese,
      naYin: baziData.fourPillars.month.naYin,
      hiddenStems: baziData.fourPillars.month.hiddenStems.map(s => s.chinese).join('、'),
    },
    dayPillar: {
      heavenlyStem: baziData.fourPillars.day.heavenlyStem.chinese,
      earthlyBranch: baziData.fourPillars.day.earthlyBranch.chinese,
      naYin: baziData.fourPillars.day.naYin,
      hiddenStems: baziData.fourPillars.day.hiddenStems.map(s => s.chinese).join('、'),
    },
    hourPillar: {
      heavenlyStem: baziData.fourPillars.hour.heavenlyStem.chinese,
      earthlyBranch: baziData.fourPillars.hour.earthlyBranch.chinese,
      naYin: baziData.fourPillars.hour.naYin,
      hiddenStems: baziData.fourPillars.hour.hiddenStems.map(s => s.chinese).join('、'),
    },

    // ==================== 日主信息 ====================
    dayMaster: baziData.dayMaster.stem.chinese,
    dayMasterElement: FIVE_ELEMENTS_CHINESE[baziData.dayMaster.stem.element],
    dayMasterStrength: baziData.dayMaster.strength === 'strong' ? '身强' : 
                       baziData.dayMaster.strength === 'weak' ? '身弱' : '中和',
    dayMasterCharacteristics: baziData.dayMaster.characteristics.join('、'),

    // ==================== 五行分布 ====================
    fiveElements: {
      metal: dist.metal,
      wood: dist.wood,
      water: dist.water,
      fire: dist.fire,
      earth: dist.earth,
      strongest: FIVE_ELEMENTS_CHINESE[baziData.fiveElements.strongest],
      weakest: FIVE_ELEMENTS_CHINESE[baziData.fiveElements.weakest],
    },
    favorableElements: baziData.fiveElements.favorable.map(e => FIVE_ELEMENTS_CHINESE[e]).join('、'),
    unfavorableElements: baziData.fiveElements.unfavorable.map(e => FIVE_ELEMENTS_CHINESE[e]).join('、'),

    // ==================== 十神关系 ====================
    tenGods: formatTenGods(baziData.tenGods),

    // ==================== 纳音信息 ====================
    naYin: formatNaYin(baziData),

    // ==================== 藏干信息 ====================
    hiddenStems: formatHiddenStems(baziData),

    // ==================== 大运信息 ====================
    majorFortune: formatDaYunSimple(baziData.yun?.daYunList),
    daYun: formatDaYunSimple(baziData.yun?.daYunList),
    daYunDetailed: formatDaYunDetailed(baziData.yun),
    yunDirection: baziData.yun?.forward ? '顺行' : '逆行',
    yunStartAge: baziData.yun?.startAge ?? 0,

    // ==================== 流年流月 ====================
    currentLiuNian: formatCurrentLiuNian(baziData.yun),

    // ==================== 神煞信息 ====================
    shenSha: formatShenSha(baziData.shenSha),

    // ==================== 吉神方位 ====================
    directions: formatDirections(baziData.directions),

    // ==================== 节气信息 ====================
    jieQi: formatJieQi(baziData.jieQi),

    // ==================== 星宿信息 ====================
    xingXiu: formatXingXiu(baziData.xingXiu),

    // ==================== 彭祖百忌 ====================
    pengZu: formatPengZu(baziData.pengZu),

    // ==================== 宜忌信息 ====================
    yiJi: formatYiJi(baziData.yiJi),

    // ==================== 其他重要信息 ====================
    gender: gender || '未知',
    shengXiao: baziData.shengXiao,
    taiYuan: baziData.taiYuan,
    mingGong: baziData.mingGong,
    shenGong: baziData.shenGong,
    xun: baziData.xun,
    xunKong: baziData.xunKong,

    // ==================== 农历信息 ====================
    lunarDate: baziData.lunarDate,
    lunarDateStr: `${baziData.lunarDate.yearInChinese}年${baziData.lunarDate.monthInChinese}月${baziData.lunarDate.dayInChinese}${baziData.lunarDate.isLeapMonth ? '（闰月）' : ''}`,

    // ==================== 新增信息 ====================
    // 十二长生
    diShi: formatDiShi(baziData.diShi),
    
    // 九星
    nineStars: formatNineStars(baziData.nineStars),
    
    // 天神
    tianShen: formatTianShen(baziData.tianShen),
    
    // 吉神凶煞
    jiXiong: formatJiXiong(baziData.jiXiong),
    
    // 时辰宜忌
    timeYiJi: formatTimeYiJi(baziData.timeYiJi),
    
    // 冲煞
    chongSha: formatChongSha(baziData.chongSha),
    
    // 胎神
    taiShen: formatTaiShen(baziData.taiShen),
    
    // 四柱旬空
    fourPillarsXunKong: formatFourPillarsXunKong(baziData.fourPillarsXunKong),
    
    // 四柱十神
    fourPillarsShiShen: formatFourPillarsShiShen(baziData.fourPillarsShiShen),
    
    // 命宫身宫纳音
    gongNaYin: formatGongNaYin(baziData.gongNaYin),
    
    // 其他信息
    otherInfo: formatOtherInfo(baziData.otherInfo),

    // ==================== 完整八字数据（JSON格式，供高级分析使用）====================
    fullBaziJson: JSON.stringify(baziData, null, 2),
  };
}

/**
 * 替换模板中的占位符
 */
export function replaceTemplateVariables(template: string, context: TemplateContext): string {
  const variableMap = buildVariableMap(context);
  const placeholderRegex = /\{\{([^}]+)\}\}/g;

  return template.replace(placeholderRegex, (match, path: string) => {
    const trimmedPath = path.trim();
    const value = getNestedValue(variableMap as Record<string, unknown>, trimmedPath);

    if (value === undefined) {
      console.warn(`[Template Engine] Variable not found: ${trimmedPath}`);
      return match;
    }

    return valueToString(value);
  });
}

/**
 * 检查模板中是否还有未替换的占位符
 */
export function findUnreplacedPlaceholders(text: string): string[] {
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  const matches: string[] = [];
  let match;

  while ((match = placeholderRegex.exec(text)) !== null) {
    matches.push(match[1].trim());
  }

  return matches;
}

/**
 * 验证模板变量替换是否完整
 */
export function validateTemplateReplacement(template: string, context: TemplateContext): boolean {
  const result = replaceTemplateVariables(template, context);
  const unreplaced = findUnreplacedPlaceholders(result);
  return unreplaced.length === 0;
}
