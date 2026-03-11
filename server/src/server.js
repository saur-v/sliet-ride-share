// server/src/server.js
// Entry point: connects to MongoDB, starts HTTP + Socket.IO server.

import { createServer } from 'http';
import mongoose from 'mongoose';
import app from './app.js';
import { initSocket } from './services/socket.js';
import { config } from './config/index.js';
import logger from './utils/logger.js';

// ── Cron jobs (cleanup expired groups) ───────────────────────────────────────
import './jobs/cleanup.js';

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    logger.info(`MongoDB connected: ${config.mongoUri.split('@').pop()}`);

    // 2. Create HTTP server from Express app
    const httpServer = createServer(app);

    // 3. Initialise Socket.IO and attach io to app for controllers
    const io = initSocket(httpServer);
    app.set('io', io);

    // 4. Start listening
    httpServer.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port} [${config.nodeEnv}]`);
      logger.info(`   Frontend URL: ${config.frontendUrl}`);
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  await mongoose.disconnect();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

startServer();
