# 实现计划: 码支付集成

## 概述

本任务列表将码支付集成设计转换为可执行的编码步骤。实现顺序为：后端服务 → 后端路由 → 前端工具 → 前端组件 → 集成测试。

## 任务列表

- [x] 1. 创建码支付服务模块
  - [x] 1.1 创建 `src/lib/payment/mazfu.ts` 文件，实现配置读取和类型定义
    - 定义 MazfuConfig、CreateMazfuPaymentParams、CreateMazfuPaymentResult、MazfuNotifyParams 接口
    - 从环境变量读取 MAZFU_PID、MAZFU_KEY、MAZFU_NOTIFY_URL、MAZFU_RETURN_URL
    - 设置默认 API 基础 URL 为 'https://www.mazfu.com'
    - _需求: 8.1, 8.2, 8.3, 8.5_
  
  - [x] 1.2 实现签名生成函数 `generateSign`
    - 按 ASCII 码升序排序参数
    - 排除 sign、sign_type 和空值参数
    - 拼接为 URL 键值对格式
    - 追加 KEY 并计算小写 MD5
    - _需求: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 1.3 实现签名验证函数 `verifySign`
    - 使用相同算法重新计算签名
    - 比较计算结果与传入签名
    - _需求: 1.5, 3.1_
  
  - [x] 1.4 编写签名往返属性测试
    - **Property 1: 签名生成往返验证**
    - **验证: 需求 1.1, 1.2, 1.3, 1.4, 1.5**
  
  - [x] 1.5 实现创建支付请求函数 `createPayment`
    - 构建请求参数（pid、type、out_trade_no、name、money、notify_url、return_url、device、sign）
    - 调用码支付 mapi.php 接口
    - 解析响应，提取 qrcode 或 payurl
    - 处理错误响应
    - _需求: 2.1, 2.2, 2.3, 2.4, 2.6_
  
  - [x] 1.6 编写签名验证安全性属性测试
    - **Property 4: 签名验证安全性**
    - **验证: 需求 3.1, 3.2**

- [x] 2. 检查点 - 确保码支付服务测试通过
  - 运行所有测试，确保通过
  - 如有问题请询问用户

- [x] 3. 扩展支付路由
  - [x] 3.1 在 `src/routes/payment.ts` 中添加创建码支付订单路由
    - POST /api/payment/create-mazfu
    - 验证用户登录状态
    - 获取套餐信息
    - 创建订单记录
    - 调用 mazfu.createPayment
    - 返回二维码 URL 或 H5 支付链接
    - _需求: 2.1, 2.2, 7.4_
  
  - [x] 3.2 添加码支付异步通知回调路由
    - POST /api/payment/mazfu-notify
    - 验证签名
    - 检查订单状态（幂等处理）
    - 更新订单状态为 paid
    - 为用户充值积分
    - 返回 'success'
    - _需求: 3.1, 3.2, 3.3, 3.4, 3.6_
  
  - [x] 3.3 添加码支付同步跳转回调路由
    - GET /api/payment/mazfu-return
    - 验证签名
    - 重定向到前端支付结果页面
    - _需求: 3.5_
  
  - [x] 3.4 编写支付回调幂等性属性测试
    - **Property 5: 支付回调幂等性**
    - **验证: 需求 3.6**

- [x] 4. 检查点 - 确保后端路由测试通过
  - 运行所有测试，确保通过
  - 如有问题请询问用户

- [x] 5. 创建前端设备检测工具
  - [x] 5.1 创建 `frontend/src/utils/deviceDetector.js`
    - 实现 detectDevice 函数
    - 实现 isMobile 函数
    - 基于 User-Agent 判断设备类型
    - _需求: 6.1, 6.2, 6.3_
  
  - [x] 5.2 编写设备检测准确性属性测试
    - **Property 6: 设备检测准确性**
    - **验证: 需求 6.1, 6.2, 6.3**

- [x] 6. 创建二维码弹窗组件
  - [x] 6.1 创建 `frontend/src/components/QRCodeModal.jsx` 和样式文件
    - 接收 props: visible、qrCodeUrl、orderNo、amount、onClose、onSuccess、onTimeout
    - 使用 qrcode.react 库渲染二维码
    - 显示订单金额
    - 实现 5 分钟倒计时
    - _需求: 4.1, 4.5_
  
  - [x] 6.2 实现订单状态轮询逻辑
    - 每 3 秒调用 /api/payment/status/:orderNo
    - 状态变为 paid 时调用 onSuccess
    - 组件卸载或关闭时停止轮询
    - _需求: 4.2, 4.3, 4.4_
  
  - [x] 6.3 实现超时处理
    - 5 分钟后显示过期消息
    - 提供重试按钮
    - _需求: 4.6_

- [x] 7. 创建支付结果页面
  - [x] 7.1 创建 `frontend/src/pages/PaymentResultPage.jsx` 和样式文件
    - 路由: /payment/result
    - 从 URL 参数获取 order_no 和 trade_status
    - 调用后端查询订单详情
    - _需求: 5.3_
  
  - [x] 7.2 实现结果显示逻辑
    - 成功时显示充值积分数和成功动画
    - 失败时显示错误消息和重试按钮
    - 提供返回积分页面按钮
    - _需求: 5.3, 5.4_
  
  - [x] 7.3 在 `frontend/src/App.jsx` 中添加路由配置
    - 添加 /payment/result 路由
    - _需求: 5.3_

- [x] 8. 修改积分页面支付流程
  - [x] 8.1 修改 `frontend/src/pages/PointsPage.jsx` 的 handlePurchase 函数
    - 检测设备类型
    - PC 端调用 /api/payment/create-mazfu 获取二维码，显示 QRCodeModal
    - 移动端调用 /api/payment/create-mazfu 获取 H5 链接，跳转支付
    - _需求: 4.1, 5.1, 6.4, 7.4_
  
  - [x] 8.2 移除 Stripe 相关 UI 和逻辑
    - 删除 create-checkout 调用
    - 确保不显示任何 Stripe 相关元素
    - _需求: 7.1, 7.2_
  
  - [x] 8.3 添加支付成功后的状态刷新
    - QRCodeModal onSuccess 回调中刷新积分余额
    - 显示成功 Toast 消息
    - _需求: 4.3_

- [x] 9. 检查点 - 确保前端组件测试通过
  - 运行所有测试，确保通过
  - 如有问题请询问用户

- [x] 10. 更新环境变量配置
  - [x] 10.1 更新 `.env.example` 文件
    - 添加 MAZFU_PID、MAZFU_KEY、MAZFU_NOTIFY_URL、MAZFU_RETURN_URL 示例
    - _需求: 8.1, 8.2, 8.4, 8.5_
  
  - [x] 10.2 在 mazfu.ts 中添加配置缺失警告
    - 检查必需环境变量
    - 缺失时记录警告日志
    - _需求: 8.4_

- [x] 11. 最终检查点 - 确保所有测试通过
  - 运行完整测试套件
  - 验证端到端支付流程
  - 如有问题请询问用户

## 备注

- 所有任务均为必需任务
- 每个任务都引用了具体的需求编号以便追溯
- 检查点用于确保增量验证
- 属性测试验证通用正确性属性
- 单元测试验证具体示例和边界情况
