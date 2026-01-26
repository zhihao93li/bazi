/**
 * 城市地理数据处理工具
 * 从完整的 city-geo-data.json 构建省/市/区三级树结构
 */

import cityGeoData from '../../../src/lib/bazi/city-geo-data.json';

/**
 * 构建省市区三级树结构
 * @returns {Array} 符合级联选择器格式的省份数组
 */
export function buildProvinceTree() {
  const provinceMap = new Map();
  
  cityGeoData.forEach(item => {
    const { province, city, area } = item;
    
    // 获取或创建省份节点
    if (!provinceMap.has(province)) {
      provinceMap.set(province, {
        value: province,
        label: province,
        cities: new Map()
      });
    }
    
    const provinceNode = provinceMap.get(province);
    
    // 获取或创建城市节点
    if (!provinceNode.cities.has(city)) {
      provinceNode.cities.set(city, {
        value: city,
        label: city,
        districts: []
      });
    }
    
    const cityNode = provinceNode.cities.get(city);
    
    // 添加区县（去重）
    if (!cityNode.districts.some(d => d.value === area)) {
      cityNode.districts.push({
        value: area,
        label: area
      });
    }
  });
  
  // 转换 Map 为数组
  return Array.from(provinceMap.values()).map(province => ({
    ...province,
    cities: Array.from(province.cities.values())
  }));
}

/**
 * 获取省市区树结构（缓存优化）
 */
let cachedProvinces = null;

export function getProvinces() {
  if (!cachedProvinces) {
    cachedProvinces = buildProvinceTree();
  }
  return cachedProvinces;
}
