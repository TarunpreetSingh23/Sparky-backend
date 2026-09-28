import mongoose from 'mongoose';

const FAQSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { type: String },
  keywords: [{ type: String, index: true }],
  active: { type: Boolean, default: true, index: true },
  priority: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.FAQ || mongoose.model('FAQ', FAQSchema);
