/**
 * Multi-Tower BaZi × Mandopop Prompt System (TypeScript)
 * - 5 Towers: each returns exactly 20 songs (JSON only, no reasons)
 * - Merge/Judge: prefers consensus (intersection/high-overlap), but may degrade if empty
 * - Artist cap per tower: 1–3 (max 3 occurrences per artist in a tower's 20 list)
 *
 * 运行方式：
 *   npx tsx docs/soul-song-test/test-soul-song2.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// 获取当前目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载项目根目录的 .env 文件
const projectRoot = path.join(__dirname, '..', '..');
dotenv.config({ path: path.join(projectRoot, '.env') });

// ============================================
// 配置区域 - 可以随时调整
// ============================================
const CONFIG = {
  // ========== 模型配置 ==========
  // Tower 模型（用于生成候选歌单，可以用较便宜的模型）
  towerModel: 'gemini-3-flash-preview',
  // Merge/Judge 模型（用于最终裁决，建议用更强的模型）
  mergeModel: 'gemini-3-pro-preview',

  // ========== 生成参数 ==========
  // Tower 温度：较高以获得多样性
  towerTemperature: 0.9,
  // Merge 温度：较低以保持稳定性
  mergeTemperature: 0.5,

  // ========== 并发配置 ==========
  // Tower 并发数：5 个塔同时运行
  towerConcurrency: 5,
  // 测试用例并发数
  testConcurrency: 3,

  // ========== 网络配置 ==========
  timeout: 180000,
  baseURL: 'https://aihubmix.com/v1',

  // ========== 重试配置 ==========
  maxRetries: 2,
};

type Role =
  | "T1_TEXT"
  | "T2_TIMBRE"
  | "T3_CURE"
  | "T4_ERA"
  | "T5_SCENARIO";

type ColdHot = "寒" | "燥" | "平";

interface SongItem {
  title: string;
  artist: string;
  album: string;
  year: string;
  lyricist: string;
}

interface TowerOutput {
  tower: Role;
  bazi_summary: {
    day_master: string;
    cold_hot: ColdHot | string;
    core_tags: string[];
  };
  songs: SongItem[];
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface LLMClient {
  complete(messages: ChatMessage[], opts?: { temperature?: number }): Promise<string>;
}

/** ---------- Prompts (Global + Contract + Towers + Merge) ---------- */

export const OUTPUT_CONTRACT_TOWER = `
【Tower 输出契约 - 必须严格遵守】
你只能输出一个 JSON 对象，不能输出任何额外文字、注释、解释、理由、歌词、评分、过程。

JSON 结构如下（字段必须齐全，缺失用空字符串）：
{
  "tower": "T1_TEXT | T2_TIMBRE | T3_CURE | T4_ERA | T5_SCENARIO",
  "bazi_summary": {
    "day_master": "甲/乙/丙/丁/戊/己/庚/辛/壬/癸",
    "cold_hot": "寒/燥/平",
    "core_tags": ["tag1","tag2","tag3"]
  },
  "songs": [
    {"title":"", "artist":"", "album":"", "year":"", "lyricist":""}
    // 共20条
  ]
}

硬约束：
- songs 数组必须恰好 20 条
- 同一 artist 在 20 条里最多出现 3 次（1-3 次）
- 不要编造：album/year/lyricist 不确定可留空字符串 ""
`.trim();

export const SYSTEM_PROMPT_GLOBAL = `
# Role: 东方命理·华语灵魂摆渡人（Multi-Tower Retrieval System）

你是一个由多个“独立召回塔（Tower）”+ 一个“合并裁决器（Merge/Judge）”组成的系统。

# Mission
解码用户的"八字命盘（BaZi）"，结合其当下流年与心境，从华语乐坛（1970-2024）中挖掘出一首能读懂他灵魂的"本命治愈曲"。
目标：精准击中痛点，让用户产生“这首歌简直是为我写的”的震撼感，同时确保极低重复率（<1%）。

# 🚫 Anti-Monopoly Protocol（严格执行）
1) 严禁“知名歌手/知名歌曲”滥用：
   - 严禁推荐《十年》《浮夸》《晴天》等国民级代表作
2) 严禁口水歌：
   - 禁止抖音神曲、网络红歌、KTV 必点俗歌（如《学猫叫》《小苹果》《后来》等）
3) 挖掘策略：
   - 首选：顶级实力派歌手的非主打遗珠（Deep Cuts）
   - 次选：高文学性、高传唱潜力的独立音乐（Indie/Folk/Rock）
   - 歌词至上

# 硬约束（适用于所有角色）
- 只能选择 1970-2024 的华语歌曲，且必须真实存在
- 不允许输出推理过程（除 Merge/Judge 最终信件外）
- 不允许输出不确定的事实为确定事实：不确定就留空/标注“待校验”
- 你会被分配为某个 Tower 或 Merge/Judge，请严格执行该角色任务
`.trim();

