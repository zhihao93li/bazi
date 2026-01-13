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
 * 主题价格配置初始数据
 * 定义各 AI 解读主题的积分价格
 */
const themePricingData = [
  {
    theme: "life_color",
    name: "生命底色",
    description: "探索你的生命本质与核心特质",
    price: 50,
    isActive: true,
    sortOrder: 1,
  },
  {
    theme: "relationship",
    name: "亲密关系",
    description: "解读情感模式与亲密关系运势",
    price: 30,
    isActive: true,
    sortOrder: 2,
  },
  {
    theme: "career_wealth",
    name: "事业财富",
    description: "分析事业发展与财富机遇",
    price: 30,
    isActive: true,
    sortOrder: 3,
  },
  {
    theme: "health",
    name: "身心健康",
    description: "关注身体健康与心理平衡",
    price: 30,
    isActive: true,
    sortOrder: 4,
  },
  {
    theme: "life_lesson",
    name: "人生课题",
    description: "洞察生命成长与人生使命",
    price: 30,
    isActive: true,
    sortOrder: 5,
  },
  {
    theme: "yearly_fortune",
    name: "流年解读",
    description: "当年运势分析与趋吉避凶",
    price: 40,
    isActive: true,
    sortOrder: 6,
  },
];

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
  // 创建主题价格配置
  console.log("开始创建主题价格配置...");
  
  for (const theme of themePricingData) {
    const existing = await prisma.themePricing.findFirst({
      where: { theme: theme.theme },
    });

    if (existing) {
      // 更新已存在的配置
      await prisma.themePricing.update({
        where: { theme: theme.theme },
        data: theme,
      });
      console.log(`更新主题价格: ${theme.name} - ${theme.price}积分`);
    } else {
      await prisma.themePricing.create({
        data: theme,
      });
      console.log(`创建主题价格: ${theme.name} - ${theme.price}积分`);
    }
  }
  
  console.log("主题价格配置创建完成！\n");

  // 创建积分套餐
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
