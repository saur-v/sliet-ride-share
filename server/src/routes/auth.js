// server/src/routes/auth.js
import express from 'express';
import { register, verifyEmail, login, refresh, logout } from '../controllers/authController.js';
import { authLimiter } from '../middleware/rateLimit.js';
import {
  registerValidation, verifyEmailValidation,
  loginValidation, refreshValidation, handleValidation,
} from '../middleware/validation.js';
import User from '../models/User.js';
import { generateVerifyToken } from '../utils/tokens.js';
import { sendVerificationEmail } from '../services/mailer.js';

const router = express.Router();

router.post('/register',     authLimiter, registerValidation,    handleValidation, register);
router.post('/verify-email', authLimiter, verifyEmailValidation, handleValidation, verifyEmail);
router.post('/login',        authLimiter, loginValidation,       handleValidation, login);
router.post('/refresh',                  refreshValidation,      handleValidation, refresh);
router.post('/logout',                   logout);
router.post('/magic-link', authLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email' });
    
    const { token, expiry } = generateVerifyToken();
    user.verifyToken = token;
    user.verifyTokenExpiry = expiry;
    await user.save();
    
    await sendVerificationEmail(email, token);
    res.json({ ok: true, message: 'Login link sent to your email' });
  } catch (err) {
    next(err);
  }
});

export default router;
