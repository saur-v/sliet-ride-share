// server/src/app.js
// Builds and exports the Express application.
// server.js imports this and starts the HTTP server.

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { config } from './config/index.js';
import { generalLimiter } from './middleware/rateLimit.js';
import logger from './utils/logger.js';

// ── Route imports ──────────────────────────────────────────────────────────────
import authRoutes         from './routes/auth.js';
import userRoutes         from './routes/users.js';
import groupRoutes        from './routes/groups.js';
import notificationRoutes from './routes/notifications.js';
import chatRoutes         from './routes/chat.js';
import adminRoutes        from './routes/admin.js';

const app = express();
app.set('trust proxy', 1);

// ── Security headers ───────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ───────────────────────────────────────────────────────────────────────
// Only allow requests from the configured frontend URL
app.use(cors({
  origin:      config.frontendUrl,
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Request parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(config.cookieSecret));

// ── HTTP logging ──────────────────────────────────────────────────────────────
app.use(morgan(config.isProd ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ── Global rate limit ─────────────────────────────────────────────────────────
app.use('/api/', generalLimiter);

// ── Socket.IO middleware ───────────────────────────────────────────────────────
// io is attached by server.js after initSocket(); this middleware makes req.io
// available in every controller so they can emit events without importing io.
app.use((req, _res, next) => {
  req.io = app.get('io');
  next();
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', env: config.nodeEnv }));

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',          authRoutes);
app.use('/api/v1/users',         userRoutes);
app.use('/api/v1/groups',        groupRoutes);
app.use('/api/v1/groups',        chatRoutes);    // GET/POST /api/v1/groups/:id/messages
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin',         adminRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ errorCode: 'NOT_FOUND', message: 'Route not found' }));

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  logger.error(err.stack || err.message);
  res.status(err.status || 500).json({
    errorCode: err.errorCode || 'SERVER_ERROR',
    message:   config.isProd ? 'Something went wrong' : err.message,
  });
});

export default app;
