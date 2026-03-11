// server/src/controllers/authController.js
// Handles: register, verifyEmail, login, refresh, logout

import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import {
  generateAccessToken,
  generateRefreshToken,
  generateVerifyToken,
  hashToken,
} from '../utils/tokens.js';
import { sendVerificationEmail } from '../services/mailer.js';
import logger from '../utils/logger.js';

// ─── REGISTER ─────────────────────────────────────────────────────────────────
// POST /api/v1/auth/register
// Creates an unverified user and sends a magic-link email.
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing && existing.emailVerified)
      return res.status(409).json({ errorCode: 'EMAIL_TAKEN', message: 'Email already registered' });

    const { token, expiry } = generateVerifyToken();

    if (existing) {
      existing.name = name;
      if (password) existing.passwordHash = await bcrypt.hash(password, 12);
      existing.verifyToken       = token;
      existing.verifyTokenExpiry = expiry;
      await existing.save();
    } else {
      await User.create({
        name,
        email,
        passwordHash:      password ? await bcrypt.hash(password, 12) : undefined,
        emailVerified:     false,
        verifyToken:       token,
        verifyTokenExpiry: expiry,
      });
    }

    await sendVerificationEmail(email, token);
    logger.info(`Verification email sent to ${email}`);
    res.status(201).json({ ok: true, message: 'Verification email sent. Check your inbox.' });
  } catch (err) {
    logger.error(`Register error: ${err.message}`);
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: 'Registration failed' });
  }
};

// ─── VERIFY EMAIL ─────────────────────────────────────────────────────────────
// POST /api/v1/auth/verify-email
// Validates the magic-link token, marks email verified, returns tokens.
export const verifyEmail = async (req, res) => {
  const { email, token } = req.body;

  try {
    // Select hidden fields we need for verification
    const user = await User.findOne({ email }).select('+verifyToken +verifyTokenExpiry +refreshTokens');
    if (!user)
      return res.status(404).json({ errorCode: 'USER_NOT_FOUND', message: 'No account for that email' });

    if (user.verifyToken !== token)
      return res.status(400).json({ errorCode: 'INVALID_TOKEN', message: 'Invalid verification token' });

    if (user.verifyTokenExpiry < new Date())
      return res.status(400).json({ errorCode: 'TOKEN_EXPIRED', message: 'Token expired. Please register again.' });

    // Mark verified, clear token
    user.emailVerified     = true;
    user.verifyToken       = undefined;
    user.verifyTokenExpiry = undefined;

    // Issue tokens
    const accessToken  = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken();
    user.refreshTokens.push(hashToken(refreshToken));
    user.refreshTokens = user.refreshTokens.slice(-5); // max 5 sessions
    await user.save();

    logger.info(`Email verified for ${email}`);
    res.json({ accessToken, refreshToken, user });
  } catch (err) {
    logger.error(`VerifyEmail error: ${err.message}`);
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: 'Verification failed' });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/login
// Supports: { email, password } or { email, token } (magic-link re-use)
export const login = async (req, res) => {
  const { email, password, token } = req.body;

  try {
    const user = await User.findOne({ email }).select('+passwordHash +refreshTokens +verifyToken +verifyTokenExpiry');
    if (!user)
      return res.status(401).json({ errorCode: 'INVALID_CREDENTIALS', message: 'Invalid email or credentials' });

    if (!user.emailVerified)
      return res.status(403).json({ errorCode: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email first' });

    if (user.suspended)
      return res.status(403).json({ errorCode: 'SUSPENDED', message: 'Account suspended' });

    // ── Magic-link token login ─────────────────────────────────────────────
    if (token) {
      if (user.verifyToken !== token || user.verifyTokenExpiry < new Date())
        return res.status(401).json({ errorCode: 'INVALID_TOKEN', message: 'Invalid or expired token' });
      user.verifyToken       = undefined;
      user.verifyTokenExpiry = undefined;
    }
    // ── Password login ─────────────────────────────────────────────────────
    else if (password) {
      if (!user.passwordHash)
        return res.status(401).json({ errorCode: 'NO_PASSWORD', message: 'No password set. Use magic link.' });
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid)
        return res.status(401).json({ errorCode: 'INVALID_CREDENTIALS', message: 'Wrong password' });
    } else {
      return res.status(400).json({ errorCode: 'MISSING_CREDENTIALS', message: 'Provide password or token' });
    }

    const accessToken  = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken();
    user.refreshTokens.push(hashToken(refreshToken));
    user.refreshTokens = user.refreshTokens.slice(-5);
    await user.save();

    res.json({ accessToken, refreshToken, user });
  } catch (err) {
    logger.error(`Login error: ${err.message}`);
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: 'Login failed' });
  }
};

// ─── REFRESH ──────────────────────────────────────────────────────────────────
// POST /api/v1/auth/refresh
// Rotates the refresh token — invalidates old, issues new access + refresh pair.
export const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ errorCode: 'NO_TOKEN', message: 'refreshToken required' });

  const hashed = hashToken(refreshToken);

  try {
    const user = await User.findOne({ refreshTokens: hashed }).select('+refreshTokens');
    if (!user)
      return res.status(401).json({ errorCode: 'INVALID_TOKEN', message: 'Token not recognised — please log in again' });

    // Rotate: remove the used token, push the new one
    const newRefreshToken = generateRefreshToken();
    user.refreshTokens = user.refreshTokens
      .filter((t) => t !== hashed)     // remove used token
      .slice(-4);                       // keep at most 4 old ones
    user.refreshTokens.push(hashToken(newRefreshToken));
    await user.save();

    const newAccessToken = generateAccessToken(user._id, user.role);
    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    logger.error(`Refresh error: ${err.message}`);
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: 'Token refresh failed' });
  }
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
// POST /api/v1/auth/logout
// Removes the specific refresh token from the user's list (this device only).
export const logout = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.json({ ok: true });

  const hashed = hashToken(refreshToken);
  try {
    await User.updateOne(
      { refreshTokens: hashed },
      { $pull: { refreshTokens: hashed } }
    );
    res.json({ ok: true });
  } catch (err) {
    // Non-fatal — still return success
    logger.warn(`Logout token cleanup failed: ${err.message}`);
    res.json({ ok: true });
  }
};
