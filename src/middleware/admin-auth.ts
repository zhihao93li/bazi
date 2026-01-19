/**
 * 管理员认证中间件
 *
 * 验证管理员 JWT Token 并将管理员信息注入到 Context
 */

import type { Context, Next } from 'hono';
import { verifyAdminToken, extractTokenFromHeader, type AdminJwtPayload } from '../lib/admin/auth.js';

// 扩展 Hono Context 的变量类型
declare module 'hono' {
  interface ContextVariableMap {
    admin: AdminJwtPayload;
    adminId: string;
  }
}

/**
 * 管理员认证中间件 - 必须登录
 *
 * 验证失败返回 401
 */
export async function adminAuthRequired(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return c.json({ success: false, message: '请先登录管理后台' }, 401);
  }

  const payload = await verifyAdminToken(token);

  if (!payload) {
    return c.json({ success: false, message: '登录已过期，请重新登录' }, 401);
  }

  // 将管理员信息注入到 context
  c.set('admin', payload);
  c.set('adminId', payload.id);

  await next();
}

/**
 * 获取当前管理员（从 Context 中）
 */
export function getCurrentAdmin(c: Context): AdminJwtPayload | undefined {
  return c.get('admin');
}

/**
 * 获取当前管理员 ID（从 Context 中）
 */
export function getCurrentAdminId(c: Context): string | undefined {
  return c.get('adminId');
}

/**
 * 要求管理员 ID 必须存在（用于 adminAuthRequired 之后的路由）
 *
 * 使用此函数可避免在每个路由处理器中重复检查 adminId
 * 仅在 adminAuthRequired 中间件之后使用才是安全的
 *
 * @throws 如果 adminId 不存在将抛出错误（理论上不应发生）
 */
export function requireAdminId(c: Context): string {
  const adminId = c.get('adminId');
  if (!adminId) {
    throw new Error('requireAdminId called without adminAuthRequired middleware');
  }
  return adminId;
}

/**
 * 检查是否为超级管理员
 */
export function isSuperAdmin(c: Context): boolean {
  const admin = c.get('admin');
  return admin?.role === 'super_admin';
}

/**
 * 要求超级管理员权限
 */
export async function requireSuperAdmin(c: Context, next: Next) {
  const admin = c.get('admin');

  if (!admin) {
    return c.json({ success: false, message: '请先登录' }, 401);
  }

  if (admin.role !== 'super_admin') {
    return c.json({ success: false, message: '需要超级管理员权限' }, 403);
  }

  await next();
}
