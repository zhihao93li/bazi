/**
 * 积分查询 API
 * GET /api/points
 * 
 * Requirements: 4.2
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTransactions } from "@/lib/points/service";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 }
      );
    }

    const result = await getTransactions(session.user.id, 1, 50);

    return NextResponse.json({
      success: true,
      balance: result.balance,
      transactions: result.transactions,
      total: result.total,
    });
  } catch (error) {
    console.error("Points query error:", error);
    return NextResponse.json(
      { success: false, message: "查询失败" },
      { status: 500 }
    );
  }
}
