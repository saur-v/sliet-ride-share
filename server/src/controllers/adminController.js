// server/src/controllers/adminController.js
import User from '../models/User.js';
import Group from '../models/Group.js';
import Membership from '../models/Membership.js';
import AuditLog from '../models/AuditLog.js';

// Helper: write audit log
const audit = (actorId, action, targetType, targetId, meta = {}) =>
  AuditLog.create({ actorId, action, targetType, targetId, meta });

// GET /api/v1/admin/stats
export const getStats = async (_req, res) => {
  const [users, groups, active, confirmed] = await Promise.all([
    User.countDocuments(),
    Group.countDocuments(),
    Group.countDocuments({ status: 'open' }),
    Group.countDocuments({ status: 'confirmed' }),
  ]);
  res.json({ users, groups, activeGroups: active, confirmedGroups: confirmed });
};

// POST /api/v1/admin/suspend-user/:id
export const suspendUser = async (req, res) => {
  const { suspended = true, reason = '' } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { suspended }, { new: true });
  if (!user) return res.status(404).json({ errorCode: 'NOT_FOUND' });
  await audit(req.user._id, suspended ? 'suspend_user' : 'unsuspend_user', 'user', user._id, { reason });
  res.json({ ok: true, user });
};

// POST /api/v1/admin/suspend-group/:id
export const suspendGroup = async (req, res) => {
  const { reason = '' } = req.body;
  const group = await Group.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
  if (!group) return res.status(404).json({ errorCode: 'NOT_FOUND' });
  await audit(req.user._id, 'suspend_group', 'group', group._id, { reason });
  res.json({ ok: true, group });
};

// GET /api/v1/admin/audit-logs
export const getAuditLogs = async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const logs = await AuditLog.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('actorId', 'name email');
  res.json({ logs });
};

// GET /api/v1/admin/users
export const listUsers = async (req, res) => {
  const { q = '', page = 1, limit = 20 } = req.query;
  const filter = q ? { $or: [{ name: new RegExp(q,'i') }, { email: new RegExp(q,'i') }] } : {};
  const users = await User.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(parseInt(limit));
  const total = await User.countDocuments(filter);
  res.json({ users, total });
};
