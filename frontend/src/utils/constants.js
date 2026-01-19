// 直接导入 JSON 文件，避免 CommonJS 全量打包问题（7.3MB → 400KB）
import provincesData from 'province-city-china/dist/province.json';
import citiesData from 'province-city-china/dist/city.json';
import areasData from 'province-city-china/dist/area.json';

export const GENDER_OPTIONS = [
  { value: 'female', label: '女' }
];

export const CALENDAR_OPTIONS = [
  { value: 'solar', label: '公历' },
  { value: 'lunar', label: '农历' }
];

// Transform data to tree structure for cascading selector
// Structure: { value: name, label: name, cities: [ { value: name, label: name, districts: [...] } ] }

// 直辖市代码（包括港澳台特别行政区，采用同样的三级结构）
const MUNICIPALITIES = ['11', '12', '31', '50', '71', '81', '82']; // 北京、天津、上海、重庆、台湾、香港、澳门

const provinceMap = new Map();
const municipalityCityMap = new Map(); // 单独存储直辖市的虚拟城市节点

provincesData.forEach(p => {
  // Key by province code (2 digits), e.g. "11" for Beijing
  const provinceNode = { value: p.name, label: p.name, cities: [] };
  provinceMap.set(p.province, provinceNode);

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

// 手动添加港澳台的区县数据
// 香港特别行政区的18个区
const hkCity = municipalityCityMap.get('81');
if (hkCity) {
  const hkDistricts = [
    '中西区', '湾仔区', '东区', '南区',
    '油尖旺区', '深水埗区', '九龙城区', '黄大仙区', '观塘区',
    '荃湾区', '屯门区', '元朗区', '北区', '大埔区', '西贡区', '沙田区', '葵青区', '离岛区'
  ];
  hkDistricts.forEach(name => {
    hkCity.districts.push({ value: name, label: name });
  });
}

// 澳门特别行政区的8个堂区
const macaoCity = municipalityCityMap.get('82');
if (macaoCity) {
  const macaoDistricts = [
    '花地玛堂区', '圣安多尼堂区', '大堂区', '望德堂区',
    '风顺堂区', '嘉模堂区', '圣方济各堂区', '路氹填海区'
  ];
  macaoDistricts.forEach(name => {
    macaoCity.districts.push({ value: name, label: name });
  });
}

// 台湾省的主要县市区（简化处理，添加主要行政区）
const taiwanCity = municipalityCityMap.get('71');
if (taiwanCity) {
  const taiwanDistricts = [
    '台北市', '新北市', '桃园市', '台中市', '台南市', '高雄市',
    '基隆市', '新竹市', '嘉义市',
    '新竹县', '苗栗县', '彰化县', '南投县', '云林县', '嘉义县',
    '屏东县', '宜兰县', '花莲县', '台东县', '澎湖县', '金门县', '连江县'
  ];
  taiwanDistricts.forEach(name => {
    taiwanCity.districts.push({ value: name, label: name });
  });
}

export const PROVINCES = Array.from(provinceMap.values());
