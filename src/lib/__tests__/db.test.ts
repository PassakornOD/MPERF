import { describe, it, expect } from 'vitest';
import { decodePassword } from '../db';

describe('decodePassword', () => {
  it('should return plain text password as is', () => {
    expect(decodePassword('mypassword')).toBe('mypassword');
  });

  it('should decode base64 prefixed password', () => {
    // 'secret' in base64 is 'c2VjcmV0'
    expect(decodePassword('base64:c2VjcmV0')).toBe('secret');
  });

  it('should handle complex characters in base64', () => {
    // 'P@ssw0rd!' in base64 is 'UEBzc3cwcmQh'
    expect(decodePassword('base64:UEBzc3cwcmQh')).toBe('P@ssw0rd!');
  });
});
