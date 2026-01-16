/**
 * 码支付服务测试
 * 
 * 包含属性测试和单元测试
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  generateSign,
  verifySign,
  MazfuNotifyParams,
} from '../mazfu.js';

describe('mazfu', () => {
  describe('generateSign', () => {
    it('should generate consistent sign for same params', () => {
      const params = {
        pid: '1001',
        type: 'alipay',
        out_trade_no: '20160806151343349',
        name: 'VIP',
        money: '1.00',
      };
      const key = 'test_key_123';

      const sign1 = generateSign(params, key);
      const sign2 = generateSign(params, key);

      expect(sign1).toBe(sign2);
    });

    it('should exclude sign and sign_type from calculation', () => {
      const params1 = {
        pid: '1001',
        type: 'alipay',
        name: 'VIP',
      };
      const params2 = {
        pid: '1001',
        type: 'alipay',
        name: 'VIP',
        sign: 'should_be_ignored',
        sign_type: 'MD5',
      };
      const key = 'test_key';

      expect(generateSign(params1, key)).toBe(generateSign(params2, key));
    });

    it('should exclude empty values from calculation', () => {
      const params1 = {
        pid: '1001',
        type: 'alipay',
      };
      const params2 = {
        pid: '1001',
        type: 'alipay',
        name: '',
      };
      const key = 'test_key';

      expect(generateSign(params1, key)).toBe(generateSign(params2, key));
    });

    it('should sort params by ASCII order', () => {
      const params1 = {
        a: '1',
        b: '2',
        c: '3',
      };
      const params2 = {
        c: '3',
        a: '1',
        b: '2',
      };
      const key = 'test_key';

      expect(generateSign(params1, key)).toBe(generateSign(params2, key));
    });

    it('should return lowercase MD5 hash', () => {
      const params = { pid: '1001' };
      const key = 'key';
      const sign = generateSign(params, key);

      expect(sign).toMatch(/^[0-9a-f]{32}$/);
    });
  });

  describe('verifySign', () => {
    it('should return true for valid signature', () => {
      const key = 'test_key_123';
      const params: Record<string, string> = {
        pid: '1001',
        trade_no: '20160806151343349021',
        out_trade_no: '20160806151343349',
        type: 'alipay',
        name: 'VIP',
        money: '1.00',
        trade_status: 'TRADE_SUCCESS',
      };

      const sign = generateSign(params, key);
      const notifyParams: MazfuNotifyParams = {
        pid: params.pid,
        trade_no: params.trade_no,
        out_trade_no: params.out_trade_no,
        type: params.type,
        name: params.name,
        money: params.money,
        trade_status: params.trade_status,
        sign,
        sign_type: 'MD5',
      };

      expect(verifySign(notifyParams, key)).toBe(true);
    });

    it('should return false for invalid signature', () => {
      const key = 'test_key_123';
      const notifyParams: MazfuNotifyParams = {
        pid: '1001',
        trade_no: '20160806151343349021',
        out_trade_no: '20160806151343349',
        type: 'alipay',
        name: 'VIP',
        money: '1.00',
        trade_status: 'TRADE_SUCCESS',
        sign: 'invalid_signature',
        sign_type: 'MD5',
      };

      expect(verifySign(notifyParams, key)).toBe(false);
    });
  });

  /**
   * Property 1: 签名生成往返验证
   * 
   * For any valid parameter set and merchant key, generating a signature
   * and then verifying it with the same parameters and key SHALL return true.
   * 
   * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
   */
  describe('Property 1: 签名生成往返验证', () => {
    it('should verify signature generated from same params', () => {
      // Arbitrary for generating alphanumeric strings
      const alphanumeric = fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9]+$/.test(s) && s.length > 0);
      const numericString = fc.nat({ max: 9999999999 }).map(n => String(n).padStart(10, '0'));

      fc.assert(
        fc.property(
          // Generate random params that simulate real payment callback params
          fc.record({
            pid: numericString,
            trade_no: numericString,
            out_trade_no: alphanumeric,
            type: fc.constantFrom('alipay', 'wxpay'),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            money: fc.integer({ min: 1, max: 1000000 }).map(n => (n / 100).toFixed(2)),
            trade_status: fc.constantFrom('TRADE_SUCCESS', 'TRADE_CLOSED'),
          }),
          fc.string({ minLength: 8, maxLength: 64 }), // key
          (params, key) => {
            // Generate signature
            const sign = generateSign(params as Record<string, string>, key);

            // Create notify params with the generated signature
            const notifyParams: MazfuNotifyParams = {
              pid: params.pid,
              trade_no: params.trade_no,
              out_trade_no: params.out_trade_no,
              type: params.type,
              name: params.name,
              money: params.money,
              trade_status: params.trade_status,
              sign,
              sign_type: 'MD5',
            };

            // Verify should return true
            return verifySign(notifyParams, key) === true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


  /**
   * Property 4: 签名验证安全性
   * 
   * For any callback notification, if the signature does not match the parameters,
   * the system SHALL reject processing and return an error response.
   * 
   * **Validates: Requirements 3.1, 3.2**
   */
  describe('Property 4: 签名验证安全性', () => {
    it('should reject tampered parameters', () => {
      // Arbitrary for generating alphanumeric strings
      const alphanumeric = fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9]+$/.test(s) && s.length > 0);
      const numericString = fc.nat({ max: 9999999999 }).map(n => String(n).padStart(10, '0'));

      fc.assert(
        fc.property(
          // Generate random params that simulate real payment callback params
          fc.record({
            pid: numericString,
            trade_no: numericString,
            out_trade_no: alphanumeric,
            type: fc.constantFrom('alipay', 'wxpay'),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            money: fc.integer({ min: 1, max: 1000000 }).map(n => (n / 100).toFixed(2)),
            trade_status: fc.constantFrom('TRADE_SUCCESS', 'TRADE_CLOSED'),
          }),
          fc.string({ minLength: 8, maxLength: 64 }), // key
          fc.constantFrom('pid', 'trade_no', 'out_trade_no', 'type', 'name', 'money', 'trade_status'), // field to tamper
          fc.string({ minLength: 1, maxLength: 20 }), // tampered value
          (params, key, fieldToTamper, tamperedValue) => {
            // Generate valid signature
            const sign = generateSign(params as Record<string, string>, key);

            // Create notify params with the generated signature
            const notifyParams: MazfuNotifyParams = {
              pid: params.pid,
              trade_no: params.trade_no,
              out_trade_no: params.out_trade_no,
              type: params.type,
              name: params.name,
              money: params.money,
              trade_status: params.trade_status,
              sign,
              sign_type: 'MD5',
            };

            // Tamper with a field (only if the new value is different)
            const originalValue = notifyParams[fieldToTamper as keyof MazfuNotifyParams];
            if (tamperedValue === originalValue) {
              // Skip if tampered value is the same as original
              return true;
            }

            // Create tampered params
            const tamperedParams: MazfuNotifyParams = {
              ...notifyParams,
              [fieldToTamper]: tamperedValue,
            };

            // Verify should return false for tampered params
            return verifySign(tamperedParams, key) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject wrong key', () => {
      const alphanumeric = fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9]+$/.test(s) && s.length > 0);
      const numericString = fc.nat({ max: 9999999999 }).map(n => String(n).padStart(10, '0'));

      fc.assert(
        fc.property(
          fc.record({
            pid: numericString,
            trade_no: numericString,
            out_trade_no: alphanumeric,
            type: fc.constantFrom('alipay', 'wxpay'),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            money: fc.integer({ min: 1, max: 1000000 }).map(n => (n / 100).toFixed(2)),
            trade_status: fc.constantFrom('TRADE_SUCCESS', 'TRADE_CLOSED'),
          }),
          fc.string({ minLength: 8, maxLength: 64 }), // original key
          fc.string({ minLength: 8, maxLength: 64 }), // wrong key
          (params, originalKey, wrongKey) => {
            // Skip if keys are the same
            if (originalKey === wrongKey) {
              return true;
            }

            // Generate signature with original key
            const sign = generateSign(params as Record<string, string>, originalKey);

            // Create notify params
            const notifyParams: MazfuNotifyParams = {
              pid: params.pid,
              trade_no: params.trade_no,
              out_trade_no: params.out_trade_no,
              type: params.type,
              name: params.name,
              money: params.money,
              trade_status: params.trade_status,
              sign,
              sign_type: 'MD5',
            };

            // Verify with wrong key should return false
            return verifySign(notifyParams, wrongKey) === false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
