# Implementation Plan: Prismo UI Redesign

## Overview

本实施计划将八字命理系统的前端界面升级为 Prismo 风格的"柔光晚霞"视觉语言。按照优先级顺序实施：先更新全局样式，再创建新组件，最后重构各页面。

**参考项目**: `prismo-react-ref/` (已克隆到本地)

## Tasks

- [x] 1. 更新全局样式系统
  - [x] 1.1 更新 globals.css 中的 CSS 变量和背景系统
    - 定义完整的 Prismo 色彩变量 (--light-85/90/94/95/96, --dark-7/12, --grey-24/30/50, accent colors)
    - 实现多层弥散光晕背景 (body::before)
    - 添加颗粒纹理层 (body::after)
    - 更新 glass-card 类样式
    - 更新按钮样式 (.btn-primary, .btn-secondary)
    - **新增**: Prismo Hero 背景系统 (ellipse-based, grid lines)
    - **新增**: Prismo Badge 样式 (gradient text)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 1.2 创建颗粒纹理图片资源
    - 在 public 目录创建或添加 noise.svg 纹理图片
    - _Requirements: 1.4_

- [x] 2. 创建新 UI 组件
  - [x] 2.1 创建 PillButton 组件
    - 实现 primary, secondary, outline, ghost 变体 (匹配 prismo-react)
    - 实现 sm, md, lg 尺寸
    - 添加 hover 动效 (translateY + color change)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 2.2 编写 PillButton 属性测试
    - **Property 3: PillButton 样式一致性**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.5**

  - [x] 2.3 创建 SocialProof 组件
    - 实现星级评分显示 (prismo-react 风格)
    - 实现头像堆叠效果
    - 实现用户数量文本
    - **新增**: 分隔线样式
    - _Requirements: 14.1, 14.2, 14.3_

  - [x] 2.4 创建 BentoGrid 组件
    - 实现 2/3/4 列布局选项
    - 实现响应式断点切换
    - _Requirements: 6.1, 6.2_

  - [x] 2.5 创建 PrismoHeroBackground 组件 (新增)
    - 实现 ellipse-based 背景 (匹配 prismo-react Hero.jsx)
    - 实现垂直网格线
    - 实现渐变遮罩层
    - 实现噪点纹理层
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Checkpoint - 确保组件测试通过
  - 运行所有测试，确保新组件正常工作
  - 如有问题请询问用户

- [x] 4. 重构首页 (page.tsx)
  - [x] 4.1 重构 Hero Section
    - 更新标题样式 (52px-72px, font-weight 500-600)
    - 添加 SocialProof 组件
    - 将 CTA 按钮替换为 PillButton
    - 移除旧的渐变按钮样式
    - **新增**: 使用 PrismoHeroBackground 组件
    - **新增**: 使用 prismo-badge 样式
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 4.2 重构 Feature Cards 区域
    - 使用 BentoGrid 组件
    - 更新 Feature Card 为新的 glass-card 样式
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 4.3 编写 Feature Card 结构属性测试
    - **Property 5: Feature Card 结构完整性**
    - **Validates: Requirements 6.3, 6.4**

- [x] 5. 重构登录页面 (login/page.tsx)
  - [x] 5.1 更新登录表单样式
    - 更新表单容器为新的 glass-card 样式
    - 更新输入框样式为暖色调
    - 将提交按钮替换为 PillButton
    - 更新 Tab 切换样式
    - _Requirements: 7.1, 7.3, 7.4, 7.5_

- [x] 6. 重构八字排盘页面 (bazi/page.tsx)
  - [x] 6.1 更新排盘表单和结果样式
    - 更新表单容器为白色 glass-card
    - 更新结果展示为 Bento Grid 布局
    - 更新 AI 分析区域样式（锁定/解锁状态）
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 7. 重构历史记录页面 (history/page.tsx)
  - [x] 7.1 更新历史页面布局和样式
    - 实现 1:2 比例的左右分栏布局
    - 更新报告列表项为 glass-card 样式
    - 添加选中项紫色边框高亮
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 8. 重构积分中心页面 (points/page.tsx)
  - [x] 8.1 更新积分页面样式
    - 更新余额卡片为渐变文字大号显示
    - 更新套餐网格为四列布局
    - 添加套餐卡片悬停放大效果
    - 更新交易记录颜色编码
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 8.2 编写交易颜色编码属性测试
    - **Property 6: 交易记录颜色编码**
    - **Validates: Requirements 10.4**

- [x] 9. 重构用户中心页面 (profile/page.tsx)
  - [x] 9.1 更新用户中心样式
    - 更新用户信息卡片样式
    - 更新统计数据为三列布局
    - 更新快捷操作为四宫格布局
    - _Requirements: 11.1, 11.2, 11.3_

- [x] 10. Checkpoint - 页面重构完成
  - 确保所有页面样式一致
  - 运行所有测试
  - 如有问题请询问用户

- [x] 11. 响应式布局优化
  - [x] 11.1 优化移动端布局
    - 确保所有页面在 < 768px 视口下正确显示单列布局
    - 调整字体大小和间距
    - _Requirements: 13.1_

  - [x] 11.2 优化平板端布局
    - 确保 768px-1024px 视口下正确显示两列布局
    - _Requirements: 13.2_

  - [ ]* 11.3 编写响应式布局属性测试
    - **Property 2: 响应式布局断点行为**
    - **Validates: Requirements 6.2, 13.1, 13.2, 13.3**

- [x] 12. 动效系统完善
  - [x] 12.1 添加页面入场动画
    - 实现 staggered fade-in-up 效果
    - 配置 0.5s duration, 0.1s delay
    - _Requirements: 12.1_

  - [x] 12.2 完善交互动效
    - 确保所有 CTA 按钮有 hover 上浮效果
    - 确保所有卡片有 hover 缩放效果
    - 添加 loading spinner 动画
    - _Requirements: 12.2, 12.3, 12.4_

- [x] 13. Final Checkpoint - 全面测试
  - 运行所有单元测试和属性测试
  - 在不同视口尺寸下手动验证
  - 确保所有页面视觉一致
  - 如有问题请询问用户

- [ ]* 14. 编写 CSS 变量完整性属性测试
  - **Property 1: CSS 变量定义完整性**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

- [ ]* 15. 编写 GlassCard 样式属性测试
  - **Property 4: GlassCard 样式一致性**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- 后端 API 不需要修改，本次重构仅涉及前端 UI 层
- **prismo-react 参考代码位于 `prismo-react-ref/` 目录**
