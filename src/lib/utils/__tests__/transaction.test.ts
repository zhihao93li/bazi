/**
 * 数据库事务封装工具测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  executeTransaction,
  executeTransactionOrThrow,
  executeBatchTransaction,
  createTransactionContext,
  transactional,
  TransactionError,
  TransactionErrorCode,
  TransactionClient,
} from '../transaction.js';

// Mock prisma
vi.mock('../../prisma.js', () => ({
  default: {
    $transaction: vi.fn(),
  },
}));

import prisma from '../../prisma.js';

describe('transaction utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeTransaction', () => {
    it('should execute transaction successfully', async () => {
      const mockResult = { id: '1', name: 'test' };
      vi.mocked(prisma.$transaction).mockResolvedValueOnce(mockResult);

      const result = await executeTransaction(async () => {
        return mockResult;
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(result.retryCount).toBe(0);
    });

    it('should return error result on failure', async () => {
      vi.mocked(prisma.$transaction).mockRejectedValueOnce(new Error('Database error'));

      const result = await executeTransaction(async () => {
        throw new Error('Database error');
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('should pass options to prisma transaction', async () => {
      vi.mocked(prisma.$transaction).mockResolvedValueOnce({});

      await executeTransaction(async () => ({}), {
        timeout: 10000,
        isolationLevel: 'Serializable',
      });

      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          timeout: 10000,
          isolationLevel: 'Serializable',
        })
      );
    });
  });

  describe('executeTransactionOrThrow', () => {
    it('should return data on success', async () => {
      const mockResult = { id: '1' };
      vi.mocked(prisma.$transaction).mockResolvedValueOnce(mockResult);

      const result = await executeTransactionOrThrow(async () => mockResult);

      expect(result).toEqual(mockResult);
    });

    it('should throw TransactionError on failure', async () => {
      vi.mocked(prisma.$transaction).mockRejectedValueOnce(new Error('Failed'));

      await expect(
        executeTransactionOrThrow(async () => {
          throw new Error('Failed');
        })
      ).rejects.toThrow(TransactionError);
    });
  });

  describe('executeBatchTransaction', () => {
    it('should execute all operations in batch', async () => {
      const results = [{ id: '1' }, { id: '2' }];
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn) => {
        const mockTx = {} as TransactionClient;
        return fn(mockTx);
      });

      const operations = [
        async () => results[0],
        async () => results[1],
      ];

      const result = await executeBatchTransaction(operations);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(results);
    });
  });

  describe('createTransactionContext', () => {
    it('should create context with execute method', async () => {
      const mockResult = { id: '1' };
      vi.mocked(prisma.$transaction).mockResolvedValueOnce(mockResult);

      const ctx = createTransactionContext();
      const result = await ctx.execute(async () => mockResult);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
    });

    it('should create context with executeOrThrow method', async () => {
      const mockResult = { id: '1' };
      vi.mocked(prisma.$transaction).mockResolvedValueOnce(mockResult);

      const ctx = createTransactionContext();
      const result = await ctx.executeOrThrow(async () => mockResult);

      expect(result).toEqual(mockResult);
    });

    it('should use provided options', async () => {
      vi.mocked(prisma.$transaction).mockResolvedValueOnce({});

      const ctx = createTransactionContext({ timeout: 15000 });
      await ctx.execute(async () => ({}));

      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ timeout: 15000 })
      );
    });
  });

  describe('transactional decorator', () => {
    it('should wrap function with transaction', async () => {
      const mockResult = { id: '1' };
      vi.mocked(prisma.$transaction).mockResolvedValueOnce(mockResult);

      const withTx = transactional();
      const wrappedFn = withTx(async (tx, data: { name: string }) => {
        return { ...mockResult, ...data };
      });

      const result = await wrappedFn({ name: 'test' });

      expect(result).toEqual(mockResult);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw on failure', async () => {
      vi.mocked(prisma.$transaction).mockRejectedValueOnce(new Error('Failed'));

      const withTx = transactional();
      const wrappedFn = withTx(async () => {
        throw new Error('Failed');
      });

      await expect(wrappedFn()).rejects.toThrow(TransactionError);
    });
  });

  describe('TransactionError', () => {
    it('should have correct properties', () => {
      const cause = new Error('Original error');
      const error = new TransactionError(
        'Transaction failed',
        TransactionErrorCode.EXECUTION_FAILED,
        cause
      );

      expect(error.message).toBe('Transaction failed');
      expect(error.code).toBe(TransactionErrorCode.EXECUTION_FAILED);
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('TransactionError');
    });
  });
});
