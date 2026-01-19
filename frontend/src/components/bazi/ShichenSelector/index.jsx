import { SHICHEN_LIST } from '../../../utils/bazi/shichen';
import styles from './ShichenSelector.module.css';

/**
 * 十二时辰选择器组件
 */
export default function ShichenSelector({ value = '', onChange, error = '' }) {
  const handleSelect = (shichenName) => {
    onChange(shichenName);
  };

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {SHICHEN_LIST.map((shichen) => (
          <button
            key={shichen.name}
            type="button"
            className={`${styles.shichenButton} ${value === shichen.name ? styles.selected : ''}`}
            onClick={() => handleSelect(shichen.name)}
          >
            <span className={styles.label}>{shichen.label}</span>
            <span className={styles.range}>{shichen.range}</span>
          </button>
        ))}
      </div>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
