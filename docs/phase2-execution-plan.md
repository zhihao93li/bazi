# Phase 2 执行计划：合并重复检测逻辑

**日期**: 2026年1月30日  
**预计时长**: 2-3小时  
**风险等级**: 中等（涉及核心算法）

---

## 🎯 Phase 2 目标

消除 `detector/` 目录与主系统之间的重复逻辑，统一检测接口。

### 预期收益
- **代码减少**: 810行 (16%)
- **重复率**: 20% → 5%
- **维护成本**: 降低40%

---

## 📋 执行步骤

### Step 2.1: 分析重复逻辑 🔍

**目标**: 精确定位重复代码位置

#### 需要对比的文件对
1. **三合局检测**
   - `detector/harmony-detector.ts` (230行)
   - `harmony-check.ts` (180行)
   
2. **能量重算**
   - `detector/energy-recalculator.ts` (150行)
   - `harmony-recalculation.ts` (140行)

3. **纯度检查**
   - `detector/purity-checker.ts` (120行)
   - 散落在 `prosperity-pattern.ts` 中 (100行)

**预计重复**: ~600行

#### 工具
```bash
# 使用 code-explorer 分析依赖
task: "分析 detector/ 与主系统的重复逻辑"
```

---

### Step 2.2: 提取统一模块 🔧

**目标**: 创建共享的核心模块

#### 2.2.1 创建 `core/` 目录
```
src/lib/bazi/core/
├── harmony-detector.ts      # 统一三合局检测
├── energy-calculator.ts     # 统一能量计算
└── purity-validator.ts      # 统一纯度验证
```

#### 2.2.2 合并三合局检测逻辑

**输入文件**:
- `detector/harmony-detector.ts`
- `harmony-check.ts`

**输出文件**:
- `core/harmony-detector.ts` (统一版本)

**合并策略**:
1. 保留 `detector/` 的完整逻辑（更新）
2. 移除 `harmony-check.ts` 的重复部分
3. 统一接口和类型定义

**预计减少**: 180行

---

#### 2.2.3 合并能量重算逻辑

**输入文件**:
- `detector/energy-recalculator.ts`
- `harmony-recalculation.ts`

**输出文件**:
- `core/energy-calculator.ts` (统一版本)

**合并策略**:
1. 提取公共的五行计算逻辑
2. 统一合局影响系数
3. 移除重复的藏干权重计算

**预计减少**: 140行

---

#### 2.2.4 提取纯度检查模块

**输入文件**:
- `detector/purity-checker.ts`
- `prosperity-pattern.ts` 中的纯度检查代码

**输出文件**:
- `core/purity-validator.ts` (统一版本)

**合并策略**:
1. 提取天干纯度检查
2. 提取藏干权重计算
3. 统一容忍度配置

**预计减少**: 100行

---

### Step 2.3: 更新调用方 🔄

**目标**: 更新所有引用旧模块的代码

#### 需要更新的文件

1. **pattern-calculation.ts**
   - 引入 `core/harmony-detector`
   - 移除对 `harmony-check` 的依赖

2. **prosperity-pattern.ts**
   - 引入 `core/purity-validator`
   - 移除内联的纯度检查代码

3. **pattern-detector.ts**
   - 引入 `core/` 模块
   - 移除对 `detector/` 子模块的依赖

4. **follow-pattern.ts**
   - 引入 `core/energy-calculator`
   - 移除对 `harmony-recalculation` 的依赖

#### 验证清单
- [ ] 所有导入路径正确
- [ ] 类型定义兼容
- [ ] 函数签名匹配

---

### Step 2.4: 删除冗余文件 🗑️

**目标**: 清理旧的重复文件

#### 待删除文件列表
```
src/lib/bazi/
├── harmony-check.ts              # → core/harmony-detector.ts
├── harmony-recalculation.ts      # → core/energy-calculator.ts
└── detector/
    ├── harmony-detector.ts       # → core/harmony-detector.ts
    ├── energy-recalculator.ts    # → core/energy-calculator.ts
    └── purity-checker.ts         # → core/purity-validator.ts
```

