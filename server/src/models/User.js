// server/src/models/User.js
import mongoose from 'mongoose';
import { config } from '../config/index.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        // Must end with the configured college domain
        validator: (v) =>
          new RegExp(`@${config.collegeEmailDomain.replace('.', '\\.')}$`).test(v),
        message: `Email must be a @${config.collegeEmailDomain} address`,
      },
    },
    emailVerified: { type: Boolean, default: false },

    // passwordHash is optional — we support magic-link only flows too
    passwordHash: { type: String, select: false },

    // Profile fields — required before joining/creating groups
    collegeId: { type: String, trim: true },   // rollNo
    contactNo: { type: String, trim: true },
    hostelNo:  { type: String, trim: true },
    avatarUrl: { type: String, default: '' },

    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },

    suspended: { type: Boolean, default: false },

    // Email verification (magic link / OTP)
    verifyToken:       { type: String, select: false },
    verifyTokenExpiry: { type: Date,   select: false },

    // Hashed refresh tokens — we store up to 5 active sessions
    refreshTokens: { type: [String], select: false, default: [] },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ collegeId: 1 });

// ── Virtual: profileComplete ──────────────────────────────────────────────────
userSchema.virtual('profileComplete').get(function () {
  return !!(this.contactNo && this.hostelNo && this.collegeId && this.emailVerified);
});

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    // Never expose sensitive fields in JSON responses
    delete ret.passwordHash;
    delete ret.refreshTokens;
    delete ret.verifyToken;
    delete ret.verifyTokenExpiry;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
