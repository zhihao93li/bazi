import Card from '../../common/Card';
import styles from './DaYunTimeline.module.css';

export default function DaYunTimeline({ data, currentAge = 34, className = '' }) {
  if (!data || !data.daYunList) return null;

  const daYunList = data.daYunList;

  return (
    <Card className={className}>
      <div className={styles.container}>
        <div className={styles.timeline}>
          {daYunList.map((yun, index) => {
            // Simple active logic
            const isActive = currentAge >= yun.startAge && currentAge < (yun.startAge + 10);
            
            return (
              <div key={index} className={`${styles.node} ${isActive ? styles.active : ''}`}>
                <span className={styles.age}>{yun.startAge}岁</span>
                <div className={styles.circle} />
                {/* Use gan/zhi from calculator output */}
                <span className={styles.pillars}>{yun.gan}{yun.zhi}</span>
                <span className={styles.year}>{yun.startYear}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
