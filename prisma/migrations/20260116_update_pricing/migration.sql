-- 价格体系更新迁移
-- 1. 添加 originalPrice 字段
-- 2. 更新主题价格
-- 3. 添加合盘主题
-- 4. 更新积分套餐

-- 添加 originalPrice 字段（如果不存在）
ALTER TABLE "ThemePricing" ADD COLUMN IF NOT EXISTS "originalPrice" INTEGER;

-- 更新主题价格
UPDATE "ThemePricing" SET price = 200, "originalPrice" = NULL WHERE theme = 'life_color';
UPDATE "ThemePricing" SET price = 100, "originalPrice" = NULL WHERE theme = 'relationship';
UPDATE "ThemePricing" SET price = 100, "originalPrice" = NULL WHERE theme = 'career_wealth';
UPDATE "ThemePricing" SET price = 100, "originalPrice" = NULL WHERE theme = 'health';
UPDATE "ThemePricing" SET price = 100, "originalPrice" = NULL WHERE theme = 'life_lesson';
UPDATE "ThemePricing" SET price = 150, "originalPrice" = 200 WHERE theme = 'yearly_fortune';

-- 添加合盘主题（如果不存在）
INSERT INTO "ThemePricing" (id, theme, name, description, price, "originalPrice", "isActive", "sortOrder")
VALUES (gen_random_uuid()::text, 'synastry', '合盘分析', '双人关系深度解读', 200, NULL, false, 7)
ON CONFLICT (theme) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  "originalPrice" = EXCLUDED."originalPrice",
  "isActive" = EXCLUDED."isActive",
  "sortOrder" = EXCLUDED."sortOrder";

-- 更新积分套餐
-- 先将所有套餐标记为不活跃
UPDATE "PointsPackage" SET "isActive" = false;

-- 删除旧套餐并插入新套餐
DELETE FROM "PointsPackage" WHERE name IN ('入门套餐', '标准套餐', '超值套餐', '尊享套餐');

-- 插入新套餐
INSERT INTO "PointsPackage" (id, name, points, price, "isActive", "sortOrder") VALUES
  (gen_random_uuid()::text, '套餐一', 200, 2000, true, 1),
  (gen_random_uuid()::text, '套餐二', 500, 4750, true, 2),
  (gen_random_uuid()::text, '套餐三', 1000, 8800, true, 3)
ON CONFLICT DO NOTHING;
