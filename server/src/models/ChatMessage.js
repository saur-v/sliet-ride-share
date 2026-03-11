// server/src/models/ChatMessage.js
import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
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
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    edited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Fetch last N messages for a group efficiently
chatMessageSchema.index({ groupId: 1, createdAt: -1 });

export default mongoose.model('ChatMessage', chatMessageSchema);
