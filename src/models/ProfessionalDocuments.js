import mongoose from 'mongoose';

const ProfessionalDocumentsSchema = new mongoose.Schema({
  professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', required: true, index: true },
  documents: {
    aadhaar: {
      frontImageUrl: String, // Cloudinary private URL
      backImageUrl: String,
      selfieWithAadhaarUrl: String,
      maskedNumber: String, // 'XXXX XXXX 1234'
      verificationStatus: { type: String, enum: ['pending', 'verified', 'failed'], default: 'pending' },
      verifiedAt: Date,
    },
    pan: {
      imageUrl: String,
      maskedNumber: String, // 'ABCXX1234X'
      verificationStatus: { type: String, enum: ['pending', 'verified', 'failed'], default: 'pending' },
      verifiedAt: Date,
    },
    experienceCertificates: [{
      url: String,
      description: String,
      uploadedAt: { type: Date, default: Date.now },
    }],
    policeVerification: {
      status: { type: String, enum: ['pending', 'clear', 'failed'], default: 'pending' },
      certificate: String, // URL if provided
      verifiedAt: Date,
    }
  },
  uploadedAt: { type: Date, default: Date.now },
  reviewedAt: Date,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin
}, { timestamps: true });

export default mongoose.models.ProfessionalDocuments || mongoose.model('ProfessionalDocuments', ProfessionalDocumentsSchema);
