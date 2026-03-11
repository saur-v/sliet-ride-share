// server/src/routes/admin.js
import express from 'express';
import { getStats, suspendUser, suspendGroup, getAuditLogs, listUsers } from '../controllers/adminController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
const router = express.Router();
router.use(requireAuth, requireAdmin);       // all admin routes need auth + admin role
router.get('/stats',             getStats);
router.get('/users',             listUsers);
router.post('/suspend-user/:id', suspendUser);
router.post('/suspend-group/:id',suspendGroup);
router.get('/audit-logs',        getAuditLogs);
export default router;
