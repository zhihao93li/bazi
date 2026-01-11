/**
 * SMS Service Factory
 * 短信服务工厂函数
 */

import type { SmsProvider, SendSmsResult } from './types.js';
import { AliyunSmsService } from './aliyun-sms.js';

export type { SmsProvider, SendSmsResult, SmsConfig } from './types.js';
export { AliyunSmsService } from './aliyun-sms.js';

/**
 * Mock SMS Provider for development and testing
 * 开发和测试用的模拟短信服务
 */
export class MockSmsService implements SmsProvider {
  private sentCodes: Map<string, string> = new Map();

  async sendVerificationCode(phone: string, code: string): Promise<SendSmsResult> {
    // Store the code for testing purposes
    this.sentCodes.set(phone, code);
    
    console.log(`[MockSMS] Sending code ${code} to ${phone}`);
    
    return {
      success: true,
      message: 'Mock SMS sent successfully',
      requestId: `mock-${Date.now()}`,
    };
  }

  /**
   * Get the last sent code for a phone number (for testing)
   */
  getLastSentCode(phone: string): string | undefined {
    return this.sentCodes.get(phone);
  }

  /**
   * Clear all stored codes (for testing)
   */
  clearCodes(): void {
    this.sentCodes.clear();
  }
}

/**
 * Create SMS provider based on environment configuration
 * 根据环境配置创建短信服务提供商
 * 
 * @returns SmsProvider instance
 * @throws Error if unknown provider is specified
 */
export function createSmsProvider(): SmsProvider {
  const provider = process.env.SMS_PROVIDER || 'mock';

  switch (provider) {
    case 'aliyun':
      return new AliyunSmsService();
    case 'mock':
      return new MockSmsService();
    default:
      console.warn(`Unknown SMS provider: ${provider}, falling back to mock`);
      return new MockSmsService();
  }
}

// Singleton instance for convenience
let smsProviderInstance: SmsProvider | null = null;

/**
 * Get or create the SMS provider singleton
 * 获取或创建短信服务单例
 */
export function getSmsProvider(): SmsProvider {
  if (!smsProviderInstance) {
    smsProviderInstance = createSmsProvider();
  }
  return smsProviderInstance;
}

/**
 * Reset the SMS provider singleton (useful for testing)
 * 重置短信服务单例（用于测试）
 */
export function resetSmsProvider(): void {
  smsProviderInstance = null;
}