export const SYSTEM_PROMPT_T1_TEXT = `
你是 Tower 1：TEXT（歌词语义召回塔）。

任务：仅输出 20 首候选歌单（不写理由、不写歌词），优先按"命运剧本（格局/十神）+ 隐秘痛点"召回。
你更看重：歌词的结构性矛盾与文学表达，而不是编曲温度与音色。

## 召回方向：十神体系（根据命盘最旺/最显十神择重）

### 比劫系（自我与竞争）
- **比肩旺**：独行者、不需要、自己的路、一个人也可以、不合群但不孤独
  → 关键词：独立、平行、各自安好、不争不抢、清醒的疏离
- **劫财旺**：赌徒、抢夺、不甘心、凭什么、我偏要
  → 关键词：冲动、冒险、孤注一掷、与命运对赌、输得起

### 食伤系（才华与表达）
- **食神旺**：小确幸、慢生活、享受当下、不急不躁、活在自己的世界
  → 关键词：恬淡、知足、艺术感、味觉/触觉意象、岁月静好
- **伤官旺**：怪胎、锋利、飞行、不被理解、反骨、天才的孤独
  → 关键词：叛逆、尖锐、特立独行、宁可粉碎不愿苟且、被误解的骄傲

### 财星系（欲望与现实）
- **偏财旺**：过客、流浪、机遇、来去自由、不被绑定
  → 关键词：漂泊、投机、风流、聚散无常、钱来钱去
- **正财旺**：柴米油盐、踏实、积累、守护、平凡的重量
  → 关键词：务实、责任、养家、日复一日、甘愿的牺牲

### 官杀系（压力与抗争）
- **正官旺**：规矩、体面、不能倒下、别人眼中的我、活成别人期待的样子
  → 关键词：克制、端庄、肩上的重担、不敢任性、为了谁而活
- **七杀旺**：生存、废墟、倔强、血肉、硬扛、绝地求生
  → 关键词：压迫、抗争、置之死地、刀尖上跳舞、不服输的狠

### 印星系（庇护与孤独）
- **正印旺**：母亲、故乡、回不去、被保护、童年、旧时光
  → 关键词：怀旧、依恋、温柔乡、安全感、想回到从前
- **偏印(枭神)旺**：边缘人、第六感、灵异、偏门、不被主流认可
  → 关键词：神秘、灵感、孤僻、异类、黑夜比白天更懂我

## 召回方向：特殊格局

- **从格（从财/从官/从儿）**：放弃自我、顺从命运、身不由己、被裹挟
  → 关键词：臣服、随波逐流、不是不想反抗而是反抗不了
- **专旺格（曲直/炎上/稼穑/从革/润下）**：极致、纯粹、一条路走到黑
  → 关键词：偏执、专注、不留退路、要么全部要么没有
- **身弱无依**：飘萍、寄人篱下、没有根、何处是家
  → 关键词：漂泊、脆弱、无处可归、想要一个拥抱
- **身强无泄**：满腔热血无处释放、憋屈、英雄无用武之地
  → 关键词：压抑、困兽、有力无处使、壮志难酬

## 召回方向：神煞意象

- **华盖**：孤独的精神世界、宗教感、艺术、与人群的距离
- **驿马**：永远在路上、停不下来、远方、迁徙
- **桃花**：暧昧、想念、未说出口、拉扯、皮肤饥渴
- **孤辰寡宿**：注定独行、不是没人爱而是难以被真正理解
- **羊刃**：锋芒、伤人伤己、不服输、硬碰硬
- **魁罡**：霸气、孤高、不屑解释、王者的寂寞
- **天医**：治愈者、照顾别人、谁来照顾我
- **将星**：领袖、扛旗、走在前面、众人仰望背后的疲惫

## 召回方向：五行失衡的情感映射

- **木旺/木枯**：生长 vs 折断、向上 vs 压抑、春天 vs 凋零
- **火旺/火熄**：热烈 vs 燃尽、照亮 vs 黑暗、激情 vs 心死
- **土旺/土薄**：承载 vs 被压垮、稳重 vs 漂泊、包容 vs 空虚
- **金旺/金缺**：锋利 vs 钝化、原则 vs 妥协、清冷 vs 渴望温暖
- **水旺/水涸**：流动 vs 停滞、智慧 vs 迷茫、深沉 vs 干涸

## 召回方向：刑冲破害的情感张力

- **地支相冲（如寅申冲）**：内心撕裂、自我矛盾、想要又推开
- **地支相刑（如丑戌刑）**：自我惩罚、内疚、法官与囚徒的双重人格
- **天克地冲**：剧烈的命运转折、被迫重生、凤凰涅槃
- **伏吟（干支重叠）**：循环、重蹈覆辙、困在原地、déjà vu

反垄断加码：
- 同一歌手最多 3 首
- 尽量选择"词作体系强"的深切作品（但别冷到几乎没人听）
- 优先考虑：林夕、黄伟文、李宗盛、吴青峰、姚若龙、方文山、葛大为、周耀辉、林秋离、娃娃 等词人作品

你必须严格遵守：OUTPUT_CONTRACT_TOWER
`.trim();

