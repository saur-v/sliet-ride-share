// server/src/routes/groups.js
import express from 'express';
import {
  createGroup, getGroups, getGroup, updateGroup,
  cancelGroup, joinGroup, leaveGroup, confirmGroup,
  kickMember, getMembers,
} from '../controllers/groupController.js';
import { requireAuth, requireProfileComplete } from '../middleware/auth.js';
import { groupCreateLimiter } from '../middleware/rateLimit.js';
import {
  createGroupValidation, updateGroupValidation, handleValidation,
} from '../middleware/validation.js';
import { body } from 'express-validator';

const router = express.Router();

router.get('/',     getGroups);
router.post('/',    requireAuth, requireProfileComplete, groupCreateLimiter, createGroupValidation, handleValidation, createGroup);

router.get('/:id',    requireAuth, getGroup);
router.put('/:id',    requireAuth, updateGroupValidation, handleValidation, updateGroup);
router.delete('/:id', requireAuth, cancelGroup);

router.post('/:id/join',    requireAuth, requireProfileComplete, joinGroup);
router.post('/:id/leave',   requireAuth, leaveGroup);
router.post('/:id/confirm', requireAuth, confirmGroup);
router.post('/:id/kick',    requireAuth, [body('userId').notEmpty()], handleValidation, kickMember);
router.get('/:id/members',  requireAuth, getMembers);

export default router;
