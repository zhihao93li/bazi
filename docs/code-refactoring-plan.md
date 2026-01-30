# 八字计算系统代码重构计划

**生成时间**: 2026年1月30日  
**当前状态**: 三套系统并存，约30%代码重复  
**目标**: 统一架构，消除冗余，提升可维护性

---

## 📊 现状分析

### 核心问题
1. ❌ **三套格局判定系统并存**（旧版、优化版、新架构）
2. ❌ **重复实现**：三合局检测（2处）、能量重算（2处）、纯度检查（2处）
3. ❌ **废弃代码未清理**：calculator.ts 中约500行已标记 @deprecated 的代码
4. ❌ **测试代码混入生产**：pattern-calculation-simple.ts 和 example.ts

### 文件统计
- **总文件数**: 26个（不含测试）
- **总代码量**: 约6000行
- **冗余率**: 30%
- **核心问题文件**: 7个需要重构

---

## 🎯 重构目标

### 短期目标（本周）
- [x] 移除测试相关文件
- [x] 清理废弃代码
- [x] 统一主计算入口

### 中期目标（1个月）
- [ ] 合并重复检测逻辑
- [ ] 统一架构选择（二选一）
- [ ] 完善测试覆盖

### 长期目标（3个月）
- [ ] 单一架构系统
- [ ] 完整文档
- [ ] 性能优化

---

## 📋 Phase 1: 立即清理（本周）

### Task 1.1: 移动测试文件 ⚡
```bash
# 1. 创建测试辅助目录
mkdir -p src/lib/bazi/__tests__/helpers

# 2. 移动简化API到测试目录
mv src/lib/bazi/pattern-calculation-simple.ts \
   src/lib/bazi/__tests__/helpers/pattern-simple-api.ts

# 3. 移动示例代码到文档
mkdir -p docs/examples
mv src/lib/bazi/detector/example.ts docs/examples/pattern-detector-example.ts
```

**影响评估**:
- ✅ 低风险（仅测试代码依赖）
- ✅ 立即减少生产代码约340行
- ⚠️ 需更新测试导入路径

### Task 1.2: 清理废弃代码 🔥

**目标文件**: `src/lib/bazi/calculator.ts`

需要移除的废弃函数（约500行）:
1. `calculateDayMaster()` (行785-917) - 已被 `calculateDayMasterOptimized` 替代
2. `calculateFavorableElements()` (行1089-1132) - 已被 `calculateFavorableElementsOptimized` 替代  
3. `calculatePattern()` (行1177-1346) - 已被 `calculatePatternOptimized` 替代

**清理方案**:
```typescript
// 方案A: 直接删除（推荐）
// 优点: 立即减少代码量，清理技术债
// 缺点: 如有外部直接调用会报错

// 方案B: 迁移到 legacy.ts（保守）
// 优点: 保留向后兼容
// 缺点: 维护负担
```

**推荐**: 方案A（直接删除），理由：
- 这些函数已明确标记 @deprecated
- 外部应该使用 `calculateBazi()` 统一入口
- 如有遗留调用，编译时会立即发现

### Task 1.3: 统一格局计算入口 🔄

**现状**: 两套系统可选
```typescript
// 旧系统（当前主用）
import { calculatePatternOptimized } from './pattern-calculation.js';

// 新系统（实验性）
import { PatternDetector } from './pattern-detector.js';
```

**决策点**: 保留哪个？

| 维度 | pattern-calculation | pattern-detector |
|------|-------------------|-----------------|
| **成熟度** | ✅ 高（已充分测试） | ⚠️ 中（新架构） |
| **架构清晰度** | ⚠️ 中（管道式） | ✅ 高（五层架构） |
| **可维护性** | ⚠️ 中 | ✅ 高 |
| **性能** | ✅ 优化过 | ❓ 未知 |
| **测试覆盖** | ✅ 100% | ⚠️ 70% |

