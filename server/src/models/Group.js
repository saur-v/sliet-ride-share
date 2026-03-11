// server/src/models/Group.js
import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: 3,
      maxlength: 120,
    },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    origin: {
      type: String,
      required: [true, 'Origin is required'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Ride date is required'],
    },
    time: {
      type: String,           // "21:00" — stored as string, displayed in local TZ
      required: [true, 'Ride time is required'],
      match: [/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'],
    },
    seatsTotal: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    seatsTaken: {
      type: Number,
      default: 0,
      min: 0,
    },
    seatPrice: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['open', 'confirmed', 'cancelled', 'completed'],
      default: 'open',
    },

    meetingPoint: { type: String, trim: true, default: '' },
    vehicleInfo: { type: String, trim: true, default: '' }, // set on confirm

    // If true, members can join even after creator confirms
    allowPostConfirmJoin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
groupSchema.index({ date: 1, time: 1 });
groupSchema.index({ origin: 1 });
groupSchema.index({ destination: 1 });
groupSchema.index({ status: 1 });

// ── Virtual: seatsRemaining ───────────────────────────────────────────────────
groupSchema.virtual('seatsRemaining').get(function () {
  return this.seatsTotal - this.seatsTaken;
});

groupSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Group', groupSchema);
