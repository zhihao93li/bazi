/**
 * 积分服务
 * 
 * 功能：
 * - 余额查询
 * - 积分明细查询
 * - 积分充值、消费、赠送
 * - 余额不足检查
 * - 使用数据库事务确保原子性
 */

import prisma from "@/lib/prisma";
import {
  PointsAccountInfo,
  PointsQueryResult,
  PointsOperationResult,
  PointsChangeParams,
  PointsTransactionType,
  PointsError,
  PointsErrorCode,
} from "./types";

/**
 * 获取或创建用户积分账户
 */
export async function getOrCreatePointsAccount(userId: string): Promise<PointsAccountInfo> {
  // 先尝试获取现有账户
  let account = await prisma.pointsAccount.findUnique({
    where: { userId },
  });

  // 如果不存在，创建新账户
  if (!account) {
    account = await prisma.pointsAccount.create({
      data: {
        userId,
        balance: 0,
      },
    });
  }

  return {
    id: account.id,
    userId: account.userId,
    balance: account.balance,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

/**
 * 获取用户积分余额
 */
export async function getBalance(userId: string): Promise<number> {
  const account = await getOrCreatePointsAccount(userId);
  return account.balance;
}

/**
 * 获取用户积分明细（分页）
 */
export async function getTransactions(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<PointsQueryResult> {
  const skip = (page - 1) * limit;

  // 获取余额
  const balance = await getBalance(userId);

  // 获取交易记录总数
  const total = await prisma.pointsTransaction.count({
    where: { userId },
  });

  // 获取交易记录（按时间倒序）
  const transactions = await prisma.pointsTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  return {
    balance,
    transactions: transactions.map((t) => ({
      id: t.id,
      userId: t.userId,
      type: t.type as PointsTransactionType,
      amount: t.amount,
      balance: t.balance,
      description: t.description,
      orderId: t.orderId,
      createdAt: t.createdAt,
    })),
    total,
    page,
    limit,
  };
}

/**
 * 检查余额是否足够
 */
export async function checkSufficientBalance(
  userId: string,
  requiredAmount: number
): Promise<{ sufficient: boolean; currentBalance: number }> {
  const balance = await getBalance(userId);
  return {
    sufficient: balance >= requiredAmount,
    currentBalance: balance,
  };
}

/**
 * 增加积分（充值或赠送）
 * 使用数据库事务确保原子性
 */
export async function addPoints(params: PointsChangeParams): Promise<PointsOperationResult> {
  const { userId, amount, type, description, orderId } = params;

  // 验证金额
  if (amount <= 0) {
    throw new PointsError(
      PointsErrorCode.INVALID_AMOUNT,
      "积分数量必须大于0"
    );
  }

  // 验证类型（只允许 recharge 和 gift）
  if (type !== "recharge" && type !== "gift") {
    throw new PointsError(
      PointsErrorCode.OPERATION_FAILED,
      "增加积分只支持充值(recharge)和赠送(gift)类型"
    );
  }

  try {
    // 使用事务确保原子性
    const result = await prisma.$transaction(async (tx) => {
      // 获取或创建账户
      let account = await tx.pointsAccount.findUnique({
        where: { userId },
      });

      if (!account) {
        account = await tx.pointsAccount.create({
          data: {
            userId,
            balance: 0,
          },
        });
      }

      // 计算新余额
      const newBalance = account.balance + amount;

      // 更新账户余额
      const updatedAccount = await tx.pointsAccount.update({
        where: { userId },
        data: { balance: newBalance },
      });

      // 创建交易记录
      const transaction = await tx.pointsTransaction.create({
        data: {
          userId,
          type,
          amount,
          balance: newBalance,
          description,
          orderId,
        },
      });

      return {
        balance: updatedAccount.balance,
        transactionId: transaction.id,
      };
    });

    return {
      success: true,
      message: "积分增加成功",
      balance: result.balance,
      transactionId: result.transactionId,
    };
  } catch (error) {
    if (error instanceof PointsError) {
      throw error;
    }
    throw new PointsError(
      PointsErrorCode.OPERATION_FAILED,
      `积分操作失败: ${error instanceof Error ? error.message : "未知错误"}`
    );
  }
}

/**
 * 扣除积分（消费）
 * 使用数据库事务确保原子性，并检查余额
 */
export async function deductPoints(params: Omit<PointsChangeParams, 'type'>): Promise<PointsOperationResult> {
  const { userId, amount, description, orderId } = params;

  // 验证金额
  if (amount <= 0) {
    throw new PointsError(
      PointsErrorCode.INVALID_AMOUNT,
      "扣除积分数量必须大于0"
    );
  }

  try {
    // 使用事务确保原子性
    const result = await prisma.$transaction(async (tx) => {
      // 获取账户
      const account = await tx.pointsAccount.findUnique({
        where: { userId },
      });

      if (!account) {
        throw new PointsError(
          PointsErrorCode.USER_NOT_FOUND,
          "用户积分账户不存在"
        );
      }

      // 检查余额是否足够
      if (account.balance < amount) {
        throw new PointsError(
          PointsErrorCode.INSUFFICIENT_BALANCE,
          `积分余额不足，当前余额: ${account.balance}，需要: ${amount}`
        );
      }

      // 计算新余额
      const newBalance = account.balance - amount;

      // 更新账户余额
      const updatedAccount = await tx.pointsAccount.update({
        where: { userId },
        data: { balance: newBalance },
      });

      // 创建交易记录（消费记录金额为负数）
      const transaction = await tx.pointsTransaction.create({
        data: {
          userId,
          type: "consume",
          amount: -amount,
          balance: newBalance,
          description,
          orderId,
        },
      });

      return {
        balance: updatedAccount.balance,
        transactionId: transaction.id,
      };
    });

    return {
      success: true,
      message: "积分扣除成功",
      balance: result.balance,
      transactionId: result.transactionId,
    };
  } catch (error) {
    if (error instanceof PointsError) {
      throw error;
    }
    throw new PointsError(
      PointsErrorCode.OPERATION_FAILED,
      `积分操作失败: ${error instanceof Error ? error.message : "未知错误"}`
    );
  }
}

/**
 * 赠送初始积分（用于新用户注册）
 */
export async function grantInitialPoints(userId: string): Promise<PointsOperationResult> {
  const initialPoints = parseInt(process.env.INITIAL_POINTS_GIFT || "100", 10);
  
  return addPoints({
    userId,
    amount: initialPoints,
    type: "gift",
    description: "新用户注册赠送",
  });
}
