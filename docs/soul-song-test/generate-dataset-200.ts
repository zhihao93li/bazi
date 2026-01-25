/**
 * 生成 200 条随机八字测试数据
 *
 * 运行方式：
 *   npx tsx docs/soul-song-test/generate-dataset-200.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { calculateBazi } from '../../src/lib/bazi/calculator.js';
import type { BaziBirthData } from '../../src/lib/bazi/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 五行中文映射
const FIVE_ELEMENTS_CHINESE: Record<string, string> = {
    metal: '金',
    wood: '木',
    water: '水',
    fire: '火',
    earth: '土',
};

// ============================================
// 工具函数：随机生成器
// ============================================

// 读取城市数据
const cityDataPath = path.join(__dirname, '../../src/lib/bazi/city-geo-data.json');
const cityDataRaw = fs.readFileSync(cityDataPath, 'utf-8');
const ALL_CITIES = JSON.parse(cityDataRaw);

// 过滤出有效的城市/区县数据（确保有 province, city, area）
const VALID_LOCATIONS = ALL_CITIES.filter((item: any) =>
    item.province && item.city && item.area && item.lng && item.lat
);

/**
 * 随机获取一个地点
 * 返回格式：省/市/区
 */
function getRandomLocation(): string {
    const item = VALID_LOCATIONS[Math.floor(Math.random() * VALID_LOCATIONS.length)];
    // 按照 Bazi calculator 的偏好，可以返回 "省/市/区" 格式，或者直接 "市/区"
    // 这里为了精确，我们尽量提供完整的层级，虽然 geo-utils 支持模糊匹配，但完整路径更准确
    // src/lib/bazi/geo-utils.ts 里的 getCoordinates 优先匹配 province/city/area
    return `${item.province}/${item.city}/${item.area}`;
}

/**
 * 随机生成出生日期 (1985-2010)
 */
function getRandomDate(startYear: number, endYear: number) {
    const start = new Date(`${startYear}-01-01T00:00:00`).getTime();
    const end = new Date(`${endYear}-12-31T23:59:59`).getTime();
    const randomTime = start + Math.random() * (end - start);
    const date = new Date(randomTime);

    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1, // 1-12
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
    };
}

/**
 * 随机性别
 */
function getRandomGender(): 'male' | 'female' {
    return Math.random() > 0.5 ? 'male' : 'female';
}

// ============================================
// 数据结构定义 (复用自 generate-test-data.ts)
// ============================================

interface BaziMinimal {
    fourPillars: {
        year: string;
        month: string;
        day: string;
        hour: string;
        naYin: {
            year: string;
            month: string;
            day: string;
            hour: string;
        };
    };
    hiddenStems: {
        year: string;
        month: string;
        day: string;
        hour: string;
    };
    dayMaster: {
        stem: string;
        element: string;
        strength: string;
        characteristics: string;
    };
    fiveElements: {
        distribution: string;
        strongest: string;
        weakest: string;
        favorable: string;
        unfavorable: string;
    };
    tenGods: string;
    yun: {
        startAge: number;
        forward: boolean;
        currentDaYun: string | null;
        currentDaYunAge: string | null;
        adjacentDaYun: string[];
        currentLiuNian: string | null;
    };
    shenSha: {
        year: string;
        month: string;
        day: string;
        hour: string;
    };
    shengXiao: string;
    lunarDate: string;
    taiYuan: string;
    mingGong: string;
    shenGong: string;
    xunKong: string;
}

interface GeneratedEntry {
    id: string;
    rawBazi: string; // 方便查看：八字字符串
    birthInfo: {
        year: number;
        month: number;
        day: number;
        hour: number;
        minute: number;
        location: string;
        gender: string;
    };
    baziMinimal: BaziMinimal;
}

function formatTenGods(tenGods: any): string {
    return Object.values(tenGods.gods)
        .map((god: any) => `${god.positions.join('、')}：${god.name}`)
        .join('\n');
}

