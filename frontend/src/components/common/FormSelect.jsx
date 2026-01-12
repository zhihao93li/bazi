import { useState, useRef, useEffect } from 'react'
import { CaretDown } from '@phosphor-icons/react'
import styles from './FormSelect.module.css'

export default function FormSelect({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = '请选择',
  error,
  disabled = false,
  required = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef(null)
  const dropdownRef = useRef(null)
  const selectedRef = useRef(null)

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 打开时滚动到选中项
  useEffect(() => {
    if (isOpen && selectedRef.current && dropdownRef.current) {
      const dropdown = dropdownRef.current
      const selected = selectedRef.current
      // 将选中项滚动到下拉框中间位置
      const scrollTop = selected.offsetTop - dropdown.clientHeight / 2 + selected.clientHeight / 2
      dropdown.scrollTop = Math.max(0, scrollTop)
    }
  }, [isOpen])

  const selectedOption = options.find(opt => opt.value === value)

  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } })
    setIsOpen(false)
  }

  return (
    <div className={`${styles.formGroup} ${error ? styles.hasError : ''} ${className}`} ref={selectRef}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <div 
        className={`${styles.select} ${isOpen ? styles.open : ''} ${disabled ? styles.disabled : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? styles.value : styles.placeholder}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <CaretDown size={18} className={styles.icon} />
      </div>
      
      {isOpen && !disabled && (
        <div className={styles.dropdown} ref={dropdownRef}>
          {options.map((option) => (
            <div
              key={option.value}
              ref={option.value === value ? selectedRef : null}
              className={`${styles.option} ${option.value === value ? styles.selected : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
      
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
