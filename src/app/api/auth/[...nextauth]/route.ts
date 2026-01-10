/**
 * NextAuth.js API Route Handler
 * 
 * 处理所有 /api/auth/* 请求
 * Requirements: 1.3, 1.7
 */

import { handlers } from "@/lib/auth/auth";

export const { GET, POST } = handlers;
