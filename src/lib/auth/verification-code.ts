/**
 * 验证码生成和存储服务
 * 
 * 功能：
 * - 生成6位数字验证码
 * - 验证码存储到数据库（含过期时间）
 * - 60秒发送频率限制
 * - 5次错误锁定机制
 */

import prisma from "../prisma.js";
import { validatePhoneFormat } from "../utils/phone-validator.js";

// 验证码配置
const VERIFICATION_CODE_LENGTH = 6;
const VERIFICATION_CODE_EXPIRY_MINUTES = 5;
const SEND_INTERVAL_SECONDS = 60;
const MAX_VERIFICATION_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

export interface SendCodeResult {
  success: boolean;
  message: string;
  retryAfterSeconds?: number;
}

export interface VerifyCodeResult {
  success: boolean;
  message: string;
  userId?: string;
  remainingAttempts?: number;
  lockedUntil?: Date;
}

/**
 * 生成6位数字验证码
 */
export function generateVerificationCode(): string {
  const min = Math.pow(10, VERIFICATION_CODE_LENGTH - 1);
  const max = Math.pow(10, VERIFICATION_CODE_LENGTH) - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

/**
 * 检查是否可以发送验证码（60秒频率限制）
 */
async function canSendCode(phone: string): Promise<{ canSend: boolean; retryAfterSeconds?: number }> {
  const lastCode = await prisma.verificationCode.findFirst({
    where: { phone },
    orderBy: { createdAt: "desc" },
  });

  if (!lastCode) {
    return { canSend: true };
  }

  const secondsSinceLastSend = Math.floor(
    (Date.now() - lastCode.createdAt.getTime()) / 1000
  );

  if (secondsSinceLastSend < SEND_INTERVAL_SECONDS) {
    return {
      canSend: false,
      retryAfterSeconds: SEND_INTERVAL_SECONDS - secondsSinceLastSend,
    };
  }

  return { canSend: true };
}

/**
 * 检查手机号是否被锁定
 */
async function isPhoneLocked(phone: string): Promise<{ locked: boolean; lockedUntil?: Date }> {
  // 查找最近的验证码记录，检查是否有超过5次错误尝试
  const recentCode = await prisma.verificationCode.findFirst({
    where: {
      phone,
      attempts: { gte: MAX_VERIFICATION_ATTEMPTS },
      createdAt: {
        gte: new Date(Date.now() - LOCK_DURATION_MINUTES * 60 * 1000),
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recentCode) {
    const lockedUntil = new Date(
      recentCode.createdAt.getTime() + LOCK_DURATION_MINUTES * 60 * 1000
    );
    if (lockedUntil > new Date()) {
      return { locked: true, lockedUntil };
    }
  }

  return { locked: false };
}

/**
 * 发送验证码
 * 注意：此函数只负责生成和存储验证码，实际发送由 SMS 服务处理
 */
export async function createVerificationCode(phone: string): Promise<SendCodeResult> {
  // 验证手机号格式
  if (!validatePhoneFormat(phone)) {
    return {
      success: false,
      message: "手机号格式不正确",
    };
  }

  // 检查是否被锁定
  const lockStatus = await isPhoneLocked(phone);
  if (lockStatus.locked) {
    return {
      success: false,
      message: `手机号已被锁定，请在 ${lockStatus.lockedUntil?.toLocaleTimeString()} 后重试`,
    };
  }

  // 检查发送频率
  const sendStatus = await canSendCode(phone);
  if (!sendStatus.canSend) {
    return {
      success: false,
      message: `请求过于频繁，请 ${sendStatus.retryAfterSeconds} 秒后重试`,
      retryAfterSeconds: sendStatus.retryAfterSeconds,
    };
  }

  // 生成验证码
  const code = generateVerificationCode();
  const expiresAt = new Date(
    Date.now() + VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000
  );

  // 存储验证码
  await prisma.verificationCode.create({
    data: {
      phone,
      code,
      expiresAt,
      attempts: 0,
      used: false,
    },
  });

  return {
    success: true,
    message: "验证码已发送",
  };
}

/**
 * 获取最新的有效验证码（用于测试和内部调用）
 */
export async function getLatestCode(phone: string): Promise<string | null> {
  const code = await prisma.verificationCode.findFirst({
    where: {
      phone,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  return code?.code ?? null;
}

/**
 * 验证验证码
 */
export async function verifyCode(phone: string, code: string): Promise<VerifyCodeResult> {
  // 验证手机号格式
  if (!validatePhoneFormat(phone)) {
    return {
      success: false,
      message: "手机号格式不正确",
    };
  }

  // 检查是否被锁定
  const lockStatus = await isPhoneLocked(phone);
  if (lockStatus.locked) {
    return {
      success: false,
      message: `手机号已被锁定，请在 ${lockStatus.lockedUntil?.toLocaleTimeString()} 后重试`,
      lockedUntil: lockStatus.lockedUntil,
    };
  }

  // 查找最新的未使用验证码
  const verificationCode = await prisma.verificationCode.findFirst({
    where: {
      phone,
      used: false,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!verificationCode) {
    return {
      success: false,
      message: "验证码不存在，请重新获取",
    };
  }

  // 检查验证码是否过期
  if (verificationCode.expiresAt < new Date()) {
    return {
      success: false,
      message: "验证码已过期，请重新获取",
    };
  }

  // 检查验证码是否正确
  if (verificationCode.code !== code) {
    // 增加错误次数
    const newAttempts = verificationCode.attempts + 1;
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { attempts: newAttempts },
    });

    const remainingAttempts = MAX_VERIFICATION_ATTEMPTS - newAttempts;

    if (remainingAttempts <= 0) {
      return {
        success: false,
        message: `验证码错误次数过多，手机号已被锁定 ${LOCK_DURATION_MINUTES} 分钟`,
        remainingAttempts: 0,
      };
    }

    return {
      success: false,
      message: `验证码错误，还剩 ${remainingAttempts} 次尝试机会`,
      remainingAttempts,
    };
  }

  // 验证成功，标记验证码为已使用
  await prisma.verificationCode.update({
    where: { id: verificationCode.id },
    data: { used: true },
  });

  return {
    success: true,
    message: "验证成功",
  };
}

/**
 * 清理过期的验证码（可用于定时任务）
 */
export async function cleanupExpiredCodes(): Promise<number> {
  const result = await prisma.verificationCode.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  return result.count;
}
