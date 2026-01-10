/**
 * NextAuth.js 主配置文件
 * 
 * 导出 auth handlers 和 session 获取方法
 */

import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
