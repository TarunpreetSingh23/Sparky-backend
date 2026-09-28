import mongoose from 'mongoose';

const ServiceAddonSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true }, // in paise (integer)
  professionalPayout: { type: Number, required: true }, // in paise
  durationMinutes: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true, index: true },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.ServiceAddon || mongoose.model('ServiceAddon', ServiceAddonSchema);
