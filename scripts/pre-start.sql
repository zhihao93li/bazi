-- 启动前数据库修复脚本
-- 确保所有必要的表和列都存在

-- 创建 ThemePricing 表（如果不存在）
CREATE TABLE IF NOT EXISTS "ThemePricing" (
    "id" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "originalPrice" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ThemePricing_pkey" PRIMARY KEY ("id")
);

-- 创建唯一索引（如果不存在）
CREATE UNIQUE INDEX IF NOT EXISTS "ThemePricing_theme_key" ON "ThemePricing"("theme");

-- 添加 originalPrice 列（如果表已存在但缺少此列）
ALTER TABLE "ThemePricing" ADD COLUMN IF NOT EXISTS "originalPrice" INTEGER;

-- 创建 PointsPackage 表（如果不存在）
CREATE TABLE IF NOT EXISTS "PointsPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PointsPackage_pkey" PRIMARY KEY ("id")
);
