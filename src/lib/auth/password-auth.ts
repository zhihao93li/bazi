/**
 * 用户名密码认证服务
 * 
 * 实现用户名密码注册和验证功能
 * Requirements: 1.7, 1.8, 1.9, 1.10
 */

import bcrypt from "bcryptjs";
import prisma from "../prisma.js";

// 密码最小长度
const MIN_PASSWORD_LENGTH = 6;

// 初始赠送积分数量（可通过环境变量配置）
const INITIAL_GIFT_POINTS = parseInt(process.env.INITIAL_GIFT_POINTS || "100", 10);

export interface RegisterResult {
  success: boolean;
  message: string;
  userId?: string;
}

export interface ValidateResult {
  success: boolean;
  message: string;
  user?: {
    id: string;
    username: string;
  };
}

/**
 * 验证用户名格式
 * 用户名规则：3-20位字母、数字、下划线，必须以字母开头
 */
export function validateUsername(username: string): { valid: boolean; message: string } {
  if (!username || username.length < 3) {
    return { valid: false, message: "用户名至少3个字符" };
  }
  if (username.length > 20) {
    return { valid: false, message: "用户名最多20个字符" };
  }
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(username)) {
    return { valid: false, message: "用户名必须以字母开头，只能包含字母、数字和下划线" };
  }
  return { valid: true, message: "" };
}

/**
 * 验证密码格式
 * 密码规则：至少6位
 */
export function validatePassword(password: string): { valid: boolean; message: string } {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, message: `密码至少${MIN_PASSWORD_LENGTH}位` };
  }
  return { valid: true, message: "" };
}

/**
 * 检查用户名是否已存在
 */
export async function isUsernameExists(username: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { username },
  });
  return !!user;
}

/**
 * 用户名密码注册
 * Requirements: 1.7, 1.8, 1.9, 1.10
 */
export async function registerWithPassword(
  username: string,
  password: string
): Promise<RegisterResult> {
  // 验证用户名格式
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    return { success: false, message: usernameValidation.message };
  }

  // 验证密码格式
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return { success: false, message: passwordValidation.message };
  }

  // 检查用户名是否已存在
  const exists = await isUsernameExists(username);
  if (exists) {
    return { success: false, message: "用户名已被占用" };
  }

  // 加密密码
  const passwordHash = await bcrypt.hash(password, 10);

  // 创建用户并赠送初始积分
  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
      pointsAccount: {
        create: {
          balance: INITIAL_GIFT_POINTS,
        },
      },
    },
  });

  // 记录赠送积分的交易记录
  await prisma.pointsTransaction.create({
    data: {
      userId: user.id,
      type: "gift",
      amount: INITIAL_GIFT_POINTS,
      balance: INITIAL_GIFT_POINTS,
      description: "注册赠送积分",
    },
  });

  return {
    success: true,
    message: "注册成功",
    userId: user.id,
  };
}

/**
 * 验证用户名密码
 * Requirements: 1.8
 */
export async function validatePassword_auth(
  username: string,
  password: string
): Promise<ValidateResult> {
  // 查找用户
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user || !user.passwordHash) {
    return { success: false, message: "用户名或密码错误" };
  }

  // 验证密码
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return { success: false, message: "用户名或密码错误" };
  }

  return {
    success: true,
    message: "验证成功",
    user: {
      id: user.id,
      username: user.username!,
    },
  };
}
