/**
 * 敏感数据加密工具测试
 */

import { describe, it, expect } from 'vitest';
import {
  encrypt,
  decrypt,
  serializeEncryptedData,
  deserializeEncryptedData,
  encryptAndSerialize,
  deserializeAndDecrypt,
  isEncryptedFormat,
  maskPhone,
  generateEncryptionKey,
  EncryptedData,
} from '../encryption';

describe('encryption', () => {
  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt a string correctly', () => {
      const plaintext = '13812345678';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext (due to random IV)', () => {
      const plaintext = '13812345678';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);
      
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });

    it('should handle empty string', () => {
      const plaintext = '';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', () => {
      const plaintext = '测试中文数据 🔐';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should throw error for non-string plaintext', () => {
      expect(() => encrypt(123 as unknown as string)).toThrow('Plaintext must be a string');
    });

    it('should throw error for invalid encrypted data', () => {
      expect(() => decrypt(null as unknown as EncryptedData)).toThrow('Invalid encrypted data');
      expect(() => decrypt({} as EncryptedData)).toThrow('Missing required encryption fields');
    });
  });

  describe('serialization', () => {
    it('should serialize and deserialize encrypted data', () => {
      const encrypted: EncryptedData = {
        iv: 'a'.repeat(32),
        encrypted: 'b'.repeat(20),
        authTag: 'c'.repeat(32),
      };
      
      const serialized = serializeEncryptedData(encrypted);
      const deserialized = deserializeEncryptedData(serialized);
      
      expect(deserialized).toEqual(encrypted);
    });

    it('should throw error for invalid serialized format', () => {
      expect(() => deserializeEncryptedData('invalid')).toThrow('Invalid serialized encrypted data format');
      expect(() => deserializeEncryptedData('a:b')).toThrow('Invalid serialized encrypted data format');
    });

    it('should throw error for non-string input', () => {
      expect(() => deserializeEncryptedData(123 as unknown as string)).toThrow('Serialized data must be a string');
    });
  });

  describe('encryptAndSerialize / deserializeAndDecrypt', () => {
    it('should encrypt, serialize, deserialize, and decrypt correctly', () => {
      const plaintext = '13812345678';
      const serialized = encryptAndSerialize(plaintext);
      const decrypted = deserializeAndDecrypt(serialized);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should produce valid serialized format', () => {
      const plaintext = 'test data';
      const serialized = encryptAndSerialize(plaintext);
      
      expect(isEncryptedFormat(serialized)).toBe(true);
    });
  });

  describe('isEncryptedFormat', () => {
    it('should return true for valid encrypted format', () => {
      const plaintext = 'test';
      const serialized = encryptAndSerialize(plaintext);
      
      expect(isEncryptedFormat(serialized)).toBe(true);
    });

    it('should return false for plain text', () => {
      expect(isEncryptedFormat('13812345678')).toBe(false);
      expect(isEncryptedFormat('hello world')).toBe(false);
    });

    it('should return false for invalid formats', () => {
      expect(isEncryptedFormat('')).toBe(false);
      expect(isEncryptedFormat('a:b')).toBe(false);
      expect(isEncryptedFormat('a:b:c')).toBe(false);
      expect(isEncryptedFormat(123 as unknown as string)).toBe(false);
    });
  });

  describe('maskPhone', () => {
    it('should mask phone number correctly', () => {
      expect(maskPhone('13812345678')).toBe('138****5678');
    });

    it('should handle short strings', () => {
      expect(maskPhone('123')).toBe('***');
      expect(maskPhone('')).toBe('***');
    });

    it('should handle non-string input', () => {
      expect(maskPhone(123 as unknown as string)).toBe('***');
    });
  });

  describe('generateEncryptionKey', () => {
    it('should generate a 64-character hex string', () => {
      const key = generateEncryptionKey();
      
      expect(key).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(key)).toBe(true);
    });

    it('should generate unique keys', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      
      expect(key1).not.toBe(key2);
    });
  });
});
