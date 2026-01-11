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
| POST | `/api/payment/create` | 创建支付订单 |
| GET | `/api/payment/status/:orderNo` | 查询订单状态 |
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

## License

MIT
