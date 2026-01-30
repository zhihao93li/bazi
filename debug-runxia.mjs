import { calculateBazi } from './src/lib/bazi/calculator.js';

console.log('🔍 Debug: 润下格案例分析\n');

const result = calculateBazi({
  year: 1995,
  month: 8,   // 申月
  day: 15,
  hour: 0,    // 子时
  gender: 'male',
  isLeapMonth: false
});

const branches = [
  result.fourPillars.year.earthlyBranch.chinese,
  result.fourPillars.month.earthlyBranch.chinese,
  result.fourPillars.day.earthlyBranch.chinese,
  result.fourPillars.hour.earthlyBranch.chinese
];

const stems = [
  result.fourPillars.year.heavenlyStem.chinese,
  result.fourPillars.month.heavenlyStem.chinese,
  result.fourPillars.day.heavenlyStem.chinese,
  result.fourPillars.hour.heavenlyStem.chinese
];

console.log('四柱:', ...stems.map((s, i) => s + branches[i]));
console.log('\n天干:', stems.join(' '));
console.log('地支:', branches.join(' '));
console.log('\n日主天干:', result.fourPillars.day.heavenlyStem.chinese);
console.log('日主五行:', result.fourPillars.day.heavenlyStem.element);
console.log('日主分数:', result.dayMaster.analysis?.totalScore);

console.log('\n五行分布(原始):');
Object.entries(result.fiveElements.distribution).forEach(([element, score]) => {
  console.log(`  ${element}: ${score}`);
});

console.log('\n格局判定结果:');
console.log('  名称:', result.pattern.name);
console.log('  类别:', result.pattern.category);
console.log('  描述:', result.pattern.description);

if (result.pattern.harmonyInfo) {
  console.log('\n合局信息:');
  console.log('  名称:', result.pattern.harmonyInfo.name);
  console.log('  类型:', result.pattern.harmonyInfo.type);
  console.log('  元素:', result.pattern.harmonyInfo.element);
  console.log('  地支:', result.pattern.harmonyInfo.branches);
  console.log('  转化率:', result.pattern.harmonyInfo.conversionRate);
  console.log('  空亡:', result.pattern.harmonyInfo.isVoid);
} else {
  console.log('\n❌ 未检测到合局!');
}

// 手动检查三合局条件
const hasShen = branches.includes('申');
const hasZi = branches.includes('子');
const hasChen = branches.includes('辰');

console.log('\n三合局检查:');
console.log('  申:', hasShen);
console.log('  子:', hasZi);
console.log('  辰:', hasChen);
console.log('  全三合:', hasShen && hasZi && hasChen);

// 检查专旺格条件
const isWaterDay = result.fourPillars.day.heavenlyStem.element === 'water';
const hasForbiddenEarth = stems.some(s => s === '戊' || s === '己');

console.log('\n润下格条件检查:');
console.log('  水日主:', isWaterDay);
console.log('  申子辰全:', hasShen && hasZi && hasChen);
console.log('  天干透土:', hasForbiddenEarth);
console.log('  日主分数:', result.dayMaster.analysis?.totalScore);
