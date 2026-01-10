# Requirements Document

## Introduction

本项目是一个基于 Next.js 的中国传统命理分析应用。用户可以通过输入出生日期、时间、性别和出生地点，获取八字排盘和命理分析结果。系统包含完整的账号体系（中国手机号注册登录）、积分系统和支付模块，采用模块化架构设计以便后期扩展。

核心命理计算逻辑基于 lunar-typescript 开源库，并参考 https://github.com/zhihao93li/human_design2 项目的实现方式。前端使用 Tailwind CSS 和 Aceternity UI 组件库，数据持久化使用 PostgreSQL。

## Glossary

- **Bazi_Engine**: 八字排盘引擎，负责根据出生信息计算八字、五行、十神等命理数据
- **Auth_Service**: 认证服务，负责用户注册、登录、短信验证码发送与验证
- **Points_Service**: 积分服务，负责积分的增减、查询和消费记录管理
- **Payment_Service**: 支付服务，负责处理支付宝支付的订单创建和回调（PC端扫码 + 移动端H5）
- **User**: 系统用户，通过手机号注册的账户
- **Fortune_Report**: 命理报告，包含八字排盘结果和命理分析内容
- **Points**: 积分，用户用于消费命理分析服务的虚拟货币
- **SMS_Provider**: 短信服务提供商，如阿里云短信或腾讯云短信
- **AI_Service**: AI 分析服务，负责调用大语言模型对八字结果进行命理解读
- **Prompt_Config**: Prompt 配置管理，通过 YAML 文件管理 AI 调用的 prompt 模板和参数设置

## Requirements

### Requirement 1: 用户注册与登录

**User Story:** As a 用户, I want to 使用中国手机号或用户名密码注册和登录系统, so that 我可以保存我的命理分析记录并使用积分服务。

#### Acceptance Criteria

**手机号验证码登录：**
1. WHEN 用户输入有效的中国手机号并请求验证码 THEN THE Auth_Service SHALL 调用 SMS_Provider 发送6位数字验证码
2. WHEN 验证码发送成功 THEN THE Auth_Service SHALL 在60秒内限制同一手机号重复请求验证码
3. WHEN 用户输入正确的验证码 THEN THE Auth_Service SHALL 验证通过并创建或登录用户账户
4. WHEN 用户输入错误的验证码超过5次 THEN THE Auth_Service SHALL 锁定该手机号15分钟
5. WHEN 验证码超过5分钟未使用 THEN THE Auth_Service SHALL 使该验证码失效
6. IF 手机号格式不符合中国大陆手机号规则 THEN THE Auth_Service SHALL 返回格式错误提示

**用户名密码登录（轻量方案）：**
7. WHEN 用户使用用户名和密码注册 THEN THE Auth_Service SHALL 使用 bcrypt 加密密码并创建账户
8. WHEN 用户使用用户名和密码登录 THEN THE Auth_Service SHALL 验证密码并返回登录结果
9. IF 用户名已存在 THEN THE Auth_Service SHALL 返回用户名已被占用错误
10. IF 密码长度少于6位 THEN THE Auth_Service SHALL 返回密码过短错误

**通用：**
11. WHEN 用户成功登录 THEN THE Auth_Service SHALL 生成 JWT Token 并返回给客户端
12. WHEN 用户首次注册成功 THEN THE Points_Service SHALL 赠送初始积分（如100积分）

### Requirement 2: 八字排盘

**User Story:** As a 用户, I want to 输入我的出生信息获取八字排盘结果, so that 我可以了解我的命理基础信息。

#### Acceptance Criteria

1. WHEN 用户提交出生日期、时间、性别和出生地点 THEN THE Bazi_Engine SHALL 计算并返回完整的八字排盘结果
2. THE Bazi_Engine SHALL 支持公历和农历两种日期输入方式
3. WHEN 计算八字 THEN THE Bazi_Engine SHALL 返回年柱、月柱、日柱、时柱的天干地支
4. WHEN 计算八字 THEN THE Bazi_Engine SHALL 返回五行分布（金木水火土的数量和强弱）
5. WHEN 计算八字 THEN THE Bazi_Engine SHALL 返回十神关系（正官、偏官、正印、偏印等）
6. WHEN 计算八字 THEN THE Bazi_Engine SHALL 返回大运和流年信息
7. IF 出生时间不确定 THEN THE Bazi_Engine SHALL 支持按时辰范围模糊计算
8. WHEN 排盘完成 THEN THE Bazi_Engine SHALL 将结果序列化为 JSON 格式存储

### Requirement 3: 命理分析

**User Story:** As a 用户, I want to 获取基于八字的 AI 命理分析报告, so that 我可以了解我的性格特点、事业运势等信息。

#### Acceptance Criteria

