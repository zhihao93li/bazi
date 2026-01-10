/**
 * Auth Module Exports
 * 
 * 统一导出认证相关的功能
 */

// NextAuth.js handlers and utilities
export { handlers, auth, signIn, signOut } from "./auth";

// Verification code service
export {
  createVerificationCode,
  verifyCode,
  getLatestCode,
  generateVerificationCode,
  cleanupExpiredCodes,
  type SendCodeResult,
  type VerifyCodeResult,
} from "./verification-code";

// Password authentication service
export {
  registerWithPassword,
  validatePassword_auth,
  validateUsername,
  validatePassword,
  isUsernameExists,
  type RegisterResult,
  type ValidateResult,
} from "./password-auth";
