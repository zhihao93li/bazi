/**
 * 十二时辰工具函数
 * 用于处理传统中国十二时辰与现代时间的转换
 */

// 十二时辰定义
export const SHICHEN_LIST = [
  { name: '子', label: '子时', range: '23:00-01:00', startHour: 23, midHour: 0, midMinute: 0 },
  { name: '丑', label: '丑时', range: '01:00-03:00', startHour: 1, midHour: 2, midMinute: 0 },
  { name: '寅', label: '寅时', range: '03:00-05:00', startHour: 3, midHour: 4, midMinute: 0 },
  { name: '卯', label: '卯时', range: '05:00-07:00', startHour: 5, midHour: 6, midMinute: 0 },
  { name: '辰', label: '辰时', range: '07:00-09:00', startHour: 7, midHour: 8, midMinute: 0 },
  { name: '巳', label: '巳时', range: '09:00-11:00', startHour: 9, midHour: 10, midMinute: 0 },
  { name: '午', label: '午时', range: '11:00-13:00', startHour: 11, midHour: 12, midMinute: 0 },
  { name: '未', label: '未时', range: '13:00-15:00', startHour: 13, midHour: 14, midMinute: 0 },
  { name: '申', label: '申时', range: '15:00-17:00', startHour: 15, midHour: 16, midMinute: 0 },
  { name: '酉', label: '酉时', range: '17:00-19:00', startHour: 17, midHour: 18, midMinute: 0 },
  { name: '戌', label: '戌时', range: '19:00-21:00', startHour: 19, midHour: 20, midMinute: 0 },
  { name: '亥', label: '亥时', range: '21:00-23:00', startHour: 21, midHour: 22, midMinute: 0 },
];

/**
 * 时辰转小时分钟（取中点时间）
 * @param {string} shichen - 时辰名称（子、丑、寅等）
 * @returns {{ hour: number, minute: number }} 中点时间
 */
export function shichenToHourMinute(shichen) {
  const found = SHICHEN_LIST.find(s => s.name === shichen);
  if (!found) {
    return { hour: 12, minute: 0 }; // 默认返回午时中点
  }
  return { hour: found.midHour, minute: found.midMinute };
}

/**
 * 小时转时辰
 * @param {number} hour - 小时（0-23）
 * @returns {string} 时辰名称
 */
export function hourToShichen(hour) {
  // 处理小时边界
  const h = ((hour % 24) + 24) % 24;

  if (h === 23 || h === 0) return '子';
  if (h >= 1 && h < 3) return '丑';
  if (h >= 3 && h < 5) return '寅';
  if (h >= 5 && h < 7) return '卯';
  if (h >= 7 && h < 9) return '辰';
  if (h >= 9 && h < 11) return '巳';
  if (h >= 11 && h < 13) return '午';
  if (h >= 13 && h < 15) return '未';
  if (h >= 15 && h < 17) return '申';
  if (h >= 17 && h < 19) return '酉';
  if (h >= 19 && h < 21) return '戌';
  if (h >= 21 && h < 23) return '亥';

  return '子'; // 默认
}

/**
 * 获取时辰的标签（如 "子时"）
 * @param {string} shichen - 时辰名称
 * @returns {string} 时辰标签
 */
export function getShichenLabel(shichen) {
  const found = SHICHEN_LIST.find(s => s.name === shichen);
  return found ? found.label : shichen + '时';
}

/**
 * 获取时辰信息
 * @param {string} shichen - 时辰名称
 * @returns {object|null} 时辰信息对象
 */
export function getShichenInfo(shichen) {
  return SHICHEN_LIST.find(s => s.name === shichen) || null;
}
