/**
 * Soul Song 批量测试脚本
 *
 * 使用预定义的八字数据批量调用 LLM 生成灵魂歌曲推荐
 * 结果保存到 results/ 目录
 *
 * 运行方式：
 *   npx tsx docs/soul-song-test/test-soul-song.ts
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
  // LLM 模型名称
  model: 'gemini-3-pro-preview',

  // ========== 生成参数 ==========
  // 温度：0-2，越高越随机，越低越确定
  temperature: 0.7,

  // Top P（核采样）：0-1，与 temperature 二选一使用
  // 设为 null 表示不使用
  topP: null as number | null,

  // 最大生成 token 数
  maxTokens: 10000,

  // 频率惩罚：-2.0 到 2.0，正值减少重复词
  frequencyPenalty: 0,

  // 存在惩罚：-2.0 到 2.0，正值鼓励新话题
  presencePenalty: 0,

  // 停止词：遇到这些词就停止生成
  // 设为 null 表示不使用
  stop: null as string[] | null,

  // ========== 并发配置 ==========
  // 并发数量：同时发起多少个请求（建议 2-3，太高可能触发限流）
  concurrency: 12,

  // ========== 网络配置 ==========
  // API 超时时间（毫秒）
  timeout: 120000,

  // 请求间隔（毫秒），避免限流（并发模式下无效）
  requestDelay: 1500,

  // API 基础地址
  baseURL: 'https://aihubmix.com/v1',  // 备用：生产环境
  // baseURL: 'http://127.0.0.1:8043/v1',    // 本地测试
};

// ============================================
// 提示词配置 - 可以随时调整
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
// 测试数据：八字字符串
// 格式：八字四柱 + 出生信息 + 性别
// ============================================
const TEST_CASES: string[] = [
  '壬申癸丑甲寅乙丑。公历1993年2月2日 03:20出生于湖北荆州的男性',
  '乙亥甲申壬辰庚子。1995.08.28 23:17出生于浙江丽水的女性',
  '丙子癸巳戊辰丁巳，公历1996.5.31 10:20出生于浙江杭州的女性',
  '壬子辛亥乙卯乙酉。农历1972年十月十五日酉时一刻出生于浙江丽水的女性',
  '乙酉甲申庚寅辛巳。2005年9月3日10.20出生 郑州金水区女性',
  '戊申壬戌戊辰壬戌。1968年农历九月初四戌时 出生于浙江丽水的男性',
  '丙子戊戌丁亥丁未。1996年10月17日下午2点14分 杭州 男',
  '乙酉辛巳己未庚午。2005年公历6月4日11：30出生于浙江丽水的男性',
  '癸酉戌午丙戌甲午。1993年公历7月4日12点15分出生于湖北省襄阳市的女性',
  '丁丑乙酉壬戌甲辰。1997年公历9月17日9点20 出生于湖北省荆州市监利市的男性',
  '戌申乙卯乙亥己卯。公历1968年03月06日 05:00 出生于湖北荆州市监利市的女性',
  '庚戌丙戌庚午壬午。公历 1970年10月17 日 12:00 出生于湖北荆州市监利市的男性',
];


// ============================================
// 解析测试用例字符串
// ============================================
interface ParsedCase {
  bazi: string;        // 八字四柱
  year: number;        // 出生年份
  gender: string;      // 性别
  fullText: string;    // 完整描述
}

function parseTestCase(testCase: string): ParsedCase {
  // 提取八字（前8个字）
  const bazi = testCase.substring(0, 8);

  // 提取年份
  const yearMatch = testCase.match(/(\d{4})年/);
  const year = yearMatch ? parseInt(yearMatch[1]) : 1990;

  // 提取性别
  const gender = testCase.includes('女性') ? '女' : '男';

  return {
    bazi,
    year,
    gender,
    fullText: testCase,
  };
}

// ============================================
// 计算年龄段
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

// ============================================
// 调用 LLM
// ============================================
async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  // const apiKey = process.env.AIHUBMIX_API_KEY;  // 备用：从环境变量读取
  // const apiKey = 'sk-18efb72d54d74d11b6b5e89b2ac86140';  // 本地测试
  const apiKey = 'sk-cly7YdPTmvVpeOHX2b71Ef3fDfB14c96A2C98f6aF211950d';  // 本地测试

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
    ...(CONFIG.topP !== null && { top_p: CONFIG.topP }),
    ...(CONFIG.stop !== null && { stop: CONFIG.stop }),
  });

  return response.choices[0]?.message?.content || '';
}

// ============================================
// 主函数
// ============================================
async function main() {
  console.log('========================================');
  console.log('Soul Song 批量测试脚本');
  console.log(`模型: ${CONFIG.model}`);
  console.log(`并发数: ${CONFIG.concurrency}`);
  console.log('========================================\n');

  // 创建结果目录
  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // 创建时间戳
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const resultFile = path.join(resultsDir, `${timestamp}_results.csv`);
  // CSV Header
  const csvHeader = '\uFEFFIndex,Bazi,Year,Gender,AgeGroup,Song,Artist,Lyric,Reason_Melody,Reason_Lyric\n';
  fs.writeFileSync(resultFile, csvHeader);

  // 统计
  let successCount = 0;
  let failCount = 0;

  // 定义单个任务的处理函数（完成后立即写入文件）
  async function processCase(testCase: string, index: number): Promise<void> {
    const parsed = parseTestCase(testCase);
    const idx = String(index + 1).padStart(2, '0');
    const ageGroup = getAgeGroup(parsed.year);

    console.log(`[${idx}] 开始: ${parsed.bazi}`);

    try {
      const userPrompt = USER_PROMPT_TEMPLATE
        .replace('{{baziInfo}}', parsed.fullText)
        .replace('{{年龄段}}', ageGroup);

      const result = await callLLM(SYSTEM_PROMPT, userPrompt);

      // 解析 JSON
      const jsonStr = result.replace(/```json\n?|\n?```/g, '').trim();
      let songs: any[];
      try {
        songs = JSON.parse(jsonStr);
        if (!Array.isArray(songs)) throw new Error('Result is not an array');
      } catch (e) {
        console.error(`[${idx}] JSON Parse Error:`, result.slice(0, 100));
        throw new Error('Invalid JSON output');
      }

      // 转换为 CSV 行
      const rows = songs.map(s => {
        // 处理 CSV 转义 (双引号变两个双引号，外包双引号)
        const escape = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;

        return [
          idx,
          escape(parsed.bazi),
          parsed.year,
          parsed.gender,
          escape(ageGroup),
          escape(s.song),
          escape(s.artist),
          escape(s.lyric),
          escape(s.reason_melody),
          escape(s.reason_lyric)
        ].join(',');
      }).join('\n');

      fs.appendFileSync(resultFile, rows + '\n');
      successCount++;
      console.log(`[${idx}] ✅ 完成 (${songs.length} 首歌)`);

    } catch (error) {
      let errorMsg: string;
      if (error instanceof Error) {
        errorMsg = `${error.name}: ${error.message}`;
      } else {
        errorMsg = JSON.stringify(error);
      }

      console.error(`[${idx}] ❌ 错误:`, errorMsg);
      // 写入错误行
      const errRow = `${idx},"${parsed.bazi}",,,,,"ERROR: ${errorMsg.replace(/"/g, '""')}",,,`;
      fs.appendFileSync(resultFile, errRow + '\n');
      failCount++;
    }
  }

  // 并发控制：分批执行
  for (let i = 0; i < TEST_CASES.length; i += CONFIG.concurrency) {
    const batch = TEST_CASES.slice(i, i + CONFIG.concurrency);
    const batchPromises = batch.map((testCase, batchIndex) =>
      processCase(testCase, i + batchIndex)
    );

    console.log(`\n--- 批次 ${Math.floor(i / CONFIG.concurrency) + 1}/${Math.ceil(TEST_CASES.length / CONFIG.concurrency)} (${batch.length} 个请求并发) ---`);

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
