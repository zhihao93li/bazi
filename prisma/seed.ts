import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

/**
 * 积分套餐初始数据
 * 根据设计文档中的积分中心页布局定义
 * 价格单位为分（人民币）
 */
const pointsPackages = [
  {
    name: "入门套餐",
    points: 100,
    price: 1000,      // ¥10
    isActive: true,
    sortOrder: 1,
  },
  {
    name: "标准套餐",
    points: 500,
    price: 4500,      // ¥45
    isActive: true,
    sortOrder: 2,
  },
  {
    name: "超值套餐",
    points: 1000,
    price: 8000,      // ¥80
    isActive: true,
    sortOrder: 3,
  },
  {
    name: "尊享套餐",
    points: 2000,
    price: 15000,     // ¥150
    isActive: true,
    sortOrder: 4,
  },
];

async function main() {
  console.log("开始创建积分套餐数据...");

  for (const pkg of pointsPackages) {
    const existing = await prisma.pointsPackage.findFirst({
      where: { name: pkg.name },
    });

    if (existing) {
      console.log(`套餐 "${pkg.name}" 已存在，跳过创建`);
      continue;
    }

    const created = await prisma.pointsPackage.create({
      data: pkg,
    });
    console.log(`创建套餐: ${created.name} - ${created.points}积分 / ¥${created.price / 100}`);
  }

  console.log("积分套餐数据创建完成！");
}

main()
  .catch((e) => {
    console.error("创建积分套餐数据失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
