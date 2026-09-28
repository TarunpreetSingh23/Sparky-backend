import mongoose from 'mongoose';

const LocationHistorySchema = new mongoose.Schema({
  professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', required: true, index: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', index: true },
  coordinates: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  timestamp: { type: Date, default: Date.now, index: { expireAfterSeconds: 30 * 24 * 60 * 60 } } // Auto-delete after 30 days
}, { timestamps: true });

LocationHistorySchema.index({ coordinates: '2dsphere' });

export default mongoose.models.LocationHistory || mongoose.model('LocationHistory', LocationHistorySchema);
