/**
 * BaziChartCard - 命盘卡片整合组件
 *
 * 整合：四柱命盘 + 五行分布 + 十步大运
 */

import { useMemo, useState, useEffect } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { Solar } from 'lunar-typescript';
import Card from '../../common/Card';
import { ELEMENT_COLORS } from '../../../mock/bazi';
import { getHiddenStems, getNayinByGanZhi } from '../../../utils/bazi/constants';
import HeaderSection from './components/HeaderSection';
import PillarColumn from './components/PillarColumn';
import styles from './BaziChartCard.module.css';

// 判断是否是小屏幕
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
}

/**
 * 获取当前的命理年份（以立春为界）
 * 立春前属于上一年，立春后属于当年
 */
function getLiuNianYear() {
  const now = new Date();
  const currentYear = now.getFullYear();

  // 获取今年立春的时间
  const solar = Solar.fromYmd(currentYear, 1, 1);
  const lunar = solar.getLunar();
  const jieQi = lunar.getNextJie(); // 获取下一个节（不是气）

  // 遍历找到立春
  let liChunSolar = null;
  let tempLunar = lunar;
  for (let i = 0; i < 15; i++) {
    const nextJie = tempLunar.getNextJie();
    if (nextJie && nextJie.getName() === '立春') {
      liChunSolar = nextJie.getSolar();
      break;
    }
    // 移动到下一个月继续找
    const nextSolar = Solar.fromYmd(currentYear, 1 + i + 1, 1);
    tempLunar = nextSolar.getLunar();
  }

  // 如果找到了立春时间，比较当前日期
  if (liChunSolar) {
    const liChunDate = new Date(
      liChunSolar.getYear(),
      liChunSolar.getMonth() - 1,
      liChunSolar.getDay(),
      liChunSolar.getHour(),
      liChunSolar.getMinute()
    );

    // 如果当前时间在立春之前，则流年为上一年
    if (now < liChunDate) {
      return currentYear - 1;
    }
  }

  return currentYear;
}

/**
 * 计算当前大运和流年
 */
function calculateCurrentFortune(yun, birthYear) {
  if (!yun?.daYunList || !birthYear) {
    return { currentDaYun: null, currentLiuNian: null };
  }

  // 使用以立春为界的命理年份
  const liuNianYear = getLiuNianYear();
  const currentAge = liuNianYear - birthYear;

  const currentDaYun = yun.daYunList.find(dy =>
    currentAge >= dy.startAge && currentAge < dy.endAge
  );

  let currentLiuNian = null;
  if (currentDaYun?.liuNian && currentDaYun.liuNian.length > 0) {
    currentLiuNian = currentDaYun.liuNian.find(ln => ln.year === liuNianYear);
  }

  return { currentDaYun, currentLiuNian };
}

/**
 * 检查地支是否空亡
 */
function isXunKong(pillarType, branch, fourPillarsXunKong) {
  if (!fourPillarsXunKong || !branch) return false;
  const dayXunKong = fourPillarsXunKong.dayXunKong || '';
  return dayXunKong.includes(branch);
}

/**
 * 从干支字符串解析出天干地支对象
 */
