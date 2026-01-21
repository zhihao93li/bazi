/**
 * 八字算命 API 服务入口
 *
 * 基于 Hono 框架的纯后端 API 服务
 */

import dotenvFlow from 'dotenv-flow';
dotenvFlow.config({
  node_env: process.env.NODE_ENV || 'development',
  silent: true, // 生产环境使用平台环境变量，不报错
});
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { setupGracefulShutdown, registerShutdownResource } from './lib/shutdown.js';

// 设置优雅关闭（尽早注册）
setupGracefulShutdown();

// 路由导入
import { authRoutes } from './routes/auth.js';
import { baziRoutes } from './routes/bazi.js';
import { fortuneRoutes } from './routes/fortune.js';
import { paymentRoutes } from './routes/payment.js';
import { pointsRoutes } from './routes/points.js';
import { reportsRoutes } from './routes/reports.js';
import { subjectsRoutes } from './routes/subjects.js';
import { themesRoutes } from './routes/themes.js';
import { tasksRoutes } from './routes/tasks.js';
import { adminRoutes } from './routes/admin/index.js';
import { soulSongRoutes } from './routes/soul-song.js';

const app = new Hono();

// 全局中间件
app.use('*', logger());

// CORS 配置
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use('*', cors({
  origin: corsOrigin === '*' ? '*' : corsOrigin.split(','),
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400,
  credentials: true,
}));

// 健康检查（包含数据库连接验证）
import { prisma } from './lib/prisma.js';

app.get('/health', async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return c.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch {
    return c.json({
      status: 'degraded',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    }, 503);
  }
});

// API 路由
app.route('/api/auth', authRoutes);
app.route('/api/bazi', baziRoutes);
app.route('/api/fortune', fortuneRoutes);
app.route('/api/payment', paymentRoutes);
app.route('/api/points', pointsRoutes);
app.route('/api/reports', reportsRoutes);
app.route('/api/subjects', subjectsRoutes);
app.route('/api/themes', themesRoutes);
app.route('/api/tasks', tasksRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/soul-song', soulSongRoutes);

// 404 处理
app.notFound((c) => {
  return c.json({ success: false, message: '接口不存在' }, 404);
});

// 全局错误处理
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? '服务器错误' : err.message
  }, 500);
});

// 启动服务器
const port = parseInt(process.env.PORT || '3000', 10);

console.log(`🚀 八字算命 API 服务启动中...`);
console.log(`🌍 运行环境: ${process.env.NODE_ENV || 'development'}`);
console.log(`📍 监听端口: ${port}`);
console.log(`🌐 CORS 来源: ${corsOrigin}`);
console.log(`🗄️  数据库: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || '未配置'}`);

// 验证数据库连接（schema 同步在构建阶段由 zeabur.json 处理）
import { syncDatabase } from './lib/db/sync.js';
try {
  await syncDatabase();
} catch (error) {
  console.error('Failed to connect to database:', error);
  process.exit(1); // 数据库连接失败时退出
}

// 初始化数据库种子数据
import { bootstrapDatabase } from './lib/db/bootstrap.js';
try {
  await bootstrapDatabase();
} catch (error) {
  console.error('Failed to bootstrap database:', error);
}

// 任务处理模式：
// - WORKER_MODE=standalone: 独立 Worker 进程处理（需要单独启动 npm run worker）
// - WORKER_MODE=embedded: API 进程内处理（默认，和以前一样）
import { recoverPendingTasks, startWorkerMode, stopPolling } from './lib/tasks/index.js';
const workerMode = process.env.WORKER_MODE || 'embedded';

try {
  if (workerMode === 'embedded') {
    // 嵌入模式：API 进程内启动 Worker
    await startWorkerMode();
    console.log(`📋 任务处理已启动（嵌入模式）`);
    registerShutdownResource('stopTasks', stopPolling);
  } else {
    // 独立模式：只恢复任务状态，不启动轮询
    const recoveredCount = await recoverPendingTasks();
    if (recoveredCount > 0) {
      console.log(`📋 恢复了 ${recoveredCount} 个中断的任务（等待 Worker 处理）`);
    }
    console.log(`📋 任务处理模式：独立 Worker（需单独启动 npm run worker）`);
  }
} catch (error) {
  console.error('Failed to initialize task processing:', error);
}

// 注册数据库断开连接函数
registerShutdownResource('disconnectDb', () => prisma.$disconnect());

// 启动服务器
const server = serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`✅ 服务已启动: http://localhost:${info.port}`);
});

// 注册服务器实例（用于优雅关闭）
registerShutdownResource('server', server);

export default app;
