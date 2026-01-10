import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
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
    global.__pgPool = new pg.Pool({ connectionString });
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
