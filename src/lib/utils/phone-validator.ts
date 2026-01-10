/**
 * 中国大陆手机号格式验证工具
 * 
 * 中国大陆手机号规则：
 * - 11位数字
 * - 以1开头
 * - 第二位为3-9
 */

// 中国大陆手机号正则表达式
const CHINA_PHONE_REGEX = /^1[3-9]\d{9}$/;

/**
 * 验证手机号格式是否符合中国大陆手机号规则
 * @param phone 手机号字符串
 * @returns 是否为有效的中国大陆手机号
 */
export function validatePhoneFormat(phone: string): boolean {
  if (typeof phone !== 'string') {
    return false;
  }
  return CHINA_PHONE_REGEX.test(phone);
}

/**
 * 手机号格式验证结果
 */
export interface PhoneValidationResult {
  valid: boolean;
  message: string;
}

/**
 * 验证手机号格式并返回详细结果
 * @param phone 手机号字符串
 * @returns 验证结果对象
 */
export function validatePhoneWithMessage(phone: string): PhoneValidationResult {
  if (typeof phone !== 'string') {
    return {
      valid: false,
      message: '手机号必须是字符串类型',
    };
  }

  if (phone.length === 0) {
    return {
      valid: false,
      message: '手机号不能为空',
    };
  }

  if (!/^\d+$/.test(phone)) {
    return {
      valid: false,
      message: '手机号只能包含数字',
    };
  }

  if (phone.length !== 11) {
    return {
      valid: false,
      message: '手机号必须是11位数字',
    };
  }

  if (!phone.startsWith('1')) {
    return {
      valid: false,
      message: '手机号必须以1开头',
    };
  }

  if (!/^1[3-9]/.test(phone)) {
    return {
      valid: false,
      message: '手机号第二位必须是3-9之间的数字',
    };
  }

  return {
    valid: true,
    message: '手机号格式正确',
  };
}
