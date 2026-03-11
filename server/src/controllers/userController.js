// server/src/controllers/userController.js
import User from '../models/User.js';
import Membership from '../models/Membership.js';

// GET /api/v1/users/me
export const getMe = async (req, res) => {
  res.json(req.user);
};

// PUT /api/v1/users/me
export const updateMe = async (req, res) => {
  const allowed = ['contactNo', 'hostelNo', 'avatarUrl', 'name'];
  // collegeId: only updatable if not yet set (after first set it's treated as immutable)
  if (!req.user.collegeId && req.body.collegeId) allowed.push('collegeId');

  const updates = {};
  allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json(user);
};

// GET /api/v1/users/:id  (limited public profile)
export const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select('name hostelNo avatarUrl role createdAt');
  if (!user) return res.status(404).json({ errorCode: 'NOT_FOUND' });

  // Only reveal contactNo if viewer shares a group with this user
  if (req.user) {
    const sharedGroup = await Membership.findOne({
      userId: req.params.id,
      status: 'joined',
      groupId: { $in: await Membership.find({ userId: req.user._id, status: 'joined' }).distinct('groupId') },
    });
    if (sharedGroup) {
      const full = await User.findById(req.params.id).select('name hostelNo avatarUrl contactNo');
      return res.json(full);
    }
  }

  res.json(user);
};
