# Design Document: 八字命理分析应用

## Overview

本设计文档描述了一个基于 Next.js 15 的中国传统命理分析应用的技术架构和实现方案。系统采用模块化架构，将认证、积分、支付、命理计算、AI 分析等功能分离为独立模块，便于后期扩展。

### 技术栈

- **前端框架**: Next.js 15 (App Router)
- **UI 组件**: Aceternity UI + Tailwind CSS v4
- **数据库**: PostgreSQL
- **ORM**: Prisma
- **认证**: NextAuth.js (Credentials Provider)
- **命理计算**: lunar-typescript
- **AI 服务**: OpenAI API / 其他 LLM 提供商
- **支付**: 支付宝 SDK (alipay-sdk)
- **短信服务**: 阿里云短信 / 腾讯云短信

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js Application                       │
├─────────────────────────────────────────────────────────────────┤
│  Pages/Components (Aceternity UI + Tailwind CSS)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │  Auth    │ │  Bazi    │ │  Points  │ │  Payment │           │
│  │  Pages   │ │  Pages   │ │  Pages   │ │  Pages   │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
├─────────────────────────────────────────────────────────────────┤
│  API Routes (Route Handlers)                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ /api/auth│ │/api/bazi │ │/api/points│ │/api/pay │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
├─────────────────────────────────────────────────────────────────┤
│  Service Layer                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │  Auth    │ │  Bazi    │ │  Points  │ │ Payment  │ │   AI   ││
│  │ Service  │ │ Engine   │ │ Service  │ │ Service  │ │Service ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘│
├─────────────────────────────────────────────────────────────────┤
│  Data Access Layer (Prisma ORM)                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    PostgreSQL Database                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

External Services:
┌──────────┐ ┌──────────┐ ┌──────────┐
│   SMS    │ │  Alipay  │ │   LLM    │
│ Provider │ │   Pay    │ │   API    │
└──────────┘ └──────────┘ └──────────┘
```

## Components and Interfaces

### 1. Auth Module (认证模块)

```typescript
// types/auth.ts
interface User {
  id: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}

