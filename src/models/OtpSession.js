import mongoose from 'mongoose';

const OtpSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  phone: { type: String, required: true, index: true },
  otpHash: { type: String, required: true }, // bcrypt hash of OTP
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 5 },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } }, // TTL index
  isUsed: { type: Boolean, default: false },
  usedAt: Date,
  ipAddress: String,
}, { timestamps: true });

export default mongoose.models.OtpSession || mongoose.model('OtpSession', OtpSessionSchema);
