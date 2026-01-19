import Card from '../../common/Card';
import { ELEMENT_COLORS } from '../../../mock/bazi';
import styles from './FiveElementsChart.module.css';

/**
 * 环状图组件 - 展示五行分布
 */
export default function FiveElementsChart({ data, className = '' }) {
  if (!data) return null;

  // Use data.distribution for chart proportions
  const distribution = data.distribution || data;
  // Use data.counts for displaying integer counts (天干+本气)
  const counts = data.counts || distribution;
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);

  const elements = [
    { key: 'wood', label: '木', value: distribution.wood, count: counts.wood },
    { key: 'fire', label: '火', value: distribution.fire, count: counts.fire },
    { key: 'earth', label: '土', value: distribution.earth, count: counts.earth },
    { key: 'metal', label: '金', value: distribution.metal, count: counts.metal },
    { key: 'water', label: '水', value: distribution.water, count: counts.water },
  ];

  // SVG 圆环参数
  const size = 160;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // 计算每个扇区
  let accumulatedPercentage = 0;
  const segments = elements.map((el) => {
    const percentage = total > 0 ? el.value / total : 0;
    const dashLength = percentage * circumference;
    
    // 扇区起始位置（占圆周的百分比）
    const startPercentage = accumulatedPercentage;
    // 扇区中点位置
    const midPercentage = startPercentage + percentage / 2;
    
    accumulatedPercentage += percentage;
    
    // 计算标签位置：从顶部（-90度）开始顺时针
    // 角度 = -90 + midPercentage * 360
    const midAngle = (-90 + midPercentage * 360) * (Math.PI / 180);
    const labelRadius = radius; // 标签放在圆环中心线上
    const labelX = center + labelRadius * Math.cos(midAngle);
    const labelY = center + labelRadius * Math.sin(midAngle);
    
    return {
      ...el,
      percentage,
      dashArray: `${dashLength} ${circumference - dashLength}`,
      // dashoffset: 从起点偏移的距离（负值表示顺时针方向）
      dashOffset: -startPercentage * circumference,
      labelX,
      labelY,
      showLabel: percentage >= 0.1, // 只有占比 >= 10% 的扇区才显示标签
    };
  });

  return (
    <Card className={`${styles.container} ${className}`}>
      <div className={styles.header}>五行分布</div>
      
      <div className={styles.mainContent}>
        <div className={styles.chartWrapper}>
          {/* 环状图 SVG */}
          <svg 
            width={size} 
            height={size} 
            viewBox={`0 0 ${size} ${size}`}
            className={styles.ringChart}
          >
            {/* 背景圆环 */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="var(--light-94)"
              strokeWidth={strokeWidth}
            />
            
            {/* 五行扇区 */}
            {segments.map((seg) => (
              <circle
                key={seg.key}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={ELEMENT_COLORS[seg.key]}
                strokeWidth={strokeWidth}
                strokeDasharray={seg.dashArray}
                strokeDashoffset={seg.dashOffset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${center} ${center})`}
                className={styles.segment}
              />
            ))}
            
            {/* 扇区标签 */}
            {segments.map((seg) => seg.showLabel && (
              <text
                key={`label-${seg.key}`}
                x={seg.labelX}
                y={seg.labelY}
                textAnchor="middle"
                dominantBaseline="central"
                className={styles.segmentLabel}
                fill="#fff"
              >
                {seg.label}
              </text>
            ))}
          </svg>
        </div>

        {/* 右侧图例 */}
        <div className={styles.legendSide}>
          {elements.map((el) => {
            const percentage = total > 0 ? ((el.value / total) * 100).toFixed(0) : 0;
            return (
              <div key={el.key} className={styles.legendItem}>
                <div
                  className={styles.dot}
                  style={{ backgroundColor: ELEMENT_COLORS[el.key] }}
                />
                <span className={styles.legendLabel}>{el.label}</span>
                <span className={styles.legendValue}>{el.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 喜忌提示 */}
      {data.favorable && data.unfavorable && (
        <div className={styles.favorableInfo}>
          <div className={styles.favorableItem}>
            <span className={styles.favorableLabel}>喜用</span>
            <span className={styles.favorableValue}>
              {data.favorable.map(el => {
                const labelMap = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };
                return labelMap[el];
              }).join(' ')}
            </span>
          </div>
          <div className={styles.favorableItem}>
            <span className={styles.unfavorableLabel}>忌用</span>
            <span className={styles.unfavorableValue}>
              {data.unfavorable.map(el => {
                const labelMap = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };
                return labelMap[el];
              }).join(' ')}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
