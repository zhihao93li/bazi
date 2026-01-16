# 需求文档

## 简介

本文档定义了码支付（mazfu）集成的需求，用于替代现有的 Stripe 支付方式。系统将支持支付宝作为默认支付方式，PC 端使用二维码支付，移动端使用 H5 跳转支付。Stripe 支付将被完全隐藏，不再展示给用户。

## 术语表

- **Mazfu_Service**: 码支付服务模块，负责与码支付 API 交互
- **Payment_Router**: 支付路由模块，处理支付相关的 HTTP 请求
- **QRCode_Modal**: PC 端二维码支付弹窗组件
- **Payment_Result_Page**: 支付结果页面，处理 return_url 回调
- **Order_Service**: 订单管理服务，负责订单创建和状态管理
- **Signature_Generator**: 签名生成器，按照码支付 MD5 签名算法生成签名
- **Device_Detector**: 设备检测器，判断用户访问设备类型（PC/移动端）

## 需求列表

### 需求 1: 码支付签名生成

**用户故事:** 作为开发者，我需要为码支付 API 请求生成有效的 MD5 签名，以便支付请求能够通过认证。

#### 验收标准

1. WHEN 生成签名时, THE Signature_Generator SHALL 按 ASCII 码升序（a-z）排序所有参数
2. WHEN 生成签名时, THE Signature_Generator SHALL 排除 'sign'、'sign_type' 和空值参数
3. WHEN 生成签名时, THE Signature_Generator SHALL 将排序后的参数拼接为 URL 键值对格式（a=b&c=d&e=f）
4. WHEN 生成签名时, THE Signature_Generator SHALL 在拼接字符串后追加商户 KEY 并计算小写 MD5 哈希值
5. FOR ALL 有效参数集, 生成签名后使用相同参数验证 SHALL 返回 true（往返验证属性）

### 需求 2: 码支付 API 集成

**用户故事:** 作为系统，我需要集成码支付 API，以便用户可以使用支付宝付款。

#### 验收标准

1. WHEN 为 PC 设备创建支付请求时, THE Mazfu_Service SHALL 调用 mapi.php 接口并设置 device='pc'，返回二维码 URL
2. WHEN 为移动设备创建支付请求时, THE Mazfu_Service SHALL 调用 mapi.php 接口并设置 device='mobile'，返回支付跳转 URL
3. WHEN 码支付 API 返回 code=1 时, THE Mazfu_Service SHALL 提取并返回支付 URL（qrcode 或 payurl）
4. IF 码支付 API 返回错误（code≠1）, THEN THE Mazfu_Service SHALL 抛出包含 API 错误信息的异常
5. THE Mazfu_Service SHALL 使用环境变量配置 pid、KEY 和 API 基础 URL
6. WHEN 构建 API 请求时, THE Mazfu_Service SHALL 包含所有必需参数：pid、type、out_trade_no、name、money、notify_url、return_url、sign

### 需求 3: 支付回调处理

**用户故事:** 作为系统，我需要处理来自码支付的回调通知，以便确认订单并为用户充值积分。

#### 验收标准

1. WHEN 收到异步通知（notify_url）时, THE Payment_Router SHALL 在处理前验证签名
2. IF 签名验证失败, THEN THE Payment_Router SHALL 拒绝回调并返回错误响应
3. WHEN 回调包含 trade_status='TRADE_SUCCESS' 时, THE Order_Service SHALL 更新订单状态为 'paid' 并为用户充值积分
4. WHEN 成功处理通知后, THE Payment_Router SHALL 返回 'success' 作为响应体
5. WHEN 收到同步回调（return_url）时, THE Payment_Router SHALL 将用户重定向到支付结果页面并携带订单状态
6. THE Payment_Router SHALL 对相同订单号的重复回调实现幂等处理

### 需求 4: 前端支付流程 - PC 端

**用户故事:** 作为 PC 用户，我希望在购买积分时看到二维码弹窗，以便我可以使用支付宝扫码支付。

#### 验收标准

1. WHEN PC 用户点击购买按钮时, THE QRCode_Modal SHALL 显示支付二维码
2. WHILE QRCode_Modal 显示时, THE 系统 SHALL 每 3 秒轮询一次订单状态
3. WHEN 订单状态变为 'paid' 时, THE QRCode_Modal SHALL 关闭并显示成功消息
4. WHEN 用户关闭 QRCode_Modal 时, THE 系统 SHALL 停止轮询并允许用户重试
5. THE QRCode_Modal SHALL 显示订单金额和支付过期倒计时
6. IF 支付超时（5 分钟）, THEN THE QRCode_Modal SHALL 显示过期消息并允许重试

### 需求 5: 前端支付流程 - 移动端

**用户故事:** 作为移动端用户，我希望被重定向到支付宝 H5 支付页面，以便我可以在手机上完成支付。

#### 验收标准

1. WHEN 移动端用户点击购买按钮时, THE 系统 SHALL 重定向到码支付 H5 支付 URL
2. WHEN 支付完成后, THE 系统 SHALL 通过 return_url 将用户重定向到 Payment_Result_Page
3. THE Payment_Result_Page SHALL 根据回调参数显示支付结果（成功/失败）
4. IF 支付失败, THEN THE Payment_Result_Page SHALL 显示错误消息和重试按钮

### 需求 6: 设备检测

**用户故事:** 作为系统，我需要检测用户的设备类型，以便提供适当的支付体验。

#### 验收标准

1. WHEN 用户访问支付页面时, THE Device_Detector SHALL 判断设备是 PC 还是移动端
2. THE Device_Detector SHALL 将移动浏览器、平板电脑和移动应用归类为 'mobile' 设备类型
3. THE Device_Detector SHALL 将桌面浏览器归类为 'pc' 设备类型
4. WHEN 确定设备类型后, THE 系统 SHALL 使用相应的支付流程（PC 用二维码，移动端用 H5 跳转）

### 需求 7: Stripe 隐藏

**用户故事:** 作为产品负责人，我希望对用户隐藏 Stripe 支付，以便只提供码支付选项。

#### 验收标准

1. THE 系统 SHALL NOT 向用户显示任何 Stripe 相关的 UI 元素
2. THE 系统 SHALL NOT 向前端暴露 Stripe checkout 接口
3. THE Stripe 集成代码 SHALL 保留在代码库中但处于非活动状态
4. WHEN 用户发起支付时, THE 系统 SHALL 仅使用码支付方式

### 需求 8: 环境配置

**用户故事:** 作为开发者，我希望通过环境变量配置码支付，以便集成可以部署到不同环境。

#### 验收标准

1. THE 系统 SHALL 从环境变量读取 MAZFU_PID 作为商户 ID
2. THE 系统 SHALL 从环境变量读取 MAZFU_KEY 作为签名密钥
3. THE 系统 SHALL 使用 'https://www.mazfu.com' 作为默认 API 基础 URL
4. IF 必需的环境变量缺失, THEN THE 系统 SHALL 记录警告并禁用码支付功能
5. THE 系统 SHALL 从环境变量读取 MAZFU_NOTIFY_URL 和 MAZFU_RETURN_URL 作为回调 URL
