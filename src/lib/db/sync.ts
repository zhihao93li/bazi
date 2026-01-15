/**
 * 数据库结构同步
 * 在应用启动时自动执行 prisma db push，确保数据库结构与 schema 同步
 */
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function syncDatabase(): Promise<void> {
    console.log('[DB Sync] 同步数据库结构...');
    
    try {
        const { stdout, stderr } = await execAsync(
            'npx prisma db push --skip-generate --accept-data-loss',
            { timeout: 60000 } // 60秒超时
        );
        
        if (stdout) {
            console.log(stdout);
        }
        if (stderr && !stderr.includes('warn')) {
            // 忽略警告，只输出真正的错误
            console.error(stderr);
        }
        
        console.log('[DB Sync] 数据库结构同步完成 ✓');
    } catch (error) {
        console.error('[DB Sync] 数据库同步失败:', error);
        // 不抛出错误，让应用继续尝试启动
        // 某些情况下数据库可能已经是最新的，只是命令返回了非零退出码
    }
}