interface VerificationCode {
  id: string;
  phone: string;
  code: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

interface AuthService {
  sendVerificationCode(phone: string): Promise<{ success: boolean; message: string }>;
  verifyCode(phone: string, code: string): Promise<{ success: boolean; user?: User; token?: string }>;
  validatePhoneFormat(phone: string): boolean;
}
```

**实现要点**:
- 使用 NextAuth.js Credentials Provider 实现手机号+验证码登录
- 验证码存储在数据库中，设置5分钟过期时间
- 实现60秒发送间隔限制和5次错误锁定机制
- 首次注册自动赠送初始积分

### 2. Bazi Engine (八字排盘引擎)

```typescript
// types/bazi.ts
interface BirthInfo {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute?: number;
  isLunar: boolean;  // 是否农历
  gender: 'male' | 'female';
  birthPlace?: string;
}

interface Pillar {
  heavenlyStem: string;   // 天干
  earthlyBranch: string;  // 地支
  hiddenStems: string[];  // 藏干
  naYin: string;          // 纳音
}

interface BaziChart {
  yearPillar: Pillar;     // 年柱
  monthPillar: Pillar;    // 月柱
  dayPillar: Pillar;      // 日柱
  hourPillar: Pillar;     // 时柱
  dayMaster: string;      // 日主
  fiveElements: FiveElementsDistribution;
  tenGods: TenGodsRelation[];
  majorFortune: MajorFortune[];  // 大运
  yearlyFortune: YearlyFortune[]; // 流年
}

interface FiveElementsDistribution {
  metal: number;   // 金
  wood: number;    // 木
  water: number;   // 水
  fire: number;    // 火
  earth: number;   // 土
  strongest: string;
  weakest: string;
}

interface TenGodsRelation {
  position: string;
  tenGod: string;  // 十神：正官、偏官、正印、偏印、比肩、劫财、食神、伤官、正财、偏财
  element: string;
}

interface BaziEngine {
  calculate(birthInfo: BirthInfo): BaziChart;
  convertToLunar(solarDate: Date): LunarDate;
  convertToSolar(lunarDate: LunarDate): Date;
}
```

**实现要点**:
- 基于 lunar-typescript 库实现核心计算
- 参考 human_design2 项目的计算逻辑
- 支持公历/农历转换
- 计算完整的八字四柱、五行分布、十神关系
- 计算大运和流年信息

### 3. AI Service (AI 分析服务)

```typescript
// types/ai.ts
interface AIConfig {
  provider: string;       // openai, anthropic, etc.
  model: string;
  temperature: number;
  maxTokens: number;
  prompts: {
    personality: string;
    career: string;
    wealth: string;
    relationship: string;
    health: string;
    overall: string;
  };
}

interface FortuneReport {
  id: string;
  userId: string;
  baziChart: BaziChart;
  analysis: {
    personality: string;
    career: string;
    wealth: string;
    relationship: string;
    health: string;
    overall: string;
    suggestions: string[];
  };
  createdAt: Date;
}

interface AIService {
  loadConfig(): AIConfig;
  generateAnalysis(baziChart: BaziChart, section: string): Promise<string>;
  generateFullReport(baziChart: BaziChart): Promise<FortuneReport>;
}
```

**实现要点**:
- 从 YAML 配置文件加载 prompt 模板和 AI 参数
- 支持变量占位符动态插入八字数据
- 支持热加载配置
- 分模块生成分析内容

### 4. Points Service (积分服务)

```typescript
// types/points.ts
interface PointsAccount {
  id: string;
  userId: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PointsTransaction {
  id: string;
  userId: string;
  type: 'recharge' | 'consume' | 'gift';
  amount: number;
  balance: number;  // 变动后余额
  description: string;
  relatedOrderId?: string;
  createdAt: Date;
}

interface PointsService {
  getBalance(userId: string): Promise<number>;
  getTransactions(userId: string, page: number, limit: number): Promise<PointsTransaction[]>;
  addPoints(userId: string, amount: number, type: string, description: string, orderId?: string): Promise<PointsAccount>;
  deductPoints(userId: string, amount: number, description: string): Promise<{ success: boolean; balance?: number }>;
}
```

**实现要点**:
- 使用数据库事务确保积分操作原子性
- 记录完整的积分变动明细
- 实现余额不足检查

### 5. Payment Service (支付服务)

```typescript
// types/payment.ts
interface PaymentOrder {
  id: string;
  userId: string;
  orderNo: string;
  amount: number;        // 金额（分）
  points: number;        // 对应积分
  paymentMethod: 'alipay_qrcode' | 'alipay_h5';  // 支付宝扫码 或 H5支付
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  transactionId?: string;
  qrCodeUrl?: string;    // PC端二维码URL
  h5PayUrl?: string;     // 移动端H5支付URL
  createdAt: Date;
  paidAt?: Date;
}

interface PaymentService {
  createOrder(userId: string, packageId: string, platform: 'pc' | 'mobile'): Promise<{ 
    orderNo: string; 
    qrCodeUrl?: string;   // PC端返回二维码
    h5PayUrl?: string;    // 移动端返回H5支付链接
  }>;
  handleCallback(data: any): Promise<{ success: boolean; orderNo?: string }>;
  queryOrder(orderNo: string): Promise<PaymentOrder>;
  refund(orderNo: string, reason: string): Promise<{ success: boolean }>;
}

interface PointsPackage {
  id: string;
  name: string;
  points: number;
  price: number;  // 金额（分）
  isActive: boolean;
}
```

**实现要点**:
- 集成支付宝 SDK（alipay-sdk）
- PC端：使用当面付（扫码支付）生成二维码
- 移动端：使用手机网站支付（H5支付）跳转支付宝
- 实现签名验证确保回调安全
- 处理支付超时和重复回调
- 支付成功后自动增加积分

## Data Models

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id              String            @id @default(cuid())
  phone           String            @unique
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  pointsAccount   PointsAccount?
  transactions    PointsTransaction[]
  orders          PaymentOrder[]
  reports         FortuneReport[]
  verificationCodes VerificationCode[]
}

model VerificationCode {
  id        String   @id @default(cuid())
  phone     String
  code      String
  expiresAt DateTime
  attempts  Int      @default(0)
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  
  user      User?    @relation(fields: [phone], references: [phone])
  
  @@index([phone, createdAt])
}

model PointsAccount {
  id        String   @id @default(cuid())
  userId    String   @unique
  balance   Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user      User     @relation(fields: [userId], references: [id])
}

model PointsTransaction {
  id          String   @id @default(cuid())
  userId      String
  type        String   // recharge, consume, gift
  amount      Int
  balance     Int      // 变动后余额
  description String
  orderId     String?
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id])
  
  @@index([userId, createdAt])
}

model PaymentOrder {
  id            String    @id @default(cuid())
  userId        String
  orderNo       String    @unique
  amount        Int       // 金额（分）
  points        Int       // 对应积分
  paymentMethod String    // alipay_qrcode (PC扫码), alipay_h5 (移动端H5)
  status        String    @default("pending") // pending, paid, failed, refunded
  transactionId String?
  qrCodeUrl     String?   // PC端二维码URL
  createdAt     DateTime  @default(now())
  paidAt        DateTime?
  
  user          User      @relation(fields: [userId], references: [id])
  
  @@index([userId, createdAt])
  @@index([orderNo])
}

model PointsPackage {
  id       String  @id @default(cuid())
  name     String
  points   Int
  price    Int     // 金额（分）
  isActive Boolean @default(true)
  sortOrder Int    @default(0)
}

model FortuneReport {
  id          String   @id @default(cuid())
  userId      String
  birthInfo   Json     // 出生信息
  baziChart   Json     // 八字排盘结果
  analysis    Json     // AI 分析结果
  pointsCost  Int      // 消耗积分
  createdAt   DateTime @default(now())
  deletedAt   DateTime? // 软删除
  
  user        User     @relation(fields: [userId], references: [id])
  
  @@index([userId, createdAt])
}
```

### AI 配置文件结构

```yaml
# config/ai-prompts.yaml

provider: openai
model: gpt-4o
temperature: 0.7
maxTokens: 2000

prompts:
  personality: |
    你是一位资深的命理分析师。请根据以下八字信息分析此人的性格特点：
    
    八字四柱：
    - 年柱：{{yearPillar.heavenlyStem}}{{yearPillar.earthlyBranch}}
    - 月柱：{{monthPillar.heavenlyStem}}{{monthPillar.earthlyBranch}}
    - 日柱：{{dayPillar.heavenlyStem}}{{dayPillar.earthlyBranch}}
    - 时柱：{{hourPillar.heavenlyStem}}{{hourPillar.earthlyBranch}}
    
    日主：{{dayMaster}}
    五行分布：金{{fiveElements.metal}}、木{{fiveElements.wood}}、水{{fiveElements.water}}、火{{fiveElements.fire}}、土{{fiveElements.earth}}
    
    请从以下方面分析性格特点：
    1. 核心性格特征
    2. 优势与长处
    3. 需要注意的方面
    
  career: |
    # 事业运势分析 prompt...
    
  wealth: |
    # 财运分析 prompt...
    
  relationship: |
    # 感情运势 prompt...
    
  health: |
    # 健康建议 prompt...
    
  overall: |
    # 综合分析 prompt...
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*



### Property 1: 手机号格式验证

*For any* 字符串输入，如果该字符串不符合中国大陆手机号格式（1开头的11位数字，第二位为3-9），THE Auth_Service SHALL 返回格式错误。

**Validates: Requirements 1.6**

### Property 2: 验证码生成与验证 Round-Trip

*For any* 有效的中国手机号，生成验证码后使用该验证码进行验证，验证应该通过。

**Validates: Requirements 1.1, 1.3**

### Property 3: 验证码发送频率限制

*For any* 手机号，在60秒内重复请求验证码，第二次及之后的请求应该被拒绝。

**Validates: Requirements 1.2**

### Property 4: 验证码错误次数锁定

*For any* 手机号，连续输入错误验证码5次后，该手机号应该被锁定，后续验证请求应该被拒绝。

**Validates: Requirements 1.4**

### Property 5: 验证码过期失效

*For any* 验证码，超过5分钟后使用该验证码进行验证，验证应该失败。

**Validates: Requirements 1.5**

### Property 6: JWT Token 有效性

*For any* 成功登录的用户，生成的 JWT Token 应该是有效的 JWT 格式，且包含正确的用户信息。

**Validates: Requirements 1.7**

### Property 7: 首次注册积分赠送

*For any* 新注册的用户，注册成功后查询积分余额应该等于初始赠送值。

**Validates: Requirements 1.8**

### Property 8: 八字计算完整性

*For any* 有效的出生信息（日期、时间、性别），THE Bazi_Engine SHALL 返回包含年柱、月柱、日柱、时柱的完整八字，每柱包含天干和地支，同时返回五行分布和十神关系。

**Validates: Requirements 2.1, 2.3, 2.4, 2.5**

### Property 9: 公历农历转换 Round-Trip

*For any* 有效的公历日期，转换为农历再转回公历应该得到原始日期。

**Validates: Requirements 2.2**

### Property 10: 五行分布总数不变性

*For any* 八字计算结果，五行分布中金木水火土的总数应该等于8（四柱八字对应的五行数量）。

**Validates: Requirements 2.4**

### Property 11: 大运排列正确性

*For any* 出生信息，大运应该根据性别和年干阴阳正确排列（阳年男命/阴年女命顺排，阴年男命/阳年女命逆排）。

**Validates: Requirements 2.6**

### Property 12: 八字序列化 Round-Trip

*For any* 八字计算结果，序列化为 JSON 后再反序列化应该得到等价的对象。

**Validates: Requirements 2.8**

### Property 13: 命理报告结构完整性

*For any* 生成的命理报告，应该包含性格分析、事业运势、财运分析、感情运势等所有必需模块。

**Validates: Requirements 3.2**

### Property 14: 积分不足拒绝分析

*For any* 积分余额不足的用户，请求命理分析应该返回积分不足错误，且不生成报告。

**Validates: Requirements 3.4**

### Property 15: 分析完成扣除积分

*For any* 成功完成的命理分析，用户积分余额应该减少相应的消耗数量。

**Validates: Requirements 3.5**

### Property 16: 报告保存到历史记录

*For any* 成功生成的命理报告，应该能在用户的历史记录中查询到该报告。

**Validates: Requirements 3.7**

### Property 17: AI 配置解析完整性

*For any* 有效的 YAML 配置文件，THE AI_Service SHALL 正确解析出所有模块的 prompt 模板、模型参数、提供商和模型名称。

**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

### Property 18: Prompt 变量替换完整性

*For any* 包含占位符的 prompt 模板和对应的八字数据，变量替换后的结果不应该包含任何未替换的占位符。

**Validates: Requirements 9.6**

### Property 19: 配置错误回退默认值

*For any* 格式错误的配置文件，THE AI_Service SHALL 返回默认配置而不是抛出异常。

**Validates: Requirements 9.7**

### Property 20: 积分查询返回完整信息

*For any* 用户的积分查询请求，返回结果应该包含当前余额和积分变动明细列表。

**Validates: Requirements 4.2**

### Property 21: 积分变动记录完整性

*For any* 积分变动操作（充值、消费、赠送），应该能查询到包含变动类型、数量、时间的完整记录。

**Validates: Requirements 4.3, 4.4**

### Property 22: 积分余额不足拒绝扣款

*For any* 扣款金额大于当前余额的扣款请求，应该返回余额不足错误，且余额保持不变。

**Validates: Requirements 4.5**

### Property 23: 积分操作原子性

*For any* 并发的积分操作序列，最终余额应该等于初始余额加上所有操作的累加结果（无丢失更新）。

**Validates: Requirements 4.6**

### Property 24: 支付订单创建完整性

*For any* 有效的充值请求，创建的订单应该包含唯一订单号和必要的支付参数。

**Validates: Requirements 5.2, 5.7**

### Property 25: 支付签名验证

*For any* 支付回调请求，签名验证通过则处理，签名验证失败则拒绝处理。

**Validates: Requirements 5.3, 5.5**

### Property 26: 支付成功增加积分

*For any* 支付验证通过的订单，用户积分应该增加对应套餐的积分数量。

**Validates: Requirements 5.4**

### Property 27: 订单号唯一性

*For any* 数量的订单创建请求，生成的订单号应该都不相同。

**Validates: Requirements 5.7**

### Property 28: 支付回调幂等性

*For any* 重复的支付成功回调，积分只应该增加一次。

**Validates: Requirements 5.8**

### Property 29: 历史记录用户隔离

*For any* 用户的历史记录查询，返回结果应该只包含该用户自己的报告，不包含其他用户的报告。

**Validates: Requirements 6.1**

### Property 30: 历史记录时间倒序

*For any* 历史记录查询结果，记录应该按创建时间倒序排列。

**Validates: Requirements 6.2**

### Property 31: 软删除保留数据

*For any* 删除的历史记录，该记录不应该出现在用户查询结果中，但数据库中应该仍然存在且标记为已删除。

**Validates: Requirements 6.4, 6.5**

### Property 32: 敏感数据加密存储

*For any* 存储的敏感用户数据（如手机号），数据库中存储的值应该是加密后的密文，而非明文。

**Validates: Requirements 7.3**

### Property 33: 事务回滚一致性

*For any* 失败的数据库事务，所有在该事务中的操作应该全部回滚，数据库状态应该与事务开始前一致。

**Validates: Requirements 7.5**

## Page Layout Design

### 页面结构

```
┌─────────────────────────────────────────────────────────────────┐
│                         Header (导航栏)                          │
│  Logo    首页    八字排盘    历史记录    积分充值    用户中心     │
└─────────────────────────────────────────────────────────────────┘

页面列表：
├── / (首页)
│   └── Hero Section + 功能介绍 + CTA
├── /login (登录页)
│   └── 手机号输入 + 验证码登录
├── /bazi (八字排盘页)
│   ├── 出生信息表单
│   ├── 排盘结果展示
│   └── AI 分析报告
├── /history (历史记录页)
│   └── 报告列表 + 详情查看
├── /points (积分中心)
│   ├── 余额展示
│   ├── 充值套餐
│   └── 积分明细
└── /profile (用户中心)
    └── 个人信息 + 设置
```

### 首页布局 (/)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Hero Section                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │     探索你的命运密码                                      │    │
│  │     基于传统八字命理的 AI 智能分析                        │    │
│  │     [开始测算] 按钮                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                      功能特点 (3列卡片)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ 精准排盘  │  │ AI 解读  │  │ 历史记录  │                      │
│  │ 基于传统  │  │ 智能分析  │  │ 随时回顾  │                      │
│  │ 命理算法  │  │ 深度解读  │  │ 永久保存  │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
├─────────────────────────────────────────────────────────────────┤
│                         Footer                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 八字排盘页 (/bazi)

```
┌─────────────────────────────────────────────────────────────────┐
│                      出生信息输入表单                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  日期类型: [公历] [农历]                                  │    │
│  │  出生日期: [年] [月] [日]                                 │    │
│  │  出生时间: [时辰选择]                                     │    │
│  │  性别:     [男] [女]                                      │    │
│  │  出生地点: [省市选择] (可选)                              │    │
│  │                          [开始排盘]                       │    │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                      八字排盘结果                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │     年柱        月柱        日柱        时柱              │    │
│  │   ┌─────┐    ┌─────┐    ┌─────┐    ┌─────┐            │    │
│  │   │ 甲  │    │ 丙  │    │ 戊  │    │ 庚  │  天干      │    │
│  │   │ 子  │    │ 寅  │    │ 辰  │    │ 午  │  地支      │    │
│  │   └─────┘    └─────┘    └─────┘    └─────┘            │    │
│  │                                                          │    │
│  │  五行分布: 金(2) 木(1) 水(2) 火(1) 土(2)                 │    │
│  │  日主: 戊土                                               │    │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                      AI 命理分析                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  [性格分析] [事业运势] [财运分析] [感情运势] [综合建议]   │    │
│  │  ─────────────────────────────────────────────────────   │    │
│  │  分析内容展示区域...                                      │    │
│  │                                                          │    │
│  │  消耗积分: 50    当前余额: 150                           │    │
│  │                          [生成分析] [导出PDF]            │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 积分中心页 (/points)

```
┌─────────────────────────────────────────────────────────────────┐
│                      积分余额                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  当前积分: 150                                            │    │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                      充值套餐                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  100积分  │  │  500积分  │  │ 1000积分  │  │ 2000积分  │       │
│  │   ¥10    │  │   ¥45    │  │   ¥80    │  │  ¥150    │       │
│  │  [购买]   │  │  [购买]   │  │  [购买]   │  │  [购买]   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
├─────────────────────────────────────────────────────────────────┤
│                      积分明细                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  时间          类型      数量      余额      说明        │    │
│  │  2026-01-09   消费      -50       150      命理分析     │    │
│  │  2026-01-08   充值      +100      200      套餐购买     │    │
│  │  2026-01-07   赠送      +100      100      注册赠送     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Aceternity UI 组件使用

推荐使用的 Aceternity UI 组件：
- **Background Beams**: 首页 Hero 背景效果
- **Spotlight**: 功能卡片高亮效果
- **Moving Border**: 按钮边框动画
- **Card Hover Effect**: 套餐卡片悬停效果
- **Tabs**: 分析报告模块切换
- **Text Generate Effect**: 分析结果打字机效果
- **Sidebar**: 移动端导航

## SMS Service Integration (短信服务集成)

### 推荐方案：阿里云短信服务

阿里云短信是国内最成熟的短信服务之一，提供官方 Node.js SDK。

**SDK 安装**:
```bash
npm install @alicloud/dysmsapi20170525 @alicloud/openapi-client
```

**配置要求**:
1. 注册阿里云账号并开通短信服务
2. 创建 AccessKey（建议使用 RAM 子账号）
3. 申请短信签名（如：【八字命理】）
4. 申请短信模板（如：验证码模板）

**环境变量配置**:
```env
ALIYUN_ACCESS_KEY_ID=your_access_key_id
ALIYUN_ACCESS_KEY_SECRET=your_access_key_secret
ALIYUN_SMS_SIGN_NAME=八字命理
ALIYUN_SMS_TEMPLATE_CODE=SMS_123456789
```

**服务封装示例**:
```typescript
// lib/sms/aliyun-sms.ts
import Dysmsapi20170525, * as $Dysmsapi20170525 from '@alicloud/dysmsapi20170525';
import * as $OpenApi from '@alicloud/openapi-client';

export class AliyunSmsService {
  private client: Dysmsapi20170525;

