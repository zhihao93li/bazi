/**
 * 管理员认证服务
 *
 * 实现管理员登录和 JWT Token 签发功能
 */

import bcrypt from "bcryptjs";
import * as jose from 'jose';
import prisma from "../prisma.js";

// JWT 配置（管理员专用）
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'default-secret-change-me';
const JWT_ISSUER = 'bazi-fortune-admin';
const JWT_AUDIENCE = 'bazi-fortune-admin-client';

// 管理员 Token 有效期：7 天
const ADMIN_TOKEN_EXPIRY = '7d';

// 密码最小长度
const MIN_PASSWORD_LENGTH = 6;
// 密码最大长度（bcrypt 只处理前 72 字节）
const MAX_PASSWORD_LENGTH = 72;

// 管理员 JWT Payload
export interface AdminJwtPayload {
  id: string;
  username: string;
  role: string;
}

export interface AdminLoginResult {
  success: boolean;
  message: string;
  token?: string;
  admin?: {
    id: string;
    username: string;
    role: string;
  };
}

// 编码后的 secret
let encodedSecret: Uint8Array | null = null;

function getEncodedSecret(): Uint8Array {
  if (!encodedSecret) {
    encodedSecret = new TextEncoder().encode(JWT_SECRET);
  }
  return encodedSecret;
}

/**
 * 生成管理员 JWT Token
 */
export async function signAdminToken(payload: AdminJwtPayload): Promise<string> {
  const secret = getEncodedSecret();

  const token = await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(ADMIN_TOKEN_EXPIRY)
    .sign(secret);

  return token;
}

/**
 * 验证并解析管理员 JWT Token
 */
export async function verifyAdminToken(token: string): Promise<AdminJwtPayload | null> {
  try {
    const secret = getEncodedSecret();

    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    return {
      id: payload.id as string,
      username: payload.username as string,
      role: payload.role as string,
    };
  } catch (error) {
    console.error('Admin JWT verification failed:', error);
    return null;
  }
}

/**
 * 从 Authorization 头中提取 Token
 */
export function extractTokenFromHeader(authHeader: string | null | undefined): string | null {
  if (!authHeader) return null;

  // 支持 "Bearer <token>" 格式
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // 直接返回 token（兼容旧格式）
  return authHeader;
}

/**
 * 管理员登录验证
 */
export async function adminLogin(
  username: string,
  password: string
): Promise<AdminLoginResult> {
  // 验证输入
  if (!username || !password) {
    return { success: false, message: "用户名和密码不能为空" };
  }

  // 查找管理员
  const admin = await prisma.admin.findUnique({
    where: { username },
  });

  if (!admin) {
    return { success: false, message: "用户名或密码错误" };
  }

  // 检查账号状态
  if (!admin.isActive) {
    return { success: false, message: "账号已被禁用" };
  }

  // 验证密码
  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) {
    return { success: false, message: "用户名或密码错误" };
  }

  // 更新最后登录时间
  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  // 生成 Token
  const token = await signAdminToken({
    id: admin.id,
    username: admin.username,
    role: admin.role,
  });

  return {
    success: true,
    message: "登录成功",
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      role: admin.role,
    },
  };
}

/**
 * 根据 ID 获取管理员信息
 */
export async function getAdminById(id: string) {
  return prisma.admin.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
}

/**
 * 创建管理员（用于初始化脚本）
 */
export async function createAdmin(
  username: string,
  password: string,
  role: string = 'admin'
): Promise<{ success: boolean; message: string; adminId?: string }> {
  // 验证用户名格式
  if (!username || username.length < 3 || username.length > 20) {
    return { success: false, message: "用户名需要 3-20 个字符" };
  }
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(username)) {
    return { success: false, message: "用户名必须以字母开头，只能包含字母、数字和下划线" };
  }

  // 验证密码格式
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return { success: false, message: `密码至少 ${MIN_PASSWORD_LENGTH} 位` };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { success: false, message: `密码最多 ${MAX_PASSWORD_LENGTH} 位` };
  }

  // 检查用户名是否已存在
  const exists = await prisma.admin.findUnique({
    where: { username },
  });
  if (exists) {
    return { success: false, message: "用户名已被占用" };
  }

  // 加密密码
  const passwordHash = await bcrypt.hash(password, 10);

  // 创建管理员
  const admin = await prisma.admin.create({
    data: {
      username,
      passwordHash,
      role,
    },
  });

  return {
    success: true,
    message: "管理员创建成功",
    adminId: admin.id,
  };
}