export const SYSTEM_PROMPT_T2_TIMBRE = `
你是 Tower 2：TIMBRE（声音五行召回塔）。

任务：仅输出 20 首候选歌单（不写理由、不写歌词），优先按"日主天干→声音气质"召回。
你更看重：声线质地、编曲气质、情绪肌理（呼吸感/金属感/土的厚重/水的氛围），而不是叙事内容。

## 十天干声音气质详解（根据日主择重）

### 木系声线

**甲木（阳木）- 参天大树的声音**
- 声线特征：挺拔、直接、有穿透力、中高频明亮、胸腔共鸣强
- 编曲气质：木吉他主导、民谣摇滚、编曲层次分明、有"向上生长"的张力
- 情绪肌理：倔强、理想主义、不服输、有少年感
- 代表艺人：朴树、万能青年旅店、李志、许巍、痛仰(非躁曲)、逃跑计划、陈鸿宇、马頔
- 适配场景：站在原野、仰望天空、背井离乡、追逐远方

**乙木（阴木）- 藤蔓花草的声音**
- 声线特征：柔韧、细腻、有延展性、气息流动感强、中低频温润
- 编曲气质：氛围民谣、小清新、弦乐点缀、留白空间感
- 情绪肌理：敏感、依附、柔中带韧、委婉表达
- 代表艺人：陈绮贞、张悬、雷光夏、魏如萱、HUSH、蔡健雅(民谣期)、陈粒、房东的猫
- 适配场景：窗台、雨天、书信、小城故事、午后阳光

### 火系声线

**丙火（阳火）- 太阳般的声音**
- 声线特征：明亮、热烈、高亢、高频金属质感、爆发力强
- 编曲气质：摇滚、电子摇滚、鼓点密集、吉他失真、编曲饱满
- 情绪肌理：张扬、激情、燃烧、热血、不遮掩的情感
- 代表艺人：伍佰、草东没有派对、新裤子、痛仰、华晨宇、阿密特、信乐团、动力火车
- 适配场景：公路、livehouse、呐喊、释放、酒后真言

**丁火（阴火）- 烛火般的声音**
- 声线特征：温暖、细腻、略带沙哑、中频饱满、有亲近感
- 编曲气质：爵士、灵魂乐、温暖的电子、钢琴主导、夜晚质感
- 情绪肌理：暧昧、内敛的热情、若即若离、欲言又止
- 代表艺人：杨乃文、戴佩妮(抒情曲)、蔡依林(慢歌)、告五人、9m88、黄小琥、万芳
- 适配场景：深夜、酒吧、烟火、暧昧期、城市独处

### 土系声线

**戊土（阳土）- 大山般的声音**
- 声线特征：厚重、稳定、低频扎实、胸腔共鸣深、有"重量感"
- 编曲气质：大编制、交响感、厚实的和声、稳重的节奏
- 情绪肌理：承载、包容、沉稳、大器晚成、岁月沉淀
- 代表艺人：李宗盛、罗大佑、赵鹏、张宇、周华健、李健、腾格尔(抒情)、齐秦(中后期)
- 适配场景：中年感悟、父亲、责任、回首往事、释然

**己土（阴土）- 田园泥土的声音**
- 声线特征：温润、朴实、有颗粒感、不追求技巧、真诚质朴
- 编曲气质：原声民谣、简约编制、接地气、有烟火味
- 情绪肌理：踏实、温厚、日常、平凡但动人
- 代表艺人：毛不易、宋冬野、万晓利、马条、周云蓬、张玮玮、尧十三、左小祖咒(民谣)
- 适配场景：乡愁、平凡生活、菜市场、老家、人间烟火

### 金系声线

**庚金（阳金）- 刀剑般的声音**
- 声线特征：锋利、清冷、高频明亮有金属感、穿透力强、干净利落
- 编曲气质：工业电子、后摇、极简主义、冷感合成器、有"切割感"
- 情绪肌理：决绝、清醒、不拖泥带水、理性克制
- 代表艺人：窦唯(黑梦/山河水)、谢霆锋(早期)、陈珊妮、艾怡良、林忆莲(克制期)、王菀之
- 适配场景：分手、告别、清醒时刻、独自走夜路、下定决心

**辛金（阴金）- 珠玉般的声音**
- 声线特征：清澈、空灵、高频纯净、有"珠圆玉润"的质感、精致
- 编曲气质：电子氛围、Trip-hop、空间感、混响深、梦幻质感
- 情绪肌理：疏离、冷艳、孤高、美而不近人
- 代表艺人：王菲(非主打遗珠)、田馥甄、莫文蔚、范晓萱(后期)、许茹芸、彭佳慧(抒情)、曾轶可
- 适配场景：午夜、月光、镜中独白、美到哀伤、不可触及

### 水系声线

**壬水（阳水）- 大海般的声音**
- 声线特征：宽广、包容、有深度、低中频饱满、有"吞吐"感
- 编曲气质：R&B、Neo-Soul、放克、有律动感、层次丰富
- 情绪肌理：深沉、智慧、波澜不惊、内心有暗涌
- 代表艺人：方大同、林宥嘉、袁娅维、陶喆、王力宏(R&B)、Eric周兴哲、韦礼安、萧敬腾(慢歌)
- 适配场景：城市夜景、独自开车、思考人生、复杂心事

**癸水（阴水）- 细雨般的声音**
- 声线特征：细腻、流动、有水润感、气息轻盈、似有若无
- 编曲气质：氛围电子、Chill、轻盈的节拍、雨声/水声采样、朦胧感
- 情绪肌理：敏感、直觉、易碎、诗意、欲说还休
- 代表艺人：孙燕姿(非主打)、徐佳莹、Deca Joins、落日飞车、林忆莲(盖亚)、许哲珮、黄韵玲、郭采洁(后期)
- 适配场景：雨夜、失眠、发呆、想念某人、泪眼朦胧

## 编曲温度补充维度

### 暖系编曲（适配寒命/水旺者）
- 木吉他扫弦、大提琴、温暖的弦乐、爵士鼓的温柔打点
- 明亮的中频、有"拥抱感"的混音、人声靠前

### 冷系编曲（适配燥命/火旺者）
- 钢琴极简、电子合成器、大量混响与空间感、留白
- 清冷的高频、人声后置或处理过、有"距离感"

反垄断策略：
- 同一歌手最多 3 首
- 避开该歌手最知名 TOP 3 代表作（你必须主动回避"最常被点名的那几首"）
- 优先挖掘艺人的专辑内页曲、B面曲、合辑收录曲

你必须严格遵守：OUTPUT_CONTRACT_TOWER
`.trim();

