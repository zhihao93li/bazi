/**
 * 八字算命常量定义
 * Bazi Fortune Telling Constants
 * 
 * Ported from backend src/lib/bazi/constants.ts
 */

// ============================================================================
// 天干 (Heavenly Stems) - 十天干
// ============================================================================

export const HEAVENLY_STEMS = [
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
export const HEAVENLY_STEMS_MAP = HEAVENLY_STEMS.reduce(
  (acc, stem) => {
    acc[stem.chinese] = stem;
    return acc;
  },
  {}
);

// ============================================================================
// 地支 (Earthly Branches) - 十二地支
// ============================================================================

export const EARTHLY_BRANCHES = [
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
export const EARTHLY_BRANCHES_MAP = EARTHLY_BRANCHES.reduce(
  (acc, branch) => {
    acc[branch.chinese] = branch;
    return acc;
  },
  {}
);


// ============================================================================
// 藏干 (Hidden Stems) - 地支藏干映射
// ============================================================================

export const HIDDEN_STEMS_MAP = {
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

export const FIVE_ELEMENTS = ['metal', 'wood', 'water', 'fire', 'earth'];

export const FIVE_ELEMENTS_CHINESE = {
  metal: '金',
  wood: '木',
  water: '水',
  fire: '火',
  earth: '土',
};

export const FIVE_ELEMENTS_COLORS = {
  metal: '#D4AF37',
  wood: '#228B22',
  water: '#1E90FF',
  fire: '#DC143C',
  earth: '#8B4513',
};

export const FIVE_ELEMENTS_GENERATION = {
  wood: 'fire',
  fire: 'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
};

export const FIVE_ELEMENTS_RESTRICTION = {
  wood: 'earth',
  earth: 'water',
  water: 'fire',
  fire: 'metal',
  metal: 'wood',
};

// 五行相生（反向查找：谁生我）
export const FIVE_ELEMENTS_GENERATED_BY = {
  wood: 'water',  // 水生木
  fire: 'wood',   // 木生火
  earth: 'fire',  // 火生土
  metal: 'earth', // 土生金
  water: 'metal', // 金生水
};

// ============================================================================
// 藏干权重 (Hidden Stem Weights)
// 本气权重较大，中气和余气权重较小
// ============================================================================

export const HIDDEN_STEM_WEIGHTS = {
  '子': [1.0],              // 癸（本气）
  '丑': [0.6, 0.2, 0.2],    // 己（本气）、癸（中气）、辛（余气）
  '寅': [0.6, 0.2, 0.2],    // 甲（本气）、丙（中气）、戊（余气）
  '卯': [1.0],              // 乙（本气）
  '辰': [0.6, 0.2, 0.2],    // 戊（本气）、乙（中气）、癸（余气）
  '巳': [0.6, 0.2, 0.2],    // 丙（本气）、庚（中气）、戊（余气）
  '午': [0.7, 0.3],         // 丁（本气）、己（中气）
  '未': [0.6, 0.2, 0.2],    // 己（本气）、丁（中气）、乙（余气）
  '申': [0.6, 0.2, 0.2],    // 庚（本气）、壬（中气）、戊（余气）
  '酉': [1.0],              // 辛（本气）
  '戌': [0.6, 0.2, 0.2],    // 戊（本气）、辛（中气）、丁（余气）
  '亥': [0.7, 0.3],         // 壬（本气）、甲（中气）
};

// ============================================================================
// 月支当令五行 (Month Branch Ruling Element)
// 每个月支对应的当令（最旺）五行
// ============================================================================

export const MONTH_BRANCH_ELEMENT = {
  '寅': 'wood',   // 正月，木旺
  '卯': 'wood',   // 二月，木旺
  '辰': 'earth',  // 三月，土旺（季月）
  '巳': 'fire',   // 四月，火旺
  '午': 'fire',   // 五月，火旺
  '未': 'earth',  // 六月，土旺（季月）
  '申': 'metal',  // 七月，金旺
  '酉': 'metal',  // 八月，金旺
  '戌': 'earth',  // 九月，土旺（季月）
  '亥': 'water',  // 十月，水旺
  '子': 'water',  // 十一月，水旺
  '丑': 'earth',  // 十二月，土旺（季月）
};

// ============================================================================
// 五行状态权重 (Five Element State Weights)
// 旺、相、休、囚、死
// ============================================================================

export const FIVE_ELEMENT_STATE_WEIGHTS = {
  wang: 1.5,   // 旺 - 当令
  xiang: 1.2,  // 相 - 被当令所生
  xiu: 1.0,    // 休 - 生当令者
  qiu: 0.7,    // 囚 - 克当令者
  si: 0.5,     // 死 - 被当令所克
};

export const FIVE_ELEMENT_STATE_CHINESE = {
  wang: '旺',
  xiang: '相',
  xiu: '休',
  qiu: '囚',
  si: '死',
};

// ============================================================================
// 十神 (Ten Gods)
// ============================================================================

export const TEN_GODS = [
  '比肩', '劫财', '食神', '伤官', '偏财', 
  '正财', '七杀', '正官', '偏印', '正印',
];

// ============================================================================
// 纳音 (Nayin) - 六十甲子纳音
// ============================================================================

export const NAYIN_60 = {
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
// 完整数据（491个区县）已迁移至 longitudes.js
// ============================================================================

// 重新导出新的经纬度数据，保持向后兼容
export { DISTRICT_LONGITUDES as CITY_LONGITUDES, getLongitude } from './longitudes.js';

// ============================================================================
// 辅助函数 (Helper Functions)
// ============================================================================

export function getHeavenlyStem(chinese) {
  return HEAVENLY_STEMS_MAP[chinese];
}

export function getEarthlyBranch(chinese) {
  return EARTHLY_BRANCHES_MAP[chinese];
}

export function getHiddenStems(branchChinese) {
  const hiddenStemChars = HIDDEN_STEMS_MAP[branchChinese] || [];
  return hiddenStemChars
    .map(char => getHeavenlyStem(char))
    .filter(stem => stem !== undefined);
}

export function getNayin(stemChinese, branchChinese) {
  const ganZhi = stemChinese + branchChinese;
  return NAYIN_60[ganZhi] || '未知';
}

export function getNayinByGanZhi(ganZhi) {
  if (!ganZhi || ganZhi.length < 2) return '';
  return NAYIN_60[ganZhi] || '';
}

export function getFiveElementColor(element) {
  return FIVE_ELEMENTS_COLORS[element];
}

export function getFiveElementChinese(element) {
  return FIVE_ELEMENTS_CHINESE[element];
}