function buildMinimalBaziData(baziData: any): BaziMinimal {
    const currentYear = new Date().getFullYear();
    const dist = baziData.fiveElements.distribution;

    // 查找当前大运
    let currentDaYunIndex = -1;
    let currentDaYun: { ganZhi: string; startAge: number; endAge: number } | null = null;
    let currentLiuNian: string | null = null;

    if (baziData.yun?.daYunList) {
        for (let i = 0; i < baziData.yun.daYunList.length; i++) {
            const dy = baziData.yun.daYunList[i];
            if (dy.startYear <= currentYear && dy.endYear >= currentYear) {
                currentDaYunIndex = i;
                currentDaYun = { ganZhi: dy.ganZhi, startAge: dy.startAge, endAge: dy.endAge };
                const liuNian = dy.liuNian?.find((ln: any) => ln.year === currentYear);
                if (liuNian) {
                    currentLiuNian = liuNian.ganZhi;
                }
                break;
            }
        }
    }

    // 获取相邻大运
    const adjacentDaYun: string[] = [];
    if (baziData.yun?.daYunList && currentDaYunIndex >= 0) {
        if (currentDaYunIndex > 0) {
            const prev = baziData.yun.daYunList[currentDaYunIndex - 1];
            if (prev.ganZhi) adjacentDaYun.push(`${prev.ganZhi}(${prev.startAge}-${prev.endAge}岁)`);
        }
        if (currentDaYunIndex < baziData.yun.daYunList.length - 1) {
            const next = baziData.yun.daYunList[currentDaYunIndex + 1];
            if (next.ganZhi) adjacentDaYun.push(`${next.ganZhi}(${next.startAge}-${next.endAge}岁)`);
        }
    }

    return {
        fourPillars: {
            year: `${baziData.fourPillars.year.heavenlyStem.chinese}${baziData.fourPillars.year.earthlyBranch.chinese}`,
            month: `${baziData.fourPillars.month.heavenlyStem.chinese}${baziData.fourPillars.month.earthlyBranch.chinese}`,
            day: `${baziData.fourPillars.day.heavenlyStem.chinese}${baziData.fourPillars.day.earthlyBranch.chinese}`,
            hour: `${baziData.fourPillars.hour.heavenlyStem.chinese}${baziData.fourPillars.hour.earthlyBranch.chinese}`,
            naYin: {
                year: baziData.fourPillars.year.naYin,
                month: baziData.fourPillars.month.naYin,
                day: baziData.fourPillars.day.naYin,
                hour: baziData.fourPillars.hour.naYin,
            },
        },
        hiddenStems: {
            year: baziData.fourPillars.year.hiddenStems.map((s: any) => s.chinese).join('、'),
            month: baziData.fourPillars.month.hiddenStems.map((s: any) => s.chinese).join('、'),
            day: baziData.fourPillars.day.hiddenStems.map((s: any) => s.chinese).join('、'),
            hour: baziData.fourPillars.hour.hiddenStems.map((s: any) => s.chinese).join('、'),
        },
        dayMaster: {
            stem: baziData.dayMaster.stem.chinese,
            element: FIVE_ELEMENTS_CHINESE[baziData.dayMaster.stem.element],
            strength: baziData.dayMaster.strength === 'strong' ? '身强' :
                baziData.dayMaster.strength === 'weak' ? '身弱' : '中和',
            characteristics: baziData.dayMaster.characteristics.join('、'),
        },
        fiveElements: {
            distribution: `金${dist.metal} 木${dist.wood} 水${dist.water} 火${dist.fire} 土${dist.earth}`,
            strongest: FIVE_ELEMENTS_CHINESE[baziData.fiveElements.strongest],
            weakest: FIVE_ELEMENTS_CHINESE[baziData.fiveElements.weakest],
            favorable: baziData.fiveElements.favorable.map((e: string) => FIVE_ELEMENTS_CHINESE[e]).join('、'),
            unfavorable: baziData.fiveElements.unfavorable.map((e: string) => FIVE_ELEMENTS_CHINESE[e]).join('、'),
        },
        tenGods: formatTenGods(baziData.tenGods),
        yun: {
            startAge: baziData.yun?.startAge ?? 0,
            forward: baziData.yun?.forward ?? true,
            currentDaYun: currentDaYun?.ganZhi ?? null,
            currentDaYunAge: currentDaYun ? `${currentDaYun.startAge}-${currentDaYun.endAge}岁` : null,
            adjacentDaYun,
            currentLiuNian,
        },
        shenSha: {
            year: baziData.shenSha?.year?.join('、') ?? '',
            month: baziData.shenSha?.month?.join('、') ?? '',
            day: baziData.shenSha?.day?.join('、') ?? '',
            hour: baziData.shenSha?.hour?.join('、') ?? '',
        },
        shengXiao: baziData.shengXiao,
        lunarDate: `${baziData.lunarDate.yearInChinese}年${baziData.lunarDate.monthInChinese}月${baziData.lunarDate.dayInChinese}`,
        taiYuan: baziData.taiYuan,
        mingGong: baziData.mingGong,
        shenGong: baziData.shenGong,
        xunKong: baziData.xunKong,
    };
}

// ============================================
// 主函数
// ============================================

async function main() {
    console.log('========================================');
    console.log('生成 200 条随机八字测试数据');
    console.log('年份范围: 1985 - 2010');
    console.log('地点范围: 中国大陆随机区县');
    console.log('========================================\n');

    const results: GeneratedEntry[] = [];
    const TOTAL_COUNT = 200;

    for (let i = 0; i < TOTAL_COUNT; i++) {
        const idx = String(i + 1).padStart(3, '0');

        // 1. 生成随机基础信息
        const gender = getRandomGender();
        const date = getRandomDate(1985, 2010);
        const location = getRandomLocation();

        // 2. 构造计算请求数据
        const birthData: BaziBirthData = {
            gender,
            calendarType: 'solar', // 默认生成公历
            year: date.year,
            month: date.month,
            day: date.day,
            hour: date.hour,
            minute: date.minute,
            location: location,
            isLeapMonth: false, // 公历无闰月
        };

        try {
            // 3. 计算八字
            const baziData = calculateBazi(birthData);

            // 4. 转换为 Minimal 格式
            const baziMinimal = buildMinimalBaziData(baziData);

            // 构造八字字符串 (年柱月柱日柱时柱)
            const rawBazi = `${baziMinimal.fourPillars.year}${baziMinimal.fourPillars.month}${baziMinimal.fourPillars.day}${baziMinimal.fourPillars.hour}`;

            results.push({
                id: idx,
                rawBazi,
                birthInfo: {
                    ...date,
                    location,
                    gender
                },
                baziMinimal,
            });

            if ((i + 1) % 10 === 0) {
                process.stdout.write(`.`); // 进度条效果
            }

        } catch (error) {
            console.error(`\n[${idx}] 生成失败:`, error);
            i--; // 重试
        }
    }

    console.log('\n\n生成完成，正在保存...');

    // 保存 JSON 文件
    const jsonPath = path.join(__dirname, 'bazi-dataset-200.json');
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf-8');

    console.log(`✅ 已保存 JSON: ${jsonPath}`);
    console.log(`总计: ${results.length} 条数据`);
}

main().catch(console.error);
