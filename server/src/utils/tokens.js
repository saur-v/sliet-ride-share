// server/src/utils/tokens.js
// Central place for all token operations.
// Import these helpers everywhere — never call jwt.sign() directly in controllers.

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/index.js';

// ─── Access Token ─────────────────────────────────────────────────────────────
// Short-lived (15m). Contains userId + role. Sent in Authorization header.
export const generateAccessToken = (userId, role) =>
  jwt.sign({ sub: userId.toString(), role }, config.jwtSecret, {
    expiresIn: config.jwtAccessExpiry,
  });

export const verifyAccessToken = (token) =>
  jwt.verify(token, config.jwtSecret);

// ─── Refresh Token ────────────────────────────────────────────────────────────
// Long-lived (7d). Random hex string. Stored HASHED in DB.
// The raw token is returned to the client; only the hash lives in MongoDB.
export const generateRefreshToken = () => crypto.randomBytes(40).toString('hex');

// ─── Hashing ──────────────────────────────────────────────────────────────────
// SHA-256 hash of a token — used for safe DB storage.
export const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

// ─── Email Verify Token ───────────────────────────────────────────────────────
// Returns { token (raw, sent by email), expiry (Date) }
export const generateVerifyToken = () => ({
  token:  crypto.randomBytes(32).toString('hex'),
  expiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
});
