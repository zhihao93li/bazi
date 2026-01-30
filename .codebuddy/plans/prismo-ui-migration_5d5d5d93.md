---
name: prismo-ui-migration
overview: 将前端项目中的通用组件（common/）抽离为独立的 NPM 包 @your-org/prismo-ui，包括 TypeScript 迁移、构建配置、Storybook 文档和完整的测试体系
todos:
  - id: create-project-structure
    content: 创建 prismo-ui 项目目录结构，初始化 package.json、tsconfig.json、vite.config.ts、.storybook 配置文件
    status: completed
  - id: migrate-design-system
    content: 迁移设计系统文件（variables.css、global.css）到 prismo-ui/src/styles/，确保 CSS 变量完整性
    status: completed
    dependencies:
      - create-project-structure
  - id: migrate-button-card-tag
    content: 使用 [skill:frontend-patterns] 和 [skill:coding-standards] 将 Button、Card、Tag 组件迁移到 TypeScript，包含完整类型定义、CSS Modules、Storybook stories
    status: completed
    dependencies:
      - migrate-design-system
  - id: migrate-modal-toast
    content: 将 Modal、Toast（包含 ToastProvider 和 useToast）迁移到 TypeScript，保持 Context API 和 Framer Motion 动画
    status: completed
    dependencies:
      - migrate-design-system
  - id: migrate-form-components
    content: 将 Form 系列组件（FormInput、FormSelect、Checkbox、ButtonGroup）迁移到 TypeScript，统一组织到 Form/ 目录
    status: completed
    dependencies:
      - migrate-design-system
  - id: migrate-loading-gradient
    content: 将 Loading（LoadingSpinner、LoadingOverlay）和 GradientBackground 迁移到 TypeScript
    status: completed
    dependencies:
      - migrate-design-system
  - id: setup-build-config
    content: 配置 Vite Library Mode 构建，实现 ESM/CJS 双格式输出，配置 peerDependencies，测试构建产物
    status: completed
    dependencies:
      - migrate-button-card-tag
      - migrate-modal-toast
      - migrate-form-components
      - migrate-loading-gradient
  - id: create-storybook-docs
    content: 为所有组件创建完整的 Storybook stories，包括默认状态、所有变体、交互示例
    status: completed
    dependencies:
      - migrate-button-card-tag
      - migrate-modal-toast
      - migrate-form-components
      - migrate-loading-gradient
  - id: test-and-publish
    content: 本地测试构建产物，验证类型声明，发布到 NPM（npm publish），创建 README.md 和使用文档
    status: completed
    dependencies:
      - setup-build-config
      - create-storybook-docs
  - id: update-original-project
    content: 更新 bazi/frontend 项目，安装 @prismo/ui 依赖，替换所有组件导入，移除旧组件文件，验证功能完整性
    status: completed
    dependencies:
      - test-and-publish
---

## 用户需求

将 bazi 项目前端的通用组件独立成 NPM 包，具体要求：

1. 迁移到 TypeScript
2. 添加 Storybook 文档
3. 发布到 NPM
4. 原项目改为依赖这个包
5. **全面响应式优化**（Mobile-first，支持 mobile/tablet/desktop 三断点）
6. **独立 Git 仓库**（与主项目分离）

## 产品概述

创建一个名为 `@prismo/ui` 的独立 React 组件库，包含 Prismo Design System 的所有基础 UI 组件。该组件库将：

- 提供 10+ 个高质量的 React 组件（Button、Card、Modal、Toast、Form 系列等）
- 包含完整的 Prismo 设计系统（颜色、间距、圆角、阴影规范）
- 支持 TypeScript，提供完整类型定义
- 提供 Storybook 交互式文档
- 支持 ESM 和 CJS 双格式输出
- 零业务耦合，适用于任何 React 项目
- **完整的响应式设计**（Mobile-first，三断点体系：375px/768px/1024px）
- **独立 Git 仓库**（可独立开发、版本管理和部署）

## 核心功能