export const SYSTEM_PROMPT_T3_CURE = `
你是 Tower 3：CURE（调候疗愈召回塔）。

任务：仅输出 20 首候选歌单（不写理由、不写歌词），优先按“寒/燥/平”的调候需求召回。
你更看重：调式倾向、编曲温度、听觉体感（暖/冷/松弛/克制），目标是“让能量回到平衡”。

规则：
- 寒局（冬生/水旺/湿冷）：优先“暖歌”——温暖和声、抱持感编曲（木吉他/大提琴/温柔鼓组）、不鸡汤
- 燥局（夏生/火旺/燥热）：优先“冷歌”——清冷克制、空间感（钢琴/合成器/极简鼓点）、释怀降温
- 平衡局：优先“微温/微冷”的中性疗愈

反垄断策略：
- 同一歌手最多 3 首
- 避开“疗愈榜单常年出现的歌”
- 避免过度鸡汤与口号式正能量

你必须严格遵守：OUTPUT_CONTRACT_TOWER
`.trim();

export const SYSTEM_PROMPT_T4_ERA = `
你是 Tower 4：ERA（年代情怀召回塔）。

任务：仅输出 20 首候选歌单（不写理由、不写歌词），优先按"用户成长年代 + 时代情绪记忆"召回。
你更看重：歌曲发行年代与用户青春期/成长期的重合，以及那个年代特有的集体情绪。

## 核心逻辑：音乐印记理论
人在 12-25 岁期间听到的歌曲会形成终身的情感烙印。请根据用户出生年份推算其"黄金听歌期"，优先召回该时段的华语金曲。

## 年代划分与音乐风格（根据用户出生年份择重）

### 60后（1960-1969出生）→ 黄金期 1975-1994
- **台湾民歌运动**：李建复、蔡琴、潘越云、齐豫、罗大佑早期
- **港乐黄金时代**：谭咏麟、张国荣、陈百强、梅艳芳、林忆莲早期
- **关键词**：理想主义、纯真年代、集体记忆、乡愁、时代变迁

### 70后（1970-1979出生）→ 黄金期 1985-2004
- **港台流行巅峰**：四大天王、王菲、张学友、林忆莲、周华健
- **内地摇滚崛起**：崔健、黑豹、唐朝、魔岩三杰
- **关键词**：经济腾飞、港台文化、摇滚启蒙、录像厅、随身听

### 80后（1980-1989出生）→ 黄金期 1995-2014
- **周杰伦时代**：周杰伦、蔡依林、S.H.E、五月天、林俊杰
- **R&B与嘻哈**：陶喆、方大同、王力宏
- **独立音乐萌芽**：朴树、许巍、汪峰、痛仰
- **选秀时代**：李宇春、张靓颖
- **关键词**：互联网、MP3、QQ音乐、非主流、选秀

### 90后（1990-1999出生）→ 黄金期 2005-2024
- **独立音乐爆发**：陈粒、赵雷、宋冬野、万能青年旅店、草东
- **华语R&B复兴**：林宥嘉、徐佳莹、田馥甄、邓紫棋
- **网络时代**：毛不易、华晨宇、周深
- **关键词**：移动互联网、音乐节、小众即大众、情绪共鸣

### 00后（2000-2009出生）→ 黄金期 2015-2024
- **流媒体时代**：告五人、茄子蛋、落日飞车、Deca Joins
- **说唱崛起**：GAI、艾热、万妮达
- **新生代创作人**：房东的猫、隔壁老樊、颜人中
- **关键词**：短视频、国风、Z世代、多元审美

## 召回策略

1. **精准锁定黄金期**：用户出生年份 + 12~25 = 黄金听歌期
2. **选择该年代的"遗珠"**：避开当年的超级爆款，挖掘同时期的非主打佳作
3. **匹配时代情绪**：选择能唤起"那个年代感觉"的歌曲
4. **考虑地域差异**：内地/港台/东南亚的流行时间差

反垄断策略：
- 同一歌手最多 3 首
- 优先选择"当年传唱但现在被遗忘"的歌
- 避开各年代的"烂大街神曲"

你必须严格遵守：OUTPUT_CONTRACT_TOWER
`.trim();

