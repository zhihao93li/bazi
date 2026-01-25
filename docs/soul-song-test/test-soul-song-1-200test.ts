/**
 * Soul Song 批量测试脚本 (200条数据版)
 *
 * 读取 docs/soul-song-test/bazi-dataset-200.json
 * 批量调用 LLM 生成 20 首推荐歌曲
 * **随机摘选其中 1 首** 作为最终结果
 * 结果保存到 results/ 目录的 CSV 文件中
 *
 * 运行方式：
 *   npx tsx docs/soul-song-test/test-soul-song-1-200test.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import type { BaziBirthData } from '../../src/lib/bazi/types.js';

// 获取当前目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载项目根目录的 .env 文件
const projectRoot = path.join(__dirname, '..', '..');
dotenv.config({ path: path.join(projectRoot, '.env') });

// ============================================
// 配置区域
// ============================================
const CONFIG = {
  // LLM 模型名称
  model: 'gemini-3-pro-preview',

  // 生成参数
  temperature: 0.7,
  maxTokens: 10000,
  frequencyPenalty: 0,
  presencePenalty: 0,

  // 并发数量
  concurrency: 12,

  // API 超时时间（毫秒）
  timeout: 120000,

  // API 基础地址
  baseURL: 'https://aihubmix.com/v1',
};

// ============================================
// 提示词配置
// ============================================
const SYSTEM_PROMPT = `
# Role
你是一位拥有“上帝视角”的灵魂解读师。你的特长是穿透八字命理的表象，挖掘一个人灵魂深处的“情感暗区”——即那些为了维持体面而不得不压抑的、最深层的渴望与疲惫。

# Goal
根据用户的命盘，精准锁定其内心不敢示人的“软肋”，并匹配20首能将这种“软肋”升华为“宿命美感”的歌曲，让用户在被“看穿”的瞬间产生起鸡皮疙瘩的震撼感。

# The Logic of "Emotional Dark Zone" (情感暗区逻辑)
在解析命盘时，请遵循以下深度挖掘逻辑：
1. **寻找“被围困的孤勇”**：看最旺的五行（能量源）如何压迫最弱的五行。这就是用户“不得不坚强”的地方。
2. **寻找“无法落地的渴望”**：看命格中最缺失、最受克的元素。这就是用户“想要却不敢开口”的软肋。
3. **寻找“自我消耗的闭环”**：看地支的刑冲破害（如寅申冲）。这就是用户内心“法官与囚徒”的日夜博弈。

# Output Format (Strict JSON)
You must output a single valid JSON array of objects. Do NOT use markdown code blocks.
Structure:
[
  {
    "song": "歌曲名",
    "artist": "歌手",
    "lyric": "核心歌词 (必须中文)",
    "reason_melody": "解析旋律与宿命的映射 (30字以内, 中文)",
    "reason_lyric": "解析歌词与内心暗区的撞击 (30字以内, 中文)"
  },
  ... (Total 20 items)
]

# Writing Requirements
- **平视的慈悲**：不要教导，要承认。承认他的孤独是合理的，甚至是有格局的。`;

const USER_PROMPT_TEMPLATE = `
【八字数据】{{baziInfo}}

# Analysis Task
  - **扫描暗区**：请通过该命盘，识别出用户性格中“最强硬外壳下掩盖的那个最柔软的牺牲”。他为了维持现在的格局，在内心杀死了哪一部分的自己？
  - **宿命映射**：这种“暗区”在现实中表现为哪种孤独？（是渴望拥抱却推开一切？还是明明疲惫却必须领跑？）
  - **灵魂匹配**：匹配20首能承接这种“巨大压强”的歌曲。这首歌不需要安慰他，只需要“确认为他”。

# Constraints
  - 严禁出现“性格活泼”、“要注意身体”等琐碎建议。
  - 字数不宜过多，每一句都要精准如刀，切开表象，直见骨架。
`;

// ============================================
// 数据接口定义
// ============================================
interface GeneratedEntry {
  id: string;
  rawBazi: string;
  birthInfo: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    location: string;
    gender: string;
  };
  baziMinimal: any; // 我们主要使用 entry 用于生成描述，具体结构不强求
}

interface SongRecommendation {
  song: string;
  artist: string;
  lyric: string;
  reason_melody: string;
  reason_lyric: string;
}

// ============================================
// 工具函数
// ============================================

function getAgeGroup(birthYear: number): string {
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  if (age < 20) return '00后青少年';
  if (age < 30) return '20-30岁青年';
  if (age < 40) return '30-40岁中青年';
  if (age < 50) return '40-50岁中年';
  return '50岁以上';
}

function constructBaziInfo(entry: GeneratedEntry): string {
  const { birthInfo, rawBazi } = entry;
  const genderStr = birthInfo.gender === 'male' ? '男' : '女';
  const minuteStr = String(birthInfo.minute).padStart(2, '0');
  // 格式：壬申癸丑甲寅乙丑。公历1993年2月2日 03:20出生于湖北荆州的男性
  return `${rawBazi}。公历${birthInfo.year}年${birthInfo.month}月${birthInfo.day}日 ${birthInfo.hour}:${minuteStr}出生于${birthInfo.location}的${genderStr}性`;
}

// ============================================
// 调用 LLM
// ============================================
async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  // const apiKey = process.env.AIHUBMIX_API_KEY;  // 备用
  const apiKey = 'sk-cly7YdPTmvVpeOHX2b71Ef3fDfB14c96A2C98f6aF211950d';  // 本地测试
  // const apiKey = 'sk-18efb72d54d74d11b6b5e89b2ac86140';  // 本地测试2

  if (!apiKey) {
    throw new Error('API_KEY 未设置');
  }

  const client = new OpenAI({
    apiKey,
    baseURL: CONFIG.baseURL,
    timeout: CONFIG.timeout,
  });

  const response = await client.chat.completions.create({
    model: CONFIG.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: CONFIG.temperature,
    max_tokens: CONFIG.maxTokens,
    frequency_penalty: CONFIG.frequencyPenalty,
    presence_penalty: CONFIG.presencePenalty,
  });

  return response.choices[0]?.message?.content || '';
}

// ============================================
// 主函数
// ============================================
async function main() {
  console.log('========================================');
  console.log('Soul Song 200条数据 批量测试');
  console.log(`模型: ${CONFIG.model}`);
  console.log(`并发数: ${CONFIG.concurrency}`);
  console.log('========================================\n');

  // 1. 读取数据集
  const datasetPath = path.join(__dirname, 'bazi-dataset-200.json');
  if (!fs.existsSync(datasetPath)) {
    console.error(`❌ 数据集文件不存在: ${datasetPath}`);
    process.exit(1);
  }
  const rawData = fs.readFileSync(datasetPath, 'utf-8');
  const dataset: GeneratedEntry[] = JSON.parse(rawData);
  console.log(`载入 ${dataset.length} 条测试数据`);

  // 2. 创建结果文件
  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const resultFile = path.join(resultsDir, `${timestamp}_200_results.csv`);
  // CSV Header
  const csvHeader = '\uFEFFIndex,RawBazi,Year,Gender,Location,AgeGroup,Song,Artist,Lyric,Reason_Melody,Reason_Lyric\n';
  fs.writeFileSync(resultFile, csvHeader);

  // 统计
  let successCount = 0;
  let failCount = 0;

  // 3. 定义处理函数
  async function processEntry(entry: GeneratedEntry, index: number): Promise<void> {
    const idx = entry.id; // JSON 中已有 id (001, 002...)
    const fullText = constructBaziInfo(entry);
    const ageGroup = getAgeGroup(entry.birthInfo.year);

    console.log(`[${idx}] 处理: ${entry.rawBazi}`);

    try {
      const userPrompt = USER_PROMPT_TEMPLATE
        .replace('{{baziInfo}}', fullText)
        .replace('{{年龄段}}', ageGroup);

      // 调用 LLM
      const result = await callLLM(SYSTEM_PROMPT, userPrompt);

      // 解析 JSON
      const jsonStr = result.replace(/```json\n?|\n?```/g, '').trim();
      let songs: SongRecommendation[];
      try {
        songs = JSON.parse(jsonStr);
        if (!Array.isArray(songs)) throw new Error('Result is not an array');
      } catch (e) {
        console.error(`[${idx}] JSON Parse Error`);
        throw new Error('Invalid JSON output');
      }

      if (songs.length === 0) {
        throw new Error('No songs returned');
      }

      // **随机选择 1 首歌**
      const randomSong = songs[Math.floor(Math.random() * songs.length)];

      // 转换为 CSV 行
      const escape = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
      const row = [
        idx,
        escape(entry.rawBazi),
        entry.birthInfo.year,
        entry.birthInfo.gender,
        escape(entry.birthInfo.location),
        escape(ageGroup),
        escape(randomSong.song),
        escape(randomSong.artist),
        escape(randomSong.lyric),
        escape(randomSong.reason_melody),
        escape(randomSong.reason_lyric)
      ].join(',');

      fs.appendFileSync(resultFile, row + '\n');
      successCount++;
      console.log(`[${idx}] ✅ 完成: 选中《${randomSong.song}》 (从 ${songs.length} 首中随机)`);

    } catch (error) {
      let errorMsg: string;
      if (error instanceof Error) {
        errorMsg = `${error.name}: ${error.message}`;
      } else {
        errorMsg = JSON.stringify(error);
      }

      console.error(`[${idx}] ❌ 错误:`, errorMsg);
      // 写入错误行
      const errRow = `${idx},"${entry.rawBazi}",,,,,"ERROR: ${errorMsg.replace(/"/g, '""')}",,,`;
      fs.appendFileSync(resultFile, errRow + '\n');
      failCount++;
    }
  }

  // 4. 并发执行
  for (let i = 0; i < dataset.length; i += CONFIG.concurrency) {
    const batch = dataset.slice(i, i + CONFIG.concurrency);
    const batchPromises = batch.map((entry, batchIndex) =>
      processEntry(entry, i + batchIndex)
    );

    console.log(`\n--- 批次 ${Math.floor(i / CONFIG.concurrency) + 1}/${Math.ceil(dataset.length / CONFIG.concurrency)} (${batch.length} 个请求并发) ---`);

    await Promise.all(batchPromises);
  }

  console.log(`\n========================================`);
  console.log(`✅ 测试完成！`);
  console.log(`   成功: ${successCount}, 失败: ${failCount}`);
  console.log(`📄 结果文件: ${resultFile}`);
  console.log(`========================================`);
}

main().catch(console.error);
