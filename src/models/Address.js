import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  label: { type: String, enum: ['HOME', 'WORK', 'OTHER', 'Home', 'Office', 'Mom\'s place'], default: 'HOME' },
  addressLine1: { type: String, required: true },
  addressLine2: String,
  landmark: String,
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  coordinates: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

AddressSchema.index({ userId: 1, isActive: 1 });
AddressSchema.index({ coordinates: '2dsphere' });

export default mongoose.models.Address || mongoose.model('Address', AddressSchema);
