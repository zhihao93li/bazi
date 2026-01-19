/**
 * 管理员认证路由
 */

import { Hono } from 'hono';
import { adminLogin, getAdminById } from '../../lib/admin/auth.js';
import { adminAuthRequired, getCurrentAdmin } from '../../middleware/admin-auth.js';

const app = new Hono();

/**
 * POST /api/admin/auth/login
 * 管理员登录
 */
app.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json();

    const result = await adminLogin(username, password);

    if (!result.success) {
      return c.json({ success: false, message: result.message }, 401);
    }

    return c.json({
      success: true,
      message: result.message,
      data: {
        token: result.token,
        admin: result.admin,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return c.json({ success: false, message: '登录失败，请稍后重试' }, 500);
  }
});

/**
 * GET /api/admin/auth/me
 * 获取当前管理员信息
 */
app.get('/me', adminAuthRequired, async (c) => {
  try {
    const adminPayload = getCurrentAdmin(c);

    if (!adminPayload) {
      return c.json({ success: false, message: '未登录' }, 401);
    }

    const admin = await getAdminById(adminPayload.id);

    if (!admin) {
      return c.json({ success: false, message: '管理员不存在' }, 404);
    }

    if (!admin.isActive) {
      return c.json({ success: false, message: '账号已被禁用' }, 403);
    }

    return c.json({
      success: true,
      data: admin,
    });
  } catch (error) {
    console.error('Get admin info error:', error);
    return c.json({ success: false, message: '获取管理员信息失败' }, 500);
  }
});

export const adminAuthRoutes = app;
