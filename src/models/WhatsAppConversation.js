import mongoose from 'mongoose';

const WhatsAppConversationSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppCustomer', required: true, index: true },
  phone: { type: String, required: true, index: true },
  status: {
    type: String,
    enum: ['OPEN', 'CLOSED', 'WAITING_FOR_CUSTOMER', 'WAITING_FOR_AGENT'],
    default: 'OPEN',
    index: true,
  },
  mode: {
    type: String,
    enum: ['BOT', 'HUMAN', 'AI'],
    default: 'BOT',
    index: true,
  },
  currentState: {
    type: String,
    enum: [
      'MAIN_MENU',
      'BOOKING_CATEGORY',
      'BOOKING_SERVICE',
      'BOOKING_DETAILS',
      'TRACK_BOOKING',
      'FAQ',
      'SUPPORT',
      'WAITING_FOR_TICKET_DESCRIPTION',
      'HUMAN_HANDOFF',
      'CLOSED'
    ],
    default: 'MAIN_MENU',
    index: true,
  },
  currentIntent: { type: String },
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastMessageAt: { type: Date },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export default mongoose.models.WhatsAppConversation || mongoose.model('WhatsAppConversation', WhatsAppConversationSchema);