1. WHEN 用户请求命理分析 THEN THE AI_Service SHALL 基于八字结果调用大语言模型生成分析报告
2. THE Fortune_Report SHALL 包含性格分析、事业运势、财运分析、感情运势等模块
3. WHEN 生成分析报告 THEN THE AI_Service SHALL 根据五行强弱给出调理建议
4. WHEN 用户积分不足 THEN THE System SHALL 提示用户充值积分
5. WHEN 分析完成 THEN THE Points_Service SHALL 扣除相应积分
6. THE Fortune_Report SHALL 支持导出为 PDF 格式
7. WHEN 生成报告 THEN THE System SHALL 保存报告到用户历史记录

### Requirement 9: AI 配置管理

**User Story:** As a 系统管理员, I want to 通过 YAML 文件管理 AI 调用的 prompt 和参数配置, so that 我可以灵活调整 AI 分析的行为而无需修改代码。

#### Acceptance Criteria

1. THE AI_Service SHALL 从 YAML 配置文件读取 prompt 模板
2. THE Prompt_Config SHALL 支持配置不同分析模块（性格、事业、财运、感情）的独立 prompt
3. THE Prompt_Config SHALL 支持配置 AI 模型参数（如 temperature、max_tokens 等）
4. THE Prompt_Config SHALL 支持配置使用的 AI 模型提供商和模型名称
5. WHEN 配置文件变更 THEN THE AI_Service SHALL 支持热加载配置而无需重启服务
6. THE Prompt_Config SHALL 支持变量占位符，用于动态插入八字数据
7. IF 配置文件格式错误 THEN THE AI_Service SHALL 使用默认配置并记录错误日志

### Requirement 4: 积分系统

**User Story:** As a 用户, I want to 管理我的积分余额, so that 我可以使用积分消费命理分析服务。

#### Acceptance Criteria

1. THE Points_Service SHALL 维护每个用户的积分余额
2. WHEN 用户查询积分 THEN THE Points_Service SHALL 返回当前余额和积分明细
3. WHEN 发生积分变动 THEN THE Points_Service SHALL 记录变动类型、数量、时间和关联订单
4. THE Points_Service SHALL 支持积分充值、消费、赠送三种变动类型
5. IF 积分余额不足以支付服务 THEN THE Points_Service SHALL 拒绝扣款并返回余额不足错误
6. WHEN 积分变动 THEN THE Points_Service SHALL 确保操作的原子性，防止并发问题

### Requirement 5: 支付模块

**User Story:** As a 用户, I want to 通过支付宝充值积分, so that 我可以购买积分使用命理分析服务。

#### Acceptance Criteria

1. THE Payment_Service SHALL 支持支付宝支付（PC端扫码支付 + 移动端H5支付）
2. WHEN 用户在PC端选择充值套餐 THEN THE Payment_Service SHALL 生成支付宝付款二维码
3. WHEN 用户在移动端选择充值套餐 THEN THE Payment_Service SHALL 跳转到支付宝H5支付页面
4. WHEN 支付成功 THEN THE Payment_Service SHALL 通过回调接口验证支付结果
5. WHEN 支付验证通过 THEN THE Points_Service SHALL 为用户增加对应积分
6. IF 支付回调签名验证失败 THEN THE Payment_Service SHALL 拒绝处理并记录异常日志
7. THE Payment_Service SHALL 支持订单查询和退款功能
8. WHEN 创建订单 THEN THE Payment_Service SHALL 生成唯一订单号并记录订单状态
9. THE Payment_Service SHALL 处理支付超时和重复回调的情况

### Requirement 6: 用户历史记录

**User Story:** As a 用户, I want to 查看我的历史命理分析记录, so that 我可以随时回顾之前的分析结果。

#### Acceptance Criteria

1. WHEN 用户查询历史记录 THEN THE System SHALL 返回该用户所有的命理分析报告列表
2. THE System SHALL 按时间倒序展示历史记录
3. WHEN 用户点击历史记录 THEN THE System SHALL 展示完整的分析报告详情
4. THE System SHALL 支持删除历史记录功能
5. WHEN 删除记录 THEN THE System SHALL 进行软删除，保留数据用于审计

### Requirement 7: 数据持久化

**User Story:** As a 系统管理员, I want to 所有数据安全存储在 PostgreSQL 数据库中, so that 数据可靠且支持复杂查询。

#### Acceptance Criteria

1. THE System SHALL 使用 PostgreSQL 作为主数据库
2. THE System SHALL 使用 Prisma ORM 进行数据库操作
3. WHEN 存储用户数据 THEN THE System SHALL 对敏感信息进行加密处理
4. THE System SHALL 实现数据库连接池管理
5. WHEN 执行数据库操作 THEN THE System SHALL 使用事务确保数据一致性

### Requirement 8: 模块化架构

**User Story:** As a 开发者, I want to 系统采用清晰的模块化架构, so that 后期可以方便地扩展新功能。

#### Acceptance Criteria

1. THE System SHALL 将认证、积分、支付、命理计算分离为独立模块
2. WHEN 模块间通信 THEN THE System SHALL 通过定义良好的接口进行交互
3. THE System SHALL 使用依赖注入模式管理模块依赖
4. THE System SHALL 为每个模块提供独立的配置管理
5. WHEN 添加新功能模块 THEN THE System SHALL 不影响现有模块的正常运行
