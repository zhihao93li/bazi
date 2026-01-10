# Design Document: Prismo UI Redesign

## Overview

本设计文档描述如何将八字命理 AI 智能分析系统的前端界面升级为 Prismo 风格的"柔光晚霞"视觉语言。设计重点是更新全局样式、创建新的 UI 组件，并重构各页面以符合新的设计规范。

## Architecture

### 技术栈
- **框架**: Next.js 15 (App Router)
- **样式**: Tailwind CSS + CSS Custom Properties
- **动画**: Framer Motion
- **字体**: Geist Sans (已配置)

### 文件结构变更
```
src/
├── app/
│   ├── globals.css          # 更新全局样式和 CSS 变量
│   ├── page.tsx             # 重构首页
│   ├── login/page.tsx       # 优化登录页
│   ├── bazi/page.tsx        # 优化排盘页
│   ├── history/page.tsx     # 优化历史页
│   ├── points/page.tsx      # 优化积分页
│   └── profile/page.tsx     # 优化用户中心
├── components/
│   └── ui/
│       ├── pill-button.tsx  # 新增：胶囊按钮
│       ├── social-proof.tsx # 新增：社会证明组件
│       └── bento-grid.tsx   # 新增：Bento 网格布局
└── public/
    └── noise.png            # 新增：颗粒纹理图片
```

## Components and Interfaces

### 1. 全局样式系统 (globals.css)

#### CSS 变量定义
```css
:root {
  /* Prismo Color Palette */
  --bg-base: #F5F0EB;
  --text-primary: #1A1A1A;
  --text-muted: rgba(0,0,0,0.5);
  --accent-orange: #F97518;
  --card-bg: #FFFFFF;
  --border-subtle: rgba(0,0,0,0.08);
  
  /* Glass Effect */
  --glass-bg: rgba(255,255,255,0.6);
  --glass-border: rgba(255,255,255,0.5);
  --glass-shadow: 0 8px 32px rgba(0,0,0,0.06);
}
```

#### 背景系统
```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -2;
  background:
    radial-gradient(circle at 0% 0%, rgba(79, 70, 229, 0.18) 0%, transparent 45%),
    radial-gradient(circle at 100% 10%, rgba(251, 146, 60, 0.15) 0%, transparent 40%),
    radial-gradient(circle at 100% 100%, rgba(219, 39, 119, 0.1) 0%, transparent 40%),
    radial-gradient(circle at 0% 80%, rgba(167, 139, 250, 0.12) 0%, transparent 35%),
    #F5F0EB;
}

body::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  background-image: url('/noise.png');
  opacity: 0.05;
  pointer-events: none;
}
```

### 2. PillButton 组件

```typescript
interface PillButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
}
```

#### 样式规范
- Primary: `bg-[#1A1A1A] text-white rounded-full`
- Secondary: `bg-transparent border border-black/15 text-[#1A1A1A] rounded-full`
- Hover: `transform: translateY(-2px)` + shadow enhancement

### 3. SocialProof 组件

```typescript
interface SocialProofProps {
  rating?: number;        // 1-5 星级
  userCount?: string;     // 如 "1000+"
  avatars?: string[];     // 头像 URL 数组
}
```

#### 布局结构
```
[★★★★★] [👤👤👤👤] [1000+ 用户信赖]
```

### 4. BentoGrid 组件

```typescript
interface BentoGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
}
```

### 5. GlassCard 样式类

```css
.glass-card {
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.5);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.06);
  transition: all 0.3s ease;
}

.glass-card:hover {
  transform: scale(1.02);
  box-shadow: 0 12px 40px rgba(0,0,0,0.1);
}
```

## Data Models

本次重构主要涉及 UI 层，不涉及数据模型变更。现有的 BaziData、Report、User 等类型保持不变。

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

本次 UI 重构主要涉及视觉样式变更，大部分验收标准属于视觉/UI 测试范畴（如颜色、动画效果），不适合通过属性测试验证。以下是经过分析后确定的可测试属性：

**Property 1: CSS 变量定义完整性**
*For any* page in the application, all required CSS custom properties (--bg-base, --text-primary, --text-muted, --accent-orange, --card-bg, --border-subtle) SHALL be defined in :root and accessible via getComputedStyle with their specified values.
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

