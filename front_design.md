# 前端体验设计需求文档 (PRD)

**文档版本**: v2.1
**更新日期**: 2026-01-10
**主视觉参考**: [Prismo](https://prismo.framer.website/)
**项目名称**: 八字命理 AI 智能分析系统

---

## 1. 设计理念 (Design Philosophy)

参考 Prismo 模板的"**柔光晨曦**"视觉语言，打造一个**温暖、专业、高转化**的命理工具。

*   **核心体验**: 用户应该感受到"晨光初照，云雾渐散"的通透与希望感。
*   **视觉关键词**: `Soft Gradient` (柔和渐变), `Grain Texture` (颗粒质感), `Warm Minimalism` (暖色极简).

---

## 2. 视觉设计规范 (Visual Design Tokens)

### 2.1 背景系统 ⭐ (核心)

Prismo 最具辨识度的视觉元素是其**多层弥散光晕背景**。

```
背景结构 (由下至上):
1. 底色: #F2F0EE (暖米白)
2. 弥散光晕层 (Blur Clouds):
   - 左上角: 淡紫蓝色 (Indigo/Light Blue)
   - 右上角/右侧: 淡粉橙色 (Soft Peach/Coral)
   - 底部/左下: 淡紫色 (Pale Violet)
   - 所有光晕应用 `filter: blur(100px - 150px)`
3. 颗粒纹理层 (Grain Overlay):
   - 全屏覆盖一层细微的 Noise/Grain 纹理
   - 透明度约 5%-10%
   - 目的: 增加"印刷品"般的触感，消除数字平面感
```

**CSS 实现**:
```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(circle at 0% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 40%), /* Indigo glow top-left */
    radial-gradient(circle at 100% 10%, rgba(251, 146, 60, 0.12) 0%, transparent 35%), /* Peach glow top-right */
    radial-gradient(circle at 100% 100%, rgba(192, 132, 252, 0.1) 0%, transparent 40%), /* Violet glow bottom-right */
    radial-gradient(circle at 0% 80%, rgba(244, 114, 182, 0.08) 0%, transparent 35%), /* Pink glow bottom-left */
    #F2F0EE; /* Base warm cream */
}

/* Grain texture overlay */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  background-image: url('/noise.png'); /* 或使用 SVG filter */
  opacity: 0.05;
  pointer-events: none;
}
```

### 2.2 色彩体系

| Token Name | Value | Usage |
| :--- | :--- | :--- |
| `--bg-base` | `#F2F0EE` | 页面底色 (暖奶油白) |
| `--text-primary` | `#1A1A1A` or `#1E0D01` | 主标题/正文 (深黑/深棕) |
| `--text-muted` | `rgba(0,0,0,0.5)` | 次要文字 |
| `--accent-orange` | `#F97518` | 高亮文字、标签 |
| `--accent-gradient` | `linear-gradient(90deg, #FF2F2F, #EF7B16, #8A43E1, #D511FD)` | 渐变强调线/隐藏动效 |
| `--card-bg` | `#FFFFFF` | 卡片背景 |
| `--border-subtle` | `rgba(0,0,0,0.08)` | 卡片边框、分割线 |

### 2.3 排版

*   **字体**: `Inter` 或 `Geist Sans`
*   **Hero 标题**: `font-size: 52px - 72px`, `font-weight: 500-600`, `letter-spacing: -1px`
*   **正文**: `font-size: 16px`, `line-height: 1.6`, `color: var(--text-muted)`

### 2.4 按钮样式

*   **Primary CTA**:
    *   背景: `#1A1A1A` (接近纯黑)
    *   文字: `#FFFFFF`
    *   圆角: `100px` (胶囊形)
    *   Hover: 轻微上浮 + 阴影增强
*   **Secondary CTA**:
    *   背景: 透明或白色
    *   边框: `1px solid rgba(0,0,0,0.15)`
    *   文字: `#1A1A1A`

### 2.5 卡片与容器

*   **Glass Card (Prismo 风格)**:
    *   背景: `rgba(255,255,255,0.6)` 或半透明白
    *   `backdrop-filter: blur(12px)`
    *   边框: `1px solid rgba(255,255,255,0.5)`
    *   圆角: `16px - 24px`
    *   阴影: `0 8px 32px rgba(0,0,0,0.06)`

---

## 3. 页面功能详述

### 3.1 首页 (Landing Page)

*   **Hero Section**:
    *   居中大标题 + 副标题
    *   黑色 CTA 按钮 "立即排盘"
    *   社会证明: 星级评分 + 用户头像堆叠 + "X+ 用户信赖"
    *   背景: 弥散光晕 + 颗粒纹理
*   **产品截图**:
    *   使用 Glassmorphism 风格的浮动卡片包裹产品截图
    *   卡片有轻微阴影，模拟"悬浮"效果

### 3.2 八字排盘页

*   **输入表单**: 白色 Glass Card，内含日期选择、地点选择、性别切换。
*   **结果展示**: Bento Grid 布局，每个模块为一个 Glass Card。
*   **AI 分析解锁**: 未解锁区域覆盖模糊层 + 橙色解锁按钮。

### 3.3 历史记录页

*   左右分栏布局 (列表 + 详情)。
*   列表项为白色卡片，选中项边框高亮 (橙色或黑色)。

### 3.4 登录页

*   居中 Glass Card 表单。
*   背景与首页一致 (弥散光晕)。

---

## 4. 动效设计

| 场景 | 动效 |
| :--- | :--- |
| **页面入场** | 元素 Staggered Fade-in Up (错落上浮淡入) |
| **CTA Hover** | `translateY(-2px)` + 阴影增强 |
| **卡片 Hover** | `scale(1.01)` 或轻微上浮 |
| **背景光晕** | 可选: 缓慢、微妙的位置动画 (如 `translateX` 循环) |

---

## 5. 附录: 视觉参考

![Prismo Hero Section](/Users/zhihaoli/.gemini/antigravity/brain/04c7f0e5-d4de-4d92-bc78-de6b7307ada0/prismo_hero_section_1768027478393.png)

**关键视觉提取**:
*   背景的紫蓝/粉橙弥散光晕
*   细腻的颗粒纹理
*   Glassmorphism 产品截图容器
*   黑色胶囊 CTA 按钮

---

**备注**: 设计师应重点参考 Prismo 的背景渐变处理和整体"柔光"氛围，将其与八字命理的"神秘/希望"主题融合。

