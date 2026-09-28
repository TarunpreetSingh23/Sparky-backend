import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    match: [/^[6-9]\d{9}$/, 'Invalid Indian mobile number'],
    index: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['customer', 'professional', 'admin'],
    required: true,
    default: 'customer',
  },
  isActive: { type: Boolean, default: true },
  isPhoneVerified: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  googleId: String,
  lastLoginAt: Date,
  // Security
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  // Push notifications
  fcmTokens: [{ type: String }],
}, { timestamps: true });

// Do NOT return sensitive fields
UserSchema.methods.toSafeObject = function() {
  return {
    id: this._id,
    phone: this.phone,
    email: this.email,
    role: this.role,
    isActive: this.isActive,
    isPhoneVerified: this.isPhoneVerified,
    isEmailVerified: this.isEmailVerified,
  };
};

UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Avoid Mongoose Model compilation override errors during Next.js Hot Reloading
export default mongoose.models.User || mongoose.model('User', UserSchema);
