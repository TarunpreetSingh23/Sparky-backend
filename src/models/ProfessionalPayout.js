import mongoose from 'mongoose';

const ProfessionalPayoutSchema = new mongoose.Schema({
  professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', required: true, index: true },
  period: {
    from: { type: Date, required: true },
    to: { type: Date, required: true }
  },
  totalServiceEarnings: { type: Number, required: true }, // in paise
  totalIncentives: { type: Number, default: 0 }, // in paise
  totalDeductions: { type: Number, default: 0 }, // in paise
  tdsDeducted: { type: Number, default: 0 }, // in paise
  netPayable: { type: Number, required: true }, // in paise
  bookingIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
  
  // Razorpay X integration
  razorpayPayoutId: String,
  status: { type: String, enum: ['pending', 'processing', 'paid', 'failed'], default: 'pending', index: true },
  processedAt: Date,
  failureReason: String,
  retryCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.ProfessionalPayout || mongoose.model('ProfessionalPayout', ProfessionalPayoutSchema);
