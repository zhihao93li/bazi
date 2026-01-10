/**
 * 积分套餐查询 API
 * GET /api/points/packages
 * 
 * Requirements: 5.1
 */

import { NextResponse } from "next/server";
import { getActivePackages } from "@/lib/payment/service";

export async function GET() {
  try {
    const packages = await getActivePackages();

    return NextResponse.json({
      success: true,
      packages,
    });
  } catch (error) {
    console.error("Packages query error:", error);
    return NextResponse.json(
      { success: false, message: "查询失败" },
      { status: 500 }
    );
  }
}
