/**
 * 数据库连接验证
 * 验证数据库连接是否正常，不再执行 schema 同步
 * Schema 同步在构建阶段由 zeabur.json 的 build_command 处理
 */
import { prisma } from '../prisma.js';

export async function syncDatabase(): Promise<void> {
    console.log('[DB Sync] 验证数据库连接...');

    try {
        // 简单的连接测试
        await prisma.$queryRaw`SELECT 1`;
        console.log('[DB Sync] 数据库连接正常 ✓');
    } catch (error) {
        console.error('[DB Sync] 数据库连接失败:', error);
        throw error; // 数据库连接失败应该阻止启动
    }
}
