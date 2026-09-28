import mongoose from 'mongoose';

const ProfessionalEarningSchema = new mongoose.Schema({
  professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', required: true, index: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true, index: true },
  amount: { type: Number, required: true }, // in paise (integer)
  incentive: { type: Number, default: 0 }, // in paise
  status: { type: String, enum: ['pending', 'settled', 'failed'], default: 'pending', index: true },
  payoutId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProfessionalPayout', default: null, index: true },
  completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.ProfessionalEarning || mongoose.model('ProfessionalEarning', ProfessionalEarningSchema);
