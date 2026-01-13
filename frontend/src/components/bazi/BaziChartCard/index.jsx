/**
 * BaziChartCard - 命盘卡片整合组件
 * 
 * 整合：四柱命盘 + 五行分布 + 十步大运
 */

import { useMemo } from 'react';
import Card from '../../common/Card';
import { ELEMENT_COLORS } from '../../../mock/bazi';
import HeaderSection from './components/HeaderSection';
import PillarColumn from './components/PillarColumn';
import styles from './BaziChartCard.module.css';

/**
 * 计算当前大运和流年
 */
function calculateCurrentFortune(yun, birthYear) {
  if (!yun?.daYunList || !birthYear) {
    return { currentDaYun: null, currentLiuNian: null };
  }
  
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthYear;
  
  const currentDaYun = yun.daYunList.find(dy => 
    currentAge >= dy.startAge && currentAge < dy.endAge
  );
  
  let currentLiuNian = null;
  if (currentDaYun?.liuNian && currentDaYun.liuNian.length > 0) {
    currentLiuNian = currentDaYun.liuNian.find(ln => ln.year === currentYear);
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
 * 获取地支藏干
 */
function getHiddenStemsForBranch(branch) {
  if (!branch) return [];
  
  const hiddenStemsMap = {
    '子': [{ chinese: '癸', element: 'water' }],
    '丑': [{ chinese: '己', element: 'earth' }, { chinese: '癸', element: 'water' }, { chinese: '辛', element: 'metal' }],
    '寅': [{ chinese: '甲', element: 'wood' }, { chinese: '丙', element: 'fire' }, { chinese: '戊', element: 'earth' }],
    '卯': [{ chinese: '乙', element: 'wood' }],
    '辰': [{ chinese: '戊', element: 'earth' }, { chinese: '乙', element: 'wood' }, { chinese: '癸', element: 'water' }],
    '巳': [{ chinese: '丙', element: 'fire' }, { chinese: '庚', element: 'metal' }, { chinese: '戊', element: 'earth' }],
    '午': [{ chinese: '丁', element: 'fire' }, { chinese: '己', element: 'earth' }],
    '未': [{ chinese: '己', element: 'earth' }, { chinese: '丁', element: 'fire' }, { chinese: '乙', element: 'wood' }],
    '申': [{ chinese: '庚', element: 'metal' }, { chinese: '壬', element: 'water' }, { chinese: '戊', element: 'earth' }],
    '酉': [{ chinese: '辛', element: 'metal' }],
    '戌': [{ chinese: '戊', element: 'earth' }, { chinese: '辛', element: 'metal' }, { chinese: '丁', element: 'fire' }],
    '亥': [{ chinese: '壬', element: 'water' }, { chinese: '甲', element: 'wood' }],
  };
  
  return hiddenStemsMap[branch] || [];
}

/**
 * 计算纳音
 */
function calculateNaYin(ganZhi) {
  if (!ganZhi) return '';
  
  const naYinMap = {
    '甲子': '海中金', '乙丑': '海中金', '丙寅': '炉中火', '丁卯': '炉中火',
    '戊辰': '大林木', '己巳': '大林木', '庚午': '路旁土', '辛未': '路旁土',
    '壬申': '剑锋金', '癸酉': '剑锋金', '甲戌': '山头火', '乙亥': '山头火',
    '丙子': '涧下水', '丁丑': '涧下水', '戊寅': '城头土', '己卯': '城头土',
    '庚辰': '白蜡金', '辛巳': '白蜡金', '壬午': '杨柳木', '癸未': '杨柳木',
    '甲申': '泉中水', '乙酉': '泉中水', '丙戌': '屋上土', '丁亥': '屋上土',
    '戊子': '霹雳火', '己丑': '霹雳火', '庚寅': '松柏木', '辛卯': '松柏木',
    '壬辰': '长流水', '癸巳': '长流水', '甲午': '砂中金', '乙未': '砂中金',
    '丙申': '山下火', '丁酉': '山下火', '戊戌': '平地木', '己亥': '平地木',
    '庚子': '壁上土', '辛丑': '壁上土', '壬寅': '金箔金', '癸卯': '金箔金',
    '甲辰': '覆灯火', '乙巳': '覆灯火', '丙午': '天河水', '丁未': '天河水',
    '戊申': '大驿土', '己酉': '大驿土', '庚戌': '钗钏金', '辛亥': '钗钏金',
    '壬子': '桑柘木', '癸丑': '桑柘木', '甲寅': '大溪水', '乙卯': '大溪水',
    '丙辰': '沙中土', '丁巳': '沙中土', '戊午': '天上火', '己未': '天上火',
    '庚申': '石榴木', '辛酉': '石榴木', '壬戌': '大海水', '癸亥': '大海水',
  };
  
  return naYinMap[ganZhi] || '';
}

/**
 * 五行分布环状图组件
 */
function FiveElementsRing({ fiveElements }) {
  if (!fiveElements) return null;
  
  const distribution = fiveElements.distribution || fiveElements;
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  
  const elements = [
    { key: 'wood', label: '木', value: distribution.wood },
    { key: 'fire', label: '火', value: distribution.fire },
    { key: 'earth', label: '土', value: distribution.earth },
    { key: 'metal', label: '金', value: distribution.metal },
    { key: 'water', label: '水', value: distribution.water },
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
              <span className={styles.legendValue}>{el.value}</span>
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
  
  const currentYear = new Date().getFullYear();
  const currentAge = birthYear ? currentYear - birthYear : 0;
  
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
  if (!data?.fourPillars) return null;

  const { fourPillars, fourPillarsShiShen, fourPillarsXunKong, fiveElements, yun } = data;
  const dayStem = fourPillars.day.heavenlyStem;
  
  const { currentDaYun, currentLiuNian } = useMemo(() => {
    return calculateCurrentFortune(yun, subject?.birthYear);
  }, [yun, subject?.birthYear]);
  
  const daYunParsed = useMemo(() => {
    if (!currentDaYun) return null;
    const { stem, branch } = parseGanZhi(currentDaYun.ganZhi);
    return {
      stem, branch,
      hiddenStems: getHiddenStemsForBranch(branch?.chinese),
      naYin: calculateNaYin(currentDaYun.ganZhi),
      isKongWang: currentDaYun.xunKong?.includes(branch?.chinese),
    };
  }, [currentDaYun]);
  
  const liuNianParsed = useMemo(() => {
    if (!currentLiuNian) return null;
    const { stem, branch } = parseGanZhi(currentLiuNian.ganZhi);
    return {
      stem, branch,
      hiddenStems: getHiddenStemsForBranch(branch?.chinese),
      naYin: calculateNaYin(currentLiuNian.ganZhi),
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
            dayStem={dayStem} shiShenGan="日元" shiShenZhi={fourPillarsShiShen?.dayZhi}
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

      {/* 五行分布 */}
      <FiveElementsRing fiveElements={fiveElements} />
      
      {/* 十步大运 */}
      <DaYunTimelineInline yun={yun} birthYear={subject?.birthYear} />
    </Card>
  );
}
