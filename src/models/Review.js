import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', required: true, index: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
  
  // Ratings
  overallRating: { type: Number, required: true, min: 1, max: 5 },
  professionalRating: { type: Number, min: 1, max: 5 },
  serviceQualityRating: { type: Number, min: 1, max: 5 },
  punctualityRating: { type: Number, min: 1, max: 5 },
  cleanlinessRating: { type: Number, min: 1, max: 5 },
  
  // Content
  reviewText: { type: String, maxlength: 1000 },
  positiveTagIds: [{ type: String }], // ['punctual', 'professional', 'clean']
  photos: [{ type: String }], // Cloudinary URLs
  
  // Moderation
  isApproved: { type: Boolean, default: true },
  isFlagged: { type: Boolean, default: false },
  flagReason: String,
  
  // Responses
  professionalResponse: { type: String, maxlength: 1000 },
  isAnonymous: { type: Boolean, default: false }
}, { timestamps: true });

ReviewSchema.index({ serviceId: 1, createdAt: -1 });
ReviewSchema.index({ professionalId: 1, createdAt: -1 });

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);
