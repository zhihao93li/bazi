/**
 * PillarColumn - 单柱组件
 * 用于展示年柱、月柱、日柱、时柱、运柱、流年柱
 * 
 * 包含：柱名、十神标签、天干、地支（含空亡）、藏干十神、纳音
 */

import { ELEMENT_COLORS } from '../../../../mock/bazi';
import styles from '../BaziChartCard.module.css';

/**
 * 根据十神获取对应的样式类
 */
function getShiShenClass(shiShen) {
  if (!shiShen) return '';

  const shiShenMap = {
    '比肩': 'biJian',
    '劫财': 'jieCai',
    '食神': 'shiShen',
    '伤官': 'shangGuan',
    '偏财': 'pianCai',
    '正财': 'zhengCai',
    '七杀': 'qiSha',
    '正官': 'zhengGuan',
    '偏印': 'pianYin',
    '正印': 'zhengYin',
    '日元': 'riYuan',
    '元男': 'riYuan',
    '元女': 'riYuan',
  };

  return styles[shiShenMap[shiShen]] || '';
}

/**
 * 根据天干获取对应十神
 */
function getGanShiShen(dayStem, targetStem) {
  if (!dayStem || !targetStem) return '';
  if (dayStem.chinese === targetStem.chinese) return '日元';

  const dayElement = dayStem.element;
  const dayYinYang = dayStem.yinYang;
  const targetElement = targetStem.element;
  const targetYinYang = targetStem.yinYang;

  // 五行相生相克关系
  const generates = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
  const restricts = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' };

  // 同我
  if (dayElement === targetElement) {
    return dayYinYang === targetYinYang ? '比肩' : '劫财';
  }
  // 我生
  if (generates[dayElement] === targetElement) {
    return dayYinYang === targetYinYang ? '食神' : '伤官';
  }
  // 我克
  if (restricts[dayElement] === targetElement) {
    return dayYinYang === targetYinYang ? '偏财' : '正财';
  }
  // 克我
  if (restricts[targetElement] === dayElement) {
    return dayYinYang === targetYinYang ? '七杀' : '正官';
  }
  // 生我
  if (generates[targetElement] === dayElement) {
    return dayYinYang === targetYinYang ? '偏印' : '正印';
  }

  return '';
}

/**
 * 从纳音名称中提取五行
 */
function getNaYinElement(naYin) {
  if (!naYin) return null;
  if (naYin.includes('金')) return 'metal';
  if (naYin.includes('木')) return 'wood';
  if (naYin.includes('水')) return 'water';
  if (naYin.includes('火')) return 'fire';
  if (naYin.includes('土')) return 'earth';
  return null;
}

export default function PillarColumn({
  title,           // 柱名：年/月/日/时/运/年
  stem,            // 天干对象 { chinese, element, yinYang }
  branch,          // 地支对象 { chinese, element }
  dayStem,         // 日主天干（用于计算十神）
  shiShenGan,      // 天干十神（直接传入）
  shiShenZhi,      // 地支藏干十神数组
  hiddenStems,     // 藏干数组 [{ chinese, element }]
  naYin,           // 纳音
  isKongWang,      // 是否空亡
  isDayPillar,     // 是否是日柱
}) {
  // 计算天干十神（如果未直接传入）
  const ganShiShen = shiShenGan || (isDayPillar ? '日元' : getGanShiShen(dayStem, stem));

  // 纳音五行颜色
  const naYinElement = getNaYinElement(naYin);
  const naYinStyle = naYinElement ? {
    backgroundColor: `${ELEMENT_COLORS[naYinElement]}20`,
    color: ELEMENT_COLORS[naYinElement],
    borderColor: `${ELEMENT_COLORS[naYinElement]}40`,
  } : {};

  return (
    <div className={styles.pillarColumn}>
      {/* 柱名 */}
      <span className={styles.pillarTitle}>{title}</span>

      {/* 十神标签 */}
      <span className={`${styles.shiShenTag} ${getShiShenClass(ganShiShen)}`}>
        {ganShiShen || '-'}
      </span>

      {/* 天干 */}
      <div
        className={styles.ganBox}
        style={{ color: stem ? ELEMENT_COLORS[stem.element] : 'inherit' }}
      >
        {stem?.chinese || '-'}
      </div>

      {/* 地支 + 空亡标记 */}
      <div className={styles.zhiWrapper}>
        <div
          className={styles.zhiBox}
          style={{ color: branch ? ELEMENT_COLORS[branch.element] : 'inherit' }}
        >
          {branch?.chinese || '-'}
        </div>
        {isKongWang && <span className={styles.kongWangMark}>空</span>}
      </div>

      {/* 藏干十神 */}
      <div className={styles.hiddenStemsArea}>
        {hiddenStems && hiddenStems.length > 0 ? (
          hiddenStems.map((hs, idx) => {
            const hsShiShen = shiShenZhi?.[idx] || getGanShiShen(dayStem, hs);
            return (
              <div key={idx} className={styles.hiddenStemRow}>
                <span
                  className={styles.hiddenStemChar}
                  style={{ color: ELEMENT_COLORS[hs.element] }}
                >
                  {hs.chinese}
                </span>
                <span className={`${styles.hiddenStemShiShen} ${getShiShenClass(hsShiShen)}`}>
                  {hsShiShen}
                </span>
              </div>
            );
          })
        ) : (
          <div className={styles.hiddenStemRow}>-</div>
        )}
      </div>

      {/* 纳音标签 - 带五行颜色 */}
      <span className={styles.naYinTag} style={naYinStyle}>{naYin || '-'}</span>
    </div>
  );
}
