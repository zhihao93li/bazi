/**
 * 优雅关闭模块
 *
 * 处理 SIGTERM/SIGINT 信号，确保服务正确关闭：
 * 1. 停止接收新请求
 * 2. 等待现有请求完成
 * 3. 停止后台任务
 * 4. 关闭数据库连接
 */

import type { Server } from 'node:http';

// 关闭状态
let isShuttingDown = false;

// 需要关闭的资源
interface ShutdownResources {
  server?: Server;
  stopTasks?: () => void;
  disconnectDb?: () => Promise<void>;
}

const resources: ShutdownResources = {};

/**
 * 注册需要关闭的资源
 */
export function registerShutdownResource(key: keyof ShutdownResources, resource: unknown): void {
  (resources as Record<string, unknown>)[key] = resource;
}

/**
 * 检查是否正在关闭
 */
export function isShutdown(): boolean {
  return isShuttingDown;
}

/**
 * 执行优雅关闭
 */
async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    console.log(`[Shutdown] Already shutting down, ignoring ${signal}`);
    return;
  }

  isShuttingDown = true;
  console.log(`\n🛑 收到 ${signal} 信号，开始优雅关闭...`);

  const shutdownTimeout = parseInt(process.env.SHUTDOWN_TIMEOUT || '30000', 10);

  // 设置强制退出超时
  const forceExitTimer = setTimeout(() => {
    console.error('⚠️  关闭超时，强制退出');
    process.exit(1);
  }, shutdownTimeout);

  try {
    // 1. 停止接收新请求
    if (resources.server) {
      console.log('  → 停止接收新请求...');
      await new Promise<void>((resolve, reject) => {
        resources.server!.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log('  ✓ HTTP 服务器已关闭');
    }

    // 2. 停止后台任务（任务轮询）
    if (resources.stopTasks) {
      console.log('  → 停止后台任务...');
      resources.stopTasks();
      console.log('  ✓ 后台任务已停止');
    }

    // 3. 等待一小段时间让进行中的请求完成
    console.log('  → 等待进行中的请求完成...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 4. 关闭数据库连接
    if (resources.disconnectDb) {
      console.log('  → 关闭数据库连接...');
      await resources.disconnectDb();
      console.log('  ✓ 数据库连接已关闭');
    }

    clearTimeout(forceExitTimer);
    console.log('✅ 优雅关闭完成');
    process.exit(0);

  } catch (error) {
    console.error('❌ 关闭过程中出错:', error);
    clearTimeout(forceExitTimer);
    process.exit(1);
  }
}

/**
 * 设置优雅关闭信号处理
 */
export function setupGracefulShutdown(): void {
  // 处理 SIGTERM（Kubernetes/Docker 停止信号）
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  // 处理 SIGINT（Ctrl+C）
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // 处理未捕获的异常
  process.on('uncaughtException', (error) => {
    console.error('❌ 未捕获的异常:', error);
    gracefulShutdown('uncaughtException');
  });

  // 处理未处理的 Promise 拒绝
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ 未处理的 Promise 拒绝:', reason);
    // 不立即退出，只记录警告
  });

  console.log('🔒 优雅关闭处理已启用');
}