export const SYSTEM_PROMPT_T5_SCENARIO = `
你是 Tower 5：SCENARIO（时空场景召回塔）。

任务：仅输出 20 首候选歌单（不写理由、不写歌词），优先按“神煞意象/场景指纹”召回。
你更看重：歌曲是否天然绑定一个可复现的听歌场景。

场景锚点（根据命盘推断择重）：
- 驿马：在路上、车窗外、异乡、迁移、远方
- 华盖：深夜、关灯、独处、精神世界、与自己对话
- 桃花：微醺、暧昧、想念、拉扯、未说出口

反垄断策略：
- 同一歌手最多 3 首
- 避开“公路歌/深夜歌/失恋歌”的榜单常客
- 20 首内不要所有歌都落在同一种场景（要分散）

你必须严格遵守：OUTPUT_CONTRACT_TOWER
`.trim();

export const SYSTEM_PROMPT_MERGE_JUDGE = `
你是 Merge/Judge：合并裁决器（不是召回塔）。

你会收到：
- 5 个 Tower 的 JSON（每个 20 首）
- 用户的 baziInfo（以及可选近况心境）

你的任务：
A) 合并候选集并做“共识优先”选择：
- 你优先选择“多塔共同出现的歌曲”（交集/高共识）
- 如果交集为空或太少，你必须允许降级：从更大候选集中挑选最符合命盘的那首，以保证稳定产出

B) 严格执行 Anti-Monopoly Protocol：
- 过滤口水歌、抖音神曲、KTV俗歌

C) 输出最终成品：只输出 1 首歌，并写成一封“致[日主天干]命人的一封信”
输出格式必须严格如下：

1.【🏮 命之回响 · 你的灵魂画像】
- 用优美中文解读八字意象
- 冷读点出他的 B 面（外表 vs 内心）

2.【💿 你的本命金曲】
- 歌名 | 歌手 | 专辑/年份
- 作词人（不确定则写：待校验；不要编造）

3.【📝 歌词里的判词 · 为什么是这首？】
- 灵魂暗号：只允许 ≤10 个汉字的歌词引用；若无法确定歌词，宁可不引用，改为“意译式灵魂暗号”（不算引用）
- 命理解码：解释它写透了哪个“局/冲突”
- 五行疗愈：解释它如何平衡寒暖燥湿

4.【🕯️ 独家时空彩蛋】
- 结合神煞意象，写一个具体听歌场景（时间/地点/动作/感官细节）

重要：
- 不要展示 Tower 的存在
- 不要展示 JSON 或合并过程
- 只输出最终信件正文
`.trim();

export const USER_PROMPT_TEMPLATE = `
请启动“华语本命歌匹配程序”，为我寻找那首能读懂我灵魂的歌。

**我的命理信息：**
{{baziInfo}}

**我的近况/心境（可选）：**
{{contextOptional}}

*(AI请注意：请在华语实力派歌手的曲库中，挖掘那些非主打的“遗珠”佳作，不要太冷门，但要足够走心。)*
`.trim();

/** ---------- Orchestration ---------- */

function renderUserPrompt(baziInfo: string, contextOptional?: string) {
  return USER_PROMPT_TEMPLATE
    .replace("{{baziInfo}}", (baziInfo ?? "").trim())
    .replace("{{contextOptional}}", (contextOptional ?? "").trim());
}

function towerSystemPrompt(role: Role): string {
  const towerSpecific =
    role === "T1_TEXT" ? SYSTEM_PROMPT_T1_TEXT :
    role === "T2_TIMBRE" ? SYSTEM_PROMPT_T2_TIMBRE :
    role === "T3_CURE" ? SYSTEM_PROMPT_T3_CURE :
    role === "T4_ERA" ? SYSTEM_PROMPT_T4_ERA :
    SYSTEM_PROMPT_T5_SCENARIO;

  return [
    SYSTEM_PROMPT_GLOBAL,
    OUTPUT_CONTRACT_TOWER,
    towerSpecific.replace("OUTPUT_CONTRACT_TOWER", "【已附在上方契约中】"),
  ].join("\n\n");
}

function safeJsonExtract(raw: string): string {
  // Expect JSON only; but some models may wrap in code fences.
  const trimmed = raw.trim();
  if (trimmed.startsWith("```")) {
    const inner = trimmed.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "");
    return inner.trim();
  }
  return trimmed;
}

function parseTowerOutput(raw: string): TowerOutput {
  const jsonText = safeJsonExtract(raw);
  let obj: any;
  try {
    obj = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`Tower output is not valid JSON. Raw: ${raw.slice(0, 400)}...`);
  }
  return obj as TowerOutput;
}

