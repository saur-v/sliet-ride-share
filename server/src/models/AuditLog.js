// server/src/models/AuditLog.js
// Records every admin action for accountability.
import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action:     { type: String, required: true },   // e.g. "suspend_user", "cancel_group"
    targetType: { type: String, required: true },   // "user" | "group"
    targetId:   { type: mongoose.Schema.Types.ObjectId, required: true },
    meta:       { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });

export default mongoose.model('AuditLog', auditLogSchema);
