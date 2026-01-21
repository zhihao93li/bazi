/**
 * QQ 音乐搜索 API - TypeScript 版本
 * 通过搜索获取 QQ 音乐上的歌曲信息，支持生成分享二维码
 */

import crypto from 'crypto';
import QRCode from 'qrcode';
import type { SongSearchResult, LyricInfo, SongWithQRCode } from './types.js';

// API 配置
const API_CONFIG = {
  endpoint: 'https://u.y.qq.com/cgi-bin/musicu.fcg',
  version_code: '13.2.5.8',
};

// 公共参数默认值
const COMMON_DEFAULTS = {
  ct: '11',
  tmeAppID: 'qqmusic',
  format: 'json',
  inCharset: 'utf-8',
  outCharset: 'utf-8',
  uid: '3931641530',
};

/**
 * 搜索类型枚举
 */
export const SearchType = {
  SONG: 0,
  SINGER: 1,
  ALBUM: 2,
  SONGLIST: 3,
  MV: 4,
  LYRIC: 7,
  USER: 8,
} as const;

/**
 * 生成随机 GUID
 */
function getGuid(): string {
  const chars = 'abcdef1234567890';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成随机 searchID
 */
function getSearchID(): string {
  const e = Math.floor(Math.random() * 20) + 1;
  const t = e * 18014398509481984;
  const n = Math.floor(Math.random() * 4194304) * 4294967296;
  const r = Date.now() % (24 * 60 * 60 * 1000);
  return String(t + n + r);
}

/**
 * 生成随机 QIMEI36
 */
function getQimei36(): string {
  return crypto.randomBytes(18).toString('hex');
}

/**
 * 构建公共参数
 */
function buildCommonParams(): Record<string, string> {
  return {
    ...COMMON_DEFAULTS,
    cv: API_CONFIG.version_code,
    v: API_CONFIG.version_code,
    QIMEI36: getQimei36(),
  };
}

/**
 * 发送 API 请求
 */
async function apiRequest<T>(
  module: string,
  method: string,
  params: Record<string, unknown>
): Promise<T> {
  const requestKey = `${module}.${method}`;
  const data = {
    comm: buildCommonParams(),
    [requestKey]: {
      module,
      method,
      param: params,
    },
  };

  const response = await fetch(API_CONFIG.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json() as Record<string, unknown>;
  const reqData = result[requestKey] as { code?: number; data?: T } | undefined;

  if (reqData && reqData.code !== 0) {
    throw new Error(`API error! code: ${reqData.code}`);
  }

  return (reqData?.data || reqData) as T;
}

/**
 * 搜索歌曲
 */
async function search(
  keyword: string,
  options: {
    type?: number;
    num?: number;
    page?: number;
    highlight?: boolean;
  } = {}
): Promise<unknown[]> {
  const { type = SearchType.SONG, num = 10, page = 1, highlight = false } = options;

  const params = {
    searchid: getSearchID(),
    query: keyword,
    search_type: type,
    num_per_page: num,
    page_num: page,
    highlight: highlight ? 1 : 0,
    grp: 1,
  };

  const data = await apiRequest<{ body?: Record<string, unknown[]> }>(
    'music.search.SearchCgiService',
    'DoSearchForQQMusicMobile',
    params
  );

  const typeMap: Record<number, string> = {
    [SearchType.SONG]: 'item_song',
    [SearchType.SINGER]: 'singer',
    [SearchType.ALBUM]: 'item_album',
    [SearchType.SONGLIST]: 'item_songlist',
    [SearchType.MV]: 'item_mv',
    [SearchType.LYRIC]: 'item_song',
    [SearchType.USER]: 'item_user',
  };

  return data?.body?.[typeMap[type]] || [];
}

/**
 * 生成歌曲分享链接
 */
function getShareUrl(mid: string): string {
  return `https://y.qq.com/n/ryqq/songDetail/${mid}`;
}

/**
 * 获取专辑封面图 URL
 */
function getAlbumCoverUrl(albumMid: string, size: number = 300): string {
  if (!albumMid) return '';
  return `https://y.qq.com/music/photo_new/T002R${size}x${size}M000${albumMid}.jpg`;
}

/**
 * 获取歌手头像 URL
 */
function getSingerAvatarUrl(singerMid: string, size: number = 300): string {
  if (!singerMid) return '';
  return `https://y.qq.com/music/photo_new/T001R${size}x${size}M000${singerMid}.jpg`;
}

/**
 * 获取歌词
 */
async function getLyric(value: string | number): Promise<{ lyric: string; trans: string }> {
  const params: Record<string, unknown> = {
    crypt: 0,
    ct: 11,
    cv: 13020508,
    lrc_t: 0,
    qrc: 0,
    qrc_t: 0,
    roma: 0,
    roma_t: 0,
    trans: 1,
    trans_t: 0,
    type: 1,
  };

  if (typeof value === 'number') {
    params.songId = value;
  } else {
    params.songMid = value;
  }

  const data = await apiRequest<{ lyric?: string; trans?: string }>(
    'music.musichallSong.PlayLyricInfo',
    'GetPlayLyricInfo',
    params
  );

  const decodeLyric = (str: string | undefined): string => {
    if (!str) return '';
    try {
      return Buffer.from(str, 'base64').toString('utf-8');
    } catch {
      return str;
    }
  };

  return {
    lyric: decodeLyric(data?.lyric),
    trans: decodeLyric(data?.trans),
  };
}

/**
 * 解析 LRC 歌词为数组
 */
function parseLyric(lrc: string): Array<{ time: number; text: string }> {
  if (!lrc) return [];

  const lines = lrc.split('\n');
  const result: Array<{ time: number; text: string }> = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

  for (const line of lines) {
    const matches = [...line.matchAll(timeRegex)];
    const text = line.replace(timeRegex, '').trim();

    if (matches.length > 0 && text) {
      for (const match of matches) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const ms = parseInt(match[3].padEnd(3, '0'), 10);
        const time = minutes * 60 + seconds + ms / 1000;
        result.push({ time, text });
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

/**
 * 格式化歌曲信息
 */
function formatSongInfo(song: Record<string, unknown>): SongSearchResult {
  const title = (song.title || song.name || '未知') as string;
  const singerArr = (song.singer || []) as Array<{ name?: string; mid?: string }>;
  const singers = singerArr.map((s) => s.name || '未知').join(', ');
  const albumData = (song.album || {}) as { name?: string; mid?: string };
  const album = albumData.name || '未知专辑';
  const albumMid = albumData.mid || '';
  const mid = (song.mid || '') as string;
  const id = String(song.id || '');
  const interval = (song.interval || 0) as number;
  const duration = interval
    ? `${Math.floor(interval / 60)}:${String(interval % 60).padStart(2, '0')}`
    : '未知';

  const singerMid = singerArr[0]?.mid || '';

  return {
    title,
    singers,
    album,
    albumMid,
    singerMid,
    mid,
    id,
    duration,
    shareUrl: getShareUrl(mid),
    coverUrl: getAlbumCoverUrl(albumMid),
    singerAvatarUrl: getSingerAvatarUrl(singerMid),
  };
}

/**
 * 生成二维码（Base64 图片）
 */
async function generateQRCodeBase64(url: string): Promise<string> {
  return await QRCode.toDataURL(url);
}

/**
 * 通过歌曲名和歌手名搜索歌曲，获取分享链接并生成二维码
 */
export async function searchSongWithQRCode(
  songName: string,
  singerName: string = '',
  options: { fetchLyric?: boolean } = {}
): Promise<SongWithQRCode> {
  const { fetchLyric = true } = options;

  // 构建搜索关键词
  const keyword = singerName ? `${songName} ${singerName}` : songName;

  // 搜索歌曲
  const results = await search(keyword, { num: 1 });

  if (!results || results.length === 0) {
    throw new Error(`未找到歌曲: ${keyword}`);
  }

  // 取第一首歌
  const song = results[0] as Record<string, unknown>;
  const songInfo = formatSongInfo(song);

  // 生成二维码
  const qrBase64 = await generateQRCodeBase64(songInfo.shareUrl);

  // 获取歌词
  let lyricData: LyricInfo = { lyric: '', trans: '', lyricParsed: [] };
  if (fetchLyric && songInfo.mid) {
    try {
      const { lyric, trans } = await getLyric(songInfo.mid);
      lyricData = {
        lyric,
        trans,
        lyricParsed: parseLyric(lyric),
      };
    } catch (e) {
      // 歌词获取失败，忽略错误
      console.warn(`[QQ Music] Failed to fetch lyrics for ${songName}:`, e);
    }
  }

  return {
    ...songInfo,
    ...lyricData,
    qrBase64,
  };
}

/**
 * 批量搜索歌曲
 */
export async function searchSongsWithQRCode(
  songs: Array<{ name: string; artist: string }>
): Promise<Array<SongWithQRCode | null>> {
  const results: Array<SongWithQRCode | null> = [];

  for (const song of songs) {
    try {
      const result = await searchSongWithQRCode(song.name, song.artist);
      results.push(result);
    } catch (error) {
      console.error(`[QQ Music] Failed to search song "${song.name}" by "${song.artist}":`, error);
      results.push(null);
    }
  }

  return results;
}
