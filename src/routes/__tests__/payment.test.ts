/**
 * 支付路由测试
 * 
 * 包含属性测试和单元测试
 * 
 * Property 5: 支付回调幂等性
 * **Validates: Requirement 3.6**
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import { generateSign } from '../../lib/payment/mazfu.js';

// Store original env values
const originalEnv = { ...process.env };

// Set up environment variables before importing routes
beforeAll(() => {
  process.env.MAZFU_PID = 'test_pid';
  process.env.MAZFU_KEY = 'test_key_12345678';
  process.env.MAZFU_NOTIFY_URL = 'https://example.com/notify';
  process.env.MAZFU_RETURN_URL = 'https://example.com/return';
  process.env.FRONTEND_URL = 'http://localhost:5173';
});

afterAll(() => {
  // Restore original env
  process.env = originalEnv;
});

// Mock prisma
vi.mock('../../lib/prisma.js', () => ({
  default: {
    paymentOrder: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    pointsAccount: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    pointsTransaction: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock points service
vi.mock('../../lib/points/service.js', () => ({
  addPoints: vi.fn().mockResolvedValue({
    success: true,
    message: '积分增加成功',
    balance: 100,
    transactionId: 'tx_123',
  }),
}));

describe('payment routes', () => {
  let app: Hono;
  let paymentRoutes: Hono;
  let prisma: typeof import('../../lib/prisma.js').default;

  beforeEach(async () => {
    // Dynamically import after env is set
    const routeModule = await import('../payment.js');
    paymentRoutes = routeModule.paymentRoutes;
    
    const prismaModule = await import('../../lib/prisma.js');
    prisma = prismaModule.default;
    
    app = new Hono();
    app.route('/api/payment', paymentRoutes);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  /**
   * Property 5: 支付回调幂等性
   * 
   * For any order number, sending the same successful payment callback multiple times,
   * user points SHALL only increase once.
   * 
   * **Validates: Requirement 3.6**
   */
  describe('Property 5: 支付回调幂等性', () => {
    it('should only process payment once for duplicate callbacks', async () => {
      const { addPoints } = await import('../../lib/points/service.js');
      const mockedAddPoints = vi.mocked(addPoints);

      // Test with multiple different order scenarios
      const testCases = [
        { orderNo: 'BZ20260116001', userId: 'user_001', points: 100, amount: 1000, callbackCount: 2 },
        { orderNo: 'BZ20260116002', userId: 'user_002', points: 500, amount: 5000, callbackCount: 3 },
        { orderNo: 'BZ20260116003', userId: 'user_003', points: 1000, amount: 10000, callbackCount: 4 },
      ];

      for (const orderData of testCases) {
        // Reset mocks for each test case
        vi.clearAllMocks();

        const key = 'test_key_12345678';
        
        // Setup: First call returns pending order, subsequent calls return paid order
        let callCount = 0;
        vi.mocked(prisma.paymentOrder.findUnique).mockImplementation(async () => {
          callCount++;
          if (callCount === 1) {
            // First callback: order is pending
            return {
              id: 'order_id_123',
              userId: orderData.userId,
              orderNo: orderData.orderNo,
              amount: orderData.amount,
              points: orderData.points,
              paymentMethod: 'alipay_qrcode',
              status: 'pending',
              transactionId: null,
              stripeSessionId: null,
              createdAt: new Date(),
              paidAt: null,
            };
          } else {
            // Subsequent callbacks: order is already paid (idempotent)
            return {
              id: 'order_id_123',
              userId: orderData.userId,
              orderNo: orderData.orderNo,
              amount: orderData.amount,
              points: orderData.points,
              paymentMethod: 'alipay_qrcode',
              status: 'paid',
              transactionId: 'trade_123',
              stripeSessionId: null,
              createdAt: new Date(),
              paidAt: new Date(),
            };
          }
        });

        vi.mocked(prisma.paymentOrder.update).mockResolvedValue({
          id: 'order_id_123',
          userId: orderData.userId,
          orderNo: orderData.orderNo,
          amount: orderData.amount,
          points: orderData.points,
          paymentMethod: 'alipay_qrcode',
          status: 'paid',
          transactionId: 'trade_123',
          stripeSessionId: null,
          createdAt: new Date(),
          paidAt: new Date(),
        });

        // Generate valid callback params
        const params: Record<string, string> = {
          pid: 'test_pid',
          trade_no: 'trade_123',
          out_trade_no: orderData.orderNo,
          type: 'alipay',
          name: 'Test Package',
          money: (orderData.amount / 100).toFixed(2),
          trade_status: 'TRADE_SUCCESS',
        };
        const sign = generateSign(params, key);

        // Send multiple callbacks
        for (let i = 0; i < orderData.callbackCount; i++) {
          const formBody = new URLSearchParams({
            ...params,
            sign,
            sign_type: 'MD5',
          }).toString();

          const res = await app.request('/api/payment/mazfu-notify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formBody,
          });

          // All callbacks should return success
          expect(res.status).toBe(200);
          const text = await res.text();
          expect(text).toBe('success');
        }

        // Points should only be added once (first callback)
        expect(mockedAddPoints).toHaveBeenCalledTimes(1);
        expect(mockedAddPoints).toHaveBeenCalledWith({
          userId: orderData.userId,
          amount: orderData.points,
          type: 'recharge',
          description: expect.stringContaining(orderData.orderNo),
          orderId: 'order_id_123',
        });
      }
    });

    it('should return success for already paid orders without adding points', async () => {
      const { addPoints } = await import('../../lib/points/service.js');
      const mockedAddPoints = vi.mocked(addPoints);

      const key = 'test_key_12345678';
      const orderNo = 'BZ20260116123456789';

      // Order is already paid
      vi.mocked(prisma.paymentOrder.findUnique).mockResolvedValue({
        id: 'order_id_123',
        userId: 'user_123',
        orderNo,
        amount: 1000,
        points: 100,
        paymentMethod: 'alipay_qrcode',
        status: 'paid',
        transactionId: 'trade_123',
        stripeSessionId: null,
        createdAt: new Date(),
        paidAt: new Date(),
      });

      // Generate valid callback params
      const params: Record<string, string> = {
        pid: 'test_pid',
        trade_no: 'trade_123',
        out_trade_no: orderNo,
        type: 'alipay',
        name: 'Test Package',
        money: '10.00',
        trade_status: 'TRADE_SUCCESS',
      };
      const sign = generateSign(params, key);

      const formBody = new URLSearchParams({
        ...params,
        sign,
        sign_type: 'MD5',
      }).toString();

      const res = await app.request('/api/payment/mazfu-notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody,
      });

      expect(res.status).toBe(200);
      expect(await res.text()).toBe('success');
      
      // Points should NOT be added for already paid order
      expect(mockedAddPoints).not.toHaveBeenCalled();
      
      // Order should NOT be updated
      expect(prisma.paymentOrder.update).not.toHaveBeenCalled();
    });
  });

  describe('mazfu-notify route', () => {
    it('should reject invalid signature', async () => {
      const orderNo = 'BZ20260116123456789';

      const formBody = new URLSearchParams({
        pid: 'test_pid',
        trade_no: 'trade_123',
        out_trade_no: orderNo,
        type: 'alipay',
        name: 'Test Package',
        money: '10.00',
        trade_status: 'TRADE_SUCCESS',
        sign: 'invalid_signature',
        sign_type: 'MD5',
      }).toString();

      const res = await app.request('/api/payment/mazfu-notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody,
      });

      expect(res.status).toBe(403);
      expect(await res.text()).toBe('fail');
    });

    it('should return success for non-success trade status', async () => {
      const key = 'test_key_12345678';
      const orderNo = 'BZ20260116123456789';

      const params: Record<string, string> = {
        pid: 'test_pid',
        trade_no: 'trade_123',
        out_trade_no: orderNo,
        type: 'alipay',
        name: 'Test Package',
        money: '10.00',
        trade_status: 'TRADE_CLOSED',
      };
      const sign = generateSign(params, key);

      const formBody = new URLSearchParams({
        ...params,
        sign,
        sign_type: 'MD5',
      }).toString();

      const res = await app.request('/api/payment/mazfu-notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody,
      });

      expect(res.status).toBe(200);
      expect(await res.text()).toBe('success');
      
      // Should not query order for non-success status
      expect(prisma.paymentOrder.findUnique).not.toHaveBeenCalled();
    });

    it('should return fail for non-existent order', async () => {
      const key = 'test_key_12345678';
      const orderNo = 'BZ20260116123456789';

      vi.mocked(prisma.paymentOrder.findUnique).mockResolvedValue(null);

      const params: Record<string, string> = {
        pid: 'test_pid',
        trade_no: 'trade_123',
        out_trade_no: orderNo,
        type: 'alipay',
        name: 'Test Package',
        money: '10.00',
        trade_status: 'TRADE_SUCCESS',
      };
      const sign = generateSign(params, key);

      const formBody = new URLSearchParams({
        ...params,
        sign,
        sign_type: 'MD5',
      }).toString();

      const res = await app.request('/api/payment/mazfu-notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody,
      });

      expect(res.status).toBe(404);
      expect(await res.text()).toBe('fail');
    });
  });
});
