/**
 * 设备检测工具
 * 基于 User-Agent 判断设备类型（PC/移动端）
 * 
 * 需求: 6.1, 6.2, 6.3
 */

// 移动设备 User-Agent 关键词
const MOBILE_KEYWORDS = [
  'Android',
  'webOS',
  'iPhone',
  'iPad',
  'iPod',
  'BlackBerry',
  'IEMobile',
  'Opera Mini',
  'Mobile',
  'mobile',
  'Tablet',
  'tablet',
  'Silk',
  'Kindle',
  'PlayBook',
  'BB10',
  'Windows Phone',
  'KFAPWI', // Kindle Fire
  'KFTT',   // Kindle Fire
  'KFOT',   // Kindle Fire
];

/**
 * 检测是否为移动设备
 * 将移动浏览器、平板电脑和移动应用归类为移动设备
 * 
 * @param {string} [userAgent] - 可选的 User-Agent 字符串，默认使用 navigator.userAgent
 * @returns {boolean} 是否为移动设备
 */
export function isMobile(userAgent) {
  const ua = userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  
  if (!ua) {
    return false;
  }
  
  return MOBILE_KEYWORDS.some(keyword => ua.includes(keyword));
}

/**
 * 检测设备类型
 * PC 端返回 'pc'，移动端返回 'mobile'
 * 
 * @param {string} [userAgent] - 可选的 User-Agent 字符串，默认使用 navigator.userAgent
 * @returns {'pc' | 'mobile'} 设备类型
 */
export function detectDevice(userAgent) {
  return isMobile(userAgent) ? 'mobile' : 'pc';
}
