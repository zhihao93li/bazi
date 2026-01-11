/**
 * 积分相关 API 路由
 * 
 * GET / - 获取积分余额和交易记录
 * GET /packages - 获取积分充值套餐
 */

import { Hono } from 'hono';
import { authRequired, getCurrentUserId } from '../middleware/auth.js';
import { getTransactions } from '../lib/points/service.js';
import { getActivePackages } from '../lib/payment/service.js';

export const pointsRoutes = new Hono();

/**
 * 获取积分余额和交易记录
 * GET /api/points
 */
pointsRoutes.get('/', authRequired, async (c) => {
  try {
    const userId = getCurrentUserId(c);
    if (!userId) {
      return c.json({ success: false, message: '请先登录' }, 401);
    }

    const result = await getTransactions(userId, 1, 50);

    return c.json({
      success: true,
      balance: result.balance,
      transactions: result.transactions,
      total: result.total,
    });
  } catch (error) {
    console.error('Points query error:', error);
    return c.json({ success: false, message: '查询失败' }, 500);
  }
});

/**
 * 获取积分充值套餐
 * GET /api/points/packages
 */
pointsRoutes.get('/packages', async (c) => {
  try {
    const packages = await getActivePackages();

    return c.json({
      success: true,
      packages,
    });
  } catch (error) {
    console.error('Packages query error:', error);
    return c.json({ success: false, message: '查询失败' }, 500);
  }
});
