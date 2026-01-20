/**
 * 城市经纬度工具模块 (后端)
 * 
 * 使用完整的中国行政区划经纬度数据
 * 数据源: https://github.com/88250/city-geo
 */

import cityGeoData from './city-geo-data.json' with { type: 'json' };

interface CityGeoItem {
    area: string;
    city: string;
    province: string;
    lat: string;
    lng: string;
    country: string;
}

// 构建索引以加速查询
const areaIndex = new Map<string, number>();
const cityIndex = new Map<string, number>();
const provinceIndex = new Map<string, number>();

// 默认经度（北京）
const DEFAULT_LONGITUDE = 116.4;

const EXTRA_LONGITUDES: Record<string, number> = {
    '香港特别行政区': 114.2,
    '澳门特别行政区': 113.5,
    '台湾省': 121.5,
    '金门县': 118.3774,
    '金城镇': 118.3774,
    '金湖镇': 118.3774,
    '金沙镇': 118.3774,
    '金宁乡': 118.3774,
    '烈屿乡': 118.3774,
    '乌丘乡': 119.4667,
    '连江县': 119.9272,
    '南竿乡': 119.9272,
    '北竿乡': 119.9272,
    '莒光乡': 119.9272,
    '东引乡': 119.9272,
    '澳门半岛': 113.5429,
    '澳门外岛': 113.5593,
    '嘉模堂区（氹仔）': 113.5593,
    '圣方济各堂区（路环）': 113.5572,
};

// 初始化索引
(cityGeoData as CityGeoItem[]).forEach(item => {
    const lng = parseFloat(item.lng);
    if (isNaN(lng)) return;

    // 省份索引
    if (item.province && !provinceIndex.has(item.province)) {
        provinceIndex.set(item.province, lng);
    }

    // 城市索引
    if (item.city && !cityIndex.has(item.city)) {
        cityIndex.set(item.city, lng);
    }

    // 区县索引
    if (item.area && !areaIndex.has(item.area)) {
        areaIndex.set(item.area, lng);
    }
});

Object.entries(EXTRA_LONGITUDES).forEach(([name, lngValue]) => {
    const lng = Number(lngValue);
    if (Number.isNaN(lng)) return;
    if (!areaIndex.has(name)) areaIndex.set(name, lng);
    if (!cityIndex.has(name)) cityIndex.set(name, lng);
    if (!provinceIndex.has(name) && /省$|自治区$|特别行政区$/.test(name)) {
        provinceIndex.set(name, lng);
    }
});

/**
 * 根据地点字符串获取经纬度
 * 支持格式: "新疆维吾尔自治区/喀什地区/喀什市" 或 "喀什市"
 */
export function getCoordinates(location: string): { lng: number; lat: number } {
    if (!location) return { lng: DEFAULT_LONGITUDE, lat: 39.9 };

    const parts = location.split('/');
    const province = parts[0]?.trim();
    const city = parts[1]?.trim();
    const area = parts[2]?.trim();

    // 优先使用完整的省/市/区进行精确匹配
    if (province && city && area) {
        const coord = findCoordinatesByFullPath(province, city, area);
        if (coord) return coord;
    }

    // 回退：仅按区县名称匹配
    if (area) {
        const coord = findCoordinatesByName(area);
        if (coord) return coord;
    }

    // 尝试城市
    if (city) {
        const coord = findCoordinatesByName(city);
        if (coord) return coord;
    }

    // 尝试省份
    if (province) {
        const coord = findCoordinatesByName(province);
        if (coord) return coord;
    }

    return { lng: DEFAULT_LONGITUDE, lat: 39.9 };
}

/**
 * 根据完整的省/市/区路径精确查找经纬度
 */
function findCoordinatesByFullPath(
    province: string,
    city: string,
    area: string
): { lng: number; lat: number } | null {
    for (const item of cityGeoData as CityGeoItem[]) {
        const lng = parseFloat(item.lng);
        const lat = parseFloat(item.lat);
        if (isNaN(lng) || isNaN(lat)) continue;

        // 精确匹配省/市/区
        if (item.province === province && item.city === city && item.area === area) {
            return { lng, lat };
        }
    }
    return null;
}

/**
 * 根据名称查找经纬度
 */
