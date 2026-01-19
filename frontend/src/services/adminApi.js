/**
 * 管理后台 API 服务
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';
const ADMIN_TOKEN_KEY = 'admin_token';

export const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY);
export const setAdminToken = (token) => localStorage.setItem(ADMIN_TOKEN_KEY, token);
export const clearAdminToken = () => localStorage.removeItem(ADMIN_TOKEN_KEY);

/**
 * 自定义 API 错误类
 */
export class AdminApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = 'AdminApiError';
    this.code = code;
    this.status = status;
  }
}

/**
 * 检查是否是取消请求的错误
 * @param {Error} error
 */
export function isAbortError(error) {
  return error?.name === 'AbortError' || error?.code === 'ABORT_ERR';
}

/**
 * 管理后台通用请求函数
 * @param {string} endpoint - API 端点
 * @param {Object} options - 请求选项
 * @param {AbortSignal} options.signal - 用于取消请求的 AbortSignal
 */
export async function adminRequest(endpoint, options = {}) {
  const { signal, ...restOptions } = options;
  const token = getAdminToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...restOptions.headers,
  };

  try {
    const response = await fetch(`${API_BASE}/admin${endpoint}`, {
      ...restOptions,
      headers,
      signal,
    });

    // Handle 204 No Content
    if (response.status === 204) return null;

    const data = await response.json();

    if (!response.ok) {
      throw new AdminApiError(
        data.message || '请求失败',
        data.code,
        response.status
      );
    }
    return data;
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new AdminApiError('网络连接失败，请检查网络', 'NETWORK_ERROR', 0);
    }

    throw error;
  }
}

export const adminApi = {
  get: (url, options = {}) => adminRequest(url, options),
  post: (url, body, options = {}) => adminRequest(url, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: (url, body, options = {}) => adminRequest(url, { method: 'PUT', body: JSON.stringify(body), ...options }),
  delete: (url, options = {}) => adminRequest(url, { method: 'DELETE', ...options }),
};

// API 方法

/**
 * 管理员登录
 */
export async function adminLogin(username, password) {
  return adminApi.post('/auth/login', { username, password });
}

/**
 * 获取当前管理员信息
 */
export async function getAdminMe() {
  return adminApi.get('/auth/me');
}

/**
 * 获取仪表盘统计数据
 */
export async function getDashboardStats() {
  return adminApi.get('/dashboard/stats');
}

/**
 * 获取用户列表
 */
export async function getUsers(params = {}) {
  const query = new URLSearchParams(params).toString();
  return adminApi.get(`/users${query ? `?${query}` : ''}`);
}

/**
 * 获取用户详情
 */
export async function getUser(id) {
  return adminApi.get(`/users/${id}`);
}

/**
 * 获取命盘列表
 */
export async function getSubjects(params = {}) {
  const query = new URLSearchParams(params).toString();
  return adminApi.get(`/subjects${query ? `?${query}` : ''}`);
}

/**
 * 获取命盘详情
 */
export async function getSubject(id) {
  return adminApi.get(`/subjects/${id}`);
}

/**
 * 获取任务列表
 */
export async function getTasks(params = {}) {
  const query = new URLSearchParams(params).toString();
  return adminApi.get(`/tasks${query ? `?${query}` : ''}`);
}

/**
 * 获取任务详情
 */
export async function getTask(id) {
  return adminApi.get(`/tasks/${id}`);
}

/**
 * 获取解读列表
 */
export async function getThemeAnalyses(params = {}) {
  const query = new URLSearchParams(params).toString();
  return adminApi.get(`/theme-analyses${query ? `?${query}` : ''}`);
}

/**
 * 获取解读详情
 */
export async function getThemeAnalysis(id) {
  return adminApi.get(`/theme-analyses/${id}`);
}

/**
 * 获取充值订单列表
 */
export async function getPaymentOrders(params = {}) {
  const query = new URLSearchParams(params).toString();
  return adminApi.get(`/payment-orders${query ? `?${query}` : ''}`);
}

/**
 * 获取充值订单详情
 */
export async function getPaymentOrder(id) {
  return adminApi.get(`/payment-orders/${id}`);
}

/**
 * 获取积分交易记录列表
 */
export async function getPointsTransactions(params = {}) {
  const query = new URLSearchParams(params).toString();
  return adminApi.get(`/points-transactions${query ? `?${query}` : ''}`);
}
