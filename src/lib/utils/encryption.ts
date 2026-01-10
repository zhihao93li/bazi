/**
 * 敏感数据加密工具
 * 
 * 使用 AES-256-GCM 算法对敏感数据进行加密存储
 * 支持手机号等敏感信息的加密和解密
 */

import crypto from 'crypto';

// 加密算法配置
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // GCM 推荐使用 12-16 字节的 IV
const AUTH_TAG_LENGTH = 16; // GCM 认证标签长度
const KEY_LENGTH = 32; // AES-256 需要 32 字节密钥

/**
 * 获取加密密钥
 * 从环境变量读取，如果不存在则使用默认密钥（仅用于开发环境）
 */
function getEncryptionKey(): Buffer {
  const keyString = process.env.ENCRYPTION_KEY;
  
  if (!keyString) {
    // 开发环境使用默认密钥，生产环境必须配置
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY environment variable is required in production');
    }
    // 开发环境默认密钥（32字节）
    return Buffer.from('dev-encryption-key-32-bytes-long', 'utf8');
  }
  
  // 如果密钥是 hex 格式
  if (/^[0-9a-fA-F]{64}$/.test(keyString)) {
    return Buffer.from(keyString, 'hex');
  }
  
  // 如果密钥是普通字符串，使用 SHA-256 派生固定长度密钥
  return crypto.createHash('sha256').update(keyString).digest();
}

/**
 * 加密结果接口
 */
export interface EncryptedData {
  /** 初始化向量（hex 编码） */
  iv: string;
  /** 加密后的数据（hex 编码） */
  encrypted: string;
  /** 认证标签（hex 编码） */
  authTag: string;
}

/**
 * 加密敏感数据
 * @param plaintext 明文数据
 * @returns 加密后的数据对象
 */
export function encrypt(plaintext: string): EncryptedData {
  if (typeof plaintext !== 'string') {
    throw new Error('Plaintext must be a string');
  }
  
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    iv: iv.toString('hex'),
    encrypted,
    authTag: authTag.toString('hex'),
  };
}

/**
 * 解密敏感数据
 * @param encryptedData 加密后的数据对象
 * @returns 解密后的明文
 */
export function decrypt(encryptedData: EncryptedData): string {
  if (!encryptedData || typeof encryptedData !== 'object') {
    throw new Error('Invalid encrypted data');
  }
  
  const { iv, encrypted, authTag } = encryptedData;
  
  if (typeof iv !== 'string' || typeof encrypted !== 'string' || typeof authTag !== 'string') {
    throw new Error('Missing required encryption fields');
  }
  
  const key = getEncryptionKey();
  const ivBuffer = Buffer.from(iv, 'hex');
  const authTagBuffer = Buffer.from(authTag, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  
  decipher.setAuthTag(authTagBuffer);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * 将加密数据序列化为字符串（用于数据库存储）
 * @param encryptedData 加密后的数据对象
 * @returns 序列化后的字符串
 */
export function serializeEncryptedData(encryptedData: EncryptedData): string {
  return `${encryptedData.iv}:${encryptedData.encrypted}:${encryptedData.authTag}`;
}

/**
 * 从序列化字符串解析加密数据
 * @param serialized 序列化后的字符串
 * @returns 加密数据对象
 */
export function deserializeEncryptedData(serialized: string): EncryptedData {
  if (typeof serialized !== 'string') {
    throw new Error('Serialized data must be a string');
  }
  
  const parts = serialized.split(':');
  
  if (parts.length !== 3) {
    throw new Error('Invalid serialized encrypted data format');
  }
  
  return {
    iv: parts[0],
    encrypted: parts[1],
    authTag: parts[2],
  };
}

/**
 * 加密并序列化（便捷方法）
 * @param plaintext 明文数据
 * @returns 序列化后的加密字符串
 */
export function encryptAndSerialize(plaintext: string): string {
  const encrypted = encrypt(plaintext);
  return serializeEncryptedData(encrypted);
}

/**
 * 反序列化并解密（便捷方法）
 * @param serialized 序列化后的加密字符串
 * @returns 解密后的明文
 */
export function deserializeAndDecrypt(serialized: string): string {
  const encryptedData = deserializeEncryptedData(serialized);
  return decrypt(encryptedData);
}

/**
 * 检查字符串是否为加密格式
 * @param value 要检查的字符串
 * @returns 是否为加密格式
 */
export function isEncryptedFormat(value: string): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  
  const parts = value.split(':');
  
  if (parts.length !== 3) {
    return false;
  }
  
  // 检查每部分是否为有效的 hex 字符串
  const hexRegex = /^[0-9a-fA-F]+$/;
  
  // IV 应该是 32 个 hex 字符（16 字节）
  if (parts[0].length !== IV_LENGTH * 2 || !hexRegex.test(parts[0])) {
    return false;
  }
  
  // 加密数据应该是 hex 字符串
  if (!hexRegex.test(parts[1])) {
    return false;
  }
  
  // 认证标签应该是 32 个 hex 字符（16 字节）
  if (parts[2].length !== AUTH_TAG_LENGTH * 2 || !hexRegex.test(parts[2])) {
    return false;
  }
  
  return true;
}

/**
 * 对手机号进行脱敏处理（用于日志和显示）
 * @param phone 手机号
 * @returns 脱敏后的手机号（如：138****1234）
 */
export function maskPhone(phone: string): string {
  if (typeof phone !== 'string' || phone.length < 7) {
    return '***';
  }
  
  const prefix = phone.slice(0, 3);
  const suffix = phone.slice(-4);
  
  return `${prefix}****${suffix}`;
}

/**
 * 生成随机加密密钥（用于初始化配置）
 * @returns 32字节的随机密钥（hex 编码）
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}
