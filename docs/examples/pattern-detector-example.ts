/**
 * PatternDetector 使用示例
 * 
 * 展示如何使用新的分层架构进行格局判定
 * 
 * 运行方式：
 * ```bash
 * cd /Users/zhihaoli/Documents/项目/bazi
 * npx tsx docs/examples/pattern-detector-example.ts
 * ```
 */

import { PatternDetector } from '../../src/lib/bazi/pattern-detector.js';
import { calculateBazi } from '../../src/lib/bazi/calculator.js';

console.log('🎯 PatternDetector 使用示例\n');
console.log('='.repeat(60));

// 示例1: 润下格案例
console.log('\n📋 示例1: 润下格判定');
console.log('-'.repeat(60));

const case1 = calculateBazi({
  year: 1992,
  month: 11,  // 子月
  day: 16,
  hour: 0,    // 子时
  gender: 'male',
  isLeapMonth: false
});

const detector = new PatternDetector();
const pattern1 = detector.detect(
  case1.fourPillars,
  case1.dayMaster,
  case1.fiveElements,
  case1.xunKong?.dayXunKong || ''
);

console.log('四柱:', [
  case1.fourPillars.year,
  case1.fourPillars.month,
  case1.fourPillars.day,
  case1.fourPillars.hour
].map(p => p.heavenlyStem.chinese + p.earthlyBranch.chinese).join(' '));

console.log('\n格局结果:');
console.log('  名称:', pattern1.name);
console.log('  类别:', pattern1.category);
console.log('  描述:', pattern1.description);

if (pattern1.harmonyInfo) {
  console.log('\n合局信息:');
  console.log('  名称:', pattern1.harmonyInfo.name);
  console.log('  类型:', pattern1.harmonyInfo.type);
  console.log('  元素:', pattern1.harmonyInfo.element);
  console.log('  地支:', pattern1.harmonyInfo.branches.join(' '));
  console.log('  转化率:', pattern1.harmonyInfo.conversionRate);
  console.log('  空亡:', pattern1.harmonyInfo.isVoid ? '是' : '否');
}

// 示例2: 普通格局
console.log('\n\n📋 示例2: 普通格局判定');
console.log('-'.repeat(60));

const case2 = calculateBazi({
  year: 1990,
  month: 5,
  day: 15,
  hour: 10,
  gender: 'male',
  isLeapMonth: false
});

const pattern2 = detector.detect(
  case2.fourPillars,
  case2.dayMaster,
  case2.fiveElements,
  case2.xunKong?.dayXunKong || ''
);

console.log('四柱:', [
  case2.fourPillars.year,
  case2.fourPillars.month,
  case2.fourPillars.day,
  case2.fourPillars.hour
].map(p => p.heavenlyStem.chinese + p.earthlyBranch.chinese).join(' '));

console.log('\n格局结果:');
console.log('  名称:', pattern2.name);
console.log('  类别:', pattern2.category);
console.log('  描述:', pattern2.description);

// 示例3: 调试模式
console.log('\n\n📋 示例3: 调试模式 (查看每层输出)');
console.log('-'.repeat(60));
console.log('提示: 设置 NODE_ENV=test 或 DEBUG_PATTERN=true 查看详细日志');

console.log('\n' + '='.repeat(60));
console.log('✅ 示例完成');
console.log('\n核心优势:');
console.log('  1. 分层架构 - 每层职责清晰');
console.log('  2. 可解释性 - 每步决策可追踪');
console.log('  3. 可扩展性 - 新增格局容易');
console.log('  4. 可测试性 - 每层独立可测');
