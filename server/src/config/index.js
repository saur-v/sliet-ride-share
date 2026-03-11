// server/src/config/index.js
// All environment variables are read here.
// Import this file in any module that needs config — never read process.env directly elsewhere.

import dotenv from 'dotenv';
dotenv.config();
console.log('EMAIL_PROVIDER raw:', process.env.EMAIL_PROVIDER);
console.log('SENDGRID_KEY set:', !!process.env.SENDGRID_API_KEY);

const required = (key) => {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
  return process.env[key];
};

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',

  // Database
  mongoUri: process.env.MONGO_URI,

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_prod',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_in_prod',
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  cookieSecret: process.env.COOKIE_SECRET || 'dev_cookie_secret',

  // Email
  emailProvider: process.env.EMAIL_PROVIDER || 'smtp',
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  sendgridApiKey: process.env.SENDGRID_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'noreply@sliet.ac.in',

  // App
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
  collegeEmailDomain: process.env.COLLEGE_EMAIL_DOMAIN || 'sliet.ac.in',
  groupCreationLimitPerDay: parseInt(process.env.GROUP_CREATION_LIMIT_PER_DAY || '3', 10),
  expirySoonHours: parseInt(process.env.EXPIRY_SOON_HOURS || '2', 10),
  timezone: process.env.TZ || 'Asia/Kolkata',

  // Rate limiting
  rateLimitAuthWindowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || '900000', 10),
  rateLimitAuthMax: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '10', 10),

  // Optional
  redisUrl:    process.env.REDIS_URL    || '',
  sentryDsn:   process.env.SENTRY_DSN  || '',
  twilioSid:   process.env.TWILIO_SID   || '',
  twilioToken: process.env.TWILIO_TOKEN || '',
  twilioPhone: process.env.TWILIO_PHONE || '',
};
