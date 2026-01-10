/**
 * SMS Service Provider Interface
 * 短信服务提供商抽象接口
 */

export interface SendSmsResult {
  success: boolean;
  message?: string;
  requestId?: string;
}

export interface SmsProvider {
  /**
   * Send verification code to the specified phone number
   * 发送验证码到指定手机号
   * @param phone - Chinese mainland phone number (11 digits starting with 1)
   * @param code - 6-digit verification code
   * @returns Promise with send result
   */
  sendVerificationCode(phone: string, code: string): Promise<SendSmsResult>;
}

export interface SmsConfig {
  provider: 'aliyun' | 'tencent' | 'mock';
  signName: string;
  templateCode: string;
}
