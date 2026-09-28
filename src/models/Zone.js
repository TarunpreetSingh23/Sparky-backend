import mongoose from 'mongoose';

const ZoneSchema = new mongoose.Schema({
  cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true, index: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, index: true },
  boundary: {
    type: { type: String, enum: ['Polygon'], default: 'Polygon' },
    coordinates: { type: [[[Number]]], required: true }
  },
  pricingMultiplier: { type: Number, default: 1.0 },
  surgeActive: { type: Boolean, default: false },
  surgeMultiplier: { type: Number, default: 1.0 },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

ZoneSchema.index({ boundary: '2dsphere' });

export default mongoose.models.Zone || mongoose.model('Zone', ZoneSchema);
