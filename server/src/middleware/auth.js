// server/src/middleware/auth.js
// requireAuth        — verifies JWT access token
// requireProfileComplete — checks contactNo + hostelNo + collegeId + emailVerified
// requireAdmin       — checks role === 'admin'

import { verifyAccessToken } from '../utils/tokens.js';
import User from '../models/User.js';

// ─── requireAuth ──────────────────────────────────────────────────────────────
// Reads Bearer token from Authorization header.
// Attaches req.user (without sensitive fields) on success.
export const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ errorCode: 'NO_TOKEN', message: 'Authentication required' });

  const token = header.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user)
      return res.status(401).json({ errorCode: 'USER_NOT_FOUND', message: 'User not found' });
    if (user.suspended)
      return res.status(403).json({ errorCode: 'SUSPENDED', message: 'Account suspended' });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ errorCode: 'TOKEN_EXPIRED', message: 'Access token expired' });
    return res.status(401).json({ errorCode: 'INVALID_TOKEN', message: 'Invalid token' });
  }
};

// ─── requireProfileComplete ───────────────────────────────────────────────────
// Must be used AFTER requireAuth.
// Blocks join/create unless all required profile fields are filled.
export const requireProfileComplete = (req, res, next) => {
  const { emailVerified, contactNo, hostelNo, collegeId } = req.user;
  if (!emailVerified)
    return res.status(403).json({ errorCode: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email first' });
  if (!contactNo || !hostelNo || !collegeId)
    return res.status(403).json({
      errorCode: 'PROFILE_INCOMPLETE',
      message: 'Complete your profile (contactNo, hostelNo, collegeId) before joining or creating rides',
    });
  next();
};

// ─── requireAdmin ─────────────────────────────────────────────────────────────
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin')
    return res.status(403).json({ errorCode: 'FORBIDDEN', message: 'Admin access required' });
  next();
};