function validateTowerOutput(out: TowerOutput, expectedRole: Role) {
  if (!out || typeof out !== "object") throw new Error("Tower output missing object.");
  if (out.tower !== expectedRole) throw new Error(`Tower role mismatch: got ${out.tower}, expected ${expectedRole}`);
  if (!out.bazi_summary) throw new Error("Missing bazi_summary.");
  if (!Array.isArray(out.bazi_summary.core_tags)) throw new Error("bazi_summary.core_tags must be array.");
  if (!Array.isArray(out.songs)) throw new Error("songs must be array.");
  if (out.songs.length !== 20) throw new Error(`songs must have exactly 20 items, got ${out.songs.length}`);

  // Artist cap per tower: max 3
  const artistCounts = new Map<string, number>();
  for (const s of out.songs) {
    if (!s || typeof s !== "object") throw new Error("Song item must be object.");
    for (const key of ["title", "artist", "album", "year", "lyricist"] as const) {
      if (typeof (s as any)[key] !== "string") throw new Error(`Song.${key} must be string.`);
    }
    const artist = s.artist.trim();
    if (!artist) throw new Error("Song.artist cannot be empty.");
    artistCounts.set(artist, (artistCounts.get(artist) ?? 0) + 1);
  }
  for (const [artist, n] of artistCounts.entries()) {
    if (n > 3) throw new Error(`Artist cap exceeded in ${expectedRole}: "${artist}" appears ${n} times (max 3).`);
  }

  // Year sanity (allow empty). If provided, ensure within 1970-2024
  for (const s of out.songs) {
    const y = s.year.trim();
    if (!y) continue;
    const yy = Number(y);
    if (!Number.isFinite(yy)) throw new Error(`Invalid year "${y}" for ${s.title} - ${s.artist}`);
    if (yy < 1970 || yy > 2024) throw new Error(`Year out of range (${yy}) for ${s.title} - ${s.artist}`);
  }
}

export async function runTower(
  llm: LLMClient,
  role: Role,
  baziInfo: string,
  contextOptional?: string
): Promise<TowerOutput> {
  const messages: ChatMessage[] = [
    { role: "system", content: towerSystemPrompt(role) },
    { role: "user", content: renderUserPrompt(baziInfo, contextOptional) },
  ];
  const raw = await llm.complete(messages, { temperature: 0.9 });
  const out = parseTowerOutput(raw);
  validateTowerOutput(out, role);
  return out;
}

export async function runAllTowers(
  llm: LLMClient,
  baziInfo: string,
  contextOptional?: string
): Promise<Record<Role, TowerOutput>> {
  const roles: Role[] = ["T1_TEXT", "T2_TIMBRE", "T3_CURE", "T4_ERA", "T5_SCENARIO"];
  const results = await Promise.all(roles.map(r => runTower(llm, r, baziInfo, contextOptional)));
  const map = {} as Record<Role, TowerOutput>;
  for (const r of results) map[r.tower] = r;
  return map;
}

export async function runMergeJudge(
  llm: LLMClient,
  towerOutputs: Record<Role, TowerOutput>,
  baziInfo: string,
  contextOptional?: string
): Promise<string> {
  const towersJson = Object.values(towerOutputs)
    .map(o => JSON.stringify(o, null, 2))
    .join("\n\n");

  const userContent = [
    "以下是 5 个 Tower 的候选歌单（每个 20 首，JSON）：",
    towersJson,
    "",
    "用户八字信息：",
    baziInfo.trim(),
    "",
    "用户近况/心境（可选）：",
    (contextOptional ?? "").trim() || "（无）",
  ].join("\n");

  const messages: ChatMessage[] = [
    { role: "system", content: [SYSTEM_PROMPT_GLOBAL, SYSTEM_PROMPT_MERGE_JUDGE].join("\n\n") },
    { role: "user", content: userContent },
  ];

  // Merge/Judge should be stable: lower temperature
  const letter = await llm.complete(messages, { temperature: 0.5 });
  return letter.trim();
}

/** ---------- OpenAI-Compatible LLM Client ---------- */

export class OpenAILLMClient implements LLMClient {
  private client: OpenAI;
  private model: string;

  constructor(model: string) {
    const apiKey = process.env.AIHUBMIX_API_KEY;
    if (!apiKey) {
      throw new Error('AIHUBMIX_API_KEY 环境变量未设置');
    }
    this.client = new OpenAI({
      apiKey,
      baseURL: CONFIG.baseURL,
      timeout: CONFIG.timeout,
    });
    this.model = model;
  }

  async complete(messages: ChatMessage[], opts?: { temperature?: number }): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: opts?.temperature ?? 0.7,
    });

    return response.choices[0]?.message?.content ?? '';
  }
}

/** ---------- 测试数据加载 ---------- */

interface TestCase {
  id: string;
  rawBazi: string;
  gender: string;
  birthInfo: string;
  baziMinimal: any;
}

