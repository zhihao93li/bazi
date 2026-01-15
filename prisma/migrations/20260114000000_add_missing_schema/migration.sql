-- 添加 User 表缺失的字段
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
ALTER TABLE "User" ALTER COLUMN "phone" DROP NOT NULL;

-- 为 username 创建唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

-- 添加 VerificationCode 表缺失的字段
ALTER TABLE "VerificationCode" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- 添加 PaymentOrder 表缺失的字段
ALTER TABLE "PaymentOrder" ADD COLUMN IF NOT EXISTS "stripeSessionId" TEXT;

-- 为 stripeSessionId 创建索引
CREATE INDEX IF NOT EXISTS "PaymentOrder_stripeSessionId_idx" ON "PaymentOrder"("stripeSessionId");

-- 添加 FortuneReport 表缺失的字段
ALTER TABLE "FortuneReport" ADD COLUMN IF NOT EXISTS "subjectId" TEXT;

-- 为 subjectId 创建索引
CREATE INDEX IF NOT EXISTS "FortuneReport_subjectId_createdAt_idx" ON "FortuneReport"("subjectId", "createdAt");

-- CreateTable Subject (测算对象)
CREATE TABLE IF NOT EXISTS "Subject" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "calendarType" TEXT NOT NULL,
    "birthYear" INTEGER NOT NULL,
    "birthMonth" INTEGER NOT NULL,
    "birthDay" INTEGER NOT NULL,
    "birthHour" INTEGER NOT NULL,
    "birthMinute" INTEGER NOT NULL,
    "isLeapMonth" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT NOT NULL,
    "baziData" JSONB,
    "relationship" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "initialAnalysis" JSONB,
    "initialAnalyzedAt" TIMESTAMP(3),

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable ThemeAnalysis (主题解读记录)
CREATE TABLE IF NOT EXISTS "ThemeAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "pointsCost" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThemeAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable ThemePricing (主题价格配置)
CREATE TABLE IF NOT EXISTS "ThemePricing" (
    "id" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ThemePricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for Subject
CREATE INDEX IF NOT EXISTS "Subject_userId_createdAt_idx" ON "Subject"("userId", "createdAt");

-- CreateIndex for ThemeAnalysis
CREATE UNIQUE INDEX IF NOT EXISTS "ThemeAnalysis_subjectId_theme_key" ON "ThemeAnalysis"("subjectId", "theme");
CREATE INDEX IF NOT EXISTS "ThemeAnalysis_userId_subjectId_idx" ON "ThemeAnalysis"("userId", "subjectId");

-- CreateIndex for ThemePricing
CREATE UNIQUE INDEX IF NOT EXISTS "ThemePricing_theme_key" ON "ThemePricing"("theme");

-- AddForeignKey for Subject
ALTER TABLE "Subject" DROP CONSTRAINT IF EXISTS "Subject_userId_fkey";
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey for ThemeAnalysis
ALTER TABLE "ThemeAnalysis" DROP CONSTRAINT IF EXISTS "ThemeAnalysis_userId_fkey";
ALTER TABLE "ThemeAnalysis" ADD CONSTRAINT "ThemeAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ThemeAnalysis" DROP CONSTRAINT IF EXISTS "ThemeAnalysis_subjectId_fkey";
ALTER TABLE "ThemeAnalysis" ADD CONSTRAINT "ThemeAnalysis_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey for FortuneReport.subjectId
ALTER TABLE "FortuneReport" DROP CONSTRAINT IF EXISTS "FortuneReport_subjectId_fkey";
ALTER TABLE "FortuneReport" ADD CONSTRAINT "FortuneReport_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey for VerificationCode.userId
ALTER TABLE "VerificationCode" DROP CONSTRAINT IF EXISTS "VerificationCode_userId_fkey";
ALTER TABLE "VerificationCode" ADD CONSTRAINT "VerificationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 修复 VerificationCode 外键（phone 改为可选关联）
ALTER TABLE "VerificationCode" DROP CONSTRAINT IF EXISTS "VerificationCode_phone_fkey";
