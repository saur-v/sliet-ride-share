// server/src/routes/auth.js
import express from 'express';
import { register, verifyEmail, login, refresh, logout } from '../controllers/authController.js';
import { authLimiter } from '../middleware/rateLimit.js';
import {
  registerValidation, verifyEmailValidation,
  loginValidation, refreshValidation, handleValidation,
} from '../middleware/validation.js';

const router = express.Router();

router.post('/register',     authLimiter, registerValidation,    handleValidation, register);
router.post('/verify-email', authLimiter, verifyEmailValidation, handleValidation, verifyEmail);
router.post('/login',        authLimiter, loginValidation,       handleValidation, login);
router.post('/refresh',                  refreshValidation,      handleValidation, refresh);
router.post('/logout',                   logout);

export default router;
