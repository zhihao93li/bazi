import Card from '../../common/Card';
import styles from './DaYunTimeline.module.css';

export default function DaYunTimeline({ data, currentAge = 34, className = '' }) {
  if (!data || !Array.isArray(data)) return null;

  return (
    <Card className={className}>
      <div className={styles.container}>
        <div className={styles.timeline}>
          {data.map((yun, index) => {
            // Simple active logic: between startAge and startAge+10
            const isActive = currentAge >= yun.startAge && currentAge < (yun.startAge + 10);
            
            return (
              <div key={index} className={`${styles.node} ${isActive ? styles.active : ''}`}>
                <span className={styles.age}>{yun.startAge}岁</span>
                <div className={styles.circle} />
                <span className={styles.pillars}>{yun.stem}{yun.branch}</span>
                <span className={styles.year}>{yun.startYear}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
