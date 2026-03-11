// server/src/middleware/rateLimit.js
import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';

// ─── Auth endpoints (register, login, verify) ─────────────────────────────────
// Strict: 10 attempts per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: config.rateLimitAuthWindowMs,
  max: config.rateLimitAuthMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    errorCode: 'TOO_MANY_REQUESTS',
    message: 'Too many auth attempts. Please try again later.',
  },
});

// ─── General API endpoints ────────────────────────────────────────────────────
// Relaxed: 100 requests per minute per IP
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    errorCode: 'TOO_MANY_REQUESTS',
    message: 'Too many requests. Slow down.',
  },
});

// ─── Group creation limiter ───────────────────────────────────────────────────
// 3 groups per day per IP (configurable via env)
export const groupCreateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: config.groupCreationLimitPerDay,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip, // per user
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    errorCode: 'GROUP_LIMIT_EXCEEDED',
    message: `You can only create ${config.groupCreationLimitPerDay} groups per day.`,
  },
});
