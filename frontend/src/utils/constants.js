// 直接导入 JSON 文件，避免 CommonJS 全量打包问题（7.3MB → 400KB）
import provincesData from 'province-city-china/dist/province.json';
import citiesData from 'province-city-china/dist/city.json';
import areasData from 'province-city-china/dist/area.json';
import hkMoTwData from '../../../docs/HK-MO-TW.json';

export const CALENDAR_OPTIONS = [
  { value: 'solar', label: '公历' },
  { value: 'lunar', label: '农历' }
];

// Transform data to tree structure for cascading selector
// Structure: { value: name, label: name, cities: [ { value: name, label: name, districts: [...] } ] }

// 直辖市代码（不包括港澳台，它们采用独立的层级结构）
const MUNICIPALITIES = ['11', '12', '31', '50']; // 北京、天津、上海、重庆

const provinceMap = new Map();
const municipalityCityMap = new Map(); // 单独存储直辖市的虚拟城市节点
const provinceNameMap = new Map();

provincesData.forEach(p => {
  // Key by province code (2 digits), e.g. "11" for Beijing
  const provinceNode = { value: p.name, label: p.name, cities: [] };
  provinceMap.set(p.province, provinceNode);
  provinceNameMap.set(p.name, provinceNode);

  // 为直辖市添加一个与省同名的"城市"，用于三级选择
  if (MUNICIPALITIES.includes(p.province)) {
    const cityNode = { value: p.name, label: p.name, districts: [] };
    provinceNode.cities.push(cityNode);
    // 用单独的 Map 存储，避免污染 provinceMap
    municipalityCityMap.set(p.province, cityNode);
  }
});

const cityMap = new Map();
citiesData.forEach(c => {
  const node = { value: c.name, label: c.name, districts: [] };
  // Key by province + city code, e.g. "13" + "01" = "1301"
  const cityKey = c.province + c.city;
  cityMap.set(cityKey, node);
  // Link to province using province code (2 digits)
  const pNode = provinceMap.get(c.province);
  if (pNode) {
    pNode.cities.push(node);
  }
});

areasData.forEach(a => {
  const node = { value: a.name, label: a.name };

  // 直辖市的区县直接关联到虚拟城市
  if (MUNICIPALITIES.includes(a.province)) {
    const municipalityCity = municipalityCityMap.get(a.province);
    if (municipalityCity) {
      municipalityCity.districts.push(node);
    }
  } else {
    // 普通省份：关联到对应城市
    const cityKey = a.province + a.city;
    const cNode = cityMap.get(cityKey);
    if (cNode) {
      cNode.districts.push(node);
    }
  }
});

Object.entries(hkMoTwData).forEach(([provinceName, cities]) => {
  const cityNodes = Object.entries(cities).map(([cityName, districts]) => ({
    value: cityName,
    label: cityName,
    districts: districts.map(name => ({ value: name, label: name }))
  }));

  const existingProvince = provinceNameMap.get(provinceName);
  if (existingProvince) {
    existingProvince.cities = cityNodes;
  } else {
    const provinceNode = { value: provinceName, label: provinceName, cities: cityNodes };
    provinceMap.set(provinceName, provinceNode);
    provinceNameMap.set(provinceName, provinceNode);
  }
});

export const PROVINCES = Array.from(provinceMap.values());