function findCoordinatesByName(name: string): { lng: number; lat: number } | null {
    if (!name) return null;

    // 检查额外经度（只有经度，返回默认纬度）
    if (EXTRA_LONGITUDES[name]) {
        return { lng: EXTRA_LONGITUDES[name], lat: 22.3 }; // 港澳台默认纬度
    }

    // 遍历数据查找精确匹配
    for (const item of cityGeoData as CityGeoItem[]) {
        const lng = parseFloat(item.lng);
        const lat = parseFloat(item.lat);
        if (isNaN(lng) || isNaN(lat)) continue;

        if (item.area === name || item.city === name || item.province === name) {
            return { lng, lat };
        }
    }

    // 添加常见后缀尝试匹配
    const suffixes = ['市', '区', '县', '地区', '州', '盟'];
    for (const suffix of suffixes) {
        const withSuffix = name.endsWith(suffix) ? name : name + suffix;
        const withoutSuffix = name.endsWith(suffix) ? name.slice(0, -suffix.length) : name;

        for (const item of cityGeoData as CityGeoItem[]) {
            const lng = parseFloat(item.lng);
            const lat = parseFloat(item.lat);
            if (isNaN(lng) || isNaN(lat)) continue;

            if (item.area === withSuffix || item.city === withSuffix ||
                item.area === withoutSuffix || item.city === withoutSuffix) {
                return { lng, lat };
            }
        }
    }

    return null;
}

/**
 * 根据地点字符串获取经度
 * 支持格式: "新疆维吾尔自治区/喀什地区/喀什市" 或 "喀什市"
 */
export function getLongitude(location: string): number {
    if (!location) return DEFAULT_LONGITUDE;

    // 尝试按 "/" 分割（三级结构）
    const parts = location.split('/');
    const province = parts[0]?.trim();
    const city = parts[1]?.trim();
    const area = parts[2]?.trim();

    // 优先使用完整的省/市/区进行精确匹配
    if (province && city && area) {
        const lng = findLongitudeByFullPath(province, city, area);
        if (lng !== DEFAULT_LONGITUDE) return lng;
    }

    // 回退：仅按区县名称匹配
    if (area) {
        const lng = findLongitudeByName(area, 'area');
        if (lng !== DEFAULT_LONGITUDE) return lng;
    }

    // 尝试城市
    if (city) {
        const lng = findLongitudeByName(city, 'city');
        if (lng !== DEFAULT_LONGITUDE) return lng;
    }

    // 尝试省份
    if (province) {
        const lng = findLongitudeByName(province, 'province');
        if (lng !== DEFAULT_LONGITUDE) return lng;
    }

    // 最后尝试模糊匹配
    return fuzzyMatch(location);
}

/**
 * 根据完整的省/市/区路径精确查找经度
 */
function findLongitudeByFullPath(province: string, city: string, area: string): number {
    for (const item of cityGeoData as CityGeoItem[]) {
        const lng = parseFloat(item.lng);
        if (isNaN(lng)) continue;

        // 精确匹配省/市/区
        if (item.province === province && item.city === city && item.area === area) {
            return lng;
        }
    }
    return DEFAULT_LONGITUDE;
}

/**
 * 根据名称查找经度
 */
function findLongitudeByName(name: string, type: 'province' | 'city' | 'area'): number {
    if (!name) return DEFAULT_LONGITUDE;

    const index = type === 'province' ? provinceIndex :
        type === 'city' ? cityIndex : areaIndex;

    // 直接匹配
    if (index.has(name)) {
        return index.get(name)!;
    }

    // 添加常见后缀尝试匹配
    const suffixes = ['市', '区', '县', '地区', '州', '盟'];
    for (const suffix of suffixes) {
        if (!name.endsWith(suffix)) {
            const withSuffix = name + suffix;
            if (index.has(withSuffix)) {
                return index.get(withSuffix)!;
            }
        }
    }

    // 移除后缀尝试匹配
    for (const suffix of suffixes) {
        if (name.endsWith(suffix)) {
            const withoutSuffix = name.slice(0, -suffix.length);
            if (index.has(withoutSuffix)) {
                return index.get(withoutSuffix)!;
            }
            // 尝试其他后缀
            for (const otherSuffix of suffixes) {
                if (otherSuffix !== suffix) {
                    const replaced = withoutSuffix + otherSuffix;
                    if (index.has(replaced)) {
                        return index.get(replaced)!;
                    }
                }
            }
        }
    }

    return DEFAULT_LONGITUDE;
}

/**
 * 模糊匹配
 */
function fuzzyMatch(location: string): number {
    // 遍历数据查找包含关系
    for (const item of cityGeoData as CityGeoItem[]) {
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
