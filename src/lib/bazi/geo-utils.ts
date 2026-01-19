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
 * 根据地点字符串获取经度
 * 支持格式: "新疆维吾尔自治区/喀什地区/喀什市" 或 "喀什市"
 */
export function getLongitude(location: string): number {
    if (!location) return DEFAULT_LONGITUDE;

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
