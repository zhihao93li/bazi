/**
 * 数据库启动初始化
 * 应用启动时自动检查并同步必要的种子数据
 * 这样可以确保无论部署环境如何，数据都是完整的
 * 
 * 最佳实践：
 * 1. 所有操作都是幂等的（可重复执行）
 * 2. 使用原生 SQL 进行 upsert，避免 ORM 字段不存在的问题
 * 3. 即使部分失败也不影响应用启动
 */
import prisma from '../prisma.js';

/**
 * 主题价格配置数据
 * 
 * 价格说明：
 * - 生命底色: 200积分
 * - 亲密关系/事业/健康/人生课题: 各100积分
 * - 流年运势: 150积分 (原价200，75折)
 * - 合盘: 200积分 (即将推出)
 */
const themePricingData = [
    {
        theme: 'life_color',
        name: '生命底色',
        description: '探索你的生命本质与核心特质',
        price: 200,
        originalPrice: null as number | null,
        isActive: true,
        sortOrder: 1,
    },
    {
        theme: 'relationship',
        name: '亲密关系',
        description: '解读情感模式与亲密关系运势',
        price: 100,
        originalPrice: null as number | null,
        isActive: true,
        sortOrder: 2,
    },
    {
        theme: 'career_wealth',
        name: '事业财富',
        description: '分析事业发展与财富机遇',
        price: 100,
        originalPrice: null as number | null,
        isActive: true,
        sortOrder: 3,
    },
    {
        theme: 'health',
        name: '身心健康',
        description: '关注身体健康与心理平衡',
        price: 100,
        originalPrice: null as number | null,
        isActive: true,
        sortOrder: 4,
    },
    {
        theme: 'life_lesson',
        name: '人生课题',
        description: '洞察生命成长与人生使命',
        price: 100,
        originalPrice: null as number | null,
        isActive: true,
        sortOrder: 5,
    },
    {
        theme: 'yearly_fortune',
        name: '流年解读',
        description: '当年运势分析与趋吉避凶',
        price: 150,
        originalPrice: 200 as number | null, // 原价200，打折到150
        isActive: true,
        sortOrder: 6,
    },
    {
        theme: 'synastry',
        name: '合盘分析',
        description: '双人关系深度解读',
        price: 200,
        originalPrice: null as number | null,
        isActive: false, // 即将推出，暂不激活
        sortOrder: 7,
    },
];

/**
 * 积分套餐数据
 * 
 * 套餐说明：
 * - 套餐一: 200积分 / ¥20 (无折扣)
 * - 套餐二: 500积分 / ¥47.5 (95折)
 * - 套餐三: 1000积分 / ¥88 (88折)
 */
const pointsPackagesData = [
    {
        name: '套餐一',
        points: 200,
        price: 2000, // ¥20
        isActive: true,
        sortOrder: 1,
    },
    {
        name: '套餐二',
        points: 500,
        price: 4750, // ¥47.5
        isActive: true,
        sortOrder: 2,
    },
    {
        name: '套餐三',
        points: 1000,
        price: 8800, // ¥88
        isActive: true,
        sortOrder: 3,
    },
];

/**
 * 检查表是否存在某列
 */
