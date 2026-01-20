/**
 * QQ 音乐搜索 API - Node.js 版本
 * 通过搜索获取 QQ 音乐上的歌曲信息，支持生成分享二维码
 */

const crypto = require("crypto");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");

// API 配置
const API_CONFIG = {
  endpoint: "https://u.y.qq.com/cgi-bin/musicu.fcg",
  version_code: "13.2.5.8",
};

// 公共参数默认值
const COMMON_DEFAULTS = {
  ct: "11",
  tmeAppID: "qqmusic",
  format: "json",
  inCharset: "utf-8",
  outCharset: "utf-8",
  uid: "3931641530",
};

/**
 * 搜索类型枚举
 */
const SearchType = {
  SONG: 0, // 歌曲
  SINGER: 1, // 歌手
  ALBUM: 2, // 专辑
  SONGLIST: 3, // 歌单
  MV: 4, // MV
  LYRIC: 7, // 歌词
  USER: 8, // 用户
};

/**
 * 生成随机 GUID
 */
function getGuid() {
  const chars = "abcdef1234567890";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成随机 searchID
 */
function getSearchID() {
  const e = Math.floor(Math.random() * 20) + 1;
  const t = e * 18014398509481984;
  const n = Math.floor(Math.random() * 4194304) * 4294967296;
  const r = Date.now() % (24 * 60 * 60 * 1000);
  return String(t + n + r);
}

/**
 * 生成随机 QIMEI36
 */
function getQimei36() {
  return crypto.randomBytes(18).toString("hex");
}

/**
 * 构建公共参数
 */
function buildCommonParams() {
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
async function apiRequest(module, method, params) {
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
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  const reqData = result[requestKey];

  if (reqData && reqData.code !== 0) {
    throw new Error(`API error! code: ${reqData.code}`);
  }

  return reqData?.data || reqData;
}

/**
 * 搜索歌曲
 * @param {string} keyword - 搜索关键词
 * @param {object} options - 搜索选项
 * @param {number} options.type - 搜索类型，默认 SearchType.SONG
 * @param {number} options.num - 返回数量，默认 10
 * @param {number} options.page - 页码，默认 1
 * @param {boolean} options.highlight - 是否高亮关键词，默认 false
 * @returns {Promise<Array>} 搜索结果
 */
async function search(keyword, options = {}) {
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

  const data = await apiRequest(
    "music.search.SearchCgiService",
    "DoSearchForQQMusicMobile",
    params
  );

  // 根据搜索类型返回对应的结果
  const typeMap = {
    [SearchType.SONG]: "item_song",
    [SearchType.SINGER]: "singer",
    [SearchType.ALBUM]: "item_album",
    [SearchType.SONGLIST]: "item_songlist",
    [SearchType.MV]: "item_mv",
    [SearchType.LYRIC]: "item_song",
    [SearchType.USER]: "item_user",
  };

  return data?.body?.[typeMap[type]] || [];
}

/**
 * 快速搜索
 * @param {string} keyword - 搜索关键词
 * @returns {Promise<object>} 搜索结果
 */
async function quickSearch(keyword) {
  const response = await fetch(
    `https://c.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg?key=${encodeURIComponent(keyword)}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://y.qq.com/",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * 获取歌曲详情
 * @param {string|number} value - 歌曲 ID 或 MID
 * @returns {Promise<object>} 歌曲详情
 */
async function getSongDetail(value) {
  const params =
    typeof value === "number" ? { song_id: value } : { song_mid: value };

  return await apiRequest(
    "music.pf_song_detail_svr",
    "get_song_detail_yqq",
    params
  );
}

/**
 * 批量获取歌曲信息
 * @param {Array<string|number>} values - 歌曲 ID 或 MID 列表
 * @returns {Promise<Array>} 歌曲信息列表
 */
async function querySongs(values) {
  const params = {
    types: values.map(() => 0),
    modify_stamp: values.map(() => 0),
    ctx: 0,
    client: 1,
  };

  if (typeof values[0] === "number") {
    params.ids = values;
  } else {
    params.mids = values;
  }

  const data = await apiRequest(
    "music.trackInfo.UniformRuleCtrl",
    "CgiGetTrackInfo",
    params
  );

  return data?.tracks || [];
}

/**
 * 生成歌曲分享链接
 * @param {string} mid - 歌曲 MID
 * @returns {string} 分享链接
 */
function getShareUrl(mid) {
  return `https://y.qq.com/n/ryqq/songDetail/${mid}`;
}

/**
 * 获取专辑封面图 URL
 * @param {string} albumMid - 专辑 MID
 * @param {number} size - 图片尺寸，默认 300
 * @returns {string} 封面图 URL
 */
function getAlbumCoverUrl(albumMid, size = 300) {
  if (!albumMid) return "";
  return `https://y.qq.com/music/photo_new/T002R${size}x${size}M000${albumMid}.jpg`;
}

/**
 * 获取歌手头像 URL
 * @param {string} singerMid - 歌手 MID
 * @param {number} size - 图片尺寸，默认 300
 * @returns {string} 歌手头像 URL
 */
function getSingerAvatarUrl(singerMid, size = 300) {
  if (!singerMid) return "";
  return `https://y.qq.com/music/photo_new/T001R${size}x${size}M000${singerMid}.jpg`;
}

/**
 * 获取歌词
 * @param {string|number} value - 歌曲 ID 或 MID
 * @returns {Promise<object>} 歌词信息 { lyric, trans }
 */
async function getLyric(value) {
  const params = {
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

  if (typeof value === "number") {
    params.songId = value;
  } else {
    params.songMid = value;
  }

  const data = await apiRequest(
    "music.musichallSong.PlayLyricInfo",
    "GetPlayLyricInfo",
    params
  );

  // 解码 Base64 歌词
  const decodeLyric = (str) => {
    if (!str) return "";
    try {
      return Buffer.from(str, "base64").toString("utf-8");
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
 * @param {string} lrc - LRC 格式歌词
 * @returns {Array<{time: number, text: string}>} 歌词数组
 */
function parseLyric(lrc) {
  if (!lrc) return [];

  const lines = lrc.split("\n");
  const result = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

  for (const line of lines) {
    const matches = [...line.matchAll(timeRegex)];
    const text = line.replace(timeRegex, "").trim();

    if (matches.length > 0 && text) {
      for (const match of matches) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const ms = parseInt(match[3].padEnd(3, "0"), 10);
        const time = minutes * 60 + seconds + ms / 1000;
        result.push({ time, text });
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

/**
 * 格式化歌曲信息
 * @param {object} song - 歌曲数据
 * @returns {object} 格式化后的歌曲信息
 */
function formatSongInfo(song) {
  const title = song.title || song.name || "未知";
  const singers = (song.singer || []).map((s) => s.name || "未知").join(", ");
  const album = song.album?.name || "未知专辑";
  const albumMid = song.album?.mid || "";
  const mid = song.mid || "";
  const id = song.id || "";
  const interval = song.interval || 0;
  const duration = interval
    ? `${Math.floor(interval / 60)}:${String(interval % 60).padStart(2, "0")}`
    : "未知";

  // 获取歌手 MID（取第一个歌手）
  const singerMid = song.singer?.[0]?.mid || "";

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
 * 搜索歌曲并返回格式化的结果
 * @param {string} keyword - 搜索关键词
 * @param {number} num - 返回数量
 * @returns {Promise<Array>} 格式化的歌曲列表
 */
async function searchSongs(keyword, num = 10) {
  const results = await search(keyword, { num });
  return results.map(formatSongInfo);
}

/**
 * 生成二维码（终端显示）
 * @param {string} url - 要生成二维码的链接
 * @returns {Promise<string>} 终端二维码字符串
 */
async function generateQRCodeTerminal(url) {
  return await QRCode.toString(url, { type: "terminal", small: true });
}

/**
 * 生成二维码（Base64 图片）
 * @param {string} url - 要生成二维码的链接
 * @returns {Promise<string>} Base64 编码的图片
 */
async function generateQRCodeBase64(url) {
  return await QRCode.toDataURL(url);
}

/**
 * 生成二维码并保存为图片文件
 * @param {string} url - 要生成二维码的链接
 * @param {string} filePath - 保存路径
 * @returns {Promise<string>} 保存的文件路径
 */
async function generateQRCodeFile(url, filePath) {
  await QRCode.toFile(filePath, url);
  return filePath;
}

/**
 * 通过歌曲名和歌手名搜索歌曲，获取分享链接并生成二维码
 * @param {string} songName - 歌曲名称
 * @param {string} singerName - 歌手名称（可选）
 * @param {object} options - 选项
 * @param {string} options.outputPath - 二维码图片保存路径（可选）
 * @param {boolean} options.showTerminal - 是否在终端显示二维码，默认 true
 * @param {boolean} options.fetchLyric - 是否获取歌词，默认 true
 * @returns {Promise<object>} 包含歌曲信息、分享链接、二维码、歌词、封面的对象
 */
async function searchSongWithQRCode(songName, singerName = "", options = {}) {
  const { outputPath, showTerminal = true, fetchLyric = true } = options;

  // 构建搜索关键词
  const keyword = singerName ? `${songName} ${singerName}` : songName;

  // 搜索歌曲
  const results = await search(keyword, { num: 1 });

  if (!results || results.length === 0) {
    throw new Error(`未找到歌曲: ${keyword}`);
  }

  // 取第一首歌
  const song = results[0];
  const songInfo = formatSongInfo(song);

  // 生成二维码
  const qrTerminal = showTerminal
    ? await generateQRCodeTerminal(songInfo.shareUrl)
    : null;
  const qrBase64 = await generateQRCodeBase64(songInfo.shareUrl);

  // 如果指定了保存路径，保存二维码图片
  let qrFilePath = null;
  if (outputPath) {
    qrFilePath = await generateQRCodeFile(songInfo.shareUrl, outputPath);
  }

  // 获取歌词
  let lyricData = { lyric: "", trans: "", lyricParsed: [] };
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
    }
  }

  return {
    ...songInfo,
    ...lyricData,
    qrTerminal,
    qrBase64,
    qrFilePath,
  };
}

// 导出模块
module.exports = {
  SearchType,
  search,
  quickSearch,
  getSongDetail,
  querySongs,
  getShareUrl,
  getAlbumCoverUrl,
  getSingerAvatarUrl,
  getLyric,
  parseLyric,
  formatSongInfo,
  searchSongs,
  generateQRCodeTerminal,
  generateQRCodeBase64,
  generateQRCodeFile,
  searchSongWithQRCode,
};

// 如果直接运行此文件，执行示例
if (require.main === module) {
  (async () => {
    try {
      console.log("=".repeat(50));
      console.log("🎵 搜索歌曲并生成分享二维码");
      console.log("=".repeat(50));

      // 通过歌曲名 + 歌手名搜索，获取分享链接和二维码
      const result = await searchSongWithQRCode("青花瓷", "周杰伦", {
        outputPath: "./qrcode.png", // 保存二维码图片
        showTerminal: true,
        fetchLyric: true,
      });

      console.log(`\n歌曲: ${result.title}`);
      console.log(`歌手: ${result.singers}`);
      console.log(`专辑: ${result.album}`);
      console.log(`时长: ${result.duration}`);
      console.log(`分享链接: ${result.shareUrl}`);
      console.log(`封面图: ${result.coverUrl}`);

      if (result.qrFilePath) {
        console.log(`\n✅ 二维码已保存至: ${result.qrFilePath}`);
      }

      // 显示歌词（前10行）
      if (result.lyric) {
        console.log("\n📝 歌词（前10行）:");
        console.log("-".repeat(30));
        const lyricLines = result.lyric.split("\n").filter(l => l.trim()).slice(0, 10);
        lyricLines.forEach(line => console.log(line));
        console.log("...");
      }

      console.log("\n📱 扫描下方二维码打开歌曲:\n");
      console.log(result.qrTerminal);

    } catch (error) {
      console.error("Error:", error.message);
    }
  })();
}
