// server/src/tests/tokens.test.js
// Unit tests for token utilities — no DB needed.

import { generateAccessToken, verifyAccessToken, generateRefreshToken, hashToken, generateVerifyToken } from '../utils/tokens.js';

describe('generateAccessToken', () => {
  it('returns a JWT string', () => {
    const token = generateAccessToken('abc123', 'student');
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // header.payload.signature
  });

  it('encodes userId and role in payload', () => {
    const token = generateAccessToken('user999', 'admin');
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user999');
    expect(payload.role).toBe('admin');
  });
});

describe('verifyAccessToken', () => {
  it('throws on tampered token', () => {
    const token = generateAccessToken('abc', 'student');
    const tampered = token.slice(0, -5) + 'XXXXX';
    expect(() => verifyAccessToken(tampered)).toThrow();
  });
});

describe('generateRefreshToken', () => {
  it('returns 80-char hex string', () => {
    const t = generateRefreshToken();
    expect(t).toHaveLength(80);
    expect(/^[a-f0-9]+$/.test(t)).toBe(true);
  });

  it('generates unique tokens', () => {
    const t1 = generateRefreshToken();
    const t2 = generateRefreshToken();
    expect(t1).not.toBe(t2);
  });
});

describe('hashToken', () => {
  it('is deterministic', () => {
    expect(hashToken('hello')).toBe(hashToken('hello'));
  });

  it('different inputs produce different hashes', () => {
    expect(hashToken('abc')).not.toBe(hashToken('def'));
  });

  it('produces 64-char hex (SHA-256)', () => {
    expect(hashToken('test')).toHaveLength(64);
  });
});

describe('generateVerifyToken', () => {
  it('returns token and expiry', () => {
    const { token, expiry } = generateVerifyToken();
    expect(token).toHaveLength(64); // 32 bytes = 64 hex chars
    expect(expiry).toBeInstanceOf(Date);
    expect(expiry.getTime()).toBeGreaterThan(Date.now());
  });
});
