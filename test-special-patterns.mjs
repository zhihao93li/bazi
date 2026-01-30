import { calculateBazi } from './src/lib/bazi/calculator.js';

console.log('🧪 Testing Special Pattern Detection System\n');
console.log('='.repeat(60));

// TC-001: 润下格测试 - 申子辰三合水局
console.log('\n📋 TC-001: 润下格测试 (乙亥 甲申 壬辰 庚子)');
console.log('-'.repeat(60));
try {
  const result1 = calculateBazi({
    year: 1995,
    month: 8,   // 申月
    day: 15,
    hour: 0,    // 子时
    gender: 'male',
    isLeapMonth: false
  });
  
  console.log('✅ 四柱:', 
    result1.fourPillars.year.heavenlyStem.chinese + result1.fourPillars.year.earthlyBranch.chinese,
    result1.fourPillars.month.heavenlyStem.chinese + result1.fourPillars.month.earthlyBranch.chinese,
    result1.fourPillars.day.heavenlyStem.chinese + result1.fourPillars.day.earthlyBranch.chinese,
    result1.fourPillars.hour.heavenlyStem.chinese + result1.fourPillars.hour.earthlyBranch.chinese
  );
  
  console.log('📊 格局:', result1.pattern.name);
  console.log('📂 类别:', result1.pattern.category);
  console.log('📝 描述:', result1.pattern.description);
  console.log('💪 日主分数:', result1.dayMaster.analysis?.totalScore);
  
  if (result1.pattern.harmonyInfo) {
    console.log('🔮 合局信息:', {
      name: result1.pattern.harmonyInfo.name,
      type: result1.pattern.harmonyInfo.type,
      element: result1.pattern.harmonyInfo.element,
      branches: result1.pattern.harmonyInfo.branches,
      conversionRate: result1.pattern.harmonyInfo.conversionRate,
      isVoid: result1.pattern.harmonyInfo.isVoid
    });
  }
  
  // 验证结果
  const pass1 = result1.pattern.name === '润下格' && result1.pattern.category === 'special';
  console.log(pass1 ? '✅ PASS' : '❌ FAIL');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
}

