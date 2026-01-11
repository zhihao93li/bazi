import { useState, useRef, useEffect } from 'react';
import { CaretDown, Plus, User } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import styles from './SubjectSwitcher.module.css';

// 简单的首字母获取或显示前两个字
const getAvatarText = (name) => name ? name.substring(0, 1) : '';

export default function SubjectSwitcher({
  currentSubject,
  subjects = [],
  onSelect,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (subject) => {
    onSelect(subject);
    setIsOpen(false);
  };

  const handleAddNew = () => {
    setIsOpen(false);
    navigate('/subjects'); // Jump to management page to add
  };

  // If no current subject, show placeholder
  const displaySubject = currentSubject || { name: '选择对象', relationship: '' };

  return (
    <div className={`${styles.switcher} ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <div 
        className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={`${styles.avatar} ${displaySubject.relationship === 'self' ? styles.self : ''}`}>
          {displaySubject.relationship === 'self' ? <User weight="fill" size={14} /> : getAvatarText(displaySubject.name)}
        </div>
        <div className={styles.info}>
          <span className={styles.name}>{displaySubject.name}</span>
          {displaySubject.relationship && (
            <span className={styles.role}>
              {displaySubject.relationship === 'self' ? '本人' : displaySubject.relationship === 'friend' ? '朋友' : '其他'}
            </span>
          )}
        </div>
        <CaretDown size={14} className={styles.chevron} weight="bold" />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.sectionTitle}>切换测算对象</div>
          
          <div className={styles.list}>
            {subjects.map((sub) => (
              <div 
                key={sub.id} 
                className={`${styles.option} ${currentSubject?.id === sub.id ? styles.active : ''}`}
                onClick={() => handleSelect(sub)}
              >
                <div className={`${styles.avatar} ${sub.relationship === 'self' ? styles.self : ''}`}>
                  {sub.relationship === 'self' ? <User weight="fill" size={14} /> : getAvatarText(sub.name)}
                </div>
                <div className={styles.info}>
                  <span className={styles.name}>{sub.name}</span>
                  <span className={styles.role}>
                    {sub.relationship === 'self' ? '本人' : sub.relationship === 'friend' ? '朋友' : '其他'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.addOption} onClick={handleAddNew}>
            <div className={styles.avatar}>
              <Plus size={14} weight="bold" />
            </div>
            <span>添加新对象</span>
          </div>
        </div>
      )}
    </div>
  );
}
