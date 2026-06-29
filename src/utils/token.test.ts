import { describe, it, expect } from 'vitest';
import { generateSecureToken } from '../utils/token';

describe('generateSecureToken', () => {
  it('generates tokens of consistent length', () => {
    const token = generateSecureToken();
    expect(token.length).toBeGreaterThanOrEqual(24);
  });

  it('generates unique tokens', () => {
    const tokens = new Set(Array.from({ length: 20 }, () => generateSecureToken()));
    expect(tokens.size).toBe(20);
  });
});
