/**
 * 灵魂歌曲 API 路由
 *
 * POST /unlock - 解锁灵魂歌曲（扣费 100 积分）
 * GET /:subjectId - 获取已解锁的灵魂歌曲
 */

import { Hono } from 'hono';
import { authRequired, requireUserId } from '../middleware/auth.js';
import { PointsError, PointsErrorCode } from '../lib/points/types.js';
import { deductPoints, refundPoints } from '../lib/points/service.js';
import { generateThemeAnalysis } from '../lib/ai/service.js';
import { searchSongWithQRCode } from '../lib/music/index.js';
import type { SoulSongData, SongWithQRCode } from '../lib/music/types.js';
import prisma from '../lib/prisma.js';

export const soulSongRoutes = new Hono();

// 灵魂歌曲价格（积分）
const SOUL_SONG_PRICE = 100;

/**
 * 解析 AI 返回的歌曲推荐 JSON
 */
function parseAIResponse(content: string): { songs: Array<{ rank: number; name: string; artist: string; reason: string }> } | null {
  try {
    // 尝试提取 JSON 块
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;

    // 清理可能的 markdown 标记
    const cleanedJson = jsonStr.trim().replace(/^```\w*\n?/, '').replace(/\n?```$/, '');

    const parsed = JSON.parse(cleanedJson);

    if (!parsed.songs || !Array.isArray(parsed.songs)) {
      console.error('[Soul Song] Invalid AI response structure:', parsed);
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('[Soul Song] Failed to parse AI response:', error);
    console.error('[Soul Song] Raw content:', content);
    return null;
  }
}

/**
 * 获取已解锁的灵魂歌曲
 * GET /api/soul-song/:subjectId
 */
soulSongRoutes.get('/:subjectId', authRequired, async (c) => {
  try {
    const userId = requireUserId(c);
    const subjectId = c.req.param('subjectId');

    if (!subjectId) {
      return c.json({ success: false, message: '缺少 subjectId' }, 400);
    }

    // 验证 Subject 归属
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { userId: true },
    });

    if (!subject) {
      return c.json({ success: false, message: '测算对象不存在' }, 404);
    }

    if (subject.userId !== userId) {
      return c.json({ success: false, message: '无权访问该测算对象' }, 403);
    }

    // 查询已解锁的灵魂歌曲
    const analysis = await prisma.themeAnalysis.findUnique({
      where: { subjectId_theme: { subjectId, theme: 'soul_song' } },
    });

    if (!analysis) {
      return c.json({
        success: true,
        isUnlocked: false,
        data: null,
      });
    }

    // 解析存储的 JSON 数据
    let soulSongData: SoulSongData | null = null;
    try {
      const contentStr = typeof analysis.content === 'string'
        ? analysis.content
        : JSON.stringify(analysis.content);
      soulSongData = JSON.parse(contentStr) as SoulSongData;
    } catch {
      console.error('[Soul Song] Failed to parse stored data');
    }

    return c.json({
      success: true,
      isUnlocked: true,
      data: soulSongData,
      unlockedAt: analysis.createdAt,
    });
  } catch (error) {
    console.error('[Soul Song] Error fetching soul song:', error);
    return c.json({ success: false, message: '获取灵魂歌曲失败' }, 500);
  }
});

/**
 * 解锁灵魂歌曲
 * POST /api/soul-song/unlock
 * Body: { subjectId: string }
 */
