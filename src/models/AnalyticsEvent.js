import mongoose from 'mongoose';

const AnalyticsEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionId: { type: String, default: () => `sess_${Math.random().toString(36).substring(2)}` },
  event: { type: String },
  eventName: { type: String },
  category: { type: String },
  properties: { type: mongoose.Schema.Types.Mixed },
  metadata: { type: mongoose.Schema.Types.Mixed },
  city: String,
  platform: { type: String, default: 'web' },
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

export default mongoose.models.AnalyticsEvent || mongoose.model('AnalyticsEvent', AnalyticsEventSchema);
