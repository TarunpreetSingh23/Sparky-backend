import mongoose from 'mongoose';

const WhatsAppMessageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppConversation', required: true, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppCustomer', required: true, index: true },
  phone: { type: String, required: true, index: true },
  whatsappMessageId: { type: String, unique: true, sparse: true, index: true },
  direction: { type: String, enum: ['INCOMING', 'OUTGOING'], required: true },
  messageType: { type: String, default: 'text' },
  text: { type: String },
  rawPayload: { type: mongoose.Schema.Types.Mixed },
  metadata: { type: mongoose.Schema.Types.Mixed },
  processed: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.WhatsAppMessage || mongoose.model('WhatsAppMessage', WhatsAppMessageSchema);
