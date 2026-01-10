/**
 * 八字算命常量定义
 * Bazi Fortune Telling Constants
 * 
 * 复用自 https://github.com/zhihao93li/human_design2
 */

import type { FiveElement, HeavenlyStem, EarthlyBranch } from './types';

// ============================================================================
// 天干 (Heavenly Stems) - 十天干
// ============================================================================

export const HEAVENLY_STEMS: HeavenlyStem[] = [
  { chinese: '甲', pinyin: 'jia', element: 'wood', yinYang: 'yang' },
  { chinese: '乙', pinyin: 'yi', element: 'wood', yinYang: 'yin' },
  { chinese: '丙', pinyin: 'bing', element: 'fire', yinYang: 'yang' },
  { chinese: '丁', pinyin: 'ding', element: 'fire', yinYang: 'yin' },
  { chinese: '戊', pinyin: 'wu', element: 'earth', yinYang: 'yang' },
  { chinese: '己', pinyin: 'ji', element: 'earth', yinYang: 'yin' },
  { chinese: '庚', pinyin: 'geng', element: 'metal', yinYang: 'yang' },
  { chinese: '辛', pinyin: 'xin', element: 'metal', yinYang: 'yin' },
  { chinese: '壬', pinyin: 'ren', element: 'water', yinYang: 'yang' },
  { chinese: '癸', pinyin: 'gui', element: 'water', yinYang: 'yin' },
];

// 天干索引映射
export const HEAVENLY_STEMS_MAP: Record<string, HeavenlyStem> = HEAVENLY_STEMS.reduce(
  (acc, stem) => {
    acc[stem.chinese] = stem;
    return acc;
  },
  {} as Record<string, HeavenlyStem>
);

// ============================================================================
// 地支 (Earthly Branches) - 十二地支
// ============================================================================

export const EARTHLY_BRANCHES: EarthlyBranch[] = [
  { chinese: '子', pinyin: 'zi', element: 'water', yinYang: 'yang', animal: '鼠' },
  { chinese: '丑', pinyin: 'chou', element: 'earth', yinYang: 'yin', animal: '牛' },
  { chinese: '寅', pinyin: 'yin', element: 'wood', yinYang: 'yang', animal: '虎' },
  { chinese: '卯', pinyin: 'mao', element: 'wood', yinYang: 'yin', animal: '兔' },
  { chinese: '辰', pinyin: 'chen', element: 'earth', yinYang: 'yang', animal: '龙' },
  { chinese: '巳', pinyin: 'si', element: 'fire', yinYang: 'yin', animal: '蛇' },
  { chinese: '午', pinyin: 'wu', element: 'fire', yinYang: 'yang', animal: '马' },
  { chinese: '未', pinyin: 'wei', element: 'earth', yinYang: 'yin', animal: '羊' },
  { chinese: '申', pinyin: 'shen', element: 'metal', yinYang: 'yang', animal: '猴' },
  { chinese: '酉', pinyin: 'you', element: 'metal', yinYang: 'yin', animal: '鸡' },
  { chinese: '戌', pinyin: 'xu', element: 'earth', yinYang: 'yang', animal: '狗' },
  { chinese: '亥', pinyin: 'hai', element: 'water', yinYang: 'yin', animal: '猪' },
];

// 地支索引映射
export const EARTHLY_BRANCHES_MAP: Record<string, EarthlyBranch> = EARTHLY_BRANCHES.reduce(
  (acc, branch) => {
    acc[branch.chinese] = branch;
    return acc;
  },
  {} as Record<string, EarthlyBranch>
);


// ============================================================================
// 藏干 (Hidden Stems) - 地支藏干映射
// ============================================================================

export const HIDDEN_STEMS_MAP: Record<string, string[]> = {
  '子': ['癸'],
  '丑': ['己', '癸', '辛'],
  '寅': ['甲', '丙', '戊'],
  '卯': ['乙'],
  '辰': ['戊', '乙', '癸'],
  '巳': ['丙', '庚', '戊'],
  '午': ['丁', '己'],
  '未': ['己', '丁', '乙'],
  '申': ['庚', '壬', '戊'],
  '酉': ['辛'],
  '戌': ['戊', '辛', '丁'],
  '亥': ['壬', '甲'],
};

// ============================================================================
// 五行 (Five Elements)
// ============================================================================

export const FIVE_ELEMENTS: FiveElement[] = ['metal', 'wood', 'water', 'fire', 'earth'];

export const FIVE_ELEMENTS_CHINESE: Record<FiveElement, string> = {
  metal: '金',
  wood: '木',
  water: '水',
  fire: '火',
  earth: '土',
};

export const FIVE_ELEMENTS_COLORS: Record<FiveElement, string> = {
  metal: '#D4AF37',
  wood: '#228B22',
  water: '#1E90FF',
  fire: '#DC143C',
  earth: '#8B4513',
};

export const FIVE_ELEMENTS_GENERATION: Record<FiveElement, FiveElement> = {
  wood: 'fire',
  fire: 'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
};

