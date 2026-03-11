// server/src/middleware/validation.js
// Reusable validation chains for each route.
// Usage: router.post('/register', registerValidation, handleValidation, controller)

import { body, param, query, validationResult } from 'express-validator';
import { config } from '../config/index.js';

// ─── handleValidation ─────────────────────────────────────────────────────────
// Always call this AFTER your validation chain to short-circuit on errors.
export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({
      errorCode: 'VALIDATION_ERROR',
      message: 'Input validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  next();
};

// ─── Auth validations ─────────────────────────────────────────────────────────
export const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  body('email')
    .trim()
    .toLowerCase()
    .isEmail().withMessage('Valid email required')
    .matches(new RegExp(`@${config.collegeEmailDomain.replace('.', '\\.')}$`))
    .withMessage(`Email must end with @${config.collegeEmailDomain}`),
];

export const verifyEmailValidation = [
  body('email').trim().toLowerCase().isEmail().withMessage('Valid email required'),
  body('token').trim().notEmpty().withMessage('Token is required'),
];

export const loginValidation = [
  body('email').trim().toLowerCase().isEmail().withMessage('Valid email required'),
  // Either password or token must be present
  body('password').optional().isLength({ min: 1 }),
  body('token').optional().isLength({ min: 1 }),
];

export const refreshValidation = [
  body('refreshToken').trim().notEmpty().withMessage('refreshToken is required'),
];

// ─── Group validations ────────────────────────────────────────────────────────
export const createGroupValidation = [
  body('title').trim().notEmpty().isLength({ min: 3, max: 120 }).withMessage('Title: 3–120 chars'),
  body('origin').trim().notEmpty().withMessage('Origin is required'),
  body('destination').trim().notEmpty().withMessage('Destination is required'),
  body('date').isISO8601().withMessage('Date must be ISO8601 format (YYYY-MM-DD)'),
  body('time').matches(/^\d{2}:\d{2}$/).withMessage('Time must be HH:MM format'),
  body('seatsTotal')
    .isInt({ min: 1, max: 10 })
    .withMessage('seatsTotal must be between 1 and 10'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('meetingPoint').optional().trim().isLength({ max: 200 }),
  body('seatPrice').optional().isNumeric().withMessage('seatPrice must be a number'),
];

export const updateGroupValidation = [
  body('title').optional().trim().isLength({ min: 3, max: 120 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('meetingPoint').optional().trim().isLength({ max: 200 }),
  body('seatsTotal').optional().isInt({ min: 1, max: 10 }),
  body('time').optional().matches(/^\d{2}:\d{2}$/),
  body('date').optional().isISO8601(),
];

// ─── Profile update validations ───────────────────────────────────────────────
export const updateProfileValidation = [
  body('contactNo')
    .optional()
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage('contactNo must be a valid phone number'),
  body('hostelNo').optional().trim().isLength({ min: 1, max: 20 }),
  body('avatarUrl').optional().isURL().withMessage('avatarUrl must be a valid URL'),
  body('collegeId').optional().trim().isLength({ min: 1, max: 20 }),
];

// ─── Message validations ──────────────────────────────────────────────────────
export const sendMessageValidation = [
  body('text')
    .trim()
    .notEmpty().withMessage('Message text is required')
    .isLength({ max: 1000 }).withMessage('Message cannot exceed 1000 characters'),
];