  constructor() {
    const config = new $OpenApi.Config({
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
      endpoint: 'dysmsapi.aliyuncs.com',
    });
    this.client = new Dysmsapi20170525(config);
  }

  async sendVerificationCode(phone: string, code: string): Promise<boolean> {
    const request = new $Dysmsapi20170525.SendSmsRequest({
      phoneNumbers: phone,
      signName: process.env.ALIYUN_SMS_SIGN_NAME,
      templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE,
      templateParam: JSON.stringify({ code }),
    });

    try {
      const response = await this.client.sendSms(request);
      return response.body.code === 'OK';
    } catch (error) {
      console.error('SMS send failed:', error);
      return false;
    }
  }
}
```

### 备选方案：腾讯云短信

如果选择腾讯云短信，使用 `tencentcloud-sdk-nodejs` SDK：

```bash
npm install tencentcloud-sdk-nodejs
```

### 短信服务抽象接口

为了支持多个短信服务商，设计统一接口：

```typescript
// lib/sms/types.ts
export interface SmsProvider {
  sendVerificationCode(phone: string, code: string): Promise<boolean>;
}

// lib/sms/index.ts
import { AliyunSmsService } from './aliyun-sms';
import { TencentSmsService } from './tencent-sms';

export function createSmsProvider(): SmsProvider {
  const provider = process.env.SMS_PROVIDER || 'aliyun';
  
  switch (provider) {
    case 'aliyun':
      return new AliyunSmsService();
    case 'tencent':
      return new TencentSmsService();
    default:
      throw new Error(`Unknown SMS provider: ${provider}`);
  }
}
```

## Error Handling

### 认证模块错误处理

| 错误场景 | 错误码 | 处理方式 |
|---------|-------|---------|
| 手机号格式错误 | AUTH_INVALID_PHONE | 返回400，提示格式要求 |
| 验证码发送频率限制 | AUTH_RATE_LIMITED | 返回429，提示剩余等待时间 |
| 验证码错误 | AUTH_INVALID_CODE | 返回401，提示剩余尝试次数 |
| 手机号被锁定 | AUTH_PHONE_LOCKED | 返回403，提示解锁时间 |
| 验证码过期 | AUTH_CODE_EXPIRED | 返回401，提示重新获取 |
| SMS 服务异常 | AUTH_SMS_ERROR | 返回500，记录日志，提示稍后重试 |

### 八字计算错误处理

| 错误场景 | 错误码 | 处理方式 |
|---------|-------|---------|
| 日期格式错误 | BAZI_INVALID_DATE | 返回400，提示正确格式 |
| 日期超出范围 | BAZI_DATE_OUT_OF_RANGE | 返回400，提示支持的日期范围 |
| 时辰无效 | BAZI_INVALID_HOUR | 返回400，提示有效时辰范围 |

### 积分模块错误处理

| 错误场景 | 错误码 | 处理方式 |
|---------|-------|---------|
| 余额不足 | POINTS_INSUFFICIENT | 返回402，提示当前余额和所需积分 |
| 并发冲突 | POINTS_CONFLICT | 重试操作，最多3次 |

### 支付模块错误处理

| 错误场景 | 错误码 | 处理方式 |
|---------|-------|---------|
| 签名验证失败 | PAY_INVALID_SIGNATURE | 返回403，记录异常日志 |
| 订单不存在 | PAY_ORDER_NOT_FOUND | 返回404 |
| 订单已处理 | PAY_ORDER_PROCESSED | 返回200，幂等处理 |
| 支付超时 | PAY_TIMEOUT | 更新订单状态为超时 |

### AI 服务错误处理

| 错误场景 | 错误码 | 处理方式 |
|---------|-------|---------|
| 配置文件错误 | AI_CONFIG_ERROR | 使用默认配置，记录警告日志 |
| AI 服务超时 | AI_TIMEOUT | 返回503，提示稍后重试 |
| AI 服务异常 | AI_SERVICE_ERROR | 返回500，记录错误日志 |

## Testing Strategy

### 测试框架选择

- **单元测试**: Vitest
- **属性测试**: fast-check
- **集成测试**: Vitest + Prisma Test Environment
- **E2E 测试**: Playwright (可选)

### 测试分层

```
┌─────────────────────────────────────────┐
│           E2E Tests (Playwright)        │  <- 关键用户流程
├─────────────────────────────────────────┤
│        Integration Tests (Vitest)       │  <- API 端点测试
├─────────────────────────────────────────┤
│    Property Tests (fast-check)          │  <- 核心业务逻辑
├─────────────────────────────────────────┤
│         Unit Tests (Vitest)             │  <- 工具函数、边界情况
└─────────────────────────────────────────┘
```

### 属性测试配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### 属性测试示例

```typescript
// 每个属性测试至少运行100次迭代
import { fc } from 'fast-check';

// Feature: bazi-fortune, Property 2: 验证码生成与验证 Round-Trip
test.prop([validPhoneArbitrary])('验证码生成与验证 round-trip', async (phone) => {
  const code = await authService.sendVerificationCode(phone);
  const result = await authService.verifyCode(phone, code);
  expect(result.success).toBe(true);
}, { numRuns: 100 });
```

### 单元测试与属性测试的平衡

- **单元测试**: 用于测试具体示例、边界情况和错误条件
- **属性测试**: 用于验证通用属性，覆盖大量随机输入
- 两者互补，共同确保代码正确性

### 测试覆盖目标

- 核心业务逻辑: 90%+ 覆盖率
- API 端点: 80%+ 覆盖率
- 工具函数: 100% 覆盖率
