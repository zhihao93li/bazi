/**
 * 认证相关 API 路由
 * 
 * - POST /login/phone - 手机号+验证码登录
 * - POST /login/password - 用户名+密码登录
 * - POST /register - 用户名密码注册
 * - POST /send-code - 发送验证码
 * - POST /verify - 验证验证码
 * - GET /me - 获取当前用户信息
 */

import { Hono } from 'hono';
import prisma from '../lib/prisma.js';
import { validatePhoneFormat } from '../lib/utils/phone-validator.js';
import { createSmsProvider } from '../lib/sms/index.js';
import {
  signToken,
  createVerificationCode,
  verifyCode,
  getLatestCode,
  registerWithPassword,
  validatePassword_auth,
} from '../lib/auth/index.js';
import { authRequired, getCurrentUser } from '../middleware/auth.js';

// 初始赠送积分数量（可通过环境变量配置）
const INITIAL_GIFT_POINTS = parseInt(process.env.INITIAL_GIFT_POINTS || "100", 10);

export const authRoutes = new Hono();

/**
 * 手机号+验证码登录
 * POST /api/auth/login/phone
 */
authRoutes.post('/login/phone', async (c) => {
  try {
    const body = await c.req.json();
    const { phone, code } = body;

    if (!phone || !code) {
      return c.json({ success: false, message: '请输入手机号和验证码' }, 400);
    }

    // 验证手机号格式
    if (!validatePhoneFormat(phone)) {
      return c.json({ success: false, message: '手机号格式不正确' }, 400);
    }

    // 验证验证码
    const verifyResult = await verifyCode(phone, code);
    if (!verifyResult.success) {
      return c.json({
        success: false,
        message: verifyResult.message,
        remainingAttempts: verifyResult.remainingAttempts,
        lockedUntil: verifyResult.lockedUntil,
      }, 401);
    }

    // 查找或创建用户
    let user = await prisma.user.findUnique({
      where: { phone },
      include: { pointsAccount: true },
    });

    const isNewUser = !user;

    if (!user) {
      // 创建新用户
      user = await prisma.user.create({
        data: {
          phone,
          pointsAccount: {
            create: {
              balance: INITIAL_GIFT_POINTS,
            },
          },
        },
        include: { pointsAccount: true },
      });

      // 记录赠送积分的交易记录
      await prisma.pointsTransaction.create({
        data: {
          userId: user.id,
          type: 'gift',
          amount: INITIAL_GIFT_POINTS,
          balance: INITIAL_GIFT_POINTS,
          description: '注册赠送积分',
        },
      });
    }

    // 生成 JWT Token
    const token = await signToken({
      id: user.id,
      phone: user.phone ?? undefined,
      username: user.username ?? undefined,
      isNewUser,
    });

    return c.json({
      success: true,
      message: isNewUser ? '注册成功' : '登录成功',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        username: user.username,
        isNewUser,
      },
    });
  } catch (error) {
    console.error('Phone login error:', error);
    return c.json({ success: false, message: '登录失败，请稍后重试' }, 500);
  }
});

/**
 * 用户名+密码登录
 * POST /api/auth/login/password
 */
authRoutes.post('/login/password', async (c) => {
  try {
    const body = await c.req.json();
    const { username, password } = body;

    if (!username || !password) {
      return c.json({ success: false, message: '请输入用户名和密码' }, 400);
    }

    // 验证用户名密码
    const result = await validatePassword_auth(username, password);
    if (!result.success) {
      return c.json({ success: false, message: result.message }, 401);
    }

    // 获取完整用户信息
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return c.json({ success: false, message: '用户不存在' }, 401);
    }

    // 生成 JWT Token
    const token = await signToken({
      id: user.id,
      phone: user.phone ?? undefined,
      username: user.username ?? undefined,
      isNewUser: false,
    });

    return c.json({
      success: true,
      message: '登录成功',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        username: user.username,
        isNewUser: false,
      },
    });
  } catch (error) {
    console.error('Password login error:', error);
    return c.json({ success: false, message: '登录失败，请稍后重试' }, 500);
  }
});

/**
 * 用户名密码注册
 * POST /api/auth/register
 * 
 * 注册成功后直接返回 token，一次调用完成注册+登录
 */
