/**
 * NextAuth.js 配置
 * 
 * 实现手机号+验证码登录和用户名+密码登录的 Credentials Provider
 * Requirements: 1.3, 1.7, 1.8, 1.11
 */

import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyCode } from "./verification-code";
import { validatePassword_auth } from "./password-auth";
import prisma from "@/lib/prisma";
import { validatePhoneFormat } from "@/lib/utils/phone-validator";

// 初始赠送积分数量（可通过环境变量配置）
const INITIAL_GIFT_POINTS = parseInt(process.env.INITIAL_GIFT_POINTS || "100", 10);

export const authConfig: NextAuthConfig = {
  providers: [
    // 手机号+验证码登录
    Credentials({
      id: "phone-credentials",
      name: "Phone",
      credentials: {
        phone: { label: "手机号", type: "text" },
        code: { label: "验证码", type: "text" },
      },
      async authorize(credentials) {
        const phone = credentials?.phone as string | undefined;
        const code = credentials?.code as string | undefined;

        if (!phone || !code) {
          throw new Error("请输入手机号和验证码");
        }

        // 验证手机号格式
        if (!validatePhoneFormat(phone)) {
          throw new Error("手机号格式不正确");
        }

        // 验证验证码
        const verifyResult = await verifyCode(phone, code);
        if (!verifyResult.success) {
          throw new Error(verifyResult.message);
        }

        // 查找或创建用户
        let user = await prisma.user.findUnique({
          where: { phone },
          include: { pointsAccount: true },
        });

        const isNewUser = !user;

        if (!user) {
          // 创建新用户
          user = await prisma.user.create({
            data: {
              phone,
              pointsAccount: {
                create: {
                  balance: INITIAL_GIFT_POINTS,
                },
              },
            },
            include: { pointsAccount: true },
          });

          // 记录赠送积分的交易记录
          await prisma.pointsTransaction.create({
            data: {
              userId: user.id,
              type: "gift",
              amount: INITIAL_GIFT_POINTS,
              balance: INITIAL_GIFT_POINTS,
              description: "注册赠送积分",
            },
          });
        }

        return {
          id: user.id,
          phone: user.phone,
          username: user.username,
          isNewUser,
        };
      },
    }),
    // 用户名+密码登录
    Credentials({
      id: "username-credentials",
      name: "Username",
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!username || !password) {
          throw new Error("请输入用户名和密码");
        }

        // 验证用户名密码
        const result = await validatePassword_auth(username, password);
        if (!result.success) {
          throw new Error(result.message);
        }

        // 获取完整用户信息
        const user = await prisma.user.findUnique({
          where: { username },
        });

        if (!user) {
          throw new Error("用户不存在");
        }

        return {
          id: user.id,
          phone: user.phone,
          username: user.username,
          isNewUser: false,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.phone = user.phone;
        token.username = user.username;
        token.isNewUser = user.isNewUser;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.phone = token.phone as string | undefined;
        session.user.username = token.username as string | undefined;
        session.user.isNewUser = token.isNewUser as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
