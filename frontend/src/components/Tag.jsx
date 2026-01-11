import styles from './Tag.module.css'

export default function Tag({ 
  children, 
  color = 'default',
  className = '' 
}) {
  return (
    <span className={`${styles.tag} ${styles[color]} ${className}`}>
      {children}
    </span>
  )
}
