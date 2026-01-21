# 任务计划：解锁灵魂歌曲功能

## 目标
在命理解读页面新增"解锁灵魂歌曲"功能卡片入口，用户点击后进入二级页面，花费100积分解锁。调用 AI 根据八字信息推荐三首歌曲，获取 QQ 音乐信息并展示。

## 技术栈
- **后端**: Hono + TypeScript + Prisma
- **前端**: React + Vite + CSS Modules
- **AI**: gemini-3-pro-preview (aihubmix)
- **QQ音乐**: 参考 `docs/qqmusic-search/index.js`

---

## 实现阶段

### Phase 1: 后端 - 新增主题类型与 AI 提示词
**状态**: `pending`

**任务**:
1. [ ] 在 `src/lib/themes/constants.ts` 添加新主题 `soul_song`
2. [ ] 在 `config/ai-prompts.yaml` 添加 `soul_song` 提示词模板
3. [ ] 在 `src/lib/ai/types.ts` 更新类型定义

**文件**:
- `src/lib/themes/constants.ts`
- `config/ai-prompts.yaml`
- `src/lib/ai/types.ts`

---

### Phase 2: 后端 - QQ音乐服务封装
**状态**: `pending`

**任务**:
1. [ ] 创建 `src/lib/music/qqmusic.ts` - 将 `docs/qqmusic-search/index.js` 转换为 TypeScript 模块
2. [ ] 实现搜索、获取歌词、封面、二维码生成功能
3. [ ] 安装 `qrcode` 依赖

**文件**:
- `src/lib/music/qqmusic.ts`
- `src/lib/music/index.ts`
- `src/lib/music/types.ts`
- `package.json` (添加 qrcode 依赖)

---

### Phase 3: 后端 - 灵魂歌曲 API 路由
**状态**: `pending`

**任务**:
1. [ ] 创建 `src/routes/soul-song.ts` 路由文件
2. [ ] 实现 `POST /api/soul-song/unlock` 解锁接口（扣费100积分 + 调用 AI + 搜索歌曲）
3. [ ] 实现 `GET /api/soul-song/:subjectId` 获取已解锁内容接口
4. [ ] 在 `src/index.ts` 注册路由

**文件**:
- `src/routes/soul-song.ts`
- `src/index.ts`

---

### Phase 4: 数据库 - 存储结构
**状态**: `pending`

**任务**:
1. [ ] 考虑是否复用 `ThemeAnalysis` 表（theme = 'soul_song'）或创建新表
2. [ ] 定义歌曲数据的 JSON 结构存储

**决策**: 复用 `ThemeAnalysis` 表，content 字段存储 JSON 格式的歌曲信息

---

### Phase 5: 前端 - 入口卡片
**状态**: `pending`

**任务**:
1. [ ] 在 `BaziResultPage.jsx` 添加"解锁灵魂歌曲"卡片入口
2. [ ] 创建对应的图标和样式
3. [ ] 点击跳转到二级页面

**文件**:
- `frontend/src/pages/BaziResultPage.jsx`
- `frontend/src/pages/BaziResultPage.module.css`

---

### Phase 6: 前端 - 二级页面
**状态**: `pending`

**任务**:
1. [ ] 创建 `frontend/src/pages/SoulSongPage.jsx` 二级页面
2. [ ] 创建 `frontend/src/pages/SoulSongPage.module.css` 样式
3. [ ] 实现解锁按钮（花费100积分）
4. [ ] 展示三首歌曲卡片（封面、名称、歌手、歌词、二维码）
5. [ ] 添加路由配置

**文件**:
- `frontend/src/pages/SoulSongPage.jsx`
- `frontend/src/pages/SoulSongPage.module.css`
- `frontend/src/main.jsx` (添加路由)

---

### Phase 7: 前端 - API 集成与 Hooks
**状态**: `pending`

**任务**:
1. [ ] 在 `frontend/src/services/api.js` 添加 API 方法
2. [ ] 创建 `useSoulSong` hook 处理数据获取和解锁

**文件**:
- `frontend/src/services/api.js`
- `frontend/src/hooks/useSoulSong.js`
- `frontend/src/hooks/index.js`

---

### Phase 8: 测试与验收
**状态**: `pending`

**任务**:
1. [ ] 后端 API 测试
2. [ ] 前端功能测试
3. [ ] 积分扣费逻辑验证
4. [ ] QQ音乐搜索验证

---

## 关键技术决策

| 决策点 | 选择 | 原因 |
|--------|------|------|
| 数据存储 | 复用 ThemeAnalysis 表 | 保持一致性，减少迁移 |
| AI 模型 | gemini-3-pro-preview | 与现有主题一致 |
| 歌曲价格 | 100 积分 | 用户需求 |
| 歌曲数量 | 3 首 | 用户需求 |
| **设计风格** | **与命理解读页面保持一致** | **用户要求** |

## 设计规范

- 入口卡片样式：复用 `ReadingEntryCard` 组件风格
- 二级页面布局：参考 `ReadingDetailPage` 页面结构
- 渐变背景：使用 `GradientBackground` 组件
- 动画效果：使用 `framer-motion` 保持一致
- 颜色主题：紫色系渐变（与命理解读一致）
- 组件库：复用现有 `common/` 组件

---

## 错误记录

| 错误 | 尝试 | 解决方案 |
|------|------|----------|
| - | - | - |

---

## 进度日志

- **开始时间**: 待开始
- **当前阶段**: Phase 1