**Property 2: 响应式布局断点行为**
*For any* viewport width value, the main content layout SHALL correctly switch between:
- Single-column layout when width < 768px
- Two-column layout when 768px ≤ width ≤ 1024px  
- Multi-column layout when width > 1024px
**Validates: Requirements 6.2, 13.1, 13.2, 13.3**

**Property 3: PillButton 样式一致性**
*For any* PillButton component instance:
- When variant='primary': background-color SHALL be #1A1A1A, text color SHALL be #FFFFFF, border-radius SHALL be 9999px (full pill)
- When variant='secondary': background SHALL be transparent, border SHALL be 1px solid with rgba(0,0,0,0.15)
**Validates: Requirements 3.1, 3.2, 3.3, 3.5**

**Property 4: GlassCard 样式一致性**
*For any* element with glass-card class, the computed styles SHALL include:
- background-color with alpha ≈ 0.6
- backdrop-filter containing blur(12px)
- border-radius between 16px and 24px
- box-shadow present
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

**Property 5: Feature Card 结构完整性**
*For any* feature card in the Feature Section, the card SHALL:
- Have glass-card styling applied
- Contain an icon element, a title element, and a description element
**Validates: Requirements 6.3, 6.4**

**Property 6: 交易记录颜色编码**
*For any* transaction item in the Transaction List:
- If transaction type is 'recharge' or 'gift', the amount text color SHALL be green-toned
- If transaction type is 'consume', the amount text color SHALL be red-toned
**Validates: Requirements 10.4**

## Error Handling

### 图片加载失败
- 如果 `/noise.png` 加载失败，颗粒纹理层将不显示，但不影响主要功能
- 使用 CSS fallback 确保背景渐变仍然正常显示

### 浏览器兼容性
- `backdrop-filter` 在部分旧浏览器不支持，提供 fallback 背景色
- 使用 `-webkit-backdrop-filter` 前缀确保 Safari 兼容

### 动画性能
- 使用 `transform` 和 `opacity` 进行动画，避免触发重排
- 对于低性能设备，可通过 `prefers-reduced-motion` 媒体查询禁用动画

## Testing Strategy

### 测试框架
- **单元测试**: Vitest + React Testing Library
- **属性测试**: fast-check (已在项目中使用)
- **E2E 测试**: Playwright (可选，用于视觉回归)

### 单元测试
- 测试 PillButton 组件的 variant 和 size props 渲染
- 测试 SocialProof 组件的 rating 和 userCount 显示
- 测试 BentoGrid 的 columns 响应式行为
- 测试 GlassCard 样式类的正确应用

### 属性测试 (Property-Based Testing)
每个属性测试必须运行至少 100 次迭代。

**Property 1 测试**: CSS 变量完整性
- 生成随机页面路径，验证所有 CSS 变量都已定义
- 标签: **Feature: prismo-ui-redesign, Property 1: CSS Variables Completeness**

**Property 2 测试**: 响应式断点
- 生成随机视口宽度 (300px - 1920px)，验证布局正确切换
- 标签: **Feature: prismo-ui-redesign, Property 2: Responsive Layout Breakpoints**

**Property 3 测试**: PillButton 样式
- 生成随机 variant 和 size 组合，验证样式正确
- 标签: **Feature: prismo-ui-redesign, Property 3: PillButton Styling**

**Property 4 测试**: GlassCard 样式
- 验证所有 glass-card 元素具有正确的 CSS 属性
- 标签: **Feature: prismo-ui-redesign, Property 4: GlassCard Styling**

**Property 5 测试**: Feature Card 结构
- 验证所有 feature card 包含必需的子元素
- 标签: **Feature: prismo-ui-redesign, Property 5: Feature Card Structure**

**Property 6 测试**: 交易颜色编码
- 生成随机交易类型，验证颜色编码正确
- 标签: **Feature: prismo-ui-redesign, Property 6: Transaction Color Coding**

### 视觉回归测试 (可选)
- 使用 Playwright 进行截图对比
- 覆盖主要页面在 375px、768px、1280px 视口下的渲染

### 手动测试清单
- [ ] 在真实设备上验证视觉效果
- [ ] 检查动画流畅度和交互反馈
- [ ] 验证颜色对比度符合 WCAG 2.1 AA 标准
- [ ] 测试深色/浅色模式切换（如适用）
