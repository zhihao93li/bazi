/**
 * 城市经纬度工具模块
 * 
 * 使用完整的中国行政区划经纬度数据
 * 数据源: https://github.com/88250/city-geo
 */

import cityGeoData from './city-geo-data.json';
import { DISTRICT_LONGITUDES } from './longitudes.js';

// 构建索引以加速查询
const areaIndex = new Map();    // 区县名 -> 经度
const cityIndex = new Map();    // 城市名 -> 经度
const provinceIndex = new Map(); // 省份名 -> 经度

// 初始化索引
cityGeoData.forEach(item => {
    const lng = parseFloat(item.lng);
    if (isNaN(lng)) return;

    // 省份索引
    if (item.province && !provinceIndex.has(item.province)) {
        provinceIndex.set(item.province, lng);
    }

    // 城市索引（包含"市"的记录）
    if (item.city && !cityIndex.has(item.city)) {
        cityIndex.set(item.city, lng);
    }

    // 区县索引
    if (item.area && !areaIndex.has(item.area)) {
        areaIndex.set(item.area, lng);
    }
});

Object.entries(DISTRICT_LONGITUDES).forEach(([name, lngValue]) => {
    const lng = Number(lngValue);
    if (Number.isNaN(lng)) return;
    if (!areaIndex.has(name)) areaIndex.set(name, lng);
    if (!cityIndex.has(name)) cityIndex.set(name, lng);
    if (!provinceIndex.has(name) && /省$|自治区$|特别行政区$/.test(name)) {
        provinceIndex.set(name, lng);
    }
});

// 默认经度（北京）
const DEFAULT_LONGITUDE = 116.4;

/**
 * 根据地点获取经度
 * @param {string|object} location - 地点字符串或对象
 * @returns {number} 经度
 */
export function getLongitude(location) {
    if (!location) return DEFAULT_LONGITUDE;

    // 如果是对象格式 { province, city, district }
    if (typeof location === 'object' && location !== null) {
        return getLongitudeFromObject(location);
    }

    // 如果是字符串格式
    if (typeof location === 'string') {
        return getLongitudeFromString(location);
    }

    return DEFAULT_LONGITUDE;
}

/**
 * 从对象格式获取经度
 * @param {object} location - { province, city, district }
 * @returns {number} 经度
 */
function getLongitudeFromObject(location) {
    const { province, city, district } = location;

    // 优先使用区县（最精确）
    if (district) {
        const lng = findLongitudeByName(district, 'area');
        if (lng !== DEFAULT_LONGITUDE) return lng;
    }

    // 其次使用城市
    if (city) {
        const lng = findLongitudeByName(city, 'city');
        if (lng !== DEFAULT_LONGITUDE) return lng;
    }

    // 最后使用省份
    if (province) {
        const lng = findLongitudeByName(province, 'province');
        if (lng !== DEFAULT_LONGITUDE) return lng;
    }

    return DEFAULT_LONGITUDE;
}

/**
 * 从字符串格式获取经度
 * 支持格式: "新疆维吾尔自治区/喀什地区/喀什市" 或 "喀什市"
 * @param {string} location - 地点字符串
 * @returns {number} 经度
 */
function getLongitudeFromString(location) {
    // 尝试按 "/" 分割（三级结构）
    const parts = location.split('/');

    if (parts.length >= 3) {
        // 优先使用区县
        const lng = findLongitudeByName(parts[2].trim(), 'area');
        if (lng !== DEFAULT_LONGITUDE) return lng;
    }

    if (parts.length >= 2) {
        // 尝试城市
        const lng = findLongitudeByName(parts[1].trim(), 'city');
        if (lng !== DEFAULT_LONGITUDE) return lng;
    }

    if (parts.length >= 1) {
        // 尝试省份或直接匹配
        const name = parts[0].trim();

        // 尝试作为区县
        let lng = findLongitudeByName(name, 'area');
        if (lng !== DEFAULT_LONGITUDE) return lng;

        // 尝试作为城市
        lng = findLongitudeByName(name, 'city');
        if (lng !== DEFAULT_LONGITUDE) return lng;

        // 尝试作为省份
        lng = findLongitudeByName(name, 'province');
        if (lng !== DEFAULT_LONGITUDE) return lng;
    }

    // 最后尝试模糊匹配
    return fuzzyMatch(location);
}

/**
 * 根据名称查找经度
 * @param {string} name - 地名
 * @param {'province' | 'city' | 'area'} type - 类型
 * @returns {number} 经度
 */
function findLongitudeByName(name, type) {
    if (!name) return DEFAULT_LONGITUDE;

    const index = type === 'province' ? provinceIndex :
        type === 'city' ? cityIndex : areaIndex;

    // 直接匹配
    if (index.has(name)) {
        return index.get(name);
    }

    // 添加常见后缀尝试匹配
    const suffixes = ['市', '区', '县', '地区', '州', '盟'];
    for (const suffix of suffixes) {
        if (!name.endsWith(suffix)) {
            const withSuffix = name + suffix;
            if (index.has(withSuffix)) {
                return index.get(withSuffix);
            }
        }
    }

    // 移除后缀尝试匹配
    for (const suffix of suffixes) {
        if (name.endsWith(suffix)) {
            const withoutSuffix = name.slice(0, -suffix.length);
            if (index.has(withoutSuffix)) {
                return index.get(withoutSuffix);
            }
            // 尝试其他后缀
            for (const otherSuffix of suffixes) {
                if (otherSuffix !== suffix) {
                    const replaced = withoutSuffix + otherSuffix;
                    if (index.has(replaced)) {
                        return index.get(replaced);
                    }
                }
            }
        }
    }

    return DEFAULT_LONGITUDE;
}

/**
 * 模糊匹配
 * @param {string} location - 地点字符串
 * @returns {number} 经度
 */
function fuzzyMatch(location) {
    // 遍历数据查找包含关系
    for (const item of cityGeoData) {
        const lng = parseFloat(item.lng);
        if (isNaN(lng)) continue;

        // 检查区县
        if (item.area && (location.includes(item.area) || item.area.includes(location))) {
            return lng;
        }

        // 检查城市
        if (item.city && (location.includes(item.city) || item.city.includes(location))) {
            return lng;
        }
    }

    return DEFAULT_LONGITUDE;
}

// 导出旧 API 的兼容函数（保持向后兼容）
export { DISTRICT_LONGITUDES };
