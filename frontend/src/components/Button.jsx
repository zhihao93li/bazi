import { Link } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'
import styles from './Button.module.css'

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  to,
  href,
  onClick,
  showArrow = false,
  className = '',
  ...props 
}) {
  const buttonClass = `${styles.button} ${styles[variant]} ${styles[size]} ${className}`
  
  const content = (
    <>
      {children}
      {showArrow && <ArrowRight size={16} weight="bold" />}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={buttonClass} {...props}>
        {content}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={buttonClass} target="_blank" rel="noopener noreferrer" {...props}>
        {content}
      </a>
    )
  }

  return (
    <button className={buttonClass} onClick={onClick} {...props}>
      {content}
    </button>
  )
}
