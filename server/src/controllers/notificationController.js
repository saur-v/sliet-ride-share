// server/src/controllers/notificationController.js
import Notification from '../models/Notification.js';

// GET /api/v1/notifications
export const getNotifications = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip  = (parseInt(page) - 1) * parseInt(limit);
  const total = await Notification.countDocuments({ userId: req.user._id });
  const items = await Notification.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });
  res.json({ notifications: items, total, unreadCount });
};

// POST /api/v1/notifications/mark-read
export const markRead = async (req, res) => {
  const { ids } = req.body; // array of notification ids, or omit to mark all
  const filter = { userId: req.user._id };
  if (ids?.length) filter._id = { $in: ids };
  await Notification.updateMany(filter, { read: true });
  res.json({ ok: true });
};