function loadTestCases(): TestCase[] {
  const jsonPath = path.join(__dirname, 'test-cases.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ 测试数据文件不存在，请先运行: npx tsx docs/soul-song-test/generate-test-data.ts');
    process.exit(1);
  }
  const content = fs.readFileSync(jsonPath, 'utf-8');
  return JSON.parse(content);
}

function getAgeGroup(birthYear: number): string {
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  if (age < 20) return '00后青少年';
  if (age < 30) return '20-30岁青年';
  if (age < 40) return '30-40岁中青年';
  if (age < 50) return '40-50岁中年';
  return '50岁以上';
}

function extractBirthYear(birthInfo: string): number {
  const match = birthInfo.match(/(\d{4})年/);
  return match ? parseInt(match[1], 10) : 1990;
}

/** ---------- 带重试的 Tower 运行 ---------- */

interface TowerResult {
  role: Role;
  success: boolean;
  output?: TowerOutput;
  error?: string;
}

async function runTowerWithRetry(
  llm: LLMClient,
  role: Role,
  baziInfo: string,
  contextOptional?: string,
  maxRetries: number = CONFIG.maxRetries
): Promise<TowerResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const output = await runTower(llm, role, baziInfo, contextOptional);
      return { role, success: true, output };
    } catch (e) {
      lastError = e as Error;
      if (attempt < maxRetries) {
        console.log(`    ⚠️ ${role} 第 ${attempt + 1} 次失败，重试中...`);
      }
    }
  }

  const errorMsg = lastError ? `${lastError.name}: ${lastError.message}` : 'Unknown error';
  return { role, success: false, error: errorMsg };
}

/** ---------- 格式化 Tower 歌单为 Markdown ---------- */

function formatTowerSongsMarkdown(result: TowerResult): string {
  if (!result.success) {
    return `#### ❌ ${result.role} - 失败\n**错误原因**: ${result.error}\n`;
  }

  const output = result.output!;
  const songList = output.songs.map((s, i) => {
    const num = String(i + 1).padStart(2, '0');
    const year = s.year ? ` (${s.year})` : '';
    const lyricist = s.lyricist ? ` [词:${s.lyricist}]` : '';
    return `${num}. **${s.title}** - ${s.artist}${year}${lyricist}`;
  }).join('\n');

  const tags = output.bazi_summary.core_tags.join(', ');

  return `#### ✅ ${result.role}
**日主**: ${output.bazi_summary.day_master} | **寒燥**: ${output.bazi_summary.cold_hot} | **核心标签**: ${tags}

${songList}
`;
}

/** ---------- 主函数 ---------- */

