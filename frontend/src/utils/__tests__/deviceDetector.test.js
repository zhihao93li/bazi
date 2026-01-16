/**
 * 设备检测工具测试
 * 
 * 包含属性测试和单元测试
 * 
 * **Property 6: 设备检测准确性**
 * **验证: 需求 6.1, 6.2, 6.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { detectDevice, isMobile } from '../deviceDetector.js';

// 常见移动设备 User-Agent 样本
const MOBILE_USER_AGENTS = [
  // iPhone
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  // Android Phone
  'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
  // iPad
  'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  // Android Tablet
  'Mozilla/5.0 (Linux; Android 12; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
  // iPod
  'Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
  // Windows Phone
  'Mozilla/5.0 (Windows Phone 10.0; Android 6.0.1; Microsoft; Lumia 950) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Mobile Safari/537.36 Edge/15.15254',
  // Opera Mini
  'Opera/9.80 (Android; Opera Mini/36.2.2254/119.132; U; en) Presto/2.12.423 Version/12.16',
  // BlackBerry
  'Mozilla/5.0 (BlackBerry; U; BlackBerry 9900; en) AppleWebKit/534.11+ (KHTML, like Gecko) Version/7.1.0.346 Mobile Safari/534.11+',
  // Kindle Fire
  'Mozilla/5.0 (Linux; Android 4.4.3; KFAPWI Build/KTU84M) AppleWebKit/537.36 (KHTML, like Gecko) Silk/47.1.79 like Chrome/47.0.2526.80 Safari/537.36',
];

// 常见桌面浏览器 User-Agent 样本
const DESKTOP_USER_AGENTS = [
  // Chrome on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
  // Firefox on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/112.0',
  // Safari on macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_3_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15',
  // Chrome on macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
  // Edge on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 Edg/112.0.1722.48',
  // Chrome on Linux
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
  // Firefox on Linux
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/112.0',
];

describe('deviceDetector', () => {
  describe('isMobile', () => {
    it('should return true for mobile User-Agents', () => {
      MOBILE_USER_AGENTS.forEach(ua => {
        expect(isMobile(ua)).toBe(true);
      });
    });

    it('should return false for desktop User-Agents', () => {
      DESKTOP_USER_AGENTS.forEach(ua => {
        expect(isMobile(ua)).toBe(false);
      });
    });

    it('should return false for empty string', () => {
      expect(isMobile('')).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isMobile(undefined)).toBe(false);
    });
  });

  describe('detectDevice', () => {
    it('should return "mobile" for mobile User-Agents', () => {
      MOBILE_USER_AGENTS.forEach(ua => {
        expect(detectDevice(ua)).toBe('mobile');
      });
    });

    it('should return "pc" for desktop User-Agents', () => {
      DESKTOP_USER_AGENTS.forEach(ua => {
        expect(detectDevice(ua)).toBe('pc');
      });
    });

    it('should return "pc" for empty string', () => {
      expect(detectDevice('')).toBe('pc');
    });
  });

  /**
   * Property 6: 设备检测准确性
   * 
   * For any User-Agent string, mobile devices (phones, tablets) SHALL be detected as 'mobile',
   * and desktop browsers SHALL be detected as 'pc'.
   * 
   * **Validates: Requirements 6.1, 6.2, 6.3**
   */
  describe('Property 6: 设备检测准确性', () => {
    // Mobile device keywords that should always result in 'mobile' detection
    const mobileKeywords = [
      'Android',
      'iPhone',
      'iPad',
      'iPod',
      'Mobile',
      'mobile',
      'Tablet',
      'tablet',
      'Windows Phone',
      'BlackBerry',
      'Opera Mini',
      'IEMobile',
    ];

    it('should detect any User-Agent containing mobile keywords as mobile', () => {
      fc.assert(
        fc.property(
          // Generate random prefix and suffix
          fc.string({ maxLength: 50 }),
          fc.string({ maxLength: 50 }),
          // Pick a mobile keyword
          fc.constantFrom(...mobileKeywords),
          (prefix, suffix, keyword) => {
            const userAgent = `${prefix}${keyword}${suffix}`;
            return detectDevice(userAgent) === 'mobile';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect User-Agents without mobile keywords as pc', () => {
      // Generate User-Agents that don't contain any mobile keywords
      const nonMobileUA = fc.string({ minLength: 0, maxLength: 100 }).filter(ua => {
        return !mobileKeywords.some(keyword => ua.includes(keyword));
      });

      fc.assert(
        fc.property(nonMobileUA, (userAgent) => {
          return detectDevice(userAgent) === 'pc';
        }),
        { numRuns: 100 }
      );
    });

    it('should have consistent results for isMobile and detectDevice', () => {
      fc.assert(
        fc.property(fc.string({ maxLength: 200 }), (userAgent) => {
          const mobile = isMobile(userAgent);
          const device = detectDevice(userAgent);
          
          // isMobile and detectDevice should be consistent
          if (mobile) {
            return device === 'mobile';
          } else {
            return device === 'pc';
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
