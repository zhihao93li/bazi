import Card from '../../common/Card';
import styles from './BaziInfoCard.module.css';

export default function BaziInfoCard({ data, className = '' }) {
  if (!data) return null;

  // New structure adaptation
  const lunarStr = data.lunarDate ?
    `${data.lunarDate.yearGanZhi}年 ${data.lunarDate.monthInChinese} ${data.lunarDate.dayInChinese}` :
    data.lunarDateStr; // fallback

  const ELEMENT_CHINESE = { fire: '火', water: '水', wood: '木', metal: '金', earth: '土' };

  let dayMasterStr = '';
  if (data.dayMaster && data.dayMaster.stem) {
    const stem = data.dayMaster.stem.chinese;
    const elem = ELEMENT_CHINESE[data.dayMaster.stem.element];
    dayMasterStr = `${stem}${elem}`;
  } else {
    dayMasterStr = data.dayMasterStr || '';
  }

  return (
    <Card className={className}>
      <div className={styles.infoGrid}>
        <div className={`${styles.item} ${styles.fullWidth}`}>
          <span className={styles.label}>农历</span>
          <span className={styles.value}>{lunarStr}</span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>生肖</span>
          <span className={styles.value}>{data.shengXiao}</span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>日主</span>
          <span className={styles.value}>{dayMasterStr}</span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>胎元</span>
          <span className={styles.value}>{data.taiYuan}</span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>命宫</span>
          <span className={styles.value}>{data.mingGong}</span>
        </div>
      </div>
    </Card>
  );
}