1. **基础组件库**：Button、Card、Tag、GradientBackground 等通用组件
2. **表单组件**：FormInput、FormSelect、Checkbox、ButtonGroup
3. **反馈组件**：Modal、Toast、Loading
4. **设计系统**：CSS 变量系统、颜色规范、间距系统
5. **响应式系统**：Mobile-first 三断点体系，所有组件完整适配
6. **触摸优化**：移动端更大的点击区域、手势支持
7. **TypeScript 类型**：完整的 Props 类型定义和类型导出
8. **Storybook 文档**：每个组件的交互式示例和 API 文档（含响应式预览）
9. **构建产物**：ESM/CJS 双格式、CSS 文件、类型声明文件

## 技术栈

### 核心技术

- **React**: 18.3+ (peerDependency)
- **TypeScript**: 5.x (开发依赖)
- **Framer Motion**: 11.x (peerDependency，动画库)
- **@phosphor-icons/react**: 2.x (peerDependency，图标库)

### 构建工具

- **Vite**: 5.x (构建工具，支持 Library Mode)
- **tsup**: 8.x (备选，更好的库构建体验)
- **rollup-plugin-postcss**: CSS 处理

### 文档工具

- **Storybook**: 8.x (组件文档和开发环境)
- **@storybook/react-vite**: Storybook Vite 集成

### 开发工具

- **ESLint**: 9.x (代码规范)
- **Prettier**: 3.x (代码格式化)
- **Vitest**: 测试框架（可选）

## 实施方案

### 1. 项目架构设计

采用**独立 Git 仓库**结构，完全与主项目分离：

```
# 新建独立仓库
/Users/zhihaoli/Documents/项目/prismo-ui/  # 独立 Git 仓库
├── .git/                              # 独立的 Git 版本控制
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.css
│   │   │   ├── Button.stories.tsx
│   │   │   └── index.ts
│   │   ├── Card/
│   │   ├── Modal/
│   │   ├── Toast/
│   │   ├── Form/
│   │   │   ├── FormInput/
│   │   │   ├── FormSelect/
│   │   │   ├── Checkbox/
│   │   │   └── ButtonGroup/
│   │   ├── Loading/
│   │   ├── Tag/
│   │   └── GradientBackground/
│   ├── styles/
│   │   ├── variables.css          # 包含响应式断点定义
│   │   ├── global.css
│   │   └── responsive.css         # 全局响应式工具类
│   ├── hooks/                     # 响应式 hooks
│   │   ├── useBreakpoint.ts
│   │   └── useTouchDevice.ts
│   └── index.ts
├── .storybook/
│   ├── main.ts
│   ├── preview.ts                 # 配置响应式 viewports
│   └── manager.ts
├── .github/
│   └── workflows/
│       ├── publish.yml            # NPM 发布 CI
│       └── storybook.yml          # Storybook 部署
├── dist/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .gitignore
├── LICENSE
└── README.md

# 原项目
/Users/zhihaoli/Documents/项目/bazi/
└── frontend/
    └── package.json               # 安装 @prismo/ui 作为依赖
```

### 2. 组件迁移策略

#### 阶段一：JSX -> TSX 转换 + 响应式基础

- 为每个组件添加 TypeScript 类型定义
- 定义 Props 接口，使用严格类型
- **建立响应式断点系统**（Mobile-first）
- 确保 CSS Modules 类型安全（使用 `*.module.css.d.ts`）

#### 阶段二：全面响应式优化

**断点体系**（Mobile-first）：

```css
/* variables.css */
:root {
  /* Breakpoints */
  --breakpoint-mobile: 375px;   /* 默认基准 */
  --breakpoint-tablet: 768px;   /* iPad 及以上 */
  --breakpoint-desktop: 1024px; /* 桌面端 */
}
```

**每个组件的响应式清单**：

1. **字体大小**：mobile/tablet/desktop 三档
2. **间距**：padding/margin 自适应
3. **布局**：flex/grid 断点变化
4. **尺寸**：width/height 百分比或 max-width
5. **触摸优化**：移动端最小 44x44px 点击区域

#### 阶段三：组件结构重组

