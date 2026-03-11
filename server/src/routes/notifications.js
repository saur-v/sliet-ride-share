// server/src/routes/notifications.js
import express from 'express';
import { getNotifications, markRead } from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/auth.js';
const router = express.Router();
router.get('/',          requireAuth, getNotifications);
router.post('/mark-read',requireAuth, markRead);
export default router;
