# 数据库设计文档

## 概述

本项目使用 PostgreSQL 数据库，通过 Prisma ORM 进行数据访问。数据库主要支持以下业务功能：

- 用户认证与管理
- 积分系统（账户、交易、充值）
- 命理报告存储

---

## 数据模型

### 1. User（用户表）

用户基础信息表，支持手机号和用户名两种登录方式。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键，CUID 自动生成 |
| phone | String? | 手机号，唯一索引，可选 |
| username | String? | 用户名，唯一索引，可选 |
| passwordHash | String? | 密码哈希，可选 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**关联关系：**
- 1:1 → PointsAccount（积分账户）
- 1:N → PointsTransaction（积分交易记录）
- 1:N → PaymentOrder（支付订单）
- 1:N → FortuneReport（命理报告）
- 1:N → VerificationCode（验证码）

---

### 2. VerificationCode（验证码表）

手机验证码记录，用于登录/注册验证。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| phone | String | 手机号 |
| code | String | 验证码 |
| expiresAt | DateTime | 过期时间 |
| attempts | Int | 尝试次数，默认 0 |
| used | Boolean | 是否已使用，默认 false |
| createdAt | DateTime | 创建时间 |
| userId | String? | 关联用户 ID |

**索引：** `[phone, createdAt]`

---

### 3. PointsAccount（积分账户表）

用户积分账户，每个用户只有一个积分账户。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| userId | String | 用户 ID，唯一 |
| balance | Int | 当前余额，默认 0 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**关联关系：** N:1 → User

---

### 4. PointsTransaction（积分交易记录表）

记录所有积分变动，包括充值、消费、赠送等。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| userId | String | 用户 ID |
| type | String | 交易类型：recharge/consume/gift |
| amount | Int | 变动金额（正数增加，负数减少） |
| balance | Int | 变动后余额 |
| description | String | 交易描述 |
| orderId | String? | 关联订单 ID |
| createdAt | DateTime | 创建时间 |

**索引：** `[userId, createdAt]`

**交易类型说明：**
- `recharge` - 充值（购买积分）
- `consume` - 消费（使用积分进行命理分析）
- `gift` - 赠送（系统赠送、活动奖励等）

---

### 5. PaymentOrder（支付订单表）

积分充值的支付订单记录。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| userId | String | 用户 ID |
| orderNo | String | 订单号，唯一 |
| amount | Int | 支付金额（单位：分） |
| points | Int | 对应积分数量 |
| paymentMethod | String | 支付方式：wechat/alipay |
| status | String | 订单状态，默认 pending |
| transactionId | String? | 第三方支付交易号 |
| createdAt | DateTime | 创建时间 |
| paidAt | DateTime? | 支付完成时间 |

**索引：** `[userId, createdAt]`, `[orderNo]`

**订单状态说明：**
- `pending` - 待支付
- `paid` - 已支付
- `failed` - 支付失败
- `refunded` - 已退款

---

### 6. PointsPackage（积分套餐表）

可购买的积分套餐配置。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| name | String | 套餐名称 |
| points | Int | 积分数量 |
| price | Int | 价格（单位：分） |
| isActive | Boolean | 是否启用，默认 true |
| sortOrder | Int | 排序顺序，默认 0 |

---

### 7. Subject（测算对象表）

存储用户创建的测算对象，可以是自己或亲朋好友。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| userId | String | 创建者用户 ID |
| name | String | 姓名/昵称 |
| gender | String | 性别：male/female |
| calendarType | String | 日历类型：solar/lunar |
| birthYear | Int | 出生年 |
| birthMonth | Int | 出生月 |
| birthDay | Int | 出生日 |
| birthHour | Int | 出生时 |
| birthMinute | Int | 出生分 |
| isLeapMonth | Boolean | 是否闰月，默认 false |
| location | String | 出生地点 |
| relationship | String? | 与用户关系：self/family/friend/other |
| note | String? | 备注 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**索引：** `[userId, createdAt]`

**关联关系：**
- N:1 → User（创建者）
- 1:N → FortuneReport（命理报告）

**relationship 说明：**
- `self` - 本人
- `family` - 家人
- `friend` - 朋友
- `other` - 其他

---

### 8. FortuneReport（命理报告表）

存储用户的八字排盘和 AI 分析结果。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| userId | String | 付费用户 ID |
| subjectId | String? | 测算对象 ID（可选） |
| birthInfo | Json | 出生信息 |
| baziChart | Json | 八字排盘结果（完整 BaziData） |
| analysis | Json | AI 分析结果 |
| pointsCost | Int | 消耗积分数 |
| createdAt | DateTime | 创建时间 |
| deletedAt | DateTime? | 软删除时间 |

