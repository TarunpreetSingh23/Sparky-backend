import mongoose from 'mongoose';

const SafetyIncidentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  reporterRole: { type: String, enum: ['Customer', 'Professional'], required: true },
  incidentType: {
    type: String,
    enum: ['customer_threat', 'professional_threat', 'inappropriate_behaviour', 'property_damage', 'medical_emergency', 'other'],
    required: true
  },
  description: String,
  evidenceUrls: [{ type: String }], // Cloudinary URLs
  status: { type: String, enum: ['reported', 'investigating', 'resolved'], default: 'reported', index: true },
  priority: { type: String, enum: ['medium', 'high', 'critical'], required: true, index: true },
  adminNotes: String,
  location: { type: [Number] } // [longitude, latitude] at time of SOS
}, { timestamps: true });

export default mongoose.models.SafetyIncident || mongoose.model('SafetyIncident', SafetyIncidentSchema);
