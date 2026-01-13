import { Check } from '@phosphor-icons/react'
import styles from './Checkbox.module.css'

export default function Checkbox({
  label,
  name,
  checked,
  onChange,
  disabled = false,
  className = '',
}) {
  const handleChange = (e) => {
    // Prevent native label behavior (toggling input) to avoid double events or conflicts
    e.preventDefault();
    e.stopPropagation();
    
    if (!disabled) {
      onChange({ target: { name, checked: !checked } })
    }
  }

  return (
    <label 
      className={`${styles.checkbox} ${disabled ? styles.disabled : ''} ${className}`}
      onClick={handleChange}
    >
      <div className={`${styles.box} ${checked ? styles.checked : ''}`}>
        {checked && <Check size={14} weight="bold" />}
      </div>
      {label && <span className={styles.label}>{label}</span>}
      <input
        type="checkbox"
        name={name}
        checked={!!checked}
        onChange={() => {}} // Controlled component
        disabled={disabled}
        className={styles.input}
      />
    </label>
  )
}
