// server/src/routes/chat.js
import express from 'express';
import { getMessages, sendMessage } from '../controllers/chatController.js';
import { requireAuth } from '../middleware/auth.js';
import { sendMessageValidation, handleValidation } from '../middleware/validation.js';
const router = express.Router({ mergeParams: true });
router.get('/messages',  requireAuth, getMessages);
router.post('/messages', requireAuth, sendMessageValidation, handleValidation, sendMessage);
export default router;
