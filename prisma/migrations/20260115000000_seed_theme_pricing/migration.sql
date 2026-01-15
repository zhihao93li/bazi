-- 主题价格初始数据（数据迁移）
-- 这是业界标准做法：把种子数据作为迁移的一部分

INSERT INTO "ThemePricing" (id, theme, name, description, price, "isActive", "sortOrder") VALUES
  (gen_random_uuid()::text, 'life_color', '生命底色', '探索你的生命本质与核心特质', 50, true, 1),
  (gen_random_uuid()::text, 'relationship', '亲密关系', '解读情感模式与亲密关系运势', 30, true, 2),
  (gen_random_uuid()::text, 'career_wealth', '事业财富', '分析事业发展与财富机遇', 30, true, 3),
  (gen_random_uuid()::text, 'health', '身心健康', '关注身体健康与心理平衡', 30, true, 4),
  (gen_random_uuid()::text, 'life_lesson', '人生课题', '洞察生命成长与人生使命', 30, true, 5),
  (gen_random_uuid()::text, 'yearly_fortune', '流年解读', '当年运势分析与趋吉避凶', 40, true, 6)
ON CONFLICT (theme) DO NOTHING;

-- 积分套餐初始数据
INSERT INTO "PointsPackage" (id, name, points, price, "isActive", "sortOrder") VALUES
  (gen_random_uuid()::text, '入门套餐', 100, 1000, true, 1),
  (gen_random_uuid()::text, '标准套餐', 500, 4500, true, 2),
  (gen_random_uuid()::text, '超值套餐', 1000, 8000, true, 3),
  (gen_random_uuid()::text, '尊享套餐', 2000, 15000, true, 4)
ON CONFLICT DO NOTHING;
