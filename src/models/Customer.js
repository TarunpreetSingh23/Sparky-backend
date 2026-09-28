import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  name: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'], default: 'prefer_not_to_say' },
  dateOfBirth: Date,
  profilePhoto: String,
  currentCity: { type: String, default: 'amritsar', index: true },
  preferredCityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
  preferProfessionalGender: { type: String, enum: ['female', 'male', 'any'], default: 'any' },
  communicationLang: { type: String, enum: ['hi', 'pa', 'en'], default: 'en' },
  walletBalance: { type: Number, default: 0 }, // in paise
  loyaltyCoins: { type: Number, default: 0 },
  totalCoinsEarned: { type: Number, default: 0 },
  membershipPlan: { type: String, enum: [null, 'sparky_plus', 'FREE', 'PLUS', 'ELITE'], default: null },
  membershipExpiresAt: Date,
  referralCode: { type: String, unique: true, sparse: true, index: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  totalBookings: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 }, // in paise
}, { timestamps: true });

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
