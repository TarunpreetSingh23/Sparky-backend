import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true },
  description: String,
  shortDescription: String,
  imageUrl: String,
  videoUrl: String,
  includedItems: [{ type: String }],
  durationMinutes: { type: Number, required: true, default: 30 },
  availableCities: [{ type: String, index: true }], // ['amritsar', 'ludhiana']
  requiredSkills: [{ type: String }], // ['waxing', 'rica_wax']
  requiredGender: { type: String, enum: ['any', 'female', 'male'], default: 'any' },
  genderApplicability: { type: String, enum: ['all', 'female', 'male'], default: 'all' },
  isActive: { type: Boolean, default: true, index: true },
  isFeatured: { type: Boolean, default: false, index: true },
  sortOrder: { type: Number, default: 0 },
  metaTitle: String,
  metaDescription: String,
  keywords: [{ type: String }],
  avgRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  bookingCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.Service || mongoose.model('Service', ServiceSchema);
