// server/src/controllers/groupController.js
// All group operations: create, list, get, update, cancel, join, leave, confirm, kick

import mongoose from 'mongoose';
import Group from '../models/Group.js';
import Membership from '../models/Membership.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendGroupConfirmedEmail, sendGroupCancelledEmail } from '../services/mailer.js';
import logger from '../utils/logger.js';

// ─── Helper: check if viewer is a member of the group ─────────────────────────
const isMember = async (groupId, userId) => {
  if (!userId) return false;
  const m = await Membership.findOne({ groupId, userId, status: 'joined' });
  return !!m;
};

// ─── CREATE GROUP ─────────────────────────────────────────────────────────────
// POST /api/v1/groups
export const createGroup = async (req, res) => {
  const { title, description, origin, destination, date, time, seatsTotal, meetingPoint, seatPrice } = req.body;

  try {
    const group = await Group.create({
      creatorId: req.user._id,
      title, description, origin, destination,
      date: new Date(date),
      time,
      seatsTotal,
      seatsTaken: 1,         // creator auto-joins
      meetingPoint,
      seatPrice: seatPrice || 0,
    });

    // Creator auto-gets a membership record
    await Membership.create({
      groupId:   group._id,
      userId:    req.user._id,
      isCreator: true,
      status:    'joined',
      joinedAt:  new Date(),
    });

    // Broadcast to anyone browsing
    req.io.emit('group:created', { group });

    logger.info(`Group created: ${group._id} by ${req.user._id}`);
    res.status(201).json(group);
  } catch (err) {
    logger.error(`createGroup: ${err.message}`);
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: 'Could not create group' });
  }
};

// ─── LIST GROUPS ──────────────────────────────────────────────────────────────
// GET /api/v1/groups?date=&origin=&destination=&seatsMin=&status=&page=&limit=
export const getGroups = async (req, res) => {
  const { date, origin, destination, seatsMin, status, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status)      filter.status      = status;
  else             filter.status      = { $in: ['open', 'confirmed'] };
  if (origin)      filter.origin      = new RegExp(origin, 'i');
  if (destination) filter.destination = new RegExp(destination, 'i');
  if (seatsMin)    filter.$expr = { $gte: [{ $subtract: ['$seatsTotal', '$seatsTaken'] }, parseInt(seatsMin)] };

  if (date) {
    const d = new Date(date);
    const next = new Date(d); next.setDate(next.getDate() + 1);
    filter.date = { $gte: d, $lt: next };
  } else {
    // Default: only show future/today rides
    filter.date = { $gte: new Date(new Date().setHours(0, 0, 0, 0)) };
  }

  const skip  = (parseInt(page) - 1) * parseInt(limit);
  const total = await Group.countDocuments(filter);
  const groups = await Group.find(filter)
    .sort({ date: 1, time: 1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('creatorId', 'name hostelNo avatarUrl');

  res.json({ groups, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
};

// ─── GET SINGLE GROUP ─────────────────────────────────────────────────────────
// GET /api/v1/groups/:id
export const getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('creatorId', 'name hostelNo avatarUrl');
    if (!group) return res.status(404).json({ errorCode: 'NOT_FOUND', message: 'Group not found' });

    const viewerIsMember = await isMember(group._id, req.user?._id);

    // Fetch members
    const memberships = await Membership.find({ groupId: group._id, status: 'joined' })
      .populate('userId', 'name hostelNo avatarUrl contactNo collegeId');

    const members = memberships.map((m) => {
      const u = m.userId.toObject();
      // Mask contact for non-members
      if (!viewerIsMember) delete u.contactNo;
      return { ...u, isCreator: m.isCreator, joinedAt: m.joinedAt };
    });

    res.json({ ...group.toJSON(), members, viewerIsMember });
  } catch (err) {
    logger.error(`getGroup: ${err.message}`);
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: 'Could not fetch group' });
  }
};

// ─── UPDATE GROUP ─────────────────────────────────────────────────────────────
// PUT /api/v1/groups/:id  (creator or admin only)
export const updateGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ errorCode: 'NOT_FOUND' });

    const isCreator = group.creatorId.toString() === req.user._id.toString();
    if (!isCreator && req.user.role !== 'admin')
      return res.status(403).json({ errorCode: 'FORBIDDEN', message: 'Only creator or admin can update' });

    // Cannot lower seatsTotal below seatsTaken
    if (req.body.seatsTotal && req.body.seatsTotal < group.seatsTaken)
      return res.status(400).json({
        errorCode: 'SEATS_CONFLICT',
        message: `Cannot reduce seats below current taken count (${group.seatsTaken})`,
      });

    const allowed = ['title', 'description', 'meetingPoint', 'seatsTotal', 'date', 'time', 'seatPrice'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) group[field] = req.body[field];
    });
    await group.save();

    req.io.to(`group:${group._id}`).emit('group:updated', { group });
    res.json(group);
  } catch (err) {
    logger.error(`updateGroup: ${err.message}`);
    res.status(500).json({ errorCode: 'SERVER_ERROR' });
  }
};

