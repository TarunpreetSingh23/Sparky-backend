import mongoose from 'mongoose';

const ServicePackageSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
  name: { type: String, required: true },
  description: String,
  basePrice: { type: Number, required: true }, // in paise (integer)
  productCost: { type: Number, default: 0 }, // in paise
  professionalPayout: { type: Number, required: true }, // in paise (what pro gets)
  platformCommission: { type: Number, required: true }, // in paise
  gstPercent: { type: Number, default: 18 },
  gstAmount: { type: Number, default: 0 }, // in paise
  durationMinutes: { type: Number, required: true, default: 30 },
  isActive: { type: Boolean, default: true, index: true },
  isDefault: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.ServicePackage || mongoose.model('ServicePackage', ServicePackageSchema);
