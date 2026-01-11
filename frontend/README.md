# Prismo React

基于 Framer 设计稿转换的 React 项目 - 一个现代化的任务管理平台。

## 🚀 快速开始

### 安装依赖

```bash
cd prismo-react
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 📁 项目结构

```
prismo-react/
├── public/                 # 静态资源
├── src/
│   ├── components/         # 可复用组件
│   │   ├── Button.jsx      # 按钮组件
│   │   ├── Contact.jsx     # 联系表单
│   │   ├── FAQ.jsx         # 常见问题
│   │   ├── Features.jsx    # 功能展示
│   │   ├── Footer.jsx      # 页脚
│   │   ├── Hero.jsx        # 首屏
│   │   ├── Navbar.jsx      # 导航栏
│   │   ├── Pricing.jsx     # 定价方案
│   │   ├── Stats.jsx       # 数据统计
│   │   ├── Tag.jsx         # 标签组件
│   │   └── Testimonials.jsx # 用户评价
│   ├── pages/              # 页面组件
│   │   ├── HomePage.jsx    # 首页
│   │   ├── WaitlistPage.jsx # 等待列表页
│   │   ├── PrivacyPage.jsx # 隐私政策页
│   │   └── NotFoundPage.jsx # 404页面
│   ├── styles/             # 全局样式
│   │   ├── global.css      # 全局CSS
│   │   └── variables.css   # CSS变量
│   ├── App.jsx             # 应用入口
│   └── main.jsx            # 渲染入口
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 🎨 设计系统

### 颜色变量

- **Light Colors**: `--light-85`, `--light-90`, `--light-94`, `--light-95`, `--light-96`
- **Dark Colors**: `--dark-7`, `--dark-12`
- **Grey Colors**: `--grey-24`, `--grey-30`, `--grey-50`
- **Accent Colors**: `--accent-red`, `--accent-orange`, `--accent-purple`, `--accent-pink`, `--accent-green`

### 字体

- 主字体: Inter (Google Fonts)

### 间距

- `--spacing-xs` 到 `--spacing-4xl` (4px - 100px)

### 圆角

- `--radius-sm` 到 `--radius-full` (6px - 100px)

## 📦 技术栈

- **React 18** - UI框架
- **React Router v6** - 路由管理
- **Framer Motion** - 动画库
- **Phosphor Icons** - 图标库
- **Vite** - 构建工具
- **CSS Modules** - 样式隔离

## 🔗 页面路由

- `/` - 首页
- `/waitlist` - 等待列表页
- `/privacy-policy` - 隐私政策页
- `/*` - 404页面

## ✨ 特性

- 响应式设计，支持桌面端和移动端
- 流畅的页面过渡动画
- 模块化组件设计
- CSS变量实现的设计系统
- 优化的性能和加载速度

## 📝 License

MIT License
