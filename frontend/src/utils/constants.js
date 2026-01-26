// 统一使用 city-geo-data.json 作为唯一数据源
import { getProvinces } from './cityDataProcessor';

export const GENDER_OPTIONS = [
  { value: 'female', label: '女' },
  { value: 'male', label: '男' }
];

export const CALENDAR_OPTIONS = [
  { value: 'solar', label: '公历' },
  { value: 'lunar', label: '农历' }
];

// 从完整的 city-geo-data.json 构建省市区三级树结构
// 包含全国27,026个区县的完整数据（含港澳台地区）
export const PROVINCES = getProvinces();
