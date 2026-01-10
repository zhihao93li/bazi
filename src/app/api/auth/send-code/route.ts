/**
 * 发送验证码 API
 * POST /api/auth/send-code
 * 
 * Requirements: 1.1
 */

import { NextRequest, NextResponse } from "next/server";
import { createVerificationCode, getLatestCode } from "@/lib/auth/verification-code";
import { createSmsProvider } from "@/lib/sms";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, message: "请输入手机号" },
        { status: 400 }
      );
    }

    // 创建验证码
    const result = await createVerificationCode(phone);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message, retryAfterSeconds: result.retryAfterSeconds },
        { status: 429 }
      );
    }

    // 获取生成的验证码
    const code = await getLatestCode(phone);

    if (!code) {
      return NextResponse.json(
        { success: false, message: "验证码生成失败" },
        { status: 500 }
      );
    }

    // 发送短信（开发环境可以跳过）
    if (process.env.NODE_ENV === "production" || process.env.ENABLE_SMS === "true") {
      try {
        const smsProvider = createSmsProvider();
        const sent = await smsProvider.sendVerificationCode(phone, code);
        
        if (!sent) {
          return NextResponse.json(
            { success: false, message: "短信发送失败，请稍后重试" },
            { status: 500 }
          );
        }
      } catch (error) {
        console.error("SMS send error:", error);
        return NextResponse.json(
          { success: false, message: "短信服务异常，请稍后重试" },
          { status: 500 }
        );
      }
    } else {
      // 开发环境：在控制台输出验证码
      console.log(`[DEV] Verification code for ${phone}: ${code}`);
    }

    return NextResponse.json({
      success: true,
      message: "验证码已发送",
      // 开发环境返回验证码方便测试
      ...(process.env.NODE_ENV !== "production" && { code }),
    });
  } catch (error) {
    console.error("Send code error:", error);
    return NextResponse.json(
      { success: false, message: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}
