/**
 * 独立 Worker 进程入口
 *
 * 专门处理异步任务，与 API 服务解耦
 * 启动命令: npm run worker
 */

import dotenvFlow from 'dotenv-flow';
dotenvFlow.config({
  node_env: process.env.NODE_ENV || 'development',
  silent: true,
});

import { setupGracefulShutdown, registerShutdownResource } from './lib/shutdown.js';
import { prisma } from './lib/prisma.js';
import { startWorkerMode, stopPolling } from './lib/tasks/index.js';

// 设置优雅关闭
setupGracefulShutdown();

// 配置信息
const MAX_CONCURRENT = process.env.MAX_CONCURRENT_TASKS || '50';
const POLL_INTERVAL = process.env.TASK_POLL_INTERVAL || '500';

console.log('🚀 Worker 进程启动中...');
console.log(`🌍 运行环境: ${process.env.NODE_ENV || 'development'}`);
console.log(`📊 最大并发任务数: ${MAX_CONCURRENT}`);
console.log(`⏱️  轮询间隔: ${POLL_INTERVAL}ms`);
console.log(`🗄️  数据库: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || '未配置'}`);

// 验证数据库连接
import { syncDatabase } from './lib/db/sync.js';
try {
  await syncDatabase();
  console.log('✅ 数据库连接成功');
} catch (error) {
  console.error('❌ 数据库连接失败:', error);
  process.exit(1);
}

// 启动 Worker 模式
try {
  await startWorkerMode();
  console.log('✅ Worker 已启动，等待任务中...');
} catch (error) {
  console.error('❌ Worker 启动失败:', error);
  process.exit(1);
}

// 注册关闭资源
registerShutdownResource('stopPolling', stopPolling);
registerShutdownResource('disconnectDb', () => prisma.$disconnect());

// 保持进程运行
console.log('\n🎯 Worker 进程运行中，按 Ctrl+C 停止\n');
