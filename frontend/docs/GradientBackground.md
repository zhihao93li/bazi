# GradientBackground 组件文档

一个精美的可复用渐变背景组件，包含栅格线、彩色光效、渐变遮罩和噪点纹理效果。

![Preview](../public/preview-gradient-background.png)

---

## 📦 安装

找到 https://github.com/zhihao93li/prismo-react， 将以下两个文件复制到你的项目中：

```
src/components/
├── GradientBackground.jsx
└── GradientBackground.module.css
```

## 🚀 快速开始

### 基础用法

```jsx
import GradientBackground from './components/GradientBackground'

function MyComponent() {
  return (
    <section style={{ position: 'relative', overflow: 'hidden' }}>
      <GradientBackground />
      
      {/* 你的内容 */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h1>Hello World</h1>
      </div>
    </section>
  )
}
```

> ⚠️ **重要**：父容器必须设置 `position: relative` 和 `overflow: hidden`

---

## 📋 Props 参数

| 参数名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `gridCount` | `number` | `24` | 垂直栅格线的数量 |
| `showLeftGlow` | `boolean` | `true` | 是否显示左侧彩色光效 |
| `showRightGlow` | `boolean` | `true` | 是否显示右侧彩色光效 |
| `glowColors` | `string[]` | 见下方 | 光效颜色数组（4个颜色） |
| `backgroundColor` | `string` | `rgb(244, 242, 241)` | 背景颜色 |
| `noiseOpacity` | `number` | `0.75` | 噪点纹理透明度 (0-1) |
| `noiseUrl` | `string` | Framer CDN | 噪点纹理图片 URL |
| `showTopGradient` | `boolean` | `true` | 是否显示顶部渐变遮罩 |
| `showBottomGradient` | `boolean` | `true` | 是否显示底部渐变遮罩 |
| `className` | `string` | `''` | 额外的 CSS 类名 |
| `style` | `object` | `{}` | 额外的内联样式 |

### 默认光效颜色

```js
const DEFAULT_GLOW_COLORS = [
  'rgba(138, 67, 225, 1)',   // 紫色 Purple
  'rgba(213, 17, 253, 1)',   // 粉色 Pink
  'rgba(239, 123, 22, 1)',   // 橙色 Orange
  'rgba(255, 47, 47, 1)',    // 红色 Red
]
```

---

## 💡 使用示例

### 1. 自定义栅格线数量

```jsx
<GradientBackground gridCount={12} />
```

### 2. 自定义颜色主题（蓝绿色调）

```jsx
<GradientBackground 
  glowColors={[
    'rgba(0, 200, 255, 1)',    // 青色
    'rgba(0, 150, 200, 1)',    // 蓝色
    'rgba(100, 255, 200, 1)',  // 绿色
    'rgba(0, 100, 150, 1)',    // 深蓝
  ]}
  backgroundColor="#0a1628"
/>
```

### 3. 深色主题

```jsx
<GradientBackground 
  backgroundColor="#1a1a1a"
  noiseOpacity={0.3}
/>
```

### 4. 只显示单侧光效

```jsx
{/* 只显示左侧光效 */}
<GradientBackground showRightGlow={false} />

{/* 只显示右侧光效 */}
<GradientBackground showLeftGlow={false} />
```

### 5. 禁用渐变遮罩

```jsx
<GradientBackground 
  showTopGradient={false}
  showBottomGradient={false}
/>
```

### 6. 完整自定义示例

```jsx
<GradientBackground 
  gridCount={16}
  showLeftGlow={true}
  showRightGlow={true}
  glowColors={[
    '#FF6B6B',  // 珊瑚红
    '#4ECDC4',  // 薄荷绿
    '#45B7D1',  // 天空蓝
    '#96CEB4',  // 抹茶绿
  ]}
  backgroundColor="#FFF5E6"
  noiseOpacity={0.5}
  showTopGradient={true}
  showBottomGradient={true}
  className="my-custom-class"
  style={{ minHeight: '100vh' }}
/>
```

---

## 🎨 视觉效果说明

### 组件层级结构

