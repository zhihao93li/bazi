import Card from '../../common/Card';
import { ELEMENT_COLORS } from '../../../mock/bazi';
import styles from './FiveElementsChart.module.css';

export default function FiveElementsChart({ data, className = '' }) {
  if (!data) return null;

  const total = Object.values(data).reduce((a, b) => a + b, 0);
  
  const elements = [
    { key: 'metal', label: '金', value: data.metal },
    { key: 'wood', label: '木', value: data.wood },
    { key: 'water', label: '水', value: data.water },
    { key: 'fire', label: '火', value: data.fire },
    { key: 'earth', label: '土', value: data.earth },
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
