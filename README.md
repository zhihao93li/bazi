# 八字算命 API 服务

基于 Hono 框架的纯后端 API 服务，提供八字排盘和命理分析功能。

## 技术栈

- **框架**: [Hono](https://hono.dev/) - 轻量级、高性能的 Web 框架
- **运行时**: Node.js + TypeScript
- **数据库**: PostgreSQL + [Prisma ORM](https://www.prisma.io/)
- **认证**: JWT (JSON Web Token)
- **AI**: OpenAI API (用于命理分析)

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件并配置以下环境变量：

```env
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/bazi"

# JWT 密钥
JWT_SECRET="your-jwt-secret-key"

# AI 服务
OPENAI_API_KEY="your-openai-api-key"
OPENAI_BASE_URL="https://api.openai.com/v1"

# 短信服务（可选）
SMS_PROVIDER="mock"  # 或 "aliyun"
ALIYUN_SMS_ACCESS_KEY_ID=""
ALIYUN_SMS_ACCESS_KEY_SECRET=""
ALIYUN_SMS_SIGN_NAME=""
ALIYUN_SMS_TEMPLATE_CODE=""

# Stripe 支付配置
STRIPE_SECRET_KEY="sk_test_xxx"      # Stripe 密钥 (测试用 sk_test_, 生产用 sk_live_)
STRIPE_WEBHOOK_SECRET="whsec_xxx"    # Stripe Webhook 签名密钥
FRONTEND_URL="http://localhost:5173" # 前端地址（用于支付回调）

# 其他配置
PORT=3000
CORS_ORIGIN="*"  # 或指定前端域名
INITIAL_GIFT_POINTS=100
NODE_ENV="development"
```

### 3. 初始化数据库

```bash
# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate deploy

# （可选）填充测试数据
npx prisma db seed
```

### 4. 启动服务

```bash
# 开发模式（支持热重载）
npm run dev

# 生产模式
npm run build
npm start
```

服务启动后访问 http://localhost:3000/health 检查服务状态。

## API 接口

### 认证相关

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/send-code` | 发送验证码 |
| POST | `/api/auth/verify` | 验证验证码 |
| POST | `/api/auth/login/phone` | 手机号+验证码登录 |
| POST | `/api/auth/login/password` | 用户名+密码登录 |
| POST | `/api/auth/register` | 用户名密码注册 |
| GET | `/api/auth/me` | 获取当前用户信息 |

### 八字排盘

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/bazi/calculate` | 计算八字排盘 |

### 命理分析

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/fortune/analyze` | AI 运势分析（需登录，消耗积分） |

### 积分系统

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/points` | 获取积分余额和交易记录 |
| GET | `/api/points/packages` | 获取充值套餐列表 |

### 支付

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/payment/create` | 创建支付订单（旧接口） |
| POST | `/api/payment/create-checkout` | 创建 Stripe Checkout Session |
| GET | `/api/payment/status/:orderNo` | 查询订单状态 |
| POST | `/api/payment/webhook` | Stripe Webhook 回调 |
| POST | `/api/payment/mock-confirm` | Mock 支付确认（仅开发环境） |

### 测算对象

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/subjects` | 获取测算对象列表 |
| POST | `/api/subjects` | 创建测算对象 |
| GET | `/api/subjects/:id` | 获取测算对象详情 |
| PUT | `/api/subjects/:id` | 更新测算对象 |
| DELETE | `/api/subjects/:id` | 删除测算对象 |
| GET | `/api/subjects/:id/reports` | 获取测算对象的报告列表 |

### 历史报告

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/reports` | 获取报告列表 |
| GET | `/api/reports/:id` | 获取报告详情 |
| DELETE | `/api/reports/:id` | 删除报告 |

## 认证方式

API 使用 JWT Bearer Token 认证。登录成功后会返回 token，需要在请求头中携带：

```
Authorization: Bearer <your-token>
```

## 开发

```bash
# 运行测试
npm test

# 运行测试（监听模式）
npm run test:watch

# 测试覆盖率
npm run test:coverage
```

## 项目结构

```
src/
├── index.ts              # 应用入口
├── routes/               # API 路由
│   ├── auth.ts          # 认证路由
│   ├── bazi.ts          # 八字排盘路由
│   ├── fortune.ts       # 命理分析路由
│   ├── payment.ts       # 支付路由
│   ├── points.ts        # 积分路由
│   ├── reports.ts       # 报告路由
│   └── subjects.ts      # 测算对象路由
├── middleware/           # 中间件
│   └── auth.ts          # JWT 认证中间件
├── lib/                  # 业务逻辑
│   ├── ai/              # AI 服务
│   ├── auth/            # 认证服务
│   ├── bazi/            # 八字计算
│   ├── payment/         # 支付服务
│   ├── points/          # 积分服务
│   ├── sms/             # 短信服务
│   ├── subject/         # 测算对象服务
│   └── utils/           # 工具函数
├── generated/            # Prisma 生成的代码
└── types/               # TypeScript 类型定义
```

## 部署到 Railway

本项目是前后端分离架构，需要在 Railway 部署两个服务。

### 1. 创建 Railway 项目

1. 登录 [Railway](https://railway.app/)
2. 创建新项目

### 2. 添加 PostgreSQL 数据库

1. 点击 "Add Service" → "Database" → "PostgreSQL"
2. Railway 会自动生成 `DATABASE_URL` 环境变量

### 3. 部署后端服务

1. 点击 "Add Service" → "GitHub Repo" → 选择本仓库
2. 设置 **Root Directory** 为 `/`（留空或根目录）
3. 配置环境变量：

| 变量名 | 说明 |
|--------|------|
| `DATABASE_URL` | 引用 PostgreSQL 服务变量 |
| `JWT_SECRET` | JWT 密钥（用 `openssl rand -base64 32` 生成） |
| `OPENAI_API_KEY` | OpenAI API 密钥 |
| `OPENAI_BASE_URL` | OpenAI API 地址（可选） |
| `STRIPE_SECRET_KEY` | Stripe 密钥 (`sk_live_xxx`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook 签名密钥 |
| `FRONTEND_URL` | 前端域名（用于支付回调） |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | 前端域名（部署后填入） |
| `INITIAL_GIFT_POINTS` | 新用户赠送积分，如 `100` |
| `SMS_PROVIDER` | `mock` 或 `aliyun` |

### 4. 部署前端服务

1. 点击 "Add Service" → "GitHub Repo" → 选择同一仓库
2. 设置 **Root Directory** 为 `/frontend`
3. 配置环境变量：

| 变量名 | 说明 |
|--------|------|
| `VITE_API_BASE` | 后端 API 地址，如 `https://xxx.up.railway.app/api` |

### 5. 配置域名和 CORS

1. 为前端和后端服务各自生成域名
2. 将前端域名添加到后端的 `CORS_ORIGIN` 环境变量

### 部署注意事项

- 后端会自动运行数据库迁移 (`prisma migrate deploy`)
- 首次部署后可运行 `npx prisma db seed` 初始化积分套餐数据
- 健康检查端点：`/health`

## License

MIT

## 待优化

1. 现在用的是 2023 年更新的中国区县数据，可能会有因为实际更新导致的问题
