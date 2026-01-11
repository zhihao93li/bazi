import styles from './Card.module.css'

export default function Card({
  children,
  variant = 'default',
  padding = 'medium',
  hover = false,
  className = '',
  onClick,
  ...props
}) {
  return (
    <div 
      className={`
        ${styles.card} 
        ${styles[variant]} 
        ${styles[`padding-${padding}`]}
        ${hover ? styles.hover : ''}
        ${onClick ? styles.clickable : ''}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}
