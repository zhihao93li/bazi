import dotenvFlow from "dotenv-flow";
dotenvFlow.config({
  node_env: process.env.NODE_ENV || 'development',
});
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __pgPool: pg.Pool | undefined;
}

function getPool(): pg.Pool {
  if (!global.__pgPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    // 连接池配置（可通过环境变量覆盖）
    const poolConfig: pg.PoolConfig = {
      connectionString,
      // 最大连接数（默认 20，支持 50 并发足够）
      max: parseInt(process.env.DATABASE_POOL_MAX || '20', 10),
      // 空闲连接超时（毫秒）
      idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000', 10),
      // 连接超时（毫秒）
      connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '5000', 10),
    };

    global.__pgPool = new pg.Pool(poolConfig);

    // 连接池错误处理
    global.__pgPool.on('error', (err) => {
      console.error('[Database Pool] Unexpected error:', err.message);
    });

    console.log(`[Database Pool] Initialized with max=${poolConfig.max} connections`);
  }
  return global.__pgPool;
}

function createPrismaClient(): PrismaClient {
  const pool = getPool();
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

// Use a getter to ensure fresh client creation if needed
const prisma: PrismaClient = (() => {
  if (process.env.NODE_ENV === "production") {
    return createPrismaClient();
  }

  if (!global.__prisma) {
    global.__prisma = createPrismaClient();
  }
  return global.__prisma;
})();

export { prisma };
export default prisma;