// ─── JOIN GROUP (ATOMIC) ──────────────────────────────────────────────────────
// POST /api/v1/groups/:id/join
// Uses MongoDB transactions to atomically claim a seat.
export const joinGroup = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Atomically increment seatsTaken ONLY if a seat is free
    const group = await Group.findOneAndUpdate(
      {
        _id: req.params.id,
        status: 'open',
        $expr: { $lt: ['$seatsTaken', '$seatsTotal'] },  // seats guard
      },
      { $inc: { seatsTaken: 1 } },
      { new: true, session }
    );

    if (!group) {
      await session.abortTransaction();
      return res.status(409).json({ errorCode: 'NO_SEATS_OR_CLOSED', message: 'No seats available or group not open' });
    }

    // Check existing membership INSIDE the same transaction
    const existing = await Membership.findOne({
      groupId: group._id,
      userId:  req.user._id,
    }).session(session);

    if (existing?.status === 'joined') {
      // Undo the increment since they're already in
      await Group.findByIdAndUpdate(group._id, { $inc: { seatsTaken: -1 } }, { session });
      await session.abortTransaction();
      return res.status(409).json({ errorCode: 'ALREADY_JOINED', message: 'You are already in this group' });
    }

    let membership;
    if (existing) {
      // Re-joining after leaving — update existing record
      existing.status   = 'joined';
      existing.joinedAt = new Date();
      existing.leftAt   = undefined;
      await existing.save({ session });
      membership = existing;
    } else {
      [membership] = await Membership.create(
        [{ groupId: group._id, userId: req.user._id, status: 'joined', joinedAt: new Date() }],
        { session }
      );
    }

    await session.commitTransaction();

    // ── Notifications & socket (after transaction) ──────────────────────────
    const seatsRemaining = group.seatsTotal - group.seatsTaken;

    // Notify the group creator
    await Notification.create({
      userId:  group.creatorId,
      type:    'member_joined',
      payload: { groupId: group._id, groupTitle: group.title, userId: req.user._id, userName: req.user.name },
    });

    req.io.to(`group:${group._id}`).emit('group:member_joined', {
      event: 'group:member_joined',
      data:  {
        groupId: group._id,
        user:    { id: req.user._id, name: req.user.name, hostelNo: req.user.hostelNo },
        seatsRemaining,
      },
    });

    logger.info(`User ${req.user._id} joined group ${group._id}`);
    res.json({ ok: true, membership });
  } catch (err) {
    await session.abortTransaction();
    logger.error(`joinGroup error: ${err.message}`);
    res.status(500).json({ errorCode: 'SERVER_ERROR', message: 'Could not join group' });
  } finally {
    session.endSession();
  }
};

// ─── LEAVE GROUP ──────────────────────────────────────────────────────────────
// POST /api/v1/groups/:id/leave
export const leaveGroup = async (req, res) => {
  try {
    const membership = await Membership.findOne({
      groupId: req.params.id,
      userId:  req.user._id,
      status:  'joined',
    });

    if (!membership)
      return res.status(404).json({ errorCode: 'NOT_MEMBER', message: 'You are not in this group' });

    if (membership.isCreator)
      return res.status(400).json({ errorCode: 'CREATOR_CANT_LEAVE', message: 'Creator cannot leave; cancel the group instead' });

    membership.status = 'left';
    membership.leftAt = new Date();
    await membership.save();

    await Group.findByIdAndUpdate(req.params.id, { $inc: { seatsTaken: -1 } });

    req.io.to(`group:${req.params.id}`).emit('group:member_left', {
      data: { groupId: req.params.id, userId: req.user._id, userName: req.user.name },
    });

    res.json({ ok: true });
  } catch (err) {
    logger.error(`leaveGroup: ${err.message}`);
    res.status(500).json({ errorCode: 'SERVER_ERROR' });
  }
};

