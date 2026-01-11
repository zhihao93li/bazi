/**
 * Hono 认证中间件
 * 
 * 验证 JWT Token 并将用户信息注入到 Context
 */

import type { Context, Next } from 'hono';
import { verifyToken, extractTokenFromHeader, type JwtPayload } from '../lib/auth/jwt.js';

// 扩展 Hono Context 的变量类型
declare module 'hono' {
  interface ContextVariableMap {
    user: JwtPayload;
    userId: string;
  }
}

/**
 * 认证中间件 - 必须登录
 * 
 * 验证失败返回 401
 */
export async function authRequired(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  const token = extractTokenFromHeader(authHeader);
  
  if (!token) {
    return c.json({ success: false, message: '请先登录' }, 401);
  }
  
  const payload = await verifyToken(token);
  
  if (!payload) {
    return c.json({ success: false, message: '登录已过期，请重新登录' }, 401);
  }
  
  // 将用户信息注入到 context
  c.set('user', payload);
  c.set('userId', payload.id);
  
  await next();
}

/**
 * 可选认证中间件
 * 
 * Token 有效则注入用户信息，无效则继续（不返回错误）
 */
export async function authOptional(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  const token = extractTokenFromHeader(authHeader);
  
  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      c.set('user', payload);
      c.set('userId', payload.id);
    }
  }
  
  await next();
}

/**
 * 获取当前用户（从 Context 中）
 */
export function getCurrentUser(c: Context): JwtPayload | undefined {
  return c.get('user');
}

/**
 * 获取当前用户 ID（从 Context 中）
 */
export function getCurrentUserId(c: Context): string | undefined {
  return c.get('userId');
}
