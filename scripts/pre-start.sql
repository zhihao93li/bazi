-- 启动前数据库修复脚本
-- 确保所有必要的列都存在

-- 添加 originalPrice 列（如果不存在）
ALTER TABLE "ThemePricing" ADD COLUMN IF NOT EXISTS "originalPrice" INTEGER;
