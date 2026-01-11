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
