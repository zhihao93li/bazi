/**
 * 八字常量定义（精简版）
 * 仅保留前端 UI 组件需要的常量和辅助函数
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
const HEAVENLY_STEMS_MAP = HEAVENLY_STEMS.reduce(
  (acc, stem) => {
    acc[stem.chinese] = stem;
    return acc;
  },
  {}
);

// ============================================================================
// 藏干 (Hidden Stems) - 地支藏干映射
// ============================================================================

const HIDDEN_STEMS_MAP = {
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
// 纳音 (Nayin) - 六十甲子纳音
// ============================================================================

const NAYIN_60 = {
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
// 辅助函数 (Helper Functions)
// ============================================================================

/**
 * 根据地支获取藏干列表
 * @param {string} branchChinese - 地支中文字符
 * @returns {Array} 藏干对象数组
 */
export function getHiddenStems(branchChinese) {
  const hiddenStemChars = HIDDEN_STEMS_MAP[branchChinese] || [];
  return hiddenStemChars
    .map(char => HEAVENLY_STEMS_MAP[char])
    .filter(stem => stem !== undefined);
}

/**
 * 根据干支获取纳音
 * @param {string} ganZhi - 干支字符串（如"甲子"）
 * @returns {string} 纳音名称
 */
export function getNayinByGanZhi(ganZhi) {
  if (!ganZhi || ganZhi.length < 2) return '';
  return NAYIN_60[ganZhi] || '';
}