async function columnExists(tableName: string, columnName: string): Promise<boolean> {
    const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = ${tableName} AND column_name = ${columnName}
        ) as exists
    `;
    return result[0]?.exists ?? false;
}

/**
 * 同步主题价格配置
 * 使用原生 SQL 进行 upsert，避免 ORM 字段不存在的问题
 */
async function syncThemePricing() {
    // 检查 originalPrice 列是否存在
    const hasOriginalPrice = await columnExists('ThemePricing', 'originalPrice');
    
    for (const theme of themePricingData) {
        if (hasOriginalPrice) {
            // 完整的 upsert，包含 originalPrice
            await prisma.$executeRaw`
                INSERT INTO "ThemePricing" (id, theme, name, description, price, "originalPrice", "isActive", "sortOrder")
                VALUES (gen_random_uuid()::text, ${theme.theme}, ${theme.name}, ${theme.description}, ${theme.price}, ${theme.originalPrice}, ${theme.isActive}, ${theme.sortOrder})
                ON CONFLICT (theme) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    price = EXCLUDED.price,
                    "originalPrice" = EXCLUDED."originalPrice",
                    "isActive" = EXCLUDED."isActive",
                    "sortOrder" = EXCLUDED."sortOrder"
            `;
        } else {
            // 降级模式：不包含 originalPrice（数据库结构尚未更新）
            console.warn('[Bootstrap] ThemePricing.originalPrice 列不存在，使用降级模式');
            await prisma.$executeRaw`
                INSERT INTO "ThemePricing" (id, theme, name, description, price, "isActive", "sortOrder")
                VALUES (gen_random_uuid()::text, ${theme.theme}, ${theme.name}, ${theme.description}, ${theme.price}, ${theme.isActive}, ${theme.sortOrder})
                ON CONFLICT (theme) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    price = EXCLUDED.price,
                    "isActive" = EXCLUDED."isActive",
                    "sortOrder" = EXCLUDED."sortOrder"
            `;
        }
    }
}

/**
 * 同步积分套餐配置
 * 使用 upsert by name 确保套餐数据是最新的
 */
async function syncPointsPackages() {
    // 先将所有现有套餐标记为不活跃
    await prisma.pointsPackage.updateMany({
        data: { isActive: false },
    });

    // 然后 upsert 新的套餐数据
    for (const pkg of pointsPackagesData) {
        const existing = await prisma.pointsPackage.findFirst({
            where: { name: pkg.name },
        });

        if (existing) {
            await prisma.pointsPackage.update({
                where: { id: existing.id },
                data: pkg,
            });
        } else {
            await prisma.pointsPackage.create({ data: pkg });
        }
    }
}

/**
 * 检查是否有未应用的迁移
 * 通过比较本地迁移文件和数据库中的迁移记录
 */
async function checkMigrationStatus() {
    try {
        // 查询数据库中已应用的迁移
        const appliedMigrations = await prisma.$queryRaw<Array<{ migration_name: string }>>`
            SELECT migration_name FROM "_prisma_migrations" 
            WHERE finished_at IS NOT NULL
            ORDER BY started_at
        `;
        console.log(`[Bootstrap] 数据库已应用 ${appliedMigrations.length} 个迁移`);
        
        // 检查最后一个迁移是否包含关键字段
        // 这里可以根据需要添加更多检查
        const hasOriginalPrice = await columnExists('ThemePricing', 'originalPrice');
        if (!hasOriginalPrice) {
            console.warn('[Bootstrap] ⚠️ 警告: ThemePricing.originalPrice 列不存在');
            console.warn('[Bootstrap] 请运行: npx prisma migrate deploy');
        }
        
        return { ok: true, appliedCount: appliedMigrations.length };
    } catch (error) {
        // _prisma_migrations 表不存在说明从未运行过迁移
        console.warn('[Bootstrap] ⚠️ 迁移表不存在，可能需要初始化数据库');
        return { ok: false, appliedCount: 0 };
    }
}

/**
 * 数据库启动初始化
 * 在应用启动时调用，确保必要的种子数据存在
 * 
 * 设计原则：
 * 1. 永远不阻止应用启动
 * 2. 尽可能提供有用的警告信息
 * 3. 所有操作都是幂等的
 */
export async function bootstrapDatabase() {
    console.log('[Bootstrap] 检查数据库状态...');
    
    try {
        // 1. 检查迁移状态
        const migrationStatus = await checkMigrationStatus();
        if (!migrationStatus.ok) {
            console.warn('[Bootstrap] 数据库可能未正确初始化，跳过种子数据同步');
            return;
        }
        
        // 2. 同步种子数据（串行执行，便于追踪问题）
        console.log('[Bootstrap] 同步主题价格配置...');
        await syncThemePricing();
        
        console.log('[Bootstrap] 同步积分套餐配置...');
        await syncPointsPackages();
        
        console.log('[Bootstrap] 数据库初始化完成 ✓');
    } catch (error) {
        // 记录错误但不阻止应用启动
        console.error('[Bootstrap] 数据库初始化失败:', error);
        console.warn('[Bootstrap] 应用将继续启动，但某些功能可能不可用');
        // 不再抛出错误，让应用继续运行
    }
}
