/**
 * Auth Module Exports
 * 
 * 统一导出认证相关的功能
 */

// JWT utilities
export {
  signToken,
  verifyToken,
  extractTokenFromHeader,
  type JwtPayload,
} from "./jwt.js";

// Verification code service
export {
  createVerificationCode,
  verifyCode,
  getLatestCode,
  generateVerificationCode,
  cleanupExpiredCodes,
  type SendCodeResult,
  type VerifyCodeResult,
} from "./verification-code.js";

// Password authentication service
export {
  registerWithPassword,
  validatePassword_auth,
  validateUsername,
  validatePassword,
  isUsernameExists,
  type RegisterResult,
  type ValidateResult,
} from "./password-auth.js";
