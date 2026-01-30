// 快速调试脚本 - 检查润下格判定逻辑
import { Lunar } from 'lunar-typescript';

// 1995年8月15日子时
const lunar = Lunar.fromYmd(1995, 8, 15);
const eightChar = lunar.getEightChar();

console.log('🔍 八字信息:');
console.log('年柱:', eightChar.getYearGanZhi());
console.log('月柱:', eightChar.getMonthGanZhi());
console.log('日柱:', eightChar.getDayGanZhi());
console.log('时柱:', eightChar.getTimeGanZhi(0)); // 子时

const yearBranch = eightChar.getYearZhi();
const monthBranch = eightChar.getMonthZhi();
const dayBranch = eightChar.getDayZhi();
const hourBranch = eightChar.getTimeZhi(0);

console.log('\n地支:', yearBranch, monthBranch, dayBranch, hourBranch);

// 检查是否有申子辰
const branches = [yearBranch, monthBranch, dayBranch, hourBranch];
const hasShen = branches.includes('申');
const hasZi = branches.includes('子');
const hasChen = branches.includes('辰');

console.log('\n三合局检查:');
console.log('  申:', hasShen);
console.log('  子:', hasZi);
console.log('  辰:', hasChen);
console.log('  ✓ 全三合:', hasShen && hasZi && hasChen);

// 检查日主
const dayStem = eightChar.getDayGan();
console.log('\n日主:', dayStem);

// 手动检查五行
const stemElements = {
  '甲': 'wood', '乙': 'wood',
  '丙': 'fire', '丁': 'fire',
  '戊': 'earth', '己': 'earth',
  '庚': 'metal', '辛': 'metal',
  '壬': 'water', '癸': 'water'
};

const branchElements = {
  '子': 'water', '丑': 'earth', '寅': 'wood',
  '卯': 'wood', '辰': 'earth', '巳': 'fire',
  '午': 'fire', '未': 'earth', '申': 'metal',
  '酉': 'metal', '戌': 'earth', '亥': 'water'
};

console.log('\n五行检查:');
console.log('  日主五行:', stemElements[dayStem]);
console.log('  申:', branchElements['申']);
console.log('  子:', branchElements['子']);  
console.log('  辰:', branchElements['辰']);

if (hasShen && hasZi && hasChen) {
  console.log('\n✅ 申子辰三合水局成立!');
  console.log('   预期: 润下格 (前提: 壬/癸日主 + 无戊己土透出 + 水分>75%)');
}
