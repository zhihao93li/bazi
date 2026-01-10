/**
 * 创建支付订单 API
 * POST /api/payment/create
 * 
 * Requirements: 5.2
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createOrder } from "@/lib/payment/service";
import { PaymentError } from "@/lib/payment/types";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { packageId, platform = "pc" } = body;

    if (!packageId) {
      return NextResponse.json(
        { success: false, message: "请选择充值套餐" },
        { status: 400 }
      );
    }

    const result = await createOrder({
      userId: session.user.id,
      packageId,
      platform,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Create order error:", error);

    if (error instanceof PaymentError) {
      return NextResponse.json(
        { success: false, message: error.message, code: error.code },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "创建订单失败" },
      { status: 500 }
    );
  }
}