soulSongRoutes.post('/unlock', authRequired, async (c) => {
  const userId = requireUserId(c);
  let pointsDeducted = false;
  let orderId = '';

  try {
    const body = await c.req.json();
    const { subjectId } = body as { subjectId: string };

    if (!subjectId) {
      return c.json({
        success: false,
        message: '请选择测算对象',
        code: 'SUBJECT_REQUIRED',
      }, 400);
    }

    // 检查是否已解锁
    const existingAnalysis = await prisma.themeAnalysis.findUnique({
      where: { subjectId_theme: { subjectId, theme: 'soul_song' } },
    });

    if (existingAnalysis) {
      const account = await prisma.pointsAccount.findUnique({
        where: { userId },
        select: { balance: true },
      });

      let soulSongData: SoulSongData | null = null;
      try {
        const contentStr = typeof existingAnalysis.content === 'string'
          ? existingAnalysis.content
          : JSON.stringify(existingAnalysis.content);
        soulSongData = JSON.parse(contentStr) as SoulSongData;
      } catch {
        // ignore
      }

      return c.json({
        success: true,
        alreadyUnlocked: true,
        data: soulSongData,
        pointsDeducted: 0,
        remainingBalance: account?.balance || 0,
      });
    }

    // 验证 Subject
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { userId: true, baziData: true, initialAnalysis: true, name: true },
    });

    if (!subject) {
      return c.json({
        success: false,
        message: '测算对象不存在',
        code: 'SUBJECT_NOT_FOUND',
      }, 404);
    }

    if (subject.userId !== userId) {
      return c.json({
        success: false,
        message: '无权访问该测算对象',
        code: 'UNAUTHORIZED',
      }, 403);
    }

    if (!subject.baziData) {
      return c.json({
        success: false,
        message: '测算对象缺少八字数据，请重新排盘',
        code: 'BAZI_DATA_MISSING',
      }, 400);
    }

    // 扣除积分
    orderId = `soul_song_${subjectId}_${Date.now()}`;
    let deductResult: { balance?: number };
    try {
      deductResult = await deductPoints({
        userId,
        amount: SOUL_SONG_PRICE,
        description: `解锁灵魂歌曲 - ${subject.name || '命盘'}`,
        orderId,
      });
      pointsDeducted = true;
    } catch (error) {
      if (error instanceof PointsError && error.code === PointsErrorCode.INSUFFICIENT_BALANCE) {
        return c.json({
          success: false,
          message: '积分不足，请先充值',
          code: 'INSUFFICIENT_POINTS',
        }, 402);
      }
      throw error;
    }

    console.log(`[Soul Song] Points deducted for user ${userId}, orderId: ${orderId}`);

    // 获取或生成初步解读
    let initialAnalysis = subject.initialAnalysis as string | null;
    if (!initialAnalysis) {
      console.log(`[Soul Song] No initial analysis found, generating...`);
      const { generateInitialAnalysis } = await import('../lib/ai/service.js');
      initialAnalysis = await generateInitialAnalysis(
        subject.baziData as unknown as import('../lib/bazi/types.js').BaziData,
        undefined,
        subjectId
      );

      // 保存初步解读
      await prisma.subject.update({
        where: { id: subjectId },
        data: { initialAnalysis },
      });
    }

    // 调用 AI 生成歌曲推荐
    console.log(`[Soul Song] Generating song recommendations...`);
    const aiContent = await generateThemeAnalysis(
      'soul_song',
      subject.baziData as unknown as import('../lib/bazi/types.js').BaziData,
      initialAnalysis,
      undefined,
      subjectId
    );

    // 解析 AI 返回的歌曲列表
    const aiResult = parseAIResponse(aiContent);
    if (!aiResult || !aiResult.songs || aiResult.songs.length === 0) {
      // AI 返回格式错误，退还积分
      await refundPoints({
        userId,
        amount: SOUL_SONG_PRICE,
        description: '灵魂歌曲解锁失败退款',
        orderId,
        reason: 'AI response parsing failed',
      });

      return c.json({
        success: false,
        message: 'AI 生成失败，积分已退还',
        code: 'AI_GENERATION_FAILED',
      }, 500);
    }

    // 搜索 QQ 音乐获取歌曲详情
    // 新逻辑：AI 返回 2 首歌曲，只取 1 首展示
    // 优先取第一首，如果搜不到则用第二首作为备选
    console.log(`[Soul Song] Searching QQ Music, trying primary song first...`);
    const soulSongData: SoulSongData = {
      songs: [],
      generatedAt: new Date().toISOString(),
    };

    // 按 rank 排序，确保第一首优先
    const sortedSongs = [...aiResult.songs].sort((a, b) => (a.rank || 1) - (b.rank || 2));

    let foundSong = false;
    for (const song of sortedSongs) {
      try {
        const qqMusicData = await searchSongWithQRCode(song.name, song.artist);
        if (qqMusicData) {
          // 找到了，只保存这一首
          soulSongData.songs.push({
            rank: 1, // 最终展示的歌曲 rank 统一为 1
            name: song.name,
            artist: song.artist,
            reason: song.reason,
            qqMusic: qqMusicData,
          });
          console.log(`[Soul Song] Found: ${song.name} by ${song.artist} (rank ${song.rank})`);
          foundSong = true;
          break; // 找到后停止搜索
        }
      } catch (error) {
        console.warn(`[Soul Song] Failed to find song: ${song.name} by ${song.artist}`, error);
        // 继续尝试下一首
      }
    }

    // 如果所有歌曲都搜不到，返回第一首并标记错误
    if (!foundSong && sortedSongs.length > 0) {
      const firstSong = sortedSongs[0];
      soulSongData.songs.push({
        rank: 1,
        name: firstSong.name,
        artist: firstSong.artist,
        reason: firstSong.reason,
        qqMusic: null,
        error: '未能在 QQ 音乐找到此歌曲',
      });
      console.log(`[Soul Song] No songs found in QQ Music, using first recommendation with error`);
    }

    // 保存到数据库
    await prisma.themeAnalysis.create({
      data: {
        userId,
        subjectId,
        theme: 'soul_song',
        content: JSON.parse(JSON.stringify(soulSongData)),
        pointsCost: SOUL_SONG_PRICE,
      },
    });

    console.log(`[Soul Song] Successfully saved for subject ${subjectId}`);

    return c.json({
      success: true,
      data: soulSongData,
      pointsDeducted: SOUL_SONG_PRICE,
      remainingBalance: deductResult.balance,
    });

  } catch (error) {
    console.error('[Soul Song] Unlock error:', error);

    // 如果已扣费但处理失败，退还积分
    if (pointsDeducted && orderId) {
      try {
        await refundPoints({
          userId,
          amount: SOUL_SONG_PRICE,
          description: '灵魂歌曲解锁失败退款',
          orderId,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
        console.log(`[Soul Song] Points refunded for failed unlock`);
      } catch (refundError) {
        console.error('[Soul Song] Failed to refund points:', refundError);
      }
    }

    return c.json({
      success: false,
      message: '解锁失败，请稍后重试',
      code: 'UNLOCK_FAILED',
    }, 500);
  }
});

/**
 * 获取灵魂歌曲价格
 * GET /api/soul-song/pricing
 */
soulSongRoutes.get('/pricing', async (c) => {
  return c.json({
    success: true,
    price: SOUL_SONG_PRICE,
  });
});
