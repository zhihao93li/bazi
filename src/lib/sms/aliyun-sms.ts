/**
 * Aliyun SMS Service Implementation
 * 阿里云短信服务实现
 */

import type { SmsProvider, SendSmsResult } from './types';

// Type declarations for optional Aliyun SDK
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AliyunSdkModule = any;

export class AliyunSmsService implements SmsProvider {
  private accessKeyId: string;
  private accessKeySecret: string;
  private signName: string;
  private templateCode: string;
  private endpoint: string;

  constructor() {
    this.accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID || '';
    this.accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET || '';
    this.signName = process.env.ALIYUN_SMS_SIGN_NAME || '';
    this.templateCode = process.env.ALIYUN_SMS_TEMPLATE_CODE || '';
    this.endpoint = 'dysmsapi.aliyuncs.com';

    if (!this.accessKeyId || !this.accessKeySecret) {
      console.warn('Aliyun SMS credentials not configured. SMS sending will fail.');
    }
  }

  async sendVerificationCode(phone: string, code: string): Promise<SendSmsResult> {
    // Validate inputs
    if (!phone || !code) {
      return {
        success: false,
        message: 'Phone number and code are required',
      };
    }

    // Check if credentials are configured
    if (!this.accessKeyId || !this.accessKeySecret) {
      return {
        success: false,
        message: 'Aliyun SMS credentials not configured',
      };
    }

    try {
      // Dynamic import to avoid issues when SDK is not installed
      // @ts-expect-error - SDK may not be installed
      const Dysmsapi20170525: AliyunSdkModule = await import('@alicloud/dysmsapi20170525');
      // @ts-expect-error - SDK may not be installed
      const OpenApi: AliyunSdkModule = await import('@alicloud/openapi-client');

      const config = new OpenApi.Config({
        accessKeyId: this.accessKeyId,
        accessKeySecret: this.accessKeySecret,
        endpoint: this.endpoint,
      });

      const client = new Dysmsapi20170525.default(config);

      const request = new Dysmsapi20170525.SendSmsRequest({
        phoneNumbers: phone,
        signName: this.signName,
        templateCode: this.templateCode,
        templateParam: JSON.stringify({ code }),
      });

      const response = await client.sendSms(request);

      if (response.body.code === 'OK') {
        return {
          success: true,
          requestId: response.body.requestId,
        };
      }

      return {
        success: false,
        message: response.body.message || 'SMS send failed',
        requestId: response.body.requestId,
      };
    } catch (error) {
      console.error('Aliyun SMS send error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}
