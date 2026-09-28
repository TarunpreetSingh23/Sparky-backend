import mongoose from 'mongoose';

const WalletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  balance: { type: Number, default: 0 }, // in paise (integer)
  currency: { type: String, default: 'INR' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.Wallet || mongoose.model('Wallet', WalletSchema);
