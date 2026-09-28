import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  adminRole: {
    type: String,
    enum: [
      'SUPER_ADMIN',
      'OPERATIONS_ADMIN',
      'CUSTOMER_SUPPORT',
      'FINANCE_ADMIN',
      'MARKETING_ADMIN',
      'SAFETY_OFFICER',
      'HR_ADMIN',
      'CONTENT_ADMIN',
      'DISPATCH_MANAGER',
      'PROFESSIONAL_MANAGER'
    ],
    required: true,
    default: 'OPERATIONS_ADMIN'
  },
  managedCities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
