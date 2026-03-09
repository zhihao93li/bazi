/**
 * 专旺格判定模块
 * Prosperity Pattern Module - Detects specialized prosperity patterns (Qu Zhi, Yan Shang, etc.)
 */

import type {
  FourPillars,
  HarmonyCheck,
  HeavenlyStem,
  PatternInfo,
  RecalculatedDistribution,
  FiveElement,
} from './types.js';
import {
  PROSPERITY_PATTERN_CONFIG,
} from './constants.js';

/**
 * 检测专旺格
 * 
 * 判定条件:
 * 1. 【结构层】必须有全三合或三会局(半三合不能定特殊格局)
 * 2. 【结构层】合局五行与日主五行相同
 * 3. 【纯度层】由 PurityChecker 统一检查（天干、藏干纯度）
 * 4. 【阈值层】重算后该五行占比 > 75%
 * 
 * 注意：本函数只负责结构检查和阈值检查，纯度检查由 PatternDetector 统一调用
 * 
 * @param dayStem 日主天干
 * @param fourPillars 四柱
 * @param harmony 合局检测结果
 * @param recalculatedDistribution 重算后的五行分布
 * @returns 专旺格信息,如不成格则返回null
 */
export function checkProsperityPattern(
  dayStem: HeavenlyStem,
  fourPillars: FourPillars,
  harmony: HarmonyCheck,
  recalculatedDistribution: RecalculatedDistribution
): PatternInfo | null {
  // DEBUG
  const DEBUG = process.env.NODE_ENV === 'test';
  
  if (DEBUG) {
    console.log('[DEBUG] 专旺格检查开始');
    console.log('  日主:', dayStem.chinese, '/', dayStem.element);
    console.log('  合局类型:', harmony.type);
    console.log('  合局元素:', harmony.element);
  }
  
  // 【修正1】只有全三合或三会局才能触发专旺格
  if (harmony.type !== 'full' && harmony.type !== 'hui') {
    if (DEBUG) console.log('  ❌ 不是全三合/三会,退出');
    return null; // 半三合不能定特殊格局
  }

  // 1. 检查是否有合局
  if (!harmony.element) {
    if (DEBUG) console.log('  ❌ 无合局,退出');
    return null;
  }

  // 2. 检查合局五行是否与日主相同
  if (harmony.element !== dayStem.element) {
    if (DEBUG) console.log('  ❌ 合局五行与日主不同,退出');
    return null;
  }
  
  if (DEBUG) console.log('  ✓ 基础条件通过');

  // 3. 查找对应的专旺格配置
  const patternName = Object.keys(PROSPERITY_PATTERN_CONFIG).find(
    (name) => PROSPERITY_PATTERN_CONFIG[name].dayElement === dayStem.element
  );

  if (!patternName) {
    if (DEBUG) console.log('  ❌ 未找到对应配置,退出');
    return null;
  }

  const config = PROSPERITY_PATTERN_CONFIG[patternName];
  if (DEBUG) console.log('  候选格局:', patternName);

  // 4. 【纯度层】纯度检查已移至 PurityChecker，此处不再检查
  // 注意：PatternDetector 会在返回后统一调用 PurityChecker.verify()

  // 5. 【阈值层】检查重算后该五行的占比
  // 直接计算百分比
  const totalScore = Object.values(recalculatedDistribution).reduce((sum, val) => sum + val, 0);
  const percentage: Record<FiveElement, number> = {
    wood: (recalculatedDistribution.wood / totalScore) * 100,
    fire: (recalculatedDistribution.fire / totalScore) * 100,
    earth: (recalculatedDistribution.earth / totalScore) * 100,
    metal: (recalculatedDistribution.metal / totalScore) * 100,
    water: (recalculatedDistribution.water / totalScore) * 100,
  };
  const dayElementPercentage = percentage[dayStem.element];

  if (DEBUG) {
    console.log('  五行占比:');
    Object.entries(percentage).forEach(([el, pct]) => {
      console.log(`    ${el}: ${pct.toFixed(1)}%`);
    });
    console.log(`  ${dayStem.element}占比:`, dayElementPercentage.toFixed(1), '% (需要 >', config.minScore, '%)');
  }

  if (dayElementPercentage < config.minScore) {
    // 分数不足 → 不成格
    if (DEBUG) console.log('  ❌ 分数不足');
    return null;
  }
  
  if (DEBUG) console.log('  ✅ 专旺格成立:', patternName);

  // 7. 成格!
  return {
    name: patternName,
    category: 'special',
    description: config.description,
    harmonyInfo: harmony,
  };
}

/**
 * 检查专旺格是否为"真格"(无破格因素)
 * @param pattern 格局信息
 * @returns 是否为真格
 */
export function isPerfectProsperityPattern(pattern: PatternInfo): boolean {
  if (!pattern.harmonyInfo) return false;

  // 真格条件:
  // 1. 全三合或三会(不是半合)
  // 2. 核心地支未空亡
  return (
    (pattern.harmonyInfo.type === 'full' || pattern.harmonyInfo.type === 'hui') &&
    !pattern.harmonyInfo.isVoid
  );
}
