# 前端体验设计需求文档 (PRD)

**文档版本**: v2.1  
**更新日期**: 2026-01-10  
**主视觉参考**: [Prismo](https://prismo.framer.website/)  
**项目名称**: 八字命理 AI 智能分析系统

---

## 1. 设计理念 (Design Philosophy)

参考 Prismo 模板的"**柔光晨曦**"视觉语言，打造一个**温暖、专业、高转化**的命理工具。

- **核心体验**: 用户应该感受到"晨光初照，云雾渐散"的通透与希望感
- **视觉关键词**: `Soft Gradient` (柔和渐变), `Grain Texture` (颗粒质感), `Warm Minimalism` (暖色极简)

---

## 2. 视觉设计规范 (Visual Design Tokens)

### 2.1 背景系统 ⭐ (核心)

Prismo 最具辨识度的视觉元素是其**多层弥散光晕背景**。

**背景结构 (由下至上):**

1. **底色**: `#F2F0EE` (暖米白)
2. **弥散光晕层 (Blur Clouds)**:
   - 左上角: 淡紫蓝色 (Indigo/Light Blue)
   - 右上角/右侧: 淡粉橙色 (Soft Peach/Coral)
   - 底部/左下: 淡紫色 (Pale Violet)
   - 所有光晕应用 `filter: blur(100px - 150px)`
3. **颗粒纹理层 (Grain Overlay)**:
   - 全屏覆盖一层细微的 Noise/Grain 纹理
   - 透明度约 5%-10%
   - 目的: 增加"印刷品"般的触感，消除数字平面感

**CSS 实现:**

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(circle at 0% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 40%),
    radial-gradient(circle at 100% 10%, rgba(251, 146, 60, 0.12) 0%, transparent 35%),
    radial-gradient(circle at 100% 100%, rgba(192, 132, 252, 0.1) 0%, transparent 40%),
    radial-gradient(circle at 0% 80%, rgba(244, 114, 182, 0.08) 0%, transparent 35%),
    #F2F0EE;
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

### 2.2 色彩体系

| Token Name | Value | Usage |
| :--- | :--- | :--- |
| `--bg-base` | `#F2F0EE` | 页面底色 (暖奶油白) |
| `--text-primary` | `#1A1A1A` | 主标题/正文 (深黑) |
| `--text-muted` | `rgba(0,0,0,0.5)` | 次要文字 |
| `--accent-orange` | `#F97518` | 高亮文字、标签 |
| `--card-bg` | `#FFFFFF` | 卡片背景 |
| `--border-subtle` | `rgba(0,0,0,0.08)` | 卡片边框、分割线 |

### 2.3 排版

- **字体**: `Geist Sans` (当前项目已配置)
- **Hero 标题**: `font-size: 52px - 72px`, `font-weight: 500-600`, `letter-spacing: -1px`
- **正文**: `font-size: 16px`, `line-height: 1.6`, `color: var(--text-muted)`

### 2.4 按钮样式

**Primary CTA (Prismo 风格):**
- 背景: `#1A1A1A` (接近纯黑)
- 文字: `#FFFFFF`
- 圆角: `100px` (胶囊形)
- Hover: `translateY(-2px)` + 阴影增强

**Secondary CTA:**
- 背景: 透明或白色
- 边框: `1px solid rgba(0,0,0,0.15)`
- 文字: `#1A1A1A`

### 2.5 卡片与容器

**Glass Card (Prismo 风格):**
- 背景: `rgba(255,255,255,0.6)`
- `backdrop-filter: blur(12px)`
- 边框: `1px solid rgba(255,255,255,0.5)`
- 圆角: `16px - 24px`
- 阴影: `0 8px 32px rgba(0,0,0,0.06)`

---

## 3. 页面功能详述

### 3.1 首页 (Landing Page) - `/`

**Hero Section:**
- 居中大标题 + 副标题
- 黑色胶囊 CTA 按钮 "立即排盘"
- 社会证明: 星级评分 + 用户头像堆叠 + "X+ 用户信赖"
- 背景: 弥散光晕 + 颗粒纹理

**Feature Cards:**
- 三列 Bento Grid 布局
- 每个卡片为 Glass Card 风格
- 图标 + 标题 + 描述

### 3.2 八字排盘页 - `/bazi`

**输入表单:**
- 白色 Glass Card 容器
- 日期选择器、时辰选择、性别切换
- 地点选择 (用于真太阳时校正)

**结果展示:**
- Bento Grid 布局展示四柱信息
- 五行分布可视化
- 每个模块为独立 Glass Card

**AI 分析区域:**
- 未解锁: 模糊遮罩 + 橙色解锁按钮
- 已解锁: 分 Tab 展示各维度分析

### 3.3 历史记录页 - `/history`

**布局:**
- 左右分栏 (1:2 比例)
- 左侧: 报告列表 (可滚动)
- 右侧: 报告详情

**列表项:**
- 白色卡片，悬停高亮
- 选中项边框高亮 (紫色)
- 显示: 农历日期 + 生成时间

### 3.4 积分中心页 - `/points`

**余额卡片:**
- 大号数字展示当前积分
- 渐变文字效果

**充值套餐:**
- 四列网格布局
- 每个套餐为独立卡片
- 悬停放大效果

**积分明细:**
- 列表形式展示交易记录
- 充值/消费用不同颜色区分

### 3.5 用户中心页 - `/profile`

**用户信息卡:**
- 头像 + 用户名/手机号
- 三列统计数据 (积分/报告数/消费)

**快捷操作:**
- 四宫格图标按钮
- 八字排盘/历史记录/积分充值/退出登录

### 3.6 登录页 - `/login`

**布局:**
- 居中 Glass Card 表单
- 背景与首页一致

**表单:**
- Tab 切换: 手机号登录 / 账号密码
- 验证码输入 + 倒计时按钮
- 注册/登录模式切换

---

## 4. 动效设计

| 场景 | 动效 | 参数 |
| :--- | :--- | :--- |
| 页面入场 | Staggered Fade-in Up | `duration: 0.5s`, `delay: 0.1s * index` |
| CTA Hover | 上浮 + 阴影 | `translateY(-2px)`, `box-shadow` 增强 |
| 卡片 Hover | 轻微放大 | `scale(1.02)` |
| 背景光晕 | 缓慢漂移 (可选) | `translateX` 循环, `duration: 20s` |
| 加载状态 | Spinner | `animate-spin` |

---

## 5. 响应式断点

| 断点 | 宽度 | 布局调整 |
| :--- | :--- | :--- |
| Mobile | `< 768px` | 单列布局，隐藏侧边栏 |
| Tablet | `768px - 1024px` | 两列布局 |
| Desktop | `> 1024px` | 完整多列布局 |

---

## 6. 组件清单

### 已有组件 (src/components/ui/)

- `header.tsx` - 顶部导航栏
- `glass-card` - 毛玻璃卡片 (CSS class)
- `glass-select.tsx` - 毛玻璃下拉选择
- `glass-switch.tsx` - 毛玻璃开关
- `background-beams.tsx` - 背景光束效果
- `spotlight.tsx` - 聚光灯效果
- `moving-border.tsx` - 动态边框

### 建议新增组件

- `SocialProof` - 社会证明组件 (头像堆叠 + 评分)
- `PillButton` - 胶囊按钮 (Prismo 风格)
- `GrainOverlay` - 颗粒纹理覆盖层
- `BentoGrid` - Bento 网格布局容器

---

## 7. 关键视觉参考

**Prismo Hero Section 特征提取:**

1. 背景的紫蓝/粉橙弥散光晕
2. 细腻的颗粒纹理
3. Glassmorphism 产品截图容器
4. 黑色胶囊 CTA 按钮
5. 居中对称的排版
6. 大量留白，呼吸感强

---

## 8. 实施建议

1. **优先级 P0**: 更新 `globals.css` 背景系统为 Prismo 风格
2. **优先级 P1**: 重构首页 Hero Section，添加社会证明
3. **优先级 P2**: 统一按钮样式为胶囊形
4. **优先级 P3**: 添加颗粒纹理层

**备注**: 设计师应重点参考 Prismo 的背景渐变处理和整体"柔光"氛围，将其与八字命理的"神秘/希望"主题融合。