```
Background (z-index: 0)
├── Left Abstract (彩色椭圆光效)
│   ├── Ellipse Group 1 (blur: 120px)
│   └── Ellipse Group 2 (blur: 100px)
├── Right Abstract (彩色椭圆光效)
│   ├── Ellipse Group 1 (blur: 120px)
│   └── Ellipse Group 2 (blur: 100px)
├── Grid Lines (z-index: 1)
│   └── 24 个垂直栅格 (backdrop-filter: blur(25px))
├── Top Gradient (z-index: 2) - 顶部渐变遮罩
├── Bottom Gradient (z-index: 3) - 底部渐变遮罩
└── Noise Texture (z-index: 4) - 噪点纹理
```

### 栅格线效果

- 每条栅格线使用 `backdrop-filter: blur(25px)` 实现毛玻璃效果
- 栅格线之间使用 `::after` 伪元素绘制 1px 白色半透明分割线
- 水平渐变背景：`linear-gradient(270deg, rgba(242,240,238,0.2) 0%, rgba(242,240,238,0) 100%)`

### 光效椭圆

- 每组包含 4 个 207x207px 的圆形
- 应用 120px / 100px 的模糊效果
- 位置预设可产生自然的光晕过渡

---

## 🔧 自定义样式

### 覆盖默认样式

```css
/* 在你的 CSS 文件中 */
.my-custom-background {
  /* 调整背景扩展范围 */
  left: -200px !important;
  right: -200px !important;
}
```

```jsx
<GradientBackground className="my-custom-background" />
```

### CSS 变量（可选）

如果你的项目使用 CSS 变量，可以在 `GradientBackground.module.css` 中修改：

```css
.background {
  background-color: var(--bg-primary, rgb(244, 242, 241));
}
```

---

## 📱 响应式设计

组件内置了响应式优化，在不同屏幕尺寸下自动调整视觉效果：

| 屏幕尺寸 | 栅格线 | 噪点 | 光效 |
|---------|--------|------|------|
| 桌面端 (>900px) | 正常透明度 | 0.75 | 100% 尺寸 |
| 平板端 (600-900px) | 60% 透明度 | 0.5 | 80% 尺寸 |
| 移动端 (400-600px) | 30% 透明度 | 0.25 | 60% 尺寸 |
| 超小屏 (<400px) | 15% 透明度 | 0.15 | 40% 尺寸 |

### 为什么需要响应式？

参考 [Prismo 原始设计](https://prismo.framer.website/)，在小屏幕下：

1. **栅格线变淡** - 屏幕变窄时，24条栅格线的每条相对变宽，视觉上更突出，需要降低透明度
2. **噪点变柔和** - 噪点图案大小固定，在小屏幕上占比更大，需要降低透明度避免干扰
3. **光效缩小** - 大尺寸的光效在小屏幕上会过于抢眼，需要适当缩小

---

## 📝 注意事项

1. **性能考虑**：`backdrop-filter` 在某些设备上可能影响性能，如需优化可减少 `gridCount`

2. **浏览器兼容性**：
   - `backdrop-filter` 需要 `-webkit-` 前缀支持 Safari
   - 建议在 CSS 中同时使用：
     ```css
     backdrop-filter: blur(25px);
     -webkit-backdrop-filter: blur(25px);
     ```

3. **Z-Index 管理**：确保你的内容层 `z-index` 大于 4（噪点层）

4. **噪点纹理**：默认使用 Framer CDN 的图片，如需离线使用请下载到本地

5. **响应式自动生效**：无需额外配置，组件会根据屏幕尺寸自动调整视觉效果

---

## 📄 导出接口

组件还导出了两个常量，方便外部使用：

```js
import GradientBackground, { 
  DEFAULT_GLOW_COLORS, 
  ELLIPSE_POSITIONS 
} from './components/GradientBackground'

// DEFAULT_GLOW_COLORS - 默认的 4 个光效颜色
// ELLIPSE_POSITIONS - 椭圆的位置配置数组
```

---

## 🎯 最佳实践

```jsx
// ✅ 推荐：包裹在有定位的容器中
<section className="hero">
  <GradientBackground />
  <div className="content">...</div>
</section>

// ✅ 推荐：CSS 设置
.hero {
  position: relative;
  overflow: hidden;
}
.content {
  position: relative;
  z-index: 1;
}

// ❌ 避免：不设置父容器定位
<div>
  <GradientBackground /> {/* 背景会溢出 */}
</div>
```

---

## 📜 License

MIT © 2026