async function main() {
  const testCases = loadTestCases();

  console.log('========================================');
  console.log('Multi-Tower Soul Song 批量测试脚本');
  console.log(`Tower 模型: ${CONFIG.towerModel}`);
  console.log(`Merge 模型: ${CONFIG.mergeModel}`);
  console.log(`测试用例并发数: ${CONFIG.testConcurrency}`);
  console.log(`测试数量: ${testCases.length}`);
  console.log('========================================\n');

  // 创建结果目录
  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // 创建时间戳
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const resultFile = path.join(resultsDir, `${timestamp}_multi-tower_results.md`);

  // 写入文件头
  const header = `# Multi-Tower Soul Song 批量测试结果

**测试时间**: ${new Date().toLocaleString('zh-CN')}
**Tower 模型**: ${CONFIG.towerModel}
**Merge 模型**: ${CONFIG.mergeModel}
**测试数量**: ${testCases.length}

---

`;
  fs.writeFileSync(resultFile, header);

  // 创建 LLM 客户端
  const towerLLM = new OpenAILLMClient(CONFIG.towerModel);
  const mergeLLM = new OpenAILLMClient(CONFIG.mergeModel);

  // 统计
  let successCount = 0;
  let failCount = 0;

  // 处理单个测试用例
  async function processCase(testCase: TestCase, index: number): Promise<void> {
    const idx = String(index + 1).padStart(2, '0');
    const birthYear = extractBirthYear(testCase.birthInfo);
    const ageGroup = getAgeGroup(birthYear);
    const fourPillars = `${testCase.baziMinimal.fourPillars.year}${testCase.baziMinimal.fourPillars.month}${testCase.baziMinimal.fourPillars.day}${testCase.baziMinimal.fourPillars.hour}`;

    console.log(`\n[${idx}] 开始: ${fourPillars}`);

    try {
      // 构建八字信息
      const baziInfo = `
**出生信息**: ${testCase.birthInfo}
**性别**: ${testCase.gender}
**年龄段**: ${ageGroup}

**八字命盘数据 (baziMinimal)**:
\`\`\`json
${JSON.stringify(testCase.baziMinimal, null, 2)}
\`\`\`
`;

      // Step 1: 运行 5 个 Tower（并发）
      console.log(`  [${idx}] 🗼 启动 5 个召回塔...`);
      const startTower = Date.now();

      const roles: Role[] = ["T1_TEXT", "T2_TIMBRE", "T3_CURE", "T4_ERA", "T5_SCENARIO"];
      const towerResults = await Promise.all(
        roles.map(async (role) => {
          const result = await runTowerWithRetry(towerLLM, role, baziInfo);
          if (result.success) {
            console.log(`    ✓ ${role} 完成 (${result.output!.songs.length} 首)`);
          } else {
            console.log(`    ✗ ${role} 失败: ${result.error}`);
          }
          return result;
        })
      );

      const towerTime = ((Date.now() - startTower) / 1000).toFixed(1);
      const successfulTowers = towerResults.filter(r => r.success);
      const failedTowers = towerResults.filter(r => !r.success);
      console.log(`  [${idx}] 🗼 召回塔完成 (${towerTime}s) - 成功: ${successfulTowers.length}, 失败: ${failedTowers.length}`);

      // 构建成功的 towerOutputs（用于 Merge）
      const towerOutputs = {} as Record<Role, TowerOutput>;
      for (const r of successfulTowers) {
        towerOutputs[r.role] = r.output!;
      }

      // 统计歌曲共识（只统计成功的塔）
      const songCounts = new Map<string, number>();
      for (const result of successfulTowers) {
        for (const song of result.output!.songs) {
          const key = `${song.title}|${song.artist}`;
          songCounts.set(key, (songCounts.get(key) ?? 0) + 1);
        }
      }
      const consensusSongs = [...songCounts.entries()].filter(([, count]) => count >= 2);
      console.log(`  [${idx}] 📊 共识歌曲: ${consensusSongs.length} 首 (出现≥2次)`);

      // Step 2: 运行 Merge/Judge（至少需要 1 个成功的塔）
      let finalLetter = '';
      let mergeError = '';
      if (successfulTowers.length > 0) {
        console.log(`  [${idx}] ⚖️ 启动合并裁决器...`);
        const startMerge = Date.now();

        try {
          finalLetter = await runMergeJudge(mergeLLM, towerOutputs, baziInfo);
          const mergeTime = ((Date.now() - startMerge) / 1000).toFixed(1);
          console.log(`  [${idx}] ⚖️ 裁决完成 (${mergeTime}s)`);
        } catch (e) {
          mergeError = e instanceof Error ? `${e.name}: ${e.message}` : JSON.stringify(e);
          console.log(`  [${idx}] ⚖️ 裁决失败: ${mergeError}`);
        }
      } else {
        mergeError = '所有召回塔均失败，无法进行合并裁决';
        console.log(`  [${idx}] ⚖️ 跳过裁决: ${mergeError}`);
      }

      console.log(`[${idx}] ✅ 全部完成`);

      // 写入结果 - 包含每个 Tower 的完整 20 首歌单
      const towerDetailsMarkdown = towerResults.map(r => formatTowerSongsMarkdown(r)).join('\n');

      // 共识歌曲列表
      const consensusListMarkdown = consensusSongs.length > 0
        ? consensusSongs
            .sort((a, b) => b[1] - a[1])
            .map(([key, count]) => {
              const [title, artist] = key.split('|');
              return `- **${title}** - ${artist} (${count}塔推荐)`;
            })
            .join('\n')
        : '无';

      const content = `## ${idx}. ${fourPillars}

**信息**: ${testCase.birthInfo}
**性别**: ${testCase.gender}
**年龄段**: ${ageGroup}

### 输入的 baziMinimal 数据
\`\`\`json
${JSON.stringify(testCase.baziMinimal, null, 2)}
\`\`\`

### 各塔召回歌单 (每塔20首)

${towerDetailsMarkdown}

### 共识歌曲 (≥2塔推荐): ${consensusSongs.length} 首
${consensusListMarkdown}

### 最终推荐
${finalLetter || `**裁决失败**: ${mergeError}`}

---

`;
      fs.appendFileSync(resultFile, content);
      successCount++;

    } catch (error) {
      let errorMsg: string;
      if (error instanceof Error) {
        errorMsg = `${error.name}: ${error.message}`;
      } else {
        errorMsg = JSON.stringify(error);
      }

      console.error(`[${idx}] ❌ 错误:`, errorMsg);

      const content = `## ${idx}. ${fourPillars}

**信息**: ${testCase.birthInfo}
**错误**: ${errorMsg}

---

`;
      fs.appendFileSync(resultFile, content);
      failCount++;
    }
  }

  // 并发控制：分批执行
  for (let i = 0; i < testCases.length; i += CONFIG.testConcurrency) {
    const batch = testCases.slice(i, i + CONFIG.testConcurrency);
    const batchPromises = batch.map((testCase, batchIndex) =>
      processCase(testCase, i + batchIndex)
    );

    console.log(`\n========== 批次 ${Math.floor(i / CONFIG.testConcurrency) + 1}/${Math.ceil(testCases.length / CONFIG.testConcurrency)} ==========`);

    await Promise.all(batchPromises);
  }

  console.log(`\n========================================`);
  console.log(`✅ 测试完成！`);
  console.log(`   成功: ${successCount}, 失败: ${failCount}`);
  console.log(`📄 结果文件: ${resultFile}`);
  console.log(`========================================`);
}

// 运行
main().catch(console.error);