// TC-002: 一票否决测试 - 透土破格
console.log('\n📋 TC-002: 一票否决测试 (透土应破润下格)');
console.log('-'.repeat(60));
try {
  // 尝试找一个戊日或己日的水局案例
  const result2 = calculateBazi({
    year: 1992,  // 壬申年
    month: 11,   // 子月
    day: 18,     // 戊辰日
    hour: 0,
    gender: 'male',
    isLeapMonth: false
  });
  
  const stems = [
    result2.fourPillars.year.heavenlyStem.chinese,
    result2.fourPillars.month.heavenlyStem.chinese,
    result2.fourPillars.day.heavenlyStem.chinese,
    result2.fourPillars.hour.heavenlyStem.chinese
  ];
  
  const branches = [
    result2.fourPillars.year.earthlyBranch.chinese,
    result2.fourPillars.month.earthlyBranch.chinese,
    result2.fourPillars.day.earthlyBranch.chinese,
    result2.fourPillars.hour.earthlyBranch.chinese
  ];
  
  console.log('✅ 四柱:', ...stems.map((s, i) => s + branches[i]));
  console.log('📊 格局:', result2.pattern.name);
  console.log('📂 类别:', result2.pattern.category);
  console.log('🔍 天干:', stems.join(' '));
  console.log('🔍 地支:', branches.join(' '));
  
  const hasEarth = stems.some(s => s === '戊' || s === '己');
  const hasWaterHarmony = branches.includes('申') && branches.includes('子');
  
  if (hasEarth && hasWaterHarmony) {
    const pass2 = result2.pattern.name !== '润下格';
    console.log(pass2 ? '✅ PASS (一票否决生效)' : '❌ FAIL (应该破格)');
  } else {
    console.log('⚠️  SKIP (条件不符)');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
}

// TC-003: 化气格测试
console.log('\n📋 TC-003: 化气格测试 (甲己化土)');
console.log('-'.repeat(60));
try {
  const result3 = calculateBazi({
    year: 1994,  // 甲戌年
    month: 3,    // 辰月
    day: 9,      // 己巳日
    hour: 8,
    gender: 'male',
    isLeapMonth: false
  });
  
  const stems3 = [
    result3.fourPillars.year.heavenlyStem.chinese,
    result3.fourPillars.month.heavenlyStem.chinese,
    result3.fourPillars.day.heavenlyStem.chinese,
    result3.fourPillars.hour.heavenlyStem.chinese
  ];
  
  const branches3 = [
    result3.fourPillars.year.earthlyBranch.chinese,
    result3.fourPillars.month.earthlyBranch.chinese,
    result3.fourPillars.day.earthlyBranch.chinese,
    result3.fourPillars.hour.earthlyBranch.chinese
  ];
  
  console.log('✅ 四柱:', ...stems3.map((s, i) => s + branches3[i]));
  console.log('📊 格局:', result3.pattern.name);
  console.log('📂 类别:', result3.pattern.category);
  
  const hasJiaJiHe = (stems3.includes('甲') && stems3.includes('己'));
  const isEarthMonth = ['辰', '戌', '丑', '未'].includes(result3.fourPillars.month.earthlyBranch.chinese);
  
  if (hasJiaJiHe && isEarthMonth) {
    const pass3 = result3.pattern.name === '甲己化土格';
    console.log(pass3 ? '✅ PASS' : '❌ FAIL (条件符合但未识别)');
  } else {
    console.log('⚠️  SKIP (条件不符: 甲己合=' + hasJiaJiHe + ', 土月=' + isEarthMonth + ')');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
}

// TC-004: 曲直格测试
console.log('\n📋 TC-004: 曲直格测试 (亥卯未三合木局)');
console.log('-'.repeat(60));
try {
  const result4 = calculateBazi({
    year: 1999,  // 己卯年
    month: 2,    // 卯月
    day: 11,     // 甲寅日
    hour: 6,     // 卯时
    gender: 'male',
    isLeapMonth: false
  });
  
  const branches4 = [
    result4.fourPillars.year.earthlyBranch.chinese,
    result4.fourPillars.month.earthlyBranch.chinese,
    result4.fourPillars.day.earthlyBranch.chinese,
    result4.fourPillars.hour.earthlyBranch.chinese
  ];
  
  console.log('✅ 四柱:', 
    result4.fourPillars.year.heavenlyStem.chinese + branches4[0],
    result4.fourPillars.month.heavenlyStem.chinese + branches4[1],
    result4.fourPillars.day.heavenlyStem.chinese + branches4[2],
    result4.fourPillars.hour.heavenlyStem.chinese + branches4[3]
  );
  console.log('📊 格局:', result4.pattern.name);
  console.log('📂 类别:', result4.pattern.category);
  console.log('🌳 日主五行:', result4.fourPillars.day.heavenlyStem.element);
  console.log('🔍 地支:', branches4.join(' '));
  
  if (result4.pattern.harmonyInfo) {
    console.log('🔮 合局:', result4.pattern.harmonyInfo.name);
  }
  
  const isWoodDay = result4.fourPillars.day.heavenlyStem.element === 'wood';
  const hasWoodHarmony = result4.pattern.harmonyInfo?.element === 'wood';
  
  if (isWoodDay && hasWoodHarmony) {
    const pass4 = result4.pattern.name === '曲直格';
    console.log(pass4 ? '✅ PASS' : '❌ FAIL');
  } else {
    console.log('⚠️  条件: 木日主=' + isWoodDay + ', 木局=' + hasWoodHarmony);
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
}

console.log('\n' + '='.repeat(60));
console.log('🏁 测试完成');
