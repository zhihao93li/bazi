/**
 * 八字算命 API 服务入口
 * 
 * 基于 Hono 框架的纯后端 API 服务
 */

import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// 路由导入
import { authRoutes } from './routes/auth.js';
import { baziRoutes } from './routes/bazi.js';
import { fortuneRoutes } from './routes/fortune.js';
import { paymentRoutes } from './routes/payment.js';
import { pointsRoutes } from './routes/points.js';
import { reportsRoutes } from './routes/reports.js';
import { subjectsRoutes } from './routes/subjects.js';
import { themesRoutes } from './routes/themes.js';

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
console.log(`📍 监听端口: ${port}`);
console.log(`🌐 CORS 来源: ${corsOrigin}`);

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

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`✅ 服务已启动: http://localhost:${info.port}`);
});

export default app;
