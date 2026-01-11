import styles from './FormInput.module.css'

export default function FormInput({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
  className = '',
  ...props
}) {
  return (
    <div className={`${styles.formGroup} ${error ? styles.hasError : ''} ${className}`}>
      {label && (
        <label htmlFor={name} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={styles.input}
        {...props}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
