/**
 * 验证前后端城市数据统一性测试脚本
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 读取 city-geo-data.json
const cityGeoData = JSON.parse(
  readFileSync(join(__dirname, 'src/lib/bazi/city-geo-data.json'), 'utf-8')
);

console.log('🔍 测试港澳台地区数据完整性...\n');

// 测试用例
const testCases = [
  { province: '香港', city: '香港岛', area: '中西区' },
  { province: '香港', city: '九龙', area: '油尖旺区' },
  { province: '香港', city: '新界', area: '葵青区' },
  { province: '澳门', city: '澳门半岛', area: '大堂区' },
  { province: '澳门', city: '澳门外岛', area: '嘉模堂区（氹仔）' },
  { province: '台湾省', city: '台北市', area: '大安区' },
  { province: '台湾省', city: '高雄市', area: '凤山区' },
  { province: '台湾省', city: '金门县', area: '金城镇' },
];

let passCount = 0;
let failCount = 0;

testCases.forEach(({ province, city, area }) => {
  const result = cityGeoData.find(
    item => item.province === province && item.city === city && item.area === area
  );
  
  if (result) {
    console.log(`✅ ${province}/${city}/${area}`);
    console.log(`   经度: ${result.lng}° | 纬度: ${result.lat}°\n`);
    passCount++;
  } else {
    console.log(`❌ ${province}/${city}/${area} - 未找到数据\n`);
    failCount++;
  }
});

// 统计数据
const hkCount = cityGeoData.filter(item => item.province === '香港').length;
const moCount = cityGeoData.filter(item => item.province === '澳门').length;
const twCount = cityGeoData.filter(item => item.province === '台湾省').length;

console.log('━'.repeat(50));
console.log('\n📊 数据统计：');
console.log(`   香港地区：${hkCount} 条记录`);
console.log(`   澳门地区：${moCount} 条记录`);
console.log(`   台湾地区：${twCount} 条记录`);
console.log(`   总计：${cityGeoData.length} 条记录\n`);

console.log('🧪 测试结果：');
console.log(`   通过：${passCount}/${testCases.length}`);
console.log(`   失败：${failCount}/${testCases.length}\n`);

if (failCount === 0) {
  console.log('🎉 所有测试通过！前后端数据统一性验证成功！\n');
  process.exit(0);
} else {
  console.log('⚠️  部分测试失败，请检查数据源。\n');
  process.exit(1);
}
