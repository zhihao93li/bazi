# 测试说明文档

## 📋 两套测试系统对比

### 1. 原有测试（已通过）✅
**文件**: `src/lib/bazi/__tests__/special-patterns.test.ts`

**特点**:
- 使用 `calculateBazi(年月日时)` 接口
- 通过真实日期计算四柱
- 集成测试，覆盖完整流程
- **结果**: 6/6 全部通过

**测试案例**:
```bash
npm test -- src/lib/bazi/__tests__/special-patterns.test.ts
```

### 2. 新增测试（使用原始格式）🆕
**文件**: `src/lib/bazi/__tests__/pattern-original-format.test.ts`

**特点**:
- 使用简化的四柱数据格式（用户提供的格式）
- 直接传入天干地支组合
- 单元测试，专注格局逻辑验证
- 使用新的简化API: `calculatePattern(chart)`

**API文件**: `src/lib/bazi/pattern-calculation-simple.ts`

**测试数据示例**:
```typescript
const chart = {
  year: '乙亥', 
  month: '甲申', 
  day: '壬辰', 
  hour: '庚子',
  stems: ['乙', '甲', '壬', '庚'],
  branches: ['亥', '申', '辰', '子']
};
```

## 🧪 运行新测试

```bash
# 运行原始格式测试
npm test -- src/lib/bazi/__tests__/pattern-original-format.test.ts

# 或使用完整路径
NODE_ENV=test vitest --run src/lib/bazi/__tests__/pattern-original-format.test.ts
```

## 📊 测试用例覆盖

| 测试ID | 描述 | 测试点 |
|--------|------|--------|
| **TC-001** | 润下格识别 | 申子辰三合水局 + 壬日主 |
| **TC-002** | 透土破格 | 天干透戊土 → 一票否决 |
| **TC-003** | 寅申冲 | 冲克对禄位的影响 |
| **TC-004** | 从格判定 | 日主极弱 + 财星极旺 |
| **TC-005** | 半三合测试 | 申子半合不应成格 |

## 🎯 预期结果

### TC-001: 润下格 ✅
```
格局: 润下格
类别: special
结构: { harmony: "申子辰", harmonyType: "full", element: "water" }
纯度: { pass: true }
```

### TC-002: 破格 ✅
```
格局: 普通格局 (not 润下格)
类别: normal
纯度: { pass: false, reason: "天干透戊(earth),破格" }
```

### TC-003: 冲克影响 ⚠️
```
检测到寅申冲
dayMaster.analysis.deDi = 36 (受冲影响)
```

### TC-004: 从财格 ✅
```
格局: 从财格
类别: special
条件: strengthScore(15) < 20 && targetScore(70) > 70
```

### TC-005: 半三合不成格 ✅
```
格局: 普通格局 (not 润下格)
类别: normal
原因: 只有申子，缺辰，不是全三合
```

## 🔍 两套系统的区别

### 原有系统 (special-patterns.test.ts)
```typescript
// 输入: 年月日时
const result = calculateBazi({
  year: 1992,
  month: 11,
  day: 16,
  hour: 0,
  gender: 'male',
  isLeapMonth: false
});

// 输出: 完整的八字分析
result.pattern.name // 格局名称
result.fourPillars  // 四柱详情
result.dayMaster    // 日主分析
result.fiveElements // 五行分析
```

### 新系统 (pattern-original-format.test.ts)
```typescript
// 输入: 简化的四柱数据
const result = calculatePattern({
  year: '乙亥', 
  month: '甲申', 
  day: '壬辰', 
  hour: '庚子',
  stems: ['乙', '甲', '壬', '庚'],
  branches: ['亥', '申', '辰', '子']
});

// 输出: 格局信息 + 结构分析
result.name          // 格局名称
result.category      // 格局类别
result.structuralInfo // 结构信息
result.purityCheck   // 纯度检查
```

## ⚠️ 注意事项

### 简化API的局限性
`pattern-calculation-simple.ts` 是一个**轻量级实现**，用于快速验证格局逻辑，但它：

1. **不包含完整的五行计算**
   - 无法精确计算五行得分
   - 无法进行身强身弱的详细判定

2. **缺少藏干权重计算**
   - 只做天干检查
   - 地支藏干影响未完全模拟

3. **冲克计算简化**
   - 只识别基本的六冲
   - 未考虑刑害破等复杂关系

### 建议
- ✅ **生产环境**: 使用完整的 `calculateBazi` API
- ✅ **快速验证**: 使用简化的 `calculatePattern` API
- ✅ **单元测试**: 两套测试都保留，互相验证

## 📝 下一步

1. **运行新测试**，验证简化API是否正确识别格局
2. **对比结果**，确保两套系统的判定逻辑一致
3. **修复差异**，如果发现不一致的地方

## 🎓 知识点

### 为什么需要两套测试？

1. **集成测试** (`special-patterns.test.ts`)
   - 测试完整流程
   - 发现系统性问题
   - 验证真实场景

2. **单元测试** (`pattern-original-format.test.ts`)
   - 测试核心逻辑
   - 快速定位问题
   - 易于调试和维护

两者结合，确保系统既正确又可靠！
