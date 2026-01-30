// 寻找符合申子辰三合水局的日期
import { Lunar } from 'lunar-typescript';

console.log('🔍 搜索符合条件的八字\n');
console.log('条件: 申子辰三合水局 + 壬/癸日主 + 无戊己土透\n');

let count = 0;

// 搜索1990-2000年间的日期
for (let year = 1990; year <= 2000; year++) {
  for (let month = 1; month <= 12; month++) {
    for (let day = 1; day <= 28; day++) {
      try {
        const lunar = Lunar.fromYmd(year, month, day);
        const ec = lunar.getEightChar();
        
        // 获取子时的八字
        const branches = [
          ec.getYearZhi(),
          ec.getMonthZhi(),
          ec.getDayZhi(),
          ec.getTimeZhi(0) // 子时
        ];
        
        const stems = [
          ec.getYearGan(),
          ec.getMonthGan(),
          ec.getDayGan(),
          ec.getTimeGan(0)
        ];
        
        // 检查申子辰
        const hasShen = branches.includes('申');
        const hasZi = branches.includes('子');
        const hasChen = branches.includes('辰');
        
        if (hasShen && hasZi && hasChen) {
          const dayStem = ec.getDayGan();
          
          // 检查水日主
          if (dayStem === '壬' || dayStem === '癸') {
            // 检查天干无土
            const hasEarth = stems.some(s => s === '戊' || s === '己');
            
            if (!hasEarth) {
              console.log('✅ 找到符合条件的八字:');
              console.log(`   日期: ${year}年${month}月${day}日 子时`);
              console.log(`   四柱: ${stems[0]}${branches[0]} ${stems[1]}${branches[1]} ${stems[2]}${branches[2]} ${stems[3]}${branches[3]}`);
              console.log(`   地支: ${branches.join(' ')}`);
              console.log('');
              
              // 只找前5个
              count++;
              if (count >= 5) {
                process.exit(0);
              }
            }
          }
        }
      } catch (e) {
        // 跳过无效日期
      }
    }
  }
}

console.log('搜索完成，共找到', count, '个符合条件的八字');

