#!/bin/bash
# Phase 1 清理验证脚本
# 自动运行所有验证步骤

echo "======================================"
echo "Phase 1 清理验证脚本"
echo "======================================"
echo ""

# 1. 检查代码行数
echo "📊 1. 检查 calculator.ts 代码行数..."
LINES=$(wc -l < src/lib/bazi/calculator.ts)
echo "   当前行数: $LINES (预期: 979行)"
if [ "$LINES" -eq 979 ]; then
  echo "   ✅ 行数正确！"
else
  echo "   ⚠️  行数不符预期"
fi
echo ""

# 2. Linter检查
echo "🔍 2. 运行 ESLint 检查..."
npm run lint 2>&1 | grep -E "(error|warning|✓)" | head -20
echo ""

# 3. TypeScript类型检查
echo "📘 3. 运行 TypeScript 类型检查..."
npx tsc --noEmit 2>&1 | grep -E "(error|warning|Found)" | head -20
echo ""

# 4. 运行测试
echo "🧪 4. 运行八字计算测试..."
npm test -- src/lib/bazi/__tests__/special-patterns.test.ts 2>&1 | grep -E "(PASS|FAIL|Test Files|Tests)" | tail -10
echo ""

echo "🧪 5. 运行原始格式测试..."
npm test -- src/lib/bazi/__tests__/pattern-original-format.test.ts 2>&1 | grep -E "(PASS|FAIL|Test Files|Tests)" | tail -10
echo ""

# 总结
echo "======================================"
echo "✅ Phase 1 验证完成！"
echo "======================================"
echo ""
echo "下一步："
echo "  1. 检查上述输出，确认所有测试通过"
echo "  2. 运行: git add ."
echo "  3. 运行: git commit -m 'refactor(phase1): 完成代码清理'"
echo ""
