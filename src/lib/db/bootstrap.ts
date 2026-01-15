/**
 * 数据库启动初始化
 * 应用启动时自动同步必要的种子数据
 * 
 * 数据库结构由 prisma db push 管理，这里只负责种子数据
 */
import prisma from '../prisma.js';

/**
 * 主题价格配置数据
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
        originalPrice: 200 as number | null,
        isActive: true,
        sortOrder: 6,
    },
    {
        theme: 'synastry',
        name: '合盘分析',
        description: '双人关系深度解读',
        price: 200,
        originalPrice: null as number | null,
        isActive: false,
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
 * 同步主题价格配置
 */
async function syncThemePricing() {
    for (const theme of themePricingData) {
        await prisma.themePricing.upsert({
            where: { theme: theme.theme },
            update: {
                name: theme.name,
                description: theme.description,
                price: theme.price,
                originalPrice: theme.originalPrice,
                isActive: theme.isActive,
                sortOrder: theme.sortOrder,
            },
            create: theme,
        });
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
 * 数据库启动初始化
 * 同步种子数据，所有操作都是幂等的
 */
export async function bootstrapDatabase() {
    console.log('[Bootstrap] 同步种子数据...');
    
    try {
        await syncThemePricing();
        await syncPointsPackages();
        console.log('[Bootstrap] 种子数据同步完成 ✓');
    } catch (error) {
        console.error('[Bootstrap] 种子数据同步失败:', error);
        // 不阻止应用启动
    }
}
