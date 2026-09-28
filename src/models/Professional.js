import mongoose from 'mongoose';

const ProfessionalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  name: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  dateOfBirth: Date,
  profilePhoto: String, // Cloudinary URL
  cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
  homeAddress: {
    addressLine1: String,
    area: String,
    pincode: String,
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true } // [longitude, latitude]
    }
  },
  serviceRadius: { type: Number, default: 10 }, // in km
  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
    updatedAt: Date
  },
  verificationStatus: {
    type: String,
    enum: ['APPLIED', 'DOCUMENTS_PENDING', 'UNDER_REVIEW', 'APPROVED', 'VERIFICATION_FAILED', 'TRAINING_PENDING', 'TRAINING_COMPLETED', 'ACTIVE', 'SUSPENDED'],
    default: 'APPLIED',
    index: true
  },
  verifiedAt: Date,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin
  experienceYears: Number,
  skillIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
  serviceCategories: [{ type: String, index: true }], // ['beauty', 'spa', 'mehendi']
  languages: [{ type: String }], // ['punjabi', 'hindi']
  bio: String,
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  acceptanceRate: { type: Number, default: 100 },
  completionRate: { type: Number, default: 100 },
  cancellationRate: { type: Number, default: 0 },
  qualityScore: { type: Number, default: 100, index: true },
  bankAccountNumber: String,
  bankIFSC: String,
  bankAccountName: String,
  bankVerified: { type: Boolean, default: false },
  razorpayContactId: String,
  razorpayFundAccountId: String,
  totalEarnings: { type: Number, default: 0 }, // in paise
  pendingPayout: { type: Number, default: 0 }, // in paise
  isOnline: { type: Boolean, default: false, index: true },
  isActive: { type: Boolean, default: true },
  trainingCompletedAt: Date,
  trainingModules: [{
    moduleId: String,
    completedAt: Date,
    score: Number
  }]
}, { timestamps: true });

ProfessionalSchema.index({ currentLocation: '2dsphere' });
ProfessionalSchema.index({ 'homeAddress.coordinates': '2dsphere' });
ProfessionalSchema.index({ cityId: 1, verificationStatus: 1, isOnline: 1 });

export default mongoose.models.Professional || mongoose.model('Professional', ProfessionalSchema);
