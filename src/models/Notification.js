import mongoose from 'mongoose';

const ChannelStatusSchema = new mongoose.Schema({
  sent: { type: Boolean, default: false },
  sentAt: Date,
  error: String
}, { _id: false });

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true }, // e.g. 'booking_confirmed'
  title: String,
  body: String,
  data: { type: mongoose.Schema.Types.Mixed },
  
  channels: {
    push: { type: ChannelStatusSchema, default: () => ({}) },
    whatsapp: { type: ChannelStatusSchema, default: () => ({}) },
    sms: { type: ChannelStatusSchema, default: () => ({}) },
    email: { type: ChannelStatusSchema, default: () => ({}) }
  },
  
  isRead: { type: Boolean, default: false, index: true },
  readAt: Date
}, { timestamps: true });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