**索引：** `[userId, createdAt]`, `[subjectId, createdAt]`

**关联关系：**
- N:1 → User（付费用户）
- N:1 → Subject（测算对象，可选）

---

## JSON 字段结构

### birthInfo（出生信息）

```typescript
{
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
  yearGanZhi: string;
  monthGanZhi: string;
  dayGanZhi: string;
  yearInChinese: string;
  monthInChinese: string;
  dayInChinese: string;
}
```

### baziChart（八字排盘结果）

完整的 `BaziData` 对象，包含：

```typescript
{
  // 四柱信息
  fourPillars: {
    year: Pillar,
    month: Pillar,
    day: Pillar,
    hour: Pillar
  },
  
  // 日主分析
  dayMaster: {
    stem: HeavenlyStem,
    strength: 'strong' | 'weak' | 'balanced',
    characteristics: string[]
  },
  
  // 五行分析
  fiveElements: {
    distribution: { metal, wood, water, fire, earth },
    strongest: FiveElement,
    weakest: FiveElement,
    favorable: FiveElement[],    // 喜用神
    unfavorable: FiveElement[]   // 忌神
  },
  
  // 十神关系
  tenGods: { gods: Record<string, TenGodInfo> },
  
  // 藏干
  hiddenStems: Record<string, HeavenlyStem[]>,
  
  // 农历日期
  lunarDate: LunarDateInfo,
  
  // 大运信息（含流年、流月）
  yun?: {
    startYear, startMonth, startDay, startAge,
    forward: boolean,
    daYunList: DaYunInfo[]  // 每个大运含 liuNian[]，每个流年含 liuYue[]
  },
  
  // 神煞
  shenSha?: { year[], month[], day[], hour[] },
  
  // 吉神方位
  directions?: { xi, yangGui, yinGui, fu, cai },
  
  // 彭祖百忌
  pengZu?: { gan, zhi },
  
  // 宜忌
  yiJi?: { yi[], ji[] },
  
  // 节气
  jieQi?: { current, next, nextDate, prev, prevDate },
  
  // 星宿
  xingXiu?: { xiu, animal, gong, shou, luck, song },
  
  // 十二长生
  diShi?: { year, month, day, hour },
  
  // 九星
  nineStars?: { year, month, day, hour },
  
  // 天神
  tianShen?: { day, dayType, dayLuck, hour, hourType, hourLuck },
  
  // 吉神凶煞
  jiXiong?: { jiShen[], xiongSha[] },
  
  // 时辰宜忌
  timeYiJi?: { yi[], ji[] },
  
  // 冲煞
  chongSha?: { dayChong, dayChongDesc, daySha, timeChong, timeChongDesc, timeSha },
  
  // 胎神
  taiShen?: { day, month },
  
  // 四柱旬空
  fourPillarsXunKong?: { yearXun, yearXunKong, monthXun, monthXunKong, dayXun, dayXunKong, hourXun, hourXunKong },
  
  // 四柱十神
  fourPillarsShiShen?: { yearGan, yearZhi[], monthGan, monthZhi[], dayZhi[], hourGan, hourZhi[] },
  
  // 命宫身宫纳音
  gongNaYin?: { taiYuan, taiYuanNaYin, mingGong, mingGongNaYin, shenGong, shenGongNaYin, taiXi, taiXiNaYin },
  
  // 其他信息
  otherInfo?: { liuYao, wuHou, hou, dayLu, yueXiang, zhiXing, festivals[], otherFestivals[] },
  
  // 基础信息
  shengXiao: string,
  xun: string,
  xunKong: string,
  taiYuan: string,
  mingGong: string,
  shenGong: string
}
```

### analysis（AI 分析结果）

```typescript
{
  personality: string;    // 性格分析
  career: string;         // 事业运势
  wealth: string;         // 财运分析
  relationship: string;   // 感情运势
  health: string;         // 健康建议
  overall: string;        // 综合分析
  suggestions: string[];  // 建议列表
}
```

---

## ER 图

