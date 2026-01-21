/**
 * QQ 音乐服务类型定义
 */

/**
 * 歌曲搜索结果
 */
export interface SongSearchResult {
  title: string;
  singers: string;
  album: string;
  albumMid: string;
  singerMid: string;
  mid: string;
  id: string;
  duration: string;
  shareUrl: string;
  coverUrl: string;
  singerAvatarUrl: string;
}

/**
 * 歌词信息
 */
export interface LyricInfo {
  lyric: string;
  trans: string;
  lyricParsed: Array<{ time: number; text: string }>;
}

/**
 * 完整歌曲信息（包含二维码）
 */
export interface SongWithQRCode extends SongSearchResult, LyricInfo {
  qrBase64: string;
}

/**
 * AI 推荐的歌曲
 */
export interface RecommendedSong {
  rank: number;
  name: string;
  artist: string;
  reason: string;
}

/**
 * AI 推荐结果
 */
export interface SongRecommendation {
  songs: RecommendedSong[];
}

/**
 * 灵魂歌曲完整数据（存储到数据库）
 */
export interface SoulSongData {
  songs: Array<{
    rank: number;
    name: string;
    artist: string;
    reason: string;
    qqMusic: SongWithQRCode | null;
    error?: string;
  }>;
  generatedAt: string;
}
