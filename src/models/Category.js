import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  description: String,
  icon: String, // Emoji or icon URL
  imageUrl: String,
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true, index: true },
  genderApplicability: { type: String, enum: ['all', 'female', 'male'], default: 'all' },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
  metaTitle: String,
  metaDescription: String
}, { timestamps: true });

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);
