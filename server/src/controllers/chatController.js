// server/src/controllers/chatController.js
import ChatMessage from '../models/ChatMessage.js';
import Membership from '../models/Membership.js';

// GET /api/v1/groups/:id/messages
export const getMessages = async (req, res) => {
  const { limit = 50 } = req.query;
  const messages = await ChatMessage.find({ groupId: req.params.id })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('userId', 'name avatarUrl hostelNo');
  res.json({ messages: messages.reverse() }); // oldest first
};

// POST /api/v1/groups/:id/messages
export const sendMessage = async (req, res) => {
  // Verify sender is a joined member
  const membership = await Membership.findOne({
    groupId: req.params.id,
    userId:  req.user._id,
    status:  'joined',
  });
  if (!membership)
    return res.status(403).json({ errorCode: 'NOT_MEMBER', message: 'Join the group to chat' });

  const msg = await ChatMessage.create({
    groupId: req.params.id,
    userId:  req.user._id,
    text:    req.body.text,
  });
  await msg.populate('userId', 'name avatarUrl hostelNo');

  // Broadcast via socket
  req.io.to(`group:${req.params.id}`).emit('chat:message', {
    groupId: req.params.id,
    message: { id: msg._id, userId: req.user._id, text: msg.text, createdAt: msg.createdAt, user: msg.userId },
  });

  res.status(201).json(msg);
};
