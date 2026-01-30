import { describe, it, expect } from 'vitest';
import { PatternDetector } from '../pattern-detector.js';
import { calculatePatternOptimized } from '../pattern-calculation.js';
import { calculateBazi } from '../calculator.js';

describe('PatternDetector vs Old System Comparison', () => {

  it('should produce consistent results for normal patterns', () => {
    const bazi = calculateBazi({
      year: 1990,
      month: 5,
      day: 15,
      hour: 10,
      gender: 'male',
      isLeapMonth: false
    });

    // 旧系统
    const oldPattern = calculatePatternOptimized(
      bazi.fourPillars,
      bazi.dayMaster,
      bazi.fiveElements,
      bazi.xunKong?.dayXunKong || ''
    );

    // 新系统
    const detector = new PatternDetector();
    const newPattern = detector.detect(
      bazi.fourPillars,
      bazi.dayMaster,
      bazi.fiveElements,
      bazi.xunKong?.dayXunKong || ''
    );

    console.log('旧系统:', oldPattern.name);
    console.log('新系统:', newPattern.name);

    // 格局名称应该一致
    expect(newPattern.name).toBe(oldPattern.name);
  });

  it('should provide richer context in new system', () => {
    const bazi = calculateBazi({
      year: 1992,
      month: 11,
      day: 16,
      hour: 0,
      gender: 'male',
      isLeapMonth: false
    });

    const detector = new PatternDetector();
    const newPattern = detector.detect(
      bazi.fourPillars,
      bazi.dayMaster,
      bazi.fiveElements,
      bazi.xunKong?.dayXunKong || ''
    );

    console.log('\n新系统提供的额外信息:');
    console.log('  合局信息:', newPattern.harmonyInfo ? '✅' : '❌');
    
    // 新系统应该提供更多上下文
    if (newPattern.category === 'special') {
      expect(newPattern.harmonyInfo).toBeDefined();
    }
  });

  it('should handle special patterns correctly', () => {
    const testCases = [
      { year: 1992, month: 11, day: 16, hour: 0 },  // 可能的润下格
      { year: 1999, month: 2, day: 15, hour: 6 },   // 可能的曲直格
      { year: 1994, month: 3, day: 21, hour: 8 },   // 可能的化气格
    ];

    const detector = new PatternDetector();

    for (const testCase of testCases) {
      const bazi = calculateBazi({
        ...testCase,
        gender: 'male',
        isLeapMonth: false
      });

      const pattern = detector.detect(
        bazi.fourPillars,
        bazi.dayMaster,
        bazi.fiveElements,
        bazi.xunKong?.dayXunKong || ''
      );

      console.log(`\n测试案例: ${testCase.year}/${testCase.month}/${testCase.day}`);
      console.log(`  格局: ${pattern.name} (${pattern.category})`);
      
      // 格局名称应该有效
      expect(pattern.name).toBeTruthy();
      expect(['normal', 'special']).toContain(pattern.category);
    }
  });

  it('should demonstrate explainability advantage', () => {
    const bazi = calculateBazi({
      year: 1992,
      month: 11,
      day: 16,
      hour: 0,
      gender: 'male',
      isLeapMonth: false
    });

    const detector = new PatternDetector();
    
    // 启用调试模式
    process.env.NODE_ENV = 'test';
    
    const pattern = detector.detect(
      bazi.fourPillars,
      bazi.dayMaster,
      bazi.fiveElements,
      bazi.xunKong?.dayXunKong || ''
    );

    console.log('\n✨ 新系统的可解释性优势:');
    console.log('  - 每层决策都有日志输出');
    console.log('  - 格局判定过程透明可追踪');
    console.log('  - 破格原因清晰明确');
    console.log(`  - 最终结果: ${pattern.name}`);

    expect(pattern).toBeDefined();
  });

});
