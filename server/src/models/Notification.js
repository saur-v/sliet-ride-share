// server/src/models/Notification.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['group_invite', 'member_joined', 'group_confirmed', 'message', 'admin', 'group_cancelled', 'member_left'],
      required: true,
    },
    // Flexible payload — stores context like groupId, groupTitle, actorName, etc.
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
