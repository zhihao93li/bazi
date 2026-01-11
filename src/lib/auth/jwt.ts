/**
 * JWT 工具函数
 * 
 * 用于生成和验证 JWT Token，替代 NextAuth
 */

import * as jose from 'jose';

// JWT 配置
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'default-secret-change-me';
const JWT_ISSUER = 'bazi-fortune-api';
const JWT_AUDIENCE = 'bazi-fortune-client';

// Token 有效期：30 天
const TOKEN_EXPIRY = '30d';

// 用户信息接口
export interface JwtPayload {
  id: string;
  phone?: string;
  username?: string;
  isNewUser?: boolean;
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
 * 生成 JWT Token
 */
export async function signToken(payload: JwtPayload): Promise<string> {
  const secret = getEncodedSecret();
  
  const token = await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secret);
  
  return token;
}

/**
 * 验证并解析 JWT Token
 */
export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const secret = getEncodedSecret();
    
    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    
    return {
      id: payload.id as string,
      phone: payload.phone as string | undefined,
      username: payload.username as string | undefined,
      isNewUser: payload.isNewUser as boolean | undefined,
    };
  } catch (error) {
    console.error('JWT verification failed:', error);
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
