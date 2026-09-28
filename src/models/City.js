import mongoose from 'mongoose';

const CitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  state: { type: String, required: true },
  country: { type: String, default: 'IN' },
  center: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  boundary: {
    type: { type: String, enum: ['Polygon'], default: 'Polygon' },
    coordinates: { type: [[[Number]]], required: true } // Polygon boundary coordinates
  },
  isActive: { type: Boolean, default: true, index: true },
  launchDate: Date,
  metaTitle: String,
  metaDescription: String
}, { timestamps: true });

CitySchema.index({ center: '2dsphere' });
CitySchema.index({ boundary: '2dsphere' });

export default mongoose.models.City || mongoose.model('City', CitySchema);
