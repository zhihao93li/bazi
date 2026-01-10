/**
 * 验证码验证 API
 * POST /api/auth/verify
 * 
 * 验证手机号和验证码，返回验证结果
 * 注意：实际登录流程通过 NextAuth.js 的 Credentials Provider 处理
 * 此接口用于独立的验证码验证场景
 * 
 * Requirements: 1.3
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyCode } from "@/lib/auth/verification-code";
import { validatePhoneFormat } from "@/lib/utils/phone-validator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code } = body;

    // 验证必填参数
    if (!phone) {
      return NextResponse.json(
        { success: false, message: "请输入手机号" },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { success: false, message: "请输入验证码" },
        { status: 400 }
      );
    }

    // 验证手机号格式
    if (!validatePhoneFormat(phone)) {
      return NextResponse.json(
        { success: false, message: "手机号格式不正确" },
        { status: 400 }
      );
    }

    // 验证验证码
    const result = await verifyCode(phone, code);

    if (!result.success) {
      // 根据不同错误类型返回不同状态码
      let statusCode = 401;
      
      if (result.lockedUntil) {
        // 手机号被锁定
        statusCode = 403;
      } else if (result.remainingAttempts !== undefined && result.remainingAttempts <= 0) {
        // 错误次数过多
        statusCode = 403;
      }

      return NextResponse.json(
        {
          success: false,
          message: result.message,
          remainingAttempts: result.remainingAttempts,
          lockedUntil: result.lockedUntil,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Verify code error:", error);
    return NextResponse.json(
      { success: false, message: "验证失败，请稍后重试" },
      { status: 500 }
    );
  }
}