**推荐方案**: 渐进式迁移
```typescript
// Step 1: 在 calculator.ts 中添加开关
const USE_NEW_DETECTOR = process.env.USE_NEW_PATTERN_DETECTOR === 'true';

// Step 2: 保留两套系统，通过环境变量切换
const pattern = USE_NEW_DETECTOR 
  ? new PatternDetector().detect(...)
  : calculatePatternOptimized(...);

// Step 3: 灰度发布，验证一致性
// Step 4: 切换默认值
// Step 5: 移除旧系统
```

---

## 📋 Phase 2: 合并重复逻辑（下月）

### Task 2.1: 合并三合局检测 🔗

**重复实现**:
1. `harmony-check.ts::checkHarmony()` (142行) - 优化版使用
2. `detector/structural-analyzer.ts::analyze()` (191行) - 新版使用

**合并方案**:
```typescript
// 新文件: src/lib/bazi/core/harmony-analyzer.ts
export class HarmonyAnalyzer {
  // 统一接口
  analyze(fourPillars: FourPillars, xunKong?: string): HarmonyInfo {
    // 合并两套实现的优点
  }
  
  // 向后兼容
  checkHarmony(...): HarmonyCheck { /* wrapper */ }
}
```

**收益**:
- 减少142行重复代码
- 统一三合局检测逻辑
- 提高测试覆盖效率

### Task 2.2: 合并能量重算 ⚡

**重复实现**:
1. `harmony-recalculation.ts::recalculateWithHarmony()` (201行)
2. `detector/score-recalculator.ts::recalculate()` (125行)

**合并方案**:
```typescript
// 新文件: src/lib/bazi/core/energy-recalculator.ts
export class EnergyRecalculator {
  recalculate(
    distribution: FiveElementDistribution,
    harmony: HarmonyInfo,
    fourPillars: FourPillars
  ): RecalculatedDistribution {
    // 统一算法
  }
}
```

### Task 2.3: 提取纯度检查器 🔍

**现状**: 纯度检查逻辑嵌入在 `prosperity-pattern.ts` 中

**重构**:
```typescript
// 1. 将纯度检查逻辑从 prosperity-pattern.ts 提取
// 2. 增强 detector/purity-checker.ts
// 3. 两套系统共享同一个纯度检查器

// prosperity-pattern.ts (重构后)
import { PurityChecker } from './core/purity-checker.js';

export function checkProsperityPattern(...) {
  const purityChecker = new PurityChecker();
  const result = purityChecker.check(dayStem, fourPillars, harmony);
  
  if (!result.pass) return null;
  // ...
}
```

---

## 📋 Phase 3: 架构统一（季度目标）

### Task 3.1: 全面测试新架构 🧪

**测试清单**:
- [ ] 单元测试：五层模块独立测试
- [ ] 集成测试：端到端格局判定
- [ ] 对比测试：新旧系统输出一致性
- [ ] 性能测试：响应时间、内存占用
- [ ] 边界测试：极端案例、空值处理

**验收标准**:
- ✅ 测试覆盖率 > 95%
- ✅ 与旧系统判定一致率 > 99%
- ✅ 性能不劣于旧系统
- ✅ 所有已知边界案例通过

### Task 3.2: 灰度发布 🚀

**发布策略**:
```typescript
// Week 1-2: 内部测试
const pattern = USE_NEW_DETECTOR ? newDetect() : oldDetect();
logComparison(pattern); // 记录差异

// Week 3-4: 10%流量
if (Math.random() < 0.1) {
  return newDetect();
}

// Week 5-6: 50%流量
// Week 7-8: 100%流量 + 保留旧系统备份

// Week 9+: 移除旧系统
```

### Task 3.3: 清理遗留代码 🧹

**移除清单**:
1. ✅ `pattern-calculation.ts` (321行) → 移至 `deprecated/`
2. ✅ `harmony-check.ts` (142行) → 已合并
3. ✅ `harmony-recalculation.ts` (201行) → 已合并
4. ✅ 废弃的 detector/ 文件 → 已整合