```
┌─────────────────┐
│      User       │
├─────────────────┤
│ id              │───┬──────────────────────────────────────────────────┐
│ phone           │   │                                                  │
│ username        │   │                                                  │
│ passwordHash    │   │                                                  │
│ createdAt       │   │                                                  │
│ updatedAt       │   │                                                  │
└─────────────────┘   │                                                  │
                      │                                                  │
        ┌─────────────┼─────────────┬─────────────┬─────────────┬───────┴───────┐
        │             │             │             │             │               │
        ▼             ▼             ▼             ▼             ▼               ▼
┌───────────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────────┐
│PointsAccount │ │PointsTrans│ │PaymentOrder│ │  Subject  │ │FortuneRpt │ │VerificationCode │
├───────────────┤ ├───────────┤ ├───────────┤ ├───────────┤ ├───────────┤ ├─────────────────┤
│ id            │ │ id        │ │ id        │ │ id        │ │ id        │ │ id              │
│ userId (1:1)  │ │ userId    │ │ userId    │ │ userId    │ │ userId    │ │ phone           │
│ balance       │ │ type      │ │ orderNo   │ │ name      │ │ subjectId │ │ code            │
│ createdAt     │ │ amount    │ │ amount    │ │ gender    │ │ birthInfo │ │ expiresAt       │
│ updatedAt     │ │ balance   │ │ points    │ │ birthYear │ │ baziChart │ │ attempts        │
└───────────────┘ │ description│ │ status    │ │ birthMonth│ │ analysis  │ │ used            │
                  │ orderId   │ │ paidAt    │ │ birthDay  │ │ pointsCost│ │ userId          │
                  │ createdAt │ └───────────┘ │ birthHour │ │ createdAt │ └─────────────────┘
                  └───────────┘               │ location  │ │ deletedAt │
                                              │ relation  │ └─────┬─────┘
                                              │ createdAt │       │
                                              └─────┬─────┘       │
                                                    │             │
                                                    └──────┬──────┘
                                                           │
                                              Subject 1:N FortuneReport

┌─────────────────┐
│ PointsPackage   │  (独立配置表)
├─────────────────┤
│ id              │
│ name            │
│ points          │
│ price           │
│ isActive        │
│ sortOrder       │
└─────────────────┘
```

---

## API 接口

### Subject（测算对象）API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/subjects | 获取用户的测算对象列表 |
| POST | /api/subjects | 创建新的测算对象 |
| GET | /api/subjects/[id] | 获取测算对象详情 |
| PUT | /api/subjects/[id] | 更新测算对象 |
| DELETE | /api/subjects/[id] | 删除测算对象 |
| GET | /api/subjects/[id]/reports | 获取测算对象的报告列表 |

---

## 业务流程

### 1. 用户注册/登录流程

```
1. 用户输入手机号
2. 系统发送验证码 → 创建 VerificationCode 记录
3. 用户输入验证码
4. 验证通过 → 创建/查找 User → 创建 PointsAccount（新用户）
5. 返回登录凭证
```

### 2. 积分充值流程

```
1. 用户选择 PointsPackage
2. 创建 PaymentOrder (status: pending)
3. 调用支付接口
4. 支付成功回调：
   - 更新 PaymentOrder (status: paid)
   - 创建 PointsTransaction (type: recharge)
   - 更新 PointsAccount.balance
```

### 3. 命理分析流程

```
方式一：直接测算（不保存对象）
1. 用户输入出生信息
2. 调用 calculateBazi() 生成 BaziData
3. 检查 PointsAccount.balance 是否足够
4. 调用 AI 生成分析
5. 创建 FortuneReport（subjectId 为空）
6. 创建 PointsTransaction (type: consume)
7. 更新 PointsAccount.balance

方式二：保存对象后测算
1. 用户创建 Subject（测算对象）
2. 选择已有 Subject 进行测算
3. 调用 calculateBazi() 生成 BaziData
4. 检查积分并调用 AI 分析
5. 创建 FortuneReport（关联 subjectId）
6. 扣除积分
```

### 4. 测算对象管理

```
1. 用户可以创建多个 Subject（自己、家人、朋友等）
2. 每个 Subject 保存完整的出生信息
3. 用户可以选择已有 Subject 快速测算
4. 同一个 Subject 可以有多次测算记录
5. 用户可以查看某个 Subject 的所有历史报告
```

---

## 索引策略

| 表 | 索引 | 用途 |
|---|---|---|
| User | phone (unique) | 手机号登录查询 |
| User | username (unique) | 用户名登录查询 |
| VerificationCode | [phone, createdAt] | 验证码查询和清理 |
| PointsTransaction | [userId, createdAt] | 用户交易记录查询 |
| PaymentOrder | [userId, createdAt] | 用户订单查询 |
| PaymentOrder | orderNo (unique) | 订单号查询 |
| FortuneReport | [userId, createdAt] | 用户报告历史查询 |
| FortuneReport | [subjectId, createdAt] | 测算对象报告查询 |
| Subject | [userId, createdAt] | 用户测算对象列表 |

---

## 数据安全

1. **密码存储**：使用 bcrypt 哈希存储，不存储明文
2. **软删除**：FortuneReport 使用 deletedAt 实现软删除
3. **验证码安全**：
   - 设置过期时间
   - 限制尝试次数
   - 使用后标记为已使用
4. **金额单位**：所有金额使用「分」为单位，避免浮点数精度问题
