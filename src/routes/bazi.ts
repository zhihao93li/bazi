/**
 * 八字排盘 API 路由
 *
 * POST /calculate - 计算八字排盘
 * GET /leap-month/:year - 获取指定年份的闰月信息
 * GET /coordinates - 获取地点的经纬度
 */

import { Hono } from 'hono';
import { LunarYear } from 'lunar-typescript';
import { calculateBazi } from '../lib/bazi/index.js';
import { getCoordinates } from '../lib/bazi/geo-utils.js';
import type { BaziBirthData } from '../lib/bazi/types.js';

export const baziRoutes = new Hono();

/**
 * 获取指定年份的闰月信息
 * GET /api/bazi/leap-month/:year
 * 返回闰月月份（1-12），如果没有闰月则返回 0
 */
baziRoutes.get('/leap-month/:year', (c) => {
  try {
    const yearStr = c.req.param('year');
    const year = parseInt(yearStr, 10);

    if (isNaN(year) || year < 1900 || year > 2100) {
      return c.json({ success: false, message: '年份无效（1900-2100）' }, 400);
    }

    const lunarYear = LunarYear.fromYear(year);
    const leapMonth = lunarYear.getLeapMonth(); // 返回闰几月，没有闰月则返回 0

    return c.json({
      success: true,
      year,
      leapMonth,
    });
  } catch (error) {
    console.error('Get leap month error:', error);
    return c.json({ success: false, message: '获取闰月信息失败' }, 500);
  }
});

/**
 * 获取地点的经纬度
 * GET /api/bazi/coordinates?location=省/市/区
 */
baziRoutes.get('/coordinates', (c) => {
  try {
    const location = c.req.query('location');

    if (!location) {
      return c.json({ success: false, message: '请提供地点信息' }, 400);
    }

    const coordinates = getCoordinates(location);

    return c.json({
      success: true,
      coordinates,
    });
  } catch (error) {
    console.error('Get coordinates error:', error);
    return c.json({ success: false, message: '获取经纬度失败' }, 500);
  }
});

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

    // Validate leap month if lunar calendar
    if (calendarType === 'lunar' && isLeapMonth) {
      const lunarYear = LunarYear.fromYear(year);
      const actualLeapMonth = lunarYear.getLeapMonth();
      if (actualLeapMonth !== month) {
        const errorMsg = actualLeapMonth === 0
          ? `${year}年没有闰月`
          : `${year}年的闰月是闰${actualLeapMonth}月，不是闰${month}月`;
        return c.json({ success: false, message: errorMsg }, 400);
      }
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
