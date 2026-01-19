/**
 * 管理后台路由聚合
 */

import { Hono } from 'hono';
import { adminAuthRoutes } from './auth.js';
import { adminDashboardRoutes } from './dashboard.js';
import { adminUsersRoutes } from './users.js';
import { adminSubjectsRoutes } from './subjects.js';
import { adminTasksRoutes } from './tasks.js';
import { adminThemeAnalysesRoutes } from './theme-analyses.js';
import { adminPaymentOrdersRoutes } from './payment-orders.js';
import { adminPointsTransactionsRoutes } from './points-transactions.js';

const app = new Hono();

// 注册子路由
app.route('/auth', adminAuthRoutes);
app.route('/dashboard', adminDashboardRoutes);
app.route('/users', adminUsersRoutes);
app.route('/subjects', adminSubjectsRoutes);
app.route('/tasks', adminTasksRoutes);
app.route('/theme-analyses', adminThemeAnalysesRoutes);
app.route('/payment-orders', adminPaymentOrdersRoutes);
app.route('/points-transactions', adminPointsTransactionsRoutes);

export const adminRoutes = app;