function parseGanZhi(ganZhi) {
  if (!ganZhi || ganZhi.length < 2) return { stem: null, branch: null };

  const ganMap = {
    '甲': { chinese: '甲', element: 'wood', yinYang: 'yang' },
    '乙': { chinese: '乙', element: 'wood', yinYang: 'yin' },
    '丙': { chinese: '丙', element: 'fire', yinYang: 'yang' },
    '丁': { chinese: '丁', element: 'fire', yinYang: 'yin' },
    '戊': { chinese: '戊', element: 'earth', yinYang: 'yang' },
    '己': { chinese: '己', element: 'earth', yinYang: 'yin' },
    '庚': { chinese: '庚', element: 'metal', yinYang: 'yang' },
    '辛': { chinese: '辛', element: 'metal', yinYang: 'yin' },
    '壬': { chinese: '壬', element: 'water', yinYang: 'yang' },
    '癸': { chinese: '癸', element: 'water', yinYang: 'yin' },
  };

  const zhiMap = {
    '子': { chinese: '子', element: 'water' },
    '丑': { chinese: '丑', element: 'earth' },
    '寅': { chinese: '寅', element: 'wood' },
    '卯': { chinese: '卯', element: 'wood' },
    '辰': { chinese: '辰', element: 'earth' },
    '巳': { chinese: '巳', element: 'fire' },
    '午': { chinese: '午', element: 'fire' },
    '未': { chinese: '未', element: 'earth' },
    '申': { chinese: '申', element: 'metal' },
    '酉': { chinese: '酉', element: 'metal' },
    '戌': { chinese: '戌', element: 'earth' },
    '亥': { chinese: '亥', element: 'water' },
  };

  return {
    stem: ganMap[ganZhi.charAt(0)] || null,
    branch: zhiMap[ganZhi.charAt(1)] || null,
  };
}

/**
 * 五行分布环状图组件
 */
