/**
 * 八字排盘 API 路由
 * 
 * POST /calculate - 计算八字排盘
 */

import { Hono } from 'hono';
import { calculateBazi } from '../lib/bazi/index.js';
import type { BaziBirthData } from '../lib/bazi/types.js';

export const baziRoutes = new Hono();

/**
 * 八字排盘计算
 * POST /api/bazi/calculate
 */
baziRoutes.post('/calculate', async (c) => {
  try {
    const body = await c.req.json();
    const {
      year, month, day, hour, minute,
      calendarType, gender, location, isLeapMonth
    } = body as BaziBirthData;

    // Validate required fields
    if (!year || !month || !day || hour === undefined || minute === undefined || !gender || !location) {
      return c.json(
        { success: false, message: '请填写完整的出生信息，包括出生城市' },
        400
      );
    }

    // Validate year range
    if (year < 1900 || year > new Date().getFullYear()) {
      return c.json(
        { success: false, message: '年份超出支持范围（1900-今年）' },
        400
      );
    }

    // Validate month
    if (month < 1 || month > 12) {
      return c.json({ success: false, message: '月份无效' }, 400);
    }

    // Validate day
    if (day < 1 || day > 31) {
      return c.json({ success: false, message: '日期无效' }, 400);
    }

    // Validate hour
    if (hour < 0 || hour > 23) {
      return c.json({ success: false, message: '小时无效（0-23）' }, 400);
    }

    // Validate minute
    if (minute < 0 || minute > 59) {
      return c.json({ success: false, message: '分钟无效（0-59）' }, 400);
    }

    // Validate gender
    if (gender !== 'male' && gender !== 'female') {
      return c.json({ success: false, message: '性别无效' }, 400);
    }

    // Calculate Bazi with true solar time correction
    const birthData: BaziBirthData = {
      year,
      month,
      day,
      hour,
      minute,
      calendarType: calendarType || 'solar',
      gender,
      location,
      isLeapMonth,
    };

    const baziData = calculateBazi(birthData);

    return c.json({
      success: true,
      baziData,
    });
  } catch (error) {
    console.error('Bazi calculation error:', error);
    return c.json(
      { success: false, message: '排盘计算失败，请检查输入信息' },
      500
    );
  }
});
