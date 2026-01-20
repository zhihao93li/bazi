/**
 * HeaderSection - 顶部基础信息区
 *
 * 展示：姓名、性别、保存状态、出生地点、出生时间、真太阳时
 */

import { MapPin, Calendar, Check } from '@phosphor-icons/react';
import styles from '../BaziChartCard.module.css';

/**
 * 格式化出生时间
 * 显示历法类型、闰月信息
 */
function formatBirthTime(subject) {
  if (!subject) return '';

  const year = subject.birthYear;
  const month = subject.birthMonth;
  const day = subject.birthDay;
  const hour = subject.birthHour ?? 0;
  const minute = subject.birthMinute ?? 0;

  // 历法标识
  const calendarLabel = subject.calendarType === 'lunar' ? '农历' : '公历';

  // 月份显示（农历闰月显示"闰X月"）
  const monthStr = subject.isLeapMonth ? `闰${month}月` : `${month}月`;

  return `${calendarLabel} ${year}年${monthStr}${day}日 ${hour}时${minute}分`;
}

/**
 * 格式化真太阳时
 */
function formatTrueSolarTime(trueSolarTime) {
  if (!trueSolarTime || trueSolarTime.hour === undefined || trueSolarTime.hour === null) return null;

  const year = trueSolarTime.year;
  const month = trueSolarTime.month;
  const day = trueSolarTime.day;
  const h = String(trueSolarTime.hour).padStart(2, '0');
  const m = String(trueSolarTime.minute || 0).padStart(2, '0');

  return `${year}年${month}月${day}日 ${h}时${m}分`;
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
  dayMasterStrength, // 日主强弱: 'strong' | 'weak' | 'balanced'
  pattern,          // 格局信息: { name, category, description }
}) {
  const genderLabel = subject?.gender === 'male' ? '男' : '女';
  const shortLocation = getShortLocation(subject?.location);

  // 身强弱中文映射
  const STRENGTH_TEXT = { strong: '身强', weak: '身弱', balanced: '中和' };
  const strengthText = dayMasterStrength ? STRENGTH_TEXT[dayMasterStrength] : null;

  return (
    <div className={styles.headerSection}>
      {/* 名字与性别行 */}
      <div className={styles.nameRow}>
        <span className={styles.subjectName}>{subject?.name || '未命名'}</span>
        <span className={styles.genderLabel}>{genderLabel}</span>
        {strengthText && (
          <span className={styles.strengthBadge} data-strength={dayMasterStrength}>
            {strengthText}
          </span>
        )}
        {pattern?.name && (
          <span className={styles.patternBadge} data-category={pattern.category}>
            {pattern.name}
          </span>
        )}
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

        {/* 出生时间（北京时间）+ 真太阳时 */}
        <span className={styles.infoItem}>
          <Calendar size={14} weight="fill" className={styles.infoIcon} />
          {formatBirthTime(subject)}
          {trueSolarTime && (
            <span className={styles.trueSolarTime}>
              （真太阳时 {formatTrueSolarTime(trueSolarTime)}）
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
