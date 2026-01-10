/**
 * NextAuth.js 类型扩展
 * 
 * 扩展 User、Session 和 JWT 类型以包含自定义字段
 */

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    phone?: string | null;
    username?: string | null;
    isNewUser?: boolean;
  }

  interface Session {
    user: {
      id: string;
      phone?: string;
      username?: string;
      isNewUser?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    phone?: string | null;
    username?: string | null;
    isNewUser?: boolean;
  }
}
