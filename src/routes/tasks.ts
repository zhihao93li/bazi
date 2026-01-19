/**
 * 任务 API 路由
 *
 * GET /api/tasks/:id - 查询任务状态
 */

import { Hono } from 'hono';
import { authRequired, requireUserId } from '../middleware/auth.js';
import { getTask } from '../lib/tasks/index.js';

export const tasksRoutes = new Hono();

/**
 * 查询任务状态
 * GET /api/tasks/:id
 */
tasksRoutes.get('/:id', authRequired, async (c) => {
    const userId = requireUserId(c);
    const taskId = c.req.param('id');

    const task = await getTask(taskId);

    if (!task) {
        return c.json({ success: false, message: '任务不存在' }, 404);
    }

    // 验证任务所属用户
    if ('payload' in task && task.payload && typeof task.payload === 'object' && 'userId' in task.payload) {
        if (task.payload.userId !== userId) {
            return c.json({ success: false, message: '无权访问该任务' }, 403);
        }
    }

    // 返回任务状态
    const response: {
        success: boolean;
        taskId: string;
        status: string;
        content?: string;
        error?: string;
    } = {
        success: true,
        taskId: task.id,
        status: task.status,
    };

    if (task.status === 'completed' && task.result) {
        response.content = task.result;
    }

    if (task.status === 'failed' && task.error) {
        response.error = task.error;
    }

    return c.json(response);
});
