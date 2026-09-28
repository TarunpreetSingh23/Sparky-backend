import mongoose from 'mongoose';

const WalletTransactionSchema = new mongoose.Schema({
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true }, // in paise
  balanceBefore: { type: Number, required: true }, // in paise
  balanceAfter: { type: Number, required: true }, // in paise
  reason: {
    type: String,
    enum: ['booking_refund', 'referral_reward', 'loyalty', 'manual', 'cancellation_credit'],
    required: true
  },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  referenceType: { type: String, enum: ['booking', 'referral', 'loyalty', 'manual'] },
  description: String
}, { timestamps: true });

export default mongoose.models.WalletTransaction || mongoose.model('WalletTransaction', WalletTransactionSchema);
