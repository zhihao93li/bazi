/**
 * 生成测试数据脚本
 *
 * 将原始八字字符串转换为 baziMinimal 数据格式
 *
 * 运行方式：
 *   npx tsx docs/soul-song-test/generate-test-data.ts
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
// 原始测试数据
// ============================================
interface RawTestCase {
  bazi: string;           // 八字四柱（用于参考）
  gender: 'male' | 'female';
  calendarType: 'solar' | 'lunar';
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  location: string;
  isLeapMonth?: boolean;
}

const RAW_TEST_CASES: RawTestCase[] = [
  {
    bazi: '壬申癸丑甲寅乙丑',
    gender: 'male',
    calendarType: 'solar',
    year: 1993, month: 2, day: 2, hour: 3, minute: 20,
    location: '湖北荆州',
  },
  {
    bazi: '乙亥甲申壬辰庚子',
    gender: 'female',
    calendarType: 'solar',
    year: 1995, month: 8, day: 28, hour: 23, minute: 17,
    location: '浙江丽水',
  },
  {
    bazi: '丙子癸巳戊辰丁巳',
    gender: 'female',
    calendarType: 'solar',
    year: 1996, month: 5, day: 31, hour: 10, minute: 20,
    location: '浙江杭州',
  },
  {
    bazi: '壬子辛亥乙卯乙酉',
    gender: 'female',
    calendarType: 'lunar',
    year: 1972, month: 10, day: 15, hour: 18, minute: 0,
    location: '浙江丽水',
  },
  {
    bazi: '乙酉甲申庚寅辛巳',
    gender: 'female',
    calendarType: 'solar',
    year: 2005, month: 9, day: 3, hour: 10, minute: 20,
    location: '郑州金水区',
  },
  {
    bazi: '戊申壬戌戊辰壬戌',
    gender: 'male',
    calendarType: 'lunar',
    year: 1968, month: 9, day: 4, hour: 19, minute: 0,
    location: '浙江丽水',
  },
  {
    bazi: '丙子戊戌丁亥丁未',
    gender: 'male',
    calendarType: 'solar',
    year: 1996, month: 10, day: 17, hour: 14, minute: 14,
    location: '杭州',
  },
  {
    bazi: '乙酉辛巳己未庚午',
    gender: 'male',
    calendarType: 'solar',
    year: 2005, month: 6, day: 4, hour: 11, minute: 30,
    location: '浙江丽水',
  },
  {
    bazi: '癸酉戌午丙戌甲午',
    gender: 'female',
    calendarType: 'solar',
    year: 1993, month: 7, day: 4, hour: 12, minute: 15,
    location: '湖北襄阳',
  },
  {
    bazi: '丁丑乙酉壬戌甲辰',
    gender: 'male',
    calendarType: 'solar',
    year: 1997, month: 9, day: 17, hour: 9, minute: 20,
    location: '湖北荆州监利',
  },
  {
    bazi: '戌申乙卯乙亥己卯',
    gender: 'female',
    calendarType: 'solar',
    year: 1968, month: 3, day: 6, hour: 5, minute: 0,
    location: '湖北荆州监利',
  },
  {
    bazi: '庚戌丙戌庚午壬午',
    gender: 'male',
    calendarType: 'solar',
    year: 1970, month: 10, day: 17, hour: 12, minute: 0,
    location: '湖北荆州监利',
  },
];

// ============================================
// 构建 baziMinimal 数据
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

interface TestCaseOutput {
  id: string;
  rawBazi: string;
  gender: string;
  birthInfo: string;
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
  console.log('生成 BaziMinimal 测试数据');
  console.log('========================================\n');

  const results: TestCaseOutput[] = [];

  for (let i = 0; i < RAW_TEST_CASES.length; i++) {
    const raw = RAW_TEST_CASES[i];
    const idx = String(i + 1).padStart(2, '0');

    console.log(`[${idx}] 处理: ${raw.bazi}`);

    try {
      const birthData: BaziBirthData = {
        gender: raw.gender,
        calendarType: raw.calendarType,
        year: raw.year,
        month: raw.month,
        day: raw.day,
        hour: raw.hour,
        minute: raw.minute,
        location: raw.location,
        isLeapMonth: raw.isLeapMonth,
      };

      const baziData = calculateBazi(birthData);
      const baziMinimal = buildMinimalBaziData(baziData);

      const calendarLabel = raw.calendarType === 'solar' ? '公历' : '农历';
      const birthInfo = `${calendarLabel}${raw.year}年${raw.month}月${raw.day}日 ${raw.hour}:${String(raw.minute).padStart(2, '0')} 出生于${raw.location}的${raw.gender === 'male' ? '男' : '女'}性`;

      results.push({
        id: idx,
        rawBazi: raw.bazi,
        gender: raw.gender === 'male' ? '男' : '女',
        birthInfo,
        baziMinimal,
      });

      console.log(`  ✅ 完成: ${baziMinimal.fourPillars.year}${baziMinimal.fourPillars.month}${baziMinimal.fourPillars.day}${baziMinimal.fourPillars.hour}`);

    } catch (error) {
      console.error(`  ❌ 错误:`, error);
    }
  }

  // 保存 JSON 文件
  const jsonPath = path.join(__dirname, 'test-cases.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n✅ 已保存 JSON: ${jsonPath}`);

  // 保存 Markdown 文件（方便查看）
  let mdContent = `# Soul Song 测试数据

生成时间: ${new Date().toLocaleString('zh-CN')}

---

`;

  for (const tc of results) {
    mdContent += `## ${tc.id}. ${tc.rawBazi}

**出生信息**: ${tc.birthInfo}
**性别**: ${tc.gender}

### 八字精简数据

\`\`\`json
${JSON.stringify(tc.baziMinimal, null, 2)}
\`\`\`

---

`;
  }

  const mdPath = path.join(__dirname, 'test-cases.md');
  fs.writeFileSync(mdPath, mdContent, 'utf-8');
  console.log(`✅ 已保存 Markdown: ${mdPath}`);

  console.log('\n========================================');
  console.log(`共生成 ${results.length} 条测试数据`);
  console.log('========================================');
}

main().catch(console.error);
