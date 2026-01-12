import Card from '../../common/Card';
import { ELEMENT_COLORS } from '../../../mock/bazi';
import styles from './FiveElementsChart.module.css';

export default function FiveElementsChart({ data, className = '' }) {
  if (!data) return null;

  // Use data.distribution instead of data directly
  const distribution = data.distribution || data; 
  // Fallback to data if it's the old structure (but it shouldn't be with new calculator)
  
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  
  const elements = [
    { key: 'metal', label: '金', value: distribution.metal },
    { key: 'wood', label: '木', value: distribution.wood },
    { key: 'water', label: '水', value: distribution.water },
    { key: 'fire', label: '火', value: distribution.fire },
    { key: 'earth', label: '土', value: distribution.earth },
  ];

  return (
    <Card className={`${styles.container} ${className}`}>
      <div className={styles.header}>五行分布</div>
      
      {/* Visual Bar */}
      <div className={styles.chart}>
        {elements.map((el) => (
          <div
            key={el.key}
            className={styles.segment}
            style={{ 
              width: `${(el.value / total) * 100}%`,
              backgroundColor: ELEMENT_COLORS[el.key]
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {elements.map((el) => (
          <div key={el.key} className={styles.legendItem}>
            <div 
              className={styles.dot} 
              style={{ backgroundColor: ELEMENT_COLORS[el.key] }}
            />
            <span>{el.label}: {el.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