export const FIVE_ELEMENTS_RESTRICTION: Record<FiveElement, FiveElement> = {
  wood: 'earth',
  earth: 'water',
  water: 'fire',
  fire: 'metal',
  metal: 'wood',
};

// ============================================================================
// 十神 (Ten Gods)
// ============================================================================

export const TEN_GODS = [
  '比肩', '劫财', '食神', '伤官', '偏财', 
  '正财', '七杀', '正官', '偏印', '正印',
] as const;

export type TenGod = typeof TEN_GODS[number];

// ============================================================================
// 纳音 (Nayin) - 六十甲子纳音
// ============================================================================

export const NAYIN_60: Record<string, string> = {
  '甲子': '海中金', '乙丑': '海中金',
  '丙寅': '炉中火', '丁卯': '炉中火',
  '戊辰': '大林木', '己巳': '大林木',
  '庚午': '路旁土', '辛未': '路旁土',
  '壬申': '剑锋金', '癸酉': '剑锋金',
  '甲戌': '山头火', '乙亥': '山头火',
  '丙子': '涧下水', '丁丑': '涧下水',
  '戊寅': '城头土', '己卯': '城头土',
  '庚辰': '白蜡金', '辛巳': '白蜡金',
  '壬午': '杨柳木', '癸未': '杨柳木',
  '甲申': '泉中水', '乙酉': '泉中水',
  '丙戌': '屋上土', '丁亥': '屋上土',
  '戊子': '霹雳火', '己丑': '霹雳火',
  '庚寅': '松柏木', '辛卯': '松柏木',
  '壬辰': '长流水', '癸巳': '长流水',
  '甲午': '砂石金', '乙未': '砂石金',
  '丙申': '山下火', '丁酉': '山下火',
  '戊戌': '平地木', '己亥': '平地木',
  '庚子': '壁上土', '辛丑': '壁上土',
  '壬寅': '金箔金', '癸卯': '金箔金',
  '甲辰': '覆灯火', '乙巳': '覆灯火',
  '丙午': '天河水', '丁未': '天河水',
  '戊申': '大驿土', '己酉': '大驿土',
  '庚戌': '钗钏金', '辛亥': '钗钏金',
  '壬子': '桑柘木', '癸丑': '桑柘木',
  '甲寅': '大溪水', '乙卯': '大溪水',
  '丙辰': '沙中土', '丁巳': '沙中土',
  '戊午': '天上火', '己未': '天上火',
  '庚申': '石榴木', '辛酉': '石榴木',
  '壬戌': '大海水', '癸亥': '大海水',
};

// ============================================================================
// 城市经度表 (City Longitudes for True Solar Time)
// ============================================================================

export const CITY_LONGITUDES: Record<string, number> = {
  // 直辖市
  '北京': 116.4, '上海': 121.5, '天津': 117.2, '重庆': 106.5,
  // 省会城市
  '石家庄': 114.5, '太原': 112.5, '呼和浩特': 111.7, '沈阳': 123.4,
  '长春': 125.3, '哈尔滨': 126.6, '南京': 118.8, '杭州': 120.2,
  '合肥': 117.3, '福州': 119.3, '南昌': 115.9, '济南': 117.0,
  '郑州': 113.6, '武汉': 114.3, '长沙': 113.0, '广州': 113.3,
  '南宁': 108.3, '海口': 110.3, '成都': 104.1, '贵阳': 106.7,
  '昆明': 102.7, '拉萨': 91.1, '西安': 108.9, '兰州': 103.8,
  '西宁': 101.8, '银川': 106.3, '乌鲁木齐': 87.6,
  // 其他主要城市
  '深圳': 114.1, '苏州': 120.6, '青岛': 120.4, '大连': 121.6,
  '厦门': 118.1, '宁波': 121.5, '无锡': 120.3, '佛山': 113.1,
  '东莞': 113.8, '温州': 120.7, '香港': 114.2, '澳门': 113.5, '台北': 121.5,
};

// ============================================================================
// 辅助函数 (Helper Functions)
// ============================================================================

export function getHeavenlyStem(chinese: string): HeavenlyStem | undefined {
  return HEAVENLY_STEMS_MAP[chinese];
}

export function getEarthlyBranch(chinese: string): EarthlyBranch | undefined {
  return EARTHLY_BRANCHES_MAP[chinese];
}

export function getHiddenStems(branchChinese: string): HeavenlyStem[] {
  const hiddenStemChars = HIDDEN_STEMS_MAP[branchChinese] || [];
  return hiddenStemChars
    .map(char => getHeavenlyStem(char))
    .filter((stem): stem is HeavenlyStem => stem !== undefined);
}

export function getNayin(stemChinese: string, branchChinese: string): string {
  const ganZhi = stemChinese + branchChinese;
  return NAYIN_60[ganZhi] || '未知';
}

export function getFiveElementColor(element: FiveElement): string {
  return FIVE_ELEMENTS_COLORS[element];
}

export function getFiveElementChinese(element: FiveElement): string {
  return FIVE_ELEMENTS_CHINESE[element];
}