authRoutes.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const { username, password } = body;

    if (!username || !password) {
      return c.json({ success: false, message: '请输入用户名和密码' }, 400);
    }

    const result = await registerWithPassword(username, password);

    if (!result.success) {
      return c.json({ success: false, message: result.message }, 400);
    }

    // 注册成功后直接生成 token
    const token = await signToken({
      id: result.userId!,
      username,
      isNewUser: true,
    });

    return c.json({
      success: true,
      message: result.message,
      token,  // 新增：返回 token
      user: {
        id: result.userId,
        username,
        isNewUser: true,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ success: false, message: '注册失败，请稍后重试' }, 500);
  }
});

/**
 * 发送验证码
 * POST /api/auth/send-code
 */
authRoutes.post('/send-code', async (c) => {
  try {
    const body = await c.req.json();
    const { phone } = body;

    if (!phone) {
      return c.json({ success: false, message: '请输入手机号' }, 400);
    }

    // 创建验证码
    const result = await createVerificationCode(phone);

    if (!result.success) {
      return c.json(
        { success: false, message: result.message, retryAfterSeconds: result.retryAfterSeconds },
        429
      );
    }

    // 获取生成的验证码
    const code = await getLatestCode(phone);

    if (!code) {
      return c.json({ success: false, message: '验证码生成失败' }, 500);
    }

    // 发送短信（开发环境可以跳过）
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SMS === 'true') {
      try {
        const smsProvider = createSmsProvider();
        const sent = await smsProvider.sendVerificationCode(phone, code);

        if (!sent) {
          return c.json({ success: false, message: '短信发送失败，请稍后重试' }, 500);
        }
      } catch (error) {
        console.error('SMS send error:', error);
        return c.json({ success: false, message: '短信服务异常，请稍后重试' }, 500);
      }
    } else {
      // 开发环境：在控制台输出验证码
      console.log(`[DEV] Verification code for ${phone}: ${code}`);
    }

    return c.json({
      success: true,
      message: '验证码已发送',
      // 开发环境返回验证码方便测试
      ...(process.env.NODE_ENV !== 'production' && { code }),
    });
  } catch (error) {
    console.error('Send code error:', error);
    return c.json({ success: false, message: '服务器错误，请稍后重试' }, 500);
  }
});

/**
 * 验证验证码
 * POST /api/auth/verify
 */
authRoutes.post('/verify', async (c) => {
  try {
    const body = await c.req.json();
    const { phone, code } = body;

    // 验证必填参数
    if (!phone) {
      return c.json({ success: false, message: '请输入手机号' }, 400);
    }

    if (!code) {
      return c.json({ success: false, message: '请输入验证码' }, 400);
    }

    // 验证手机号格式
    if (!validatePhoneFormat(phone)) {
      return c.json({ success: false, message: '手机号格式不正确' }, 400);
    }

    // 验证验证码
    const result = await verifyCode(phone, code);

    if (!result.success) {
      // 根据不同错误类型返回不同状态码
      let statusCode: 401 | 403 = 401;

      if (result.lockedUntil) {
        statusCode = 403;
      } else if (result.remainingAttempts !== undefined && result.remainingAttempts <= 0) {
        statusCode = 403;
      }

      return c.json(
        {
          success: false,
          message: result.message,
          remainingAttempts: result.remainingAttempts,
          lockedUntil: result.lockedUntil,
        },
        statusCode
      );
    }

    return c.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Verify code error:', error);
    return c.json({ success: false, message: '验证失败，请稍后重试' }, 500);
  }
});

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
authRoutes.get('/me', authRequired, async (c) => {
  try {
    const user = getCurrentUser(c);
    
    if (!user) {
      return c.json({ success: false, message: '未登录' }, 401);
    }

    // 获取完整用户信息
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { pointsAccount: true },
    });

    if (!fullUser) {
      return c.json({ success: false, message: '用户不存在' }, 404);
    }

    return c.json({
      success: true,
      user: {
        id: fullUser.id,
        phone: fullUser.phone,
        username: fullUser.username,
        pointsBalance: fullUser.pointsAccount?.balance ?? 0,
        createdAt: fullUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Get user info error:', error);
    return c.json({ success: false, message: '获取用户信息失败' }, 500);
  }
});
