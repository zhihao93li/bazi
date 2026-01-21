# 研究发现：解锁灵魂歌曲功能

## 代码结构分析

### 后端架构

#### 主题系统 (`src/lib/themes/`)
- **constants.ts**: 定义有效主题类型 `AnalysisTheme`，包括 `life_color`, `relationship`, `career_wealth`, `health`, `life_lesson`, `yearly_fortune`, `synastry`
- 新增主题需要在此添加类型定义

#### AI 服务 (`src/lib/ai/`)
- **config-loader.ts**: 从 `config/ai-prompts.yaml` 加载提示词配置
- **service.ts**: 调用 aihubmix API (OpenAI 兼容接口)
- **types.ts**: 定义 AI 相关类型
- 支持两轮 LLM 架构：初步解读 + 分主题解读

#### 积分系统 (`src/lib/points/service.ts`)
- `deductPoints()`: 扣除积分，支持事务
- `refundPoints()`: 退还积分（失败时回滚）
- 使用 Prisma 事务确保原子性

#### 主题解锁流程 (`src/routes/themes.ts`)
1. 验证主题有效性
2. 检查是否已解锁
3. 获取价格并扣除积分
4. 创建异步任务处理 AI 生成
5. 返回任务 ID，前端轮询结果

### QQ 音乐 API (`docs/qqmusic-search/index.js`)
关键函数：
- `searchSongWithQRCode(songName, singerName)`: 搜索歌曲并返回完整信息
- 返回内容包括：
  - `title`, `singers`, `album`
  - `shareUrl`: 分享链接
  - `coverUrl`: 专辑封面
  - `lyric`, `trans`: 歌词和翻译
  - `qrBase64`: Base64 二维码图片

### 前端结构

#### 命理解读页面 (`frontend/src/pages/BaziResultPage.jsx`)
- 使用 `ReadingEntryCard` 组件展示主题入口
- 主题数据来自 `useThemes` hook
- 点击卡片跳转到 `ReadingDetailPage`

#### 现有入口卡片
- 生命底色 (life_color)
- 专项分析 (relationship, career_wealth, health, life_lesson)
- 流年解读 (yearly_fortune)
- 合盘分析 (synastry) - Coming Soon

---

## AI 提示词结构

现有主题提示词格式 (`config/ai-prompts.yaml`):
```yaml
themes:
  theme_name:
    description: 主题描述
    category: standalone | special_analysis
    word_count: 字数范围
    system: |
      系统提示词...
    user: |
      用户提示词（支持模板变量）...
```

模板变量：
- `{{initialAnalysis}}`: 初步解读结果
- `{{baziMinimalJson}}`: 八字数据 JSON
- `{{gender}}`: 性别

---

## 灵魂歌曲功能设计

### AI 输出格式要求
需要 AI 返回 JSON 格式：
```json
{
  "songs": [
    {
      "name": "歌曲名称",
      "artist": "歌手名称",
      "reason": "推荐理由"
    }
  ]
}
```

### 完整数据流
1. 用户点击解锁 → 扣费 100 积分
2. 调用 AI 获取推荐歌曲列表
3. 解析 AI 返回的歌曲信息
4. 调用 QQ 音乐 API 获取每首歌的详细信息
5. 存储完整结果到 ThemeAnalysis
6. 前端展示歌曲卡片

### 存储结构
```json
{
  "songs": [
    {
      "name": "歌曲名称",
      "artist": "歌手名称",
      "reason": "AI推荐理由",
      "qqMusic": {
        "title": "QQ音乐标题",
        "singers": "歌手",
        "album": "专辑",
        "shareUrl": "分享链接",
        "coverUrl": "封面URL",
        "lyric": "歌词",
        "qrBase64": "二维码Base64"
      }
    }
  ]
}
```
