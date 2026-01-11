import Card from '../../common/Card';
import styles from './BaziInfoCard.module.css';

export default function BaziInfoCard({ data, className = '' }) {
  if (!data) return null;

  return (
    <Card className={className}>
      <div className={styles.infoGrid}>
        <div className={`${styles.item} ${styles.fullWidth}`}>
          <span className={styles.label}>农历</span>
          <span className={styles.value}>{data.lunarDate}</span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>生肖</span>
          <span className={styles.value}>{data.shengXiao}</span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>日主</span>
          <span className={styles.value}>{data.dayMaster}</span>
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