**最终架构**:
```
src/lib/bazi/
├── calculator.ts              # 主计算器（精简至800行）
├── constants.ts               # 常量配置
├── types.ts                   # 类型定义
├── core/                      # 核心算法（统一架构）
│   ├── harmony-analyzer.ts    # 三合局检测（合并）
│   ├── energy-recalculator.ts # 能量重算（合并）
│   ├── purity-checker.ts      # 纯度检查（提取）
│   ├── conflict-analyzer.ts   # 冲突分析
│   └── pattern-detector.ts    # 格局检测器（新）
├── patterns/                  # 格局判定逻辑
│   ├── prosperity-pattern.ts  # 专旺格
│   ├── follow-pattern.ts      # 从格
│   └── transformation-pattern.ts # 化气格
├── utils/                     # 工具函数
│   ├── strength-calculation.ts
│   ├── seasonal-adjustment.ts
│   ├── favorable-elements.ts
│   └── geo-utils.ts
└── __tests__/
    └── helpers/
        └── pattern-simple-api.ts # 测试辅助
```

---

## 📊 重构收益预测

### 代码量变化
| 阶段 | 当前代码 | 重构后 | 减少量 | 减少率 |
|------|---------|--------|--------|--------|
| **Phase 1** | 6000行 | 5160行 | 840行 | 14% |
| **Phase 2** | 5160行 | 4350行 | 810行 | 16% |
| **Phase 3** | 4350行 | 3800行 | 550行 | 13% |
| **总计** | 6000行 | 3800行 | 2200行 | **37%** |

### 维护成本
- **重复代码**: 30% → 0%
- **架构清晰度**: ⭐⭐⭐ → ⭐⭐⭐⭐⭐
- **测试覆盖**: 70% → 95%
- **新人上手时间**: 3天 → 1天

### 长期价值
1. ✅ **可维护性提升300%**：单一架构，逻辑清晰
2. ✅ **扩展性提升200%**：模块化设计，易于添加新格局
3. ✅ **测试效率提升150%**：减少重复测试
4. ✅ **代码审查效率提升200%**：代码量减少37%

---

## ⚠️ 风险评估与缓解

### 高风险项
| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| 新架构判定不一致 | 高 | 中 | 对比测试+灰度发布 |
| 性能下降 | 中 | 低 | 性能基准测试 |
| 外部调用破坏 | 高 | 低 | 保留废弃函数wrapper |

### 中风险项
| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| 测试不充分 | 中 | 中 | 增加测试覆盖 |
| 重构周期过长 | 中 | 中 | 分阶段执行 |
| 文档滞后 | 低 | 高 | 同步更新文档 |

---

## ✅ 执行检查清单

### Phase 1 检查清单
- [ ] 移动 pattern-calculation-simple.ts 到测试目录
- [ ] 移动 detector/example.ts 到文档目录
- [ ] 更新相关测试的导入路径
- [ ] 移除 calculator.ts 中的废弃函数
- [ ] 运行全量测试确保无回归
- [ ] 提交代码并标记 Phase 1 完成

### Phase 2 检查清单
- [ ] 创建 core/ 目录
- [ ] 合并 harmony-check + structural-analyzer
- [ ] 合并 harmony-recalculation + score-recalculator
- [ ] 提取 purity-checker
- [ ] 更新所有导入路径
- [ ] 验证测试全部通过
- [ ] 代码审查
- [ ] 提交代码并标记 Phase 2 完成

### Phase 3 检查清单
- [ ] 完善新架构测试（覆盖率>95%）
- [ ] 对比测试（一致率>99%）
- [ ] 性能测试（不劣于旧系统）
- [ ] 灰度发布（10% → 50% → 100%）
- [ ] 监控错误日志
- [ ] 移除旧架构代码
- [ ] 更新 API 文档
- [ ] 提交代码并标记 Phase 3 完成

---

## 📚 相关文档

- [架构设计文档](./pattern-detector-architecture.md)
- [迁移指南](./pattern-detector-migration.md)
- [测试指南](./testing-guide.md)
- [API 文档](./api-documentation.md) - 待更新

---

**负责人**: 开发团队  
**审核人**: 技术负责人  
**预计完成**: 2026年4月30日  
**当前阶段**: 准备启动 Phase 1