// ─── CONFIRM GROUP ────────────────────────────────────────────────────────────
// POST /api/v1/groups/:id/confirm  (creator only)
export const confirmGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ errorCode: 'NOT_FOUND' });

    if (group.creatorId.toString() !== req.user._id.toString())
      return res.status(403).json({ errorCode: 'FORBIDDEN', message: 'Only creator can confirm' });

    if (group.status !== 'open')
      return res.status(400).json({ errorCode: 'INVALID_STATUS', message: 'Group is not open' });

    group.status      = 'confirmed';
    group.vehicleInfo = req.body.vehicleInfo || group.vehicleInfo;
    group.meetingPoint= req.body.meetingPoint|| group.meetingPoint;
    await group.save();

    // Fetch all joined members
    const memberships = await Membership.find({ groupId: group._id, status: 'joined' })
      .populate('userId', 'name email contactNo');

    const memberList = memberships.map((m) => ({
      id: m.userId._id, name: m.userId.name, contactNo: m.userId.contactNo,
    }));

    // Notify every member
    await Promise.all(
      memberships.map(async (m) => {
        if (m.userId._id.toString() === req.user._id.toString()) return; // skip creator
        await Notification.create({
          userId:  m.userId._id,
          type:    'group_confirmed',
          payload: { groupId: group._id, groupTitle: group.title, vehicleInfo: group.vehicleInfo },
        });
        // Email notification
        try {
          await sendGroupConfirmedEmail(m.userId.email, group.title, group.vehicleInfo, group.meetingPoint);
        } catch (_) { /* non-fatal */ }
      })
    );

    req.io.to(`group:${group._id}`).emit('group:confirmed', {
      groupId:      group._id,
      vehicleInfo:  group.vehicleInfo,
      meetingPoint: group.meetingPoint,
      members:      memberList,
    });

    logger.info(`Group ${group._id} confirmed by ${req.user._id}`);
    res.json(group);
  } catch (err) {
    logger.error(`confirmGroup: ${err.message}`);
    res.status(500).json({ errorCode: 'SERVER_ERROR' });
  }
};

// ─── CANCEL GROUP ─────────────────────────────────────────────────────────────
// DELETE /api/v1/groups/:id
export const cancelGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ errorCode: 'NOT_FOUND' });

    const isCreator = group.creatorId.toString() === req.user._id.toString();
    if (!isCreator && req.user.role !== 'admin')
      return res.status(403).json({ errorCode: 'FORBIDDEN' });

    group.status = 'cancelled';
    await group.save();

    // Notify all members
    const memberships = await Membership.find({ groupId: group._id, status: 'joined' })
      .populate('userId', 'name email');

    await Promise.all(
      memberships.map(async (m) => {
        if (m.userId._id.toString() === req.user._id.toString()) return;
        await Notification.create({
          userId:  m.userId._id,
          type:    'group_cancelled',
          payload: { groupId: group._id, groupTitle: group.title },
        });
        try {
          await sendGroupCancelledEmail(m.userId.email, group.title);
        } catch (_) { /* non-fatal */ }
      })
    );

    req.io.to(`group:${group._id}`).emit('group:updated', { group });
    res.json({ ok: true });
  } catch (err) {
    logger.error(`cancelGroup: ${err.message}`);
    res.status(500).json({ errorCode: 'SERVER_ERROR' });
  }
};

// ─── KICK MEMBER ──────────────────────────────────────────────────────────────
// POST /api/v1/groups/:id/kick
export const kickMember = async (req, res) => {
  const { userId } = req.body;
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ errorCode: 'NOT_FOUND' });

    const isCreator = group.creatorId.toString() === req.user._id.toString();
    if (!isCreator && req.user.role !== 'admin')
      return res.status(403).json({ errorCode: 'FORBIDDEN' });

    const membership = await Membership.findOne({ groupId: group._id, userId, status: 'joined' });
    if (!membership)
      return res.status(404).json({ errorCode: 'NOT_MEMBER' });

    if (membership.isCreator)
      return res.status(400).json({ errorCode: 'CANNOT_KICK_CREATOR' });

    membership.status = 'rejected';
    membership.leftAt = new Date();
    await membership.save();
    await Group.findByIdAndUpdate(group._id, { $inc: { seatsTaken: -1 } });

    req.io.to(`group:${group._id}`).emit('group:member_left', {
      data: { groupId: group._id, userId, kicked: true },
    });

    res.json({ ok: true });
  } catch (err) {
    logger.error(`kickMember: ${err.message}`);
    res.status(500).json({ errorCode: 'SERVER_ERROR' });
  }
};

// ─── GET MEMBERS ──────────────────────────────────────────────────────────────
// GET /api/v1/groups/:id/members
export const getMembers = async (req, res) => {
  try {
    const viewerIsMember = await isMember(req.params.id, req.user?._id);
    const memberships = await Membership.find({ groupId: req.params.id, status: 'joined' })
      .populate('userId', 'name hostelNo avatarUrl contactNo collegeId');

    const members = memberships.map((m) => {
      const u = m.userId.toObject();
      if (!viewerIsMember) delete u.contactNo;
      return { ...u, isCreator: m.isCreator, joinedAt: m.joinedAt };
    });

    res.json({ members });
  } catch (err) {
    res.status(500).json({ errorCode: 'SERVER_ERROR' });
  }
};
