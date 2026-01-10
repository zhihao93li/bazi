import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { validatePhoneFormat, validatePhoneWithMessage } from "../phone-validator";

/**
 * Property 1: 手机号格式验证
 * Validates: Requirements 1.6
 * 
 * For any 字符串输入，如果该字符串不符合中国大陆手机号格式
 * （1开头的11位数字，第二位为3-9），THE Auth_Service SHALL 返回格式错误。
 */
describe("Phone Validator - Property Tests", () => {
  // 生成有效的中国大陆手机号
  const validPhoneArbitrary = fc
    .tuple(
      fc.constantFrom("3", "4", "5", "6", "7", "8", "9"), // 第二位 3-9
      fc.array(fc.constantFrom("0", "1", "2", "3", "4", "5", "6", "7", "8", "9"), { minLength: 9, maxLength: 9 }) // 后9位
    )
    .map(([second, rest]) => `1${second}${rest.join("")}`);

  // 生成无效的手机号（不以1开头）
  const invalidFirstDigitArbitrary = fc
    .tuple(
      fc.constantFrom("0", "2", "3", "4", "5", "6", "7", "8", "9"), // 第一位不是1
      fc.array(fc.constantFrom("0", "1", "2", "3", "4", "5", "6", "7", "8", "9"), { minLength: 10, maxLength: 10 })
    )
    .map(([first, rest]) => `${first}${rest.join("")}`);

  // 生成无效的手机号（第二位不在3-9范围）
  const invalidSecondDigitArbitrary = fc
    .tuple(
      fc.constantFrom("0", "1", "2"), // 第二位是0、1、2
      fc.array(fc.constantFrom("0", "1", "2", "3", "4", "5", "6", "7", "8", "9"), { minLength: 9, maxLength: 9 })
    )
    .map(([second, rest]) => `1${second}${rest.join("")}`);

  // 生成长度不正确的数字字符串
  const wrongLengthArbitrary = fc
    .array(fc.constantFrom("0", "1", "2", "3", "4", "5", "6", "7", "8", "9"), { minLength: 1, maxLength: 20 })
    .filter((arr) => arr.length !== 11)
    .map((arr) => arr.join(""));

  // 生成包含非数字字符的字符串
  const nonDigitArbitrary = fc
    .string({ minLength: 1, maxLength: 20 })
    .filter((s) => /[^0-9]/.test(s));

  /**
   * Feature: bazi-fortune, Property 1: 手机号格式验证
   * Validates: Requirements 1.6
   */
  it("should accept all valid Chinese phone numbers", () => {
    fc.assert(
      fc.property(validPhoneArbitrary, (phone) => {
        return validatePhoneFormat(phone) === true;
      }),
      { numRuns: 100 }
    );
  });

  it("should reject phone numbers not starting with 1", () => {
    fc.assert(
      fc.property(invalidFirstDigitArbitrary, (phone) => {
        return validatePhoneFormat(phone) === false;
      }),
      { numRuns: 100 }
    );
  });

  it("should reject phone numbers with invalid second digit (0, 1, 2)", () => {
    fc.assert(
      fc.property(invalidSecondDigitArbitrary, (phone) => {
        return validatePhoneFormat(phone) === false;
      }),
      { numRuns: 100 }
    );
  });

  it("should reject phone numbers with wrong length", () => {
    fc.assert(
      fc.property(wrongLengthArbitrary, (phone) => {
        return validatePhoneFormat(phone) === false;
      }),
      { numRuns: 100 }
    );
  });

  it("should reject strings containing non-digit characters", () => {
    fc.assert(
      fc.property(nonDigitArbitrary, (phone) => {
        return validatePhoneFormat(phone) === false;
      }),
      { numRuns: 100 }
    );
  });
});

describe("Phone Validator - Unit Tests", () => {
  it("should validate correct phone numbers", () => {
    expect(validatePhoneFormat("13812345678")).toBe(true);
    expect(validatePhoneFormat("15912345678")).toBe(true);
    expect(validatePhoneFormat("18612345678")).toBe(true);
    expect(validatePhoneFormat("19912345678")).toBe(true);
  });

  it("should reject invalid phone numbers", () => {
    expect(validatePhoneFormat("12345678901")).toBe(false); // 第二位是2
    expect(validatePhoneFormat("1381234567")).toBe(false);  // 只有10位
    expect(validatePhoneFormat("138123456789")).toBe(false); // 12位
    expect(validatePhoneFormat("23812345678")).toBe(false); // 不以1开头
    expect(validatePhoneFormat("1381234567a")).toBe(false); // 包含字母
    expect(validatePhoneFormat("")).toBe(false);            // 空字符串
  });

  it("should return detailed validation messages", () => {
    expect(validatePhoneWithMessage("13812345678").valid).toBe(true);
    expect(validatePhoneWithMessage("").message).toBe("手机号不能为空");
    expect(validatePhoneWithMessage("abc").message).toBe("手机号只能包含数字");
    expect(validatePhoneWithMessage("1234567890").message).toBe("手机号必须是11位数字");
    expect(validatePhoneWithMessage("23812345678").message).toBe("手机号必须以1开头");
    expect(validatePhoneWithMessage("12345678901").message).toBe("手机号第二位必须是3-9之间的数字");
  });
});