- 将 `components/common/` 和根目录的通用组件统一迁移
- 每个组件独立目录，包含 `.tsx`、`.module.css`、`.stories.tsx`、`index.ts`
- Form 组件组织到 `Form/` 子目录下
- 保持原有的导出接口一致性

#### 阶段四：依赖处理

- 将 react、react-dom、framer-motion、@phosphor-icons/react 设为 peerDependencies
- 确保没有业务逻辑依赖（如 react-router-dom 仅在必要时用于 Button 的 Link 模式）
- 移除 Ant Design 等第三方 UI 库依赖

### 3. 构建配置

使用 **Vite Library Mode** 进行构建：

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    react(),
    dts({ include: ['src'] }) // 生成类型声明
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PrismoUI',
      formats: ['es', 'cjs'],
      fileName: (format) => `prismo-ui.${format === 'es' ? 'mjs' : 'cjs'}`
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'framer-motion', '@phosphor-icons/react'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'framer-motion': 'FramerMotion',
          '@phosphor-icons/react': 'PhosphorIcons'
        }
      }
    },
    cssCodeSplit: false // 将所有 CSS 打包到一个文件
  }
})
```

### 4. TypeScript 配置

```
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "outDir": "./dist",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.stories.tsx"]
}
```

### 5. Package.json 配置

```
{
  "name": "@prismo/ui",
  "version": "0.1.0",
  "description": "Prismo Design System - React Component Library",
  "type": "module",
  "main": "./dist/prismo-ui.cjs",
  "module": "./dist/prismo-ui.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/prismo-ui.mjs",
      "require": "./dist/prismo-ui.cjs",
      "types": "./dist/index.d.ts"
    },
    "./styles": "./dist/style.css"
  },
  "files": ["dist"],
  "sideEffects": ["**/*.css"],
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "framer-motion": "^11.0.0",
    "@phosphor-icons/react": "^2.0.0"
  },
  "scripts": {
    "dev": "storybook dev -p 6006",
    "build": "vite build",
    "build:storybook": "storybook build",
    "lint": "eslint src --ext ts,tsx",
    "typecheck": "tsc --noEmit"
  }
}
```

### 6. Storybook 配置

```typescript
// .storybook/main.ts
export default {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
}
```

### 7. 组件示例（TypeScript 迁移）

```typescript
// src/components/Button/Button.tsx
import { Link } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'
import styles from './Button.module.css'

export interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'light'
  size?: 'small' | 'medium' | 'large'
  to?: string
  href?: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  showArrow?: boolean
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  to,
  href,
  onClick,
  showArrow = false,
  className = '',
  disabled = false,
  type = 'button',
  ...props 
}) => {
  const buttonClass = `${styles.button} ${styles[variant]} ${styles[size]} ${className}`
  
  const content = (
    <>
      {children}
      {showArrow && <ArrowRight size={16} weight="bold" />}
    </>
  )

  if (to && !disabled) {
    return (
      <Link to={to} className={buttonClass} {...props}>
        {content}
      </Link>
    )
  }

  if (href && !disabled) {
    return (
      <a href={href} className={buttonClass} target="_blank" rel="noopener noreferrer" {...props}>
        {content}
      </a>
    )
  }

  return (
    <button 
      className={buttonClass} 
      onClick={onClick} 
      disabled={disabled}
      type={type}
      {...props}
    >
      {content}
    </button>
  )
}
```

### 8. 原项目迁移策略

#### 依赖更新

```
// bazi/frontend/package.json
{
  "dependencies": {
    "@prismo/ui": "^0.1.0",
    // 移除已包含在 @prismo/ui 中的 peerDependencies
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "framer-motion": "^11.0.0",
    "@phosphor-icons/react": "^2.1.7"
  }
}
```

#### 导入方式变更

```typescript
// 旧方式
import { FormInput, Card, Modal } from '../components/common'
import Button from '../components/Button'

