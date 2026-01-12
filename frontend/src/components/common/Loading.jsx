import { CircleNotch } from '@phosphor-icons/react';
import styles from './Loading.module.css';

export function LoadingSpinner({ size = 'medium', color = 'default', className = '' }) {
  return (
    <CircleNotch 
      className={`${styles.spinner} ${styles[size]} ${styles[color]} ${className}`} 
      weight="bold" 
    />
  );
}

export function LoadingOverlay({ text, fixed = false, className = '' }) {
  return (
    <div className={`${styles.overlay} ${fixed ? styles.fixed : ''} ${className}`}>
      <LoadingSpinner size="large" color="purple" />
      {text && <span className={styles.text}>{text}</span>}
    </div>
  );
}