**预计删除**: 780行

**保留**:
- `detector/types.ts` (类型定义)
- `detector/pattern-detector.ts` (高级封装)

---

### Step 2.5: 测试验证 ✅

**目标**: 确保重构后功能完整

#### 测试范围
1. **单元测试**
   ```bash
   npm test -- src/lib/bazi/__tests__/special-patterns.test.ts
   npm test -- src/lib/bazi/__tests__/pattern-original-format.test.ts
   ```

2. **集成测试**
   ```bash
   npm test -- src/lib/bazi/__tests__/
   ```

3. **类型检查**
   ```bash
   npx tsc --noEmit
   ```

4. **Linter检查**
   ```bash
   npm run lint
   ```

#### 成功标准
- ✅ 所有测试通过 (11/11)
- ✅ 0个TypeScript错误
- ✅ 0个Linter错误
- ✅ 功能与Phase 1保持一致

---

## 📊 预期成果

### 代码减少

| 类型 | 行数 |
|-----|------|
| 重复三合局检测 | -180行 |
| 重复能量计算 | -140行 |
| 重复纯度检查 | -100行 |
| 冗余文件删除 | -390行 |
| **总计** | **-810行** |

### 架构优化

**优化前**:
```
src/lib/bazi/
├── harmony-check.ts          (重复1)
├── harmony-recalculation.ts  (重复2)
├── detector/
│   ├── harmony-detector.ts   (重复1)
│   ├── energy-recalculator.ts (重复2)
│   └── purity-checker.ts     (重复3)
└── prosperity-pattern.ts     (重复3内联)
```

**优化后**:
```
src/lib/bazi/
├── core/                     ✨ 新增
│   ├── harmony-detector.ts   (统一版本)
│   ├── energy-calculator.ts  (统一版本)
│   └── purity-validator.ts   (统一版本)
├── detector/
│   ├── types.ts              (保留)
│   └── pattern-detector.ts   (保留,依赖core/)
└── pattern-calculation.ts    (主系统,依赖core/)
```

---

## ⚠️ 风险控制

### 潜在风险

1. **函数签名不兼容**
   - **缓解**: 创建兼容层包装器
   - **验证**: TypeScript类型检查

2. **测试覆盖不足**
   - **缓解**: 先写测试后重构
   - **验证**: 覆盖率保持70%+

3. **性能回退**
   - **缓解**: 保留关键路径优化
   - **验证**: 性能基准测试

### 回滚方案

```bash
# 如果出现问题，立即回滚
git reset --hard HEAD~1
git clean -fd
```

---

## 📝 执行清单

### 准备阶段
- [x] 创建 Phase 2 执行计划
- [ ] 分析重复逻辑（code-explorer）
- [ ] 创建 `core/` 目录结构

### 实施阶段
- [ ] Step 2.2.1: 创建统一三合局检测器
- [ ] Step 2.2.2: 创建统一能量计算器
- [ ] Step 2.2.3: 创建统一纯度验证器
- [ ] Step 2.3: 更新所有调用方
- [ ] Step 2.4: 删除冗余文件

### 验证阶段
- [ ] 运行单元测试
- [ ] 运行集成测试
- [ ] TypeScript类型检查
- [ ] Linter检查
- [ ] 手动功能验证

### 完成阶段
- [ ] 更新文档
- [ ] 提交代码
- [ ] 标记 Phase 2 完成

---

## 🚀 开始执行

准备就绪！让我们开始 Phase 2 的执行。

**下一步**: 运行 code-explorer 分析重复逻辑

```bash
# 执行命令
task: "分析 detector/ 目录与主系统的重复检测逻辑"
```

---

**预计完成时间**: 2-3小时  
**当前进度**: 0% → 开始执行