function FiveElementsRing({ fiveElements }) {
  if (!fiveElements) return null;

  // Use distribution for chart proportions
  const distribution = fiveElements.distribution || fiveElements;
  // Use counts for displaying integer counts (天干+本气)
  const counts = fiveElements.counts || distribution;
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);

  const elements = [
    { key: 'wood', label: '木', value: distribution.wood, count: counts.wood },
    { key: 'fire', label: '火', value: distribution.fire, count: counts.fire },
    { key: 'earth', label: '土', value: distribution.earth, count: counts.earth },
    { key: 'metal', label: '金', value: distribution.metal, count: counts.metal },
    { key: 'water', label: '水', value: distribution.water, count: counts.water },
  ];

  const size = 120;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let accumulatedPercentage = 0;
  const segments = elements.map((el) => {
    const percentage = total > 0 ? el.value / total : 0;
    const dashLength = percentage * circumference;
    const startPercentage = accumulatedPercentage;
    const midPercentage = startPercentage + percentage / 2;
    accumulatedPercentage += percentage;

    const midAngle = (-90 + midPercentage * 360) * (Math.PI / 180);
    const labelX = center + radius * Math.cos(midAngle);
    const labelY = center + radius * Math.sin(midAngle);

    return {
      ...el,
      percentage,
      dashArray: `${dashLength} ${circumference - dashLength}`,
      dashOffset: -startPercentage * circumference,
      labelX,
      labelY,
      showLabel: percentage >= 0.12,
    };
  });

  return (
    <div className={styles.fiveElementsSection}>
      <div className={styles.sectionTitle}>五行</div>
      <div className={styles.fiveElementsContent}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={styles.ringChart}>
          <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--light-94)" strokeWidth={strokeWidth} />
          {segments.map((seg) => (
            <circle
              key={seg.key}
              cx={center} cy={center} r={radius}
              fill="none"
              stroke={ELEMENT_COLORS[seg.key]}
              strokeWidth={strokeWidth}
              strokeDasharray={seg.dashArray}
              strokeDashoffset={seg.dashOffset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${center} ${center})`}
            />
          ))}
          {segments.map((seg) => seg.showLabel && (
            <text
              key={`label-${seg.key}`}
              x={seg.labelX} y={seg.labelY}
              textAnchor="middle" dominantBaseline="central"
              className={styles.ringLabel}
              fill="#fff"
            >
              {seg.label}
            </text>
          ))}
        </svg>
        <div className={styles.fiveElementsLegend}>
          {elements.map((el) => (
            <div key={el.key} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ backgroundColor: ELEMENT_COLORS[el.key] }} />
              <span className={styles.legendLabel}>{el.label}</span>
              <span className={styles.legendValue}>{el.count}</span>
            </div>
          ))}
        </div>
      </div>
      {fiveElements.favorable && fiveElements.unfavorable && (
        <div className={styles.favorableRow}>
          <span className={styles.favorableTag}>
            喜 {fiveElements.favorable.map(e => ({ wood: '木', fire: '火', earth: '土', metal: '金', water: '水' }[e])).join('')}
          </span>
          <span className={styles.unfavorableTag}>
            忌 {fiveElements.unfavorable.map(e => ({ wood: '木', fire: '火', earth: '土', metal: '金', water: '水' }[e])).join('')}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * 十步大运时间轴组件
 */
function DaYunTimelineInline({ yun, birthYear }) {
  if (!yun?.daYunList) return null;

  // 使用以立春为界的命理年份
  const liuNianYear = getLiuNianYear();
  const currentAge = birthYear ? liuNianYear - birthYear : 0;

  return (
    <div className={styles.daYunSection}>
      <div className={styles.sectionTitle}>十步大运</div>
      <div className={styles.daYunTimeline}>
        {yun.daYunList.map((dy, index) => {
          const isActive = currentAge >= dy.startAge && currentAge < dy.endAge;
          return (
            <div key={index} className={`${styles.daYunNode} ${isActive ? styles.daYunActive : ''}`}>
              <span className={styles.daYunAge}>{dy.startAge}岁</span>
              <div className={styles.daYunCircle} />
              <span className={styles.daYunGanZhi}>{dy.gan}{dy.zhi}</span>
              <span className={styles.daYunYear}>{dy.startYear}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function BaziChartCard({
  data,
  subject,
  trueSolarTime,
  isSaved = false,
  className = ''
}) {
  const isMobile = useIsMobile();
  // 小屏幕默认折叠五行和大运部分
  const [isDetailExpanded, setIsDetailExpanded] = useState(!isMobile);

  // 当屏幕尺寸变化时更新折叠状态
  useEffect(() => {
    setIsDetailExpanded(!isMobile);
  }, [isMobile]);

  if (!data?.fourPillars) return null;

  const { fourPillars, fourPillarsShiShen, fourPillarsXunKong, fiveElements, yun, pattern } = data;
  const dayStem = fourPillars.day.heavenlyStem;

  const { currentDaYun, currentLiuNian } = useMemo(() => {
    return calculateCurrentFortune(yun, subject?.birthYear);
  }, [yun, subject?.birthYear]);

  const daYunParsed = useMemo(() => {
    if (!currentDaYun) return null;
    const { stem, branch } = parseGanZhi(currentDaYun.ganZhi);
    return {
      stem, branch,
      hiddenStems: getHiddenStems(branch?.chinese),
      naYin: getNayinByGanZhi(currentDaYun.ganZhi),
      isKongWang: currentDaYun.xunKong?.includes(branch?.chinese),
    };
  }, [currentDaYun]);

  const liuNianParsed = useMemo(() => {
    if (!currentLiuNian) return null;
    const { stem, branch } = parseGanZhi(currentLiuNian.ganZhi);
    return {
      stem, branch,
      hiddenStems: getHiddenStems(branch?.chinese),
      naYin: getNayinByGanZhi(currentLiuNian.ganZhi),
      isKongWang: currentLiuNian.xunKong?.includes(branch?.chinese),
    };
  }, [currentLiuNian]);

  return (
    <Card className={`${styles.card} ${className}`}>
      {/* 顶部基础信息 */}
      <HeaderSection
        subject={subject}
        trueSolarTime={trueSolarTime}
        isSaved={isSaved}
        dayMasterStrength={data.dayMaster?.strength}
        pattern={pattern}
      />

      {/* 六柱区域 */}
      <div className={styles.pillarsContainer}>
        <div className={styles.fourPillarsArea}>
          <PillarColumn title="年" stem={fourPillars.year.heavenlyStem} branch={fourPillars.year.earthlyBranch}
            dayStem={dayStem} shiShenGan={fourPillarsShiShen?.yearGan} shiShenZhi={fourPillarsShiShen?.yearZhi}
            hiddenStems={fourPillars.year.hiddenStems} naYin={fourPillars.year.naYin}
            isKongWang={isXunKong('year', fourPillars.year.earthlyBranch.chinese, fourPillarsXunKong)} />
          <PillarColumn title="月" stem={fourPillars.month.heavenlyStem} branch={fourPillars.month.earthlyBranch}
            dayStem={dayStem} shiShenGan={fourPillarsShiShen?.monthGan} shiShenZhi={fourPillarsShiShen?.monthZhi}
            hiddenStems={fourPillars.month.hiddenStems} naYin={fourPillars.month.naYin}
            isKongWang={isXunKong('month', fourPillars.month.earthlyBranch.chinese, fourPillarsXunKong)} />
          <PillarColumn title="日" stem={fourPillars.day.heavenlyStem} branch={fourPillars.day.earthlyBranch}
            dayStem={dayStem} shiShenGan={subject?.gender === 'male' ? '元男' : '元女'} shiShenZhi={fourPillarsShiShen?.dayZhi}
            hiddenStems={fourPillars.day.hiddenStems} naYin={fourPillars.day.naYin}
            isKongWang={false} isDayPillar />
          <PillarColumn title="时" stem={fourPillars.hour.heavenlyStem} branch={fourPillars.hour.earthlyBranch}
            dayStem={dayStem} shiShenGan={fourPillarsShiShen?.hourGan} shiShenZhi={fourPillarsShiShen?.hourZhi}
            hiddenStems={fourPillars.hour.hiddenStems} naYin={fourPillars.hour.naYin}
            isKongWang={isXunKong('hour', fourPillars.hour.earthlyBranch.chinese, fourPillarsXunKong)} />
        </div>

        <div className={styles.divider} />

        <div className={styles.fortuneArea}>
          {daYunParsed ? (
            <PillarColumn title="运" stem={daYunParsed.stem} branch={daYunParsed.branch}
              dayStem={dayStem} hiddenStems={daYunParsed.hiddenStems} naYin={daYunParsed.naYin}
              isKongWang={daYunParsed.isKongWang} />
          ) : (
            <div className={styles.emptyPillar}><span className={styles.pillarTitle}>运</span><span className={styles.emptyText}>-</span></div>
          )}
          {liuNianParsed ? (
            <PillarColumn title="流年" stem={liuNianParsed.stem} branch={liuNianParsed.branch}
              dayStem={dayStem} hiddenStems={liuNianParsed.hiddenStems} naYin={liuNianParsed.naYin}
              isKongWang={liuNianParsed.isKongWang} />
          ) : (
            <div className={styles.emptyPillar}><span className={styles.pillarTitle}>流年</span><span className={styles.emptyText}>-</span></div>
          )}
        </div>
      </div>

      {/* 小屏幕展开/收起按钮 */}
      {isMobile && (
        <button
          className={styles.expandToggle}
          onClick={() => setIsDetailExpanded(!isDetailExpanded)}
          type="button"
        >
          <span>{isDetailExpanded ? '收起详情' : '展开五行与大运'}</span>
          <CaretDown
            size={16}
            weight="bold"
            className={`${styles.expandIcon} ${isDetailExpanded ? styles.expanded : ''}`}
          />
        </button>
      )}

      {/* 可折叠的详情区域（五行 + 大运） */}
      <div className={`${styles.collapsibleSection} ${isDetailExpanded ? styles.sectionExpanded : ''}`}>
        <div className={styles.collapsibleInner}>
          {/* 五行分布 */}
          <FiveElementsRing fiveElements={fiveElements} />

          {/* 十步大运 */}
          <DaYunTimelineInline yun={yun} birthYear={subject?.birthYear} />
        </div>
      </div>
    </Card>
  );
}
