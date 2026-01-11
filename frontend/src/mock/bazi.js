// mock/bazi.js
export const mockBaziResult = {
  // 四柱
  fourPillars: {
    year: { heavenlyStem: '庚', earthlyBranch: '午', heavenlyStemElement: 'metal', earthlyBranchElement: 'fire', tenGods: '正财' },
    month: { heavenlyStem: '壬', earthlyBranch: '午', heavenlyStemElement: 'water', earthlyBranchElement: 'fire', tenGods: '正官' },
    day: { heavenlyStem: '丁', earthlyBranch: '亥', heavenlyStemElement: 'fire', earthlyBranchElement: 'water', tenGods: '日主' },
    hour: { heavenlyStem: '乙', earthlyBranch: '巳', heavenlyStemElement: 'wood', earthlyBranchElement: 'fire', tenGods: '偏印' }
  },
  // 五行分布
  fiveElements: { 
    metal: 20, 
    wood: 15, 
    water: 25, 
    fire: 35, 
    earth: 5 
  },
  // 基础信息
  lunarDate: '庚午年 五月 十五日',
  shengXiao: '马',
  dayMaster: '丁火',
  taiYuan: '癸未',
  mingGong: '甲戌',
  shenGong: '丙子',
  
  // 大运
  daYun: [
    { startAge: 4, stem: '癸', branch: '未', startYear: 1994 },
    { startAge: 14, stem: '甲', branch: '申', startYear: 2004 },
    { startAge: 24, stem: '乙', branch: '酉', startYear: 2014 },
    { startAge: 34, stem: '丙', branch: '戌', startYear: 2024 },
    { startAge: 44, stem: '丁', branch: '亥', startYear: 2034 },
    { startAge: 54, stem: '戊', branch: '子', startYear: 2044 },
    { startAge: 64, stem: '己', branch: '丑', startYear: 2054 },
    { startAge: 74, stem: '庚', branch: '寅', startYear: 2064 }
  ]
};

// 五行颜色映射 - Prismo 风格 (低饱和度/莫兰迪色系)
// 降低了饱和度，使其更接近首页背景的柔和质感
export const ELEMENT_COLORS = {
  metal: '#A0A0A0',     // 金 -> 银灰 (中性)
  wood: '#D49EEB',      // 木 -> 柔和粉紫 (Soft Pink)
  water: '#A48EEB',     // 水 -> 柔和蓝紫 (Soft Purple)
  fire: '#EB8E8E',      // 火 -> 柔和红 (Soft Red)
  earth: '#EBB48E'      // 土 -> 柔和橙 (Soft Orange)
};
