/**
 * HeaderSection - 顶部基础信息区
 * 
 * 展示：姓名、性别（乾造/坤造）、保存状态、出生地点、出生时间、真太阳时
 */

import { MapPin, Calendar, Sun, Check } from '@phosphor-icons/react';
import styles from '../BaziChartCard.module.css';

/**
 * 格式化出生时间
 */
function formatBirthTime(subject) {
  if (!subject) return '';
  
  const year = subject.birthYear;
  const month = subject.birthMonth;
  const day = subject.birthDay;
  const hour = subject.birthHour ?? 0;
  const minute = subject.birthMinute ?? 0;
  
  return `${year}年${month}月${day}日 ${hour}时${minute}分`;
}

/**
 * 格式化真太阳时
 */
function formatTrueSolarTime(hour, minute) {
  if (hour === undefined || hour === null) return null;
  const h = String(hour).padStart(2, '0');
  const m = String(minute || 0).padStart(2, '0');
  return `${h}时${m}分`;
}

/**
 * 从位置信息中提取简短地名
 */
function getShortLocation(location) {
  if (!location) return '';
  
  // 如果是对象格式
  if (typeof location === 'object') {
    // 优先显示城市
    return location.city || location.province || '';
  }
  
  // 如果是字符串格式 "省/市/区"
  if (typeof location === 'string') {
    const parts = location.split('/');
    // 返回城市部分
    return parts[1] || parts[0] || location;
  }
  
  return location;
}

export default function HeaderSection({
  subject,          // 当前对象信息
  trueSolarTime,    // 真太阳时 { hour, minute }
  isSaved,          // 是否已保存
}) {
  const genderLabel = subject?.gender === 'male' ? '乾造(男)' : '坤造(女)';
  const shortLocation = getShortLocation(subject?.location);
  
  return (
    <div className={styles.headerSection}>
      {/* 标题行：命理天象 */}
      <div className={styles.cardTitle}>命理天象</div>
      
      {/* 名字与性别行 */}
      <div className={styles.nameRow}>
        <span className={styles.subjectName}>{subject?.name || '未命名'}</span>
        <span className={styles.genderLabel}>{genderLabel}</span>
        {isSaved && (
          <span className={styles.savedBadge}>
            <Check size={12} weight="bold" />
            已保存
          </span>
        )}
      </div>
      
      {/* 出生信息行 */}
      <div className={styles.birthInfoRow}>
        {/* 地点 */}
        {shortLocation && (
          <span className={styles.infoItem}>
            <MapPin size={14} weight="fill" className={styles.infoIcon} />
            {shortLocation}
          </span>
        )}
        
        {/* 出生时间（北京时间） */}
        <span className={styles.infoItem}>
          <Calendar size={14} weight="fill" className={styles.infoIcon} />
          {formatBirthTime(subject)}
        </span>
        
        {/* 真太阳时 */}
        {trueSolarTime && (
          <span className={styles.infoItem}>
            <Sun size={14} weight="fill" className={styles.infoIcon} />
            真太阳时 {formatTrueSolarTime(trueSolarTime.hour, trueSolarTime.minute)}
          </span>
        )}
      </div>
    </div>
  );
}
