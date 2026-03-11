// server/src/services/socket.js
// Initialises Socket.IO, attaches auth middleware, and sets up event handlers.
// Each group gets its own room: "group:<groupId>"

import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/tokens.js';
import ChatMessage from '../models/ChatMessage.js';
import Membership from '../models/Membership.js';
import logger from '../utils/logger.js';
import { config } from '../config/index.js';

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin:      config.frontendUrl,
      credentials: true,
    },
    // Polling fallback is automatic — Socket.IO tries websocket first,
    // falls back to long-polling if websockets are unavailable.
    transports: ['websocket', 'polling'],
    pingTimeout:  20000,
    pingInterval: 25000,
  });

  // ── Auth middleware ──────────────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = verifyAccessToken(token);
      socket.userId = payload.sub;
      socket.userRole = payload.role;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  // ── Connection handler ───────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id} (user: ${socket.userId})`);

    // Join a personal notification room — so we can notify this user directly
    socket.join(`user:${socket.userId}`);

    // ── subscribe:group ────────────────────────────────────────────────────────
    // Client joins a group room to receive group-level events
    socket.on('subscribe:group', (groupId) => {
      socket.join(`group:${groupId}`);
      logger.debug(`Socket ${socket.id} subscribed to group:${groupId}`);
    });

    socket.on('unsubscribe:group', (groupId) => {
      socket.leave(`group:${groupId}`);
    });

    // ── chat:send ──────────────────────────────────────────────────────────────
    // Client sends a chat message; server validates membership then broadcasts
    socket.on('chat:send', async ({ groupId, text }) => {
      try {
        if (!text?.trim()) return;

        // Server-side membership check — never trust the client
        const member = await Membership.findOne({
          groupId,
          userId: socket.userId,
          status: 'joined',
        });
        if (!member) {
          socket.emit('error', { message: 'You are not a member of this group' });
          return;
        }

        const msg = await ChatMessage.create({
          groupId,
          userId: socket.userId,
          text:   text.trim().slice(0, 1000), // sanitise length
        });
        await msg.populate('userId', 'name avatarUrl hostelNo');

        io.to(`group:${groupId}`).emit('chat:message', {
          groupId,
          message: {
            id:        msg._id,
            userId:    socket.userId,
            user:      msg.userId,
            text:      msg.text,
            createdAt: msg.createdAt,
          },
        });
      } catch (err) {
        logger.error(`chat:send error: ${err.message}`);
        socket.emit('error', { message: 'Message failed' });
      }
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};
