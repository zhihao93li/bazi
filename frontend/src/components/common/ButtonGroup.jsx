import { useMemo } from 'react'
import styles from './ButtonGroup.module.css'

export default function ButtonGroup({
  options = [],
  value,
  onChange,
  name,
  variant = 'default',
  size = 'medium',
  fullWidth = false,
  className = '',
}) {
  const handleClick = (optionValue) => {
    onChange({ target: { name, value: optionValue } })
  }

  // 计算滑块位置
  const activeIndex = useMemo(() => {
    return options.findIndex(opt => opt.value === value)
  }, [options, value])

  const sliderStyle = useMemo(() => {
    if (activeIndex < 0) return { opacity: 0 }
    const width = 100 / options.length
    return {
      width: `calc(${width}% - 4px)`,
      transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 4}px))`,
      opacity: 1
    }
  }, [activeIndex, options.length])

  return (
    <div 
      className={`
        ${styles.buttonGroup} 
        ${styles[variant]} 
        ${styles[size]}
        ${fullWidth ? styles.fullWidth : ''}
        ${className}
      `}
    >
      {/* 滑动指示器 */}
      <div className={styles.slider} style={sliderStyle} />
      
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`${styles.button} ${value === option.value ? styles.active : ''}`}
          onClick={() => handleClick(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
