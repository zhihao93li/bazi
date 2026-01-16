/**
 * 码支付（Mazfu）服务模块
 * 
 * 功能：
 * - 签名生成和验证
 * - 创建支付请求
 * - 处理支付回调
 */

import crypto from 'crypto';

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 码支付配置接口
 */
export interface MazfuConfig {
  pid: string;           // 商户ID
  key: string;           // 签名密钥
  apiBaseUrl: string;    // API基础URL
  notifyUrl: string;     // 异步通知URL
  returnUrl: string;     // 同步跳转URL
}

/**
 * 创建支付请求参数
 */
export interface CreateMazfuPaymentParams {
  orderNo: string;       // 商户订单号
  amount: number;        // 金额（分）
  productName: string;   // 商品名称
  device: 'pc' | 'mobile'; // 设备类型
  clientIp?: string;     // 客户端IP
}

/**
 * 创建支付请求结果
 */
export interface CreateMazfuPaymentResult {
  success: boolean;
  tradeNo?: string;      // 码支付订单号
  qrcode?: string;       // 二维码链接（PC端）
  payurl?: string;       // 支付跳转URL（移动端）
  money?: string;        // 支付金额
  message?: string;      // 错误信息
}

/**
 * 回调通知参数
 */
export interface MazfuNotifyParams {
  pid: string;           // 商户ID
  trade_no: string;      // 码支付订单号
  out_trade_no: string;  // 商户订单号
  type: string;          // 支付方式
  name: string;          // 商品名称
  money: string;         // 金额
  trade_status: string;  // 支付状态
  param?: string;        // 业务扩展参数
  sign: string;          // 签名
  sign_type: string;     // 签名类型
}

// ============================================================================
// 配置读取
// ============================================================================

/**
 * 从环境变量读取码支付配置
 */
export function getMazfuConfig(): MazfuConfig {
  const pid = process.env.MAZFU_PID || '';
  const key = process.env.MAZFU_KEY || '';
  const notifyUrl = process.env.MAZFU_NOTIFY_URL || '';
  const returnUrl = process.env.MAZFU_RETURN_URL || '';
  const apiBaseUrl = 'https://www.mazfu.com';

  return {
    pid,
    key,
    apiBaseUrl,
    notifyUrl,
    returnUrl,
  };
}

/**
 * 检查码支付配置是否完整
 */
export function isMazfuConfigured(): boolean {
  const config = getMazfuConfig();
  return !!(config.pid && config.key && config.notifyUrl && config.returnUrl);
}

/**
 * 记录配置缺失警告
 * 返回缺失的环境变量列表
 */
export function logConfigWarnings(): string[] {
  const config = getMazfuConfig();
  const missing: string[] = [];

  if (!config.pid) missing.push('MAZFU_PID');
  if (!config.key) missing.push('MAZFU_KEY');
  if (!config.notifyUrl) missing.push('MAZFU_NOTIFY_URL');
  if (!config.returnUrl) missing.push('MAZFU_RETURN_URL');

  if (missing.length > 0) {
    console.warn(`[Mazfu] 码支付配置不完整，缺少以下环境变量: ${missing.join(', ')}`);
    console.warn('[Mazfu] 码支付功能将被禁用，请在 .env 文件中配置相关变量');
  }

  return missing;
}

// 模块加载时自动检查配置
// 仅在非测试环境下执行，避免测试时产生不必要的警告
if (process.env.NODE_ENV !== 'test') {
  logConfigWarnings();
}

// ============================================================================
// 签名生成和验证
// ============================================================================

/**
 * 生成签名
 * 
 * 算法：
 * 1. 按 ASCII 码升序排序所有参数
 * 2. 排除 sign、sign_type 和空值参数
 * 3. 拼接为 URL 键值对格式（a=b&c=d&e=f）
 * 4. 追加商户 KEY 并计算小写 MD5
 */
export function generateSign(params: Record<string, string>, key: string): string {
  // 过滤掉 sign、sign_type 和空值参数
  const filteredParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (k !== 'sign' && k !== 'sign_type' && v !== '' && v !== undefined && v !== null) {
      filteredParams[k] = v;
    }
  }

  // 按 ASCII 码升序排序参数名
  const sortedKeys = Object.keys(filteredParams).sort();

  // 拼接为 URL 键值对格式
  const queryString = sortedKeys
    .map(k => `${k}=${filteredParams[k]}`)
    .join('&');

  // 追加 KEY 并计算小写 MD5
  const signString = queryString + key;
  return crypto.createHash('md5').update(signString).digest('hex').toLowerCase();
}

/**
 * 验证签名
 */
export function verifySign(params: MazfuNotifyParams, key: string): boolean {
  const { sign, ...restParams } = params;
  
  // 将参数转换为 Record<string, string>
  const paramsRecord: Record<string, string> = {};
  for (const [k, v] of Object.entries(restParams)) {
    if (v !== undefined && v !== null) {
      paramsRecord[k] = String(v);
    }
  }

  const calculatedSign = generateSign(paramsRecord, key);
  return calculatedSign === sign;
}

// ============================================================================
// 支付请求
// ============================================================================

/**
 * 创建支付请求
 */
export async function createPayment(params: CreateMazfuPaymentParams): Promise<CreateMazfuPaymentResult> {
  const config = getMazfuConfig();

  if (!isMazfuConfigured()) {
    return {
      success: false,
      message: '码支付未配置，请检查环境变量',
    };
  }

  // 金额从分转换为元，保留两位小数
  const moneyInYuan = (params.amount / 100).toFixed(2);

  // 构建请求参数
  const requestParams: Record<string, string> = {
    pid: config.pid,
    type: 'alipay',
    out_trade_no: params.orderNo,
    notify_url: config.notifyUrl,
    return_url: config.returnUrl,
    name: params.productName,
    money: moneyInYuan,
    device: params.device,
  };

  // 添加可选参数
  if (params.clientIp) {
    requestParams.clientip = params.clientIp;
  }

  // 生成签名
  requestParams.sign = generateSign(requestParams, config.key);
  requestParams.sign_type = 'MD5';

  try {
    // 调用码支付 API
    const apiUrl = `${config.apiBaseUrl}/xpay/epay/mapi.php`;
    
    // 构建 form-urlencoded 请求体
    const formBody = Object.entries(requestParams)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody,
    });

    if (!response.ok) {
      return {
        success: false,
        message: `HTTP 错误: ${response.status}`,
      };
    }

    const data = await response.json() as {
      code: number;
      msg?: string;
      trade_no?: string;
      qrcode?: string;
      payurl?: string;
      money?: string;
    };

    // 检查返回状态
    if (data.code !== 1) {
      return {
        success: false,
        message: data.msg || '支付请求失败',
      };
    }

    // 返回成功结果
    return {
      success: true,
      tradeNo: data.trade_no,
      qrcode: data.qrcode,
      payurl: data.payurl,
      money: data.money,
    };
  } catch (error) {
    return {
      success: false,
      message: `请求失败: ${error instanceof Error ? error.message : '未知错误'}`,
    };
  }
}
