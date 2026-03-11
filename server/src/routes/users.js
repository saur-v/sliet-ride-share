// server/src/routes/users.js
import express from 'express';
import { getMe, updateMe, getUserById } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';
import { updateProfileValidation, handleValidation } from '../middleware/validation.js';

const router = express.Router();

router.get('/me',  requireAuth, getMe);
router.put('/me',  requireAuth, updateProfileValidation, handleValidation, updateMe);
router.get('/:id', requireAuth, getUserById);

export default router;