// 新方式
import { FormInput, Card, Modal, Button } from '@prismo/ui'
import '@prismo/ui/styles'
```

## 实施细节

### 响应式设计规范

#### 断点策略（Mobile-first）

```css
/* 默认样式：Mobile (375px+) */
.button {
  font-size: 16px;
  padding: 12px 20px;
  min-height: 44px; /* 触摸友好 */
}

/* Tablet (768px+) */
@media (min-width: 768px) {
  .button {
    font-size: 17px;
    padding: 14px 24px;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .button {
    font-size: 18px;
    padding: 16px 32px;
    min-height: auto; /* 桌面端不需要大触摸区域 */
  }
}
```

#### 响应式工具 Hooks

```typescript
// hooks/useBreakpoint.ts
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('mobile')
  // 监听 window.matchMedia 变化
  return breakpoint
}

// hooks/useTouchDevice.ts
export const useTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}
```

#### 组件响应式要求

| 组件 | 移动端优化 | Tablet 变化 | Desktop 变化 |
| --- | --- | --- | --- |
| **Button** | 44x44px 最小点击区域 | 字体增大 | 添加 hover 效果 |
| **Card** | padding: 16px | padding: 20px | padding: 24px |
| **Modal** | 底部弹出 | 居中，80% 宽度 | 居中，固定 max-width |
| **FormInput** | 字体 16px（防缩放） | 字体 17px | 字体 18px |
| **FormSelect** | 原生下拉（iOS） | 自定义下拉 | 自定义下拉 |
| **ButtonGroup** | 全宽按钮，纵向堆叠 | 横向布局 | 横向布局 + hover |
| **Toast** | 顶部，全宽 | 右上角，固定宽度 | 右上角，固定宽度 |


### 性能优化

1. **Tree-shaking 支持**：使用 named exports，允许打包工具进行 tree-shaking
2. **CSS 代码分割**：考虑每个组件独立 CSS 文件（可选）
3. **按需加载**：支持 `import { Button } from '@prismo/ui/Button'` 形式
4. **响应式性能**：使用 CSS 媒体查询而非 JS 监听，减少重渲染

### 版本管理

1. **语义化版本**：严格遵循 SemVer 规范
2. **变更日志**：维护 CHANGELOG.md
3. **发布流程**：使用 npm version + git tag
4. **独立仓库管理**：

- GitHub Actions 自动发布到 NPM
- Storybook 自动部署到 GitHub Pages
- 独立的 Issue 和 PR 管理

### 质量保证

1. **类型检查**：确保所有组件都有完整的 TypeScript 类型
2. **ESLint 规则**：统一代码风格
3. **Storybook 测试**：每个组件至少 5 个 story：

- 默认状态
- 所有变体（variant/size）
- 移动端视图（375px）
- Tablet 视图（768px）
- Desktop 视图（1024px+）

4. **响应式验证**：使用 Storybook viewport addon 测试所有断点
5. **触摸设备测试**：在真机上测试交互体验
6. **文档完整性**：README、组件 API 文档、响应式行为说明

### 注意事项

1. **React Router 依赖**：Button 组件的 Link 模式依赖 react-router-dom，设为 optional peerDependency
2. **CSS 变量继承**：确保 variables.css 在使用前被导入
3. **Framer Motion 优化**：考虑 lazy import 减小初始包体积
4. **向后兼容**：保持原有 API 接口不变，确保原项目平滑迁移
5. **独立仓库管理**：

- 创建新的 GitHub 仓库 `prismo-ui`
- 配置 NPM 发布权限
- 设置 GitHub Actions CI/CD
- 部署 Storybook 到 GitHub Pages

6. **响应式测试**：

- 使用 BrowserStack 或真机测试
- 验证 iOS/Android 不同设备
- 确保触摸事件正常工作

## 目录结构详解

### 组件库项目结构

```
prismo-ui/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx              # 组件实现
│   │   │   ├── Button.module.css       # 组件样式
│   │   │   ├── Button.stories.tsx      # Storybook 文档
│   │   │   └── index.ts                # 导出
│   │   ├── Card/
│   │   │   ├── Card.tsx
│   │   │   ├── Card.module.css
│   │   │   ├── Card.stories.tsx
│   │   │   └── index.ts
│   │   ├── Modal/
│   │   │   ├── Modal.tsx
│   │   │   ├── Modal.module.css
│   │   │   ├── Modal.stories.tsx
│   │   │   └── index.ts
│   │   ├── Toast/
│   │   │   ├── Toast.tsx               # ToastProvider 和 useToast
│   │   │   ├── Toast.module.css
│   │   │   ├── Toast.stories.tsx
│   │   │   └── index.ts
│   │   ├── Form/
│   │   │   ├── FormInput/
│   │   │   │   ├── FormInput.tsx
│   │   │   │   ├── FormInput.module.css
│   │   │   │   ├── FormInput.stories.tsx
│   │   │   │   └── index.ts
│   │   │   ├── FormSelect/
│   │   │   │   ├── FormSelect.tsx
│   │   │   │   ├── FormSelect.module.css
│   │   │   │   ├── FormSelect.stories.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Checkbox/
│   │   │   │   ├── Checkbox.tsx
│   │   │   │   ├── Checkbox.module.css
│   │   │   │   ├── Checkbox.stories.tsx
│   │   │   │   └── index.ts
│   │   │   ├── ButtonGroup/
│   │   │   │   ├── ButtonGroup.tsx
│   │   │   │   ├── ButtonGroup.module.css
│   │   │   │   ├── ButtonGroup.stories.tsx
│   │   │   │   └── index.ts
│   │   │   └── index.ts                # Form 组件统一导出
│   │   ├── Loading/
│   │   │   ├── Loading.tsx             # LoadingSpinner 和 LoadingOverlay
│   │   │   ├── Loading.module.css
│   │   │   ├── Loading.stories.tsx
│   │   │   └── index.ts
│   │   ├── Tag/
│   │   │   ├── Tag.tsx
│   │   │   ├── Tag.module.css
│   │   │   ├── Tag.stories.tsx
│   │   │   └── index.ts
│   │   ├── GradientBackground/
│   │   │   ├── GradientBackground.tsx
│   │   │   ├── GradientBackground.module.css
│   │   │   ├── GradientBackground.stories.tsx
│   │   │   └── index.ts
│   │   └── index.ts                    # 所有组件统一导出
│   ├── styles/
│   │   ├── variables.css               # CSS 变量系统
│   │   └── global.css                  # 全局样式（可选导入）
│   ├── types/
│   │   └── index.ts                    # 共享类型定义
│   └── index.ts                        # 主入口文件
├── .storybook/
│   ├── main.ts                         # Storybook 主配置
│   ├── preview.ts                      # Storybook 预览配置
│   └── manager.ts                      # Storybook 管理器配置
├── dist/                               # 构建产物（不提交到 git）
│   ├── prismo-ui.mjs                   # ESM 格式
│   ├── prismo-ui.cjs                   # CJS 格式
│   ├── style.css                       # 打包后的 CSS
│   ├── index.d.ts                      # 类型声明入口
│   └── components/                     # 各组件类型声明
├── .eslintrc.json                      # ESLint 配置
├── .prettierrc.json                    # Prettier 配置
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
└── CHANGELOG.md
```

### 构建产物说明

- **prismo-ui.mjs**: ESM 格式，供现代打包工具使用
- **prismo-ui.cjs**: CommonJS 格式，向后兼容
- **style.css**: 所有组件样式的合并文件
- **index.d.ts**: TypeScript 类型声明文件
- **components/**: 各组件的独立类型声明（供 IDE 使用）

## 代理扩展

### Skill

- **frontend-patterns**
- 目的：确保组件库遵循 React 最佳实践，包括性能优化、类型安全、可访问性
- 预期结果：生成符合现代 React 开发规范的高质量组件代码，包括 Hooks 使用、memo 优化、props 设计等

- **coding-standards**
- 目的：统一 TypeScript 代码风格、命名规范、目录结构
- 预期结果：确保组件库代码一致性，遵循 TypeScript 和 React 社区最佳实践