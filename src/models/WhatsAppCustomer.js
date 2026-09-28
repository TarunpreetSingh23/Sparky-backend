import mongoose from 'mongoose';

const WhatsAppCustomerSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true, index: true },
  name: { type: String },
  email: { type: String },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', index: true },
  currentConversation: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppConversation' },
  botEnabled: { type: Boolean, default: true },
  humanHandoff: { type: Boolean, default: false },
  lastMessageAt: { type: Date },
}, { timestamps: true });

export default mongoose.models.WhatsAppCustomer || mongoose.model('WhatsAppCustomer', WhatsAppCustomerSchema);
