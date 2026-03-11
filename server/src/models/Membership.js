// server/src/models/Membership.js
import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['joined', 'left', 'rejected', 'pending'],
      default: 'joined',
    },
    isCreator: { type: Boolean, default: false },
    joinedAt:  { type: Date, default: Date.now },
    leftAt:    { type: Date },
  },
  { timestamps: true }
);

// ── Compound unique index: one membership record per (group, user) ─────────────
membershipSchema.index({ groupId: 1, userId: 1 }, { unique: true });
membershipSchema.index({ userId: 1 });   // fast "my groups" queries

export default mongoose.model('Membership', membershipSchema);
