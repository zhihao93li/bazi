import styles from './GradientBackground.module.css'

// 默认的光效颜色
const DEFAULT_GLOW_COLORS = [
  'rgba(138, 67, 225, 1)',   // Purple
  'rgba(213, 17, 253, 1)',   // Pink
  'rgba(239, 123, 22, 1)',   // Orange
  'rgba(255, 47, 47, 1)',    // Red
]

// 椭圆位置配置
const ELLIPSE_POSITIONS = [
  { top: '207px', left: '0' },
  { top: '363px', left: '37px' },
  { top: '0', left: '213px' },
  { top: '80px', left: '9px' },
]

export default function GradientBackground({
  gridCount = 24,
  showLeftGlow = true,
  showRightGlow = true,
  glowColors = DEFAULT_GLOW_COLORS,
  backgroundColor,
  noiseOpacity,
  noiseUrl = 'https://framerusercontent.com/images/6mcf62RlDfRfU61Yg5vb2pefpi4.png',
  showTopGradient = true,
  showBottomGradient = true,
  animated = false, // New Prop
  expanded = false, // New Prop
  className = '',
  style = {},
}) {
  // 生成栅格线数组
  const gridLines = Array.from({ length: gridCount }, (_, i) => i)
  
  // 渲染椭圆组
  const renderEllipseGroup = (extraStyle = {}) => (
    <div className={styles.ellipseGroup} style={extraStyle}>
      {glowColors.map((color, index) => (
        <div
          key={index}
          className={styles.ellipse}
          style={{
            background: color,
            ...ELLIPSE_POSITIONS[index % ELLIPSE_POSITIONS.length],
          }}
        />
      ))}
    </div>
  )

  return (
    <div
      className={`
        ${styles.background} 
        ${animated ? styles.animated : ''} 
        ${expanded ? styles.expanded : ''} 
        ${className}
      `}
      style={{
        ...(backgroundColor && { backgroundColor }),
        ...style,
      }}
    >
      {/* 左侧光效 */}
      {showLeftGlow && (
        <div className={styles.leftAbstract}>
          {renderEllipseGroup()}
          {renderEllipseGroup()}
        </div>
      )}

      {/* 右侧光效 */}
      {showRightGlow && (
        <div className={styles.rightAbstract}>
          {renderEllipseGroup()}
          {renderEllipseGroup({ transform: 'rotate(-25deg)', top: '20px', left: '-50px' })}
        </div>
      )}

      {/* 垂直栅格线 */}
      <div className={styles.gridLines}>
        {gridLines.map((i) => (
          <div key={i} className={styles.gridLine} />
        ))}
      </div>

      {/* 顶部渐变 */}
      {showTopGradient && <div className={styles.bgGradientTop} />}
      
      {/* 底部渐变 */}
      {showBottomGradient && <div className={styles.bgGradient} />}

      {/* 噪点纹理 */}
      <div
        className={styles.noise}
        style={{
          ...(noiseOpacity !== undefined && { opacity: noiseOpacity }),
          backgroundImage: `url('${noiseUrl}')`,
        }}
      />
    </div>
  )
}

// 导出默认颜色配置，方便外部使用
export { DEFAULT_GLOW_COLORS, ELLIPSE_POSITIONS }
