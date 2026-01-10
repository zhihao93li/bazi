/**
 * 查询支付状态 API
 * GET /api/payment/status/[orderNo]
 * 
 * 根据订单号查询支付订单状态
 * 
 * Requirements: 5.2
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { queryOrder } from "@/lib/payment/service";

interface RouteParams {
  params: Promise<{ orderNo: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 获取当前用户会话
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "请先登录",
          },
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { orderNo } = await params;

    if (!orderNo) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_PARAMS",
            message: "订单号不能为空",
          },
        },
        { status: 400 }
      );
    }

    // 查询订单
    const result = await queryOrder(orderNo);

    if (!result.success || !result.order) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ORDER_NOT_FOUND",
            message: result.message || "订单不存在",
          },
        },
        { status: 404 }
      );
    }

    // 确保用户只能查询自己的订单
    if (result.order.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "无权查看此订单",
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        orderNo: result.order.orderNo,
        amount: result.order.amount,
        points: result.order.points,
        status: result.order.status,
        paymentMethod: result.order.paymentMethod,
        transactionId: result.order.transactionId,
        createdAt: result.order.createdAt,
        paidAt: result.order.paidAt,
      },
    });
  } catch (error) {
    console.error("Query order status error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "查询订单状态失败",
        },
      },
      { status: 500 }
    );
  }
}
