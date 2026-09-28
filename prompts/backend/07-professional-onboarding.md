# 07 — Professional Onboarding

## 1. Role
Backend Developer & Architect

## 2. Objective
Implement the complete professional registration and KYC document upload flow, including admin review processing and status transitions.

## 3. Read Before Coding
- `c:/RAG-frontend/mdfile/doc8_database_specification.md`
- `c:/RAG-frontend/mdfile/MASTER_IMPLEMENTATION_BLUEPRINT.md`

## 4. Existing Architecture
- Professional and User models exist.
- Cloudinary setup for media (assume library config exists).

## 5. Requirements
- Basic Registration API.
- KYC Document Upload API (Private Cloudinary bucket).
- Admin KYC review API with signed URL generation.
- Suspend API.
- Re-application flow on rejection.

## 6. Database Changes
```javascript
// models/ProfessionalDocument.js
const professionalDocumentSchema = new mongoose.Schema({
  professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', required: true },
  documentType: { type: String, enum: ['AADHAAR_FRONT', 'AADHAAR_BACK', 'PAN_CARD', 'SELFIE', 'POLICE_VERIFICATION', 'EXPERIENCE_CERT'], required: true },
  fileUrl: { type: String, required: true },
  verificationStatus: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  rejectionReason: String,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  verifiedAt: Date
}, { timestamps: true });
```

## 7. API Requirements
- `POST /api/professionals/register`
  Body: `{ name, gender, cityId, phone, password }`
  Logic: Creates User + Professional. Status -> 'APPLIED'.
- `POST /api/professionals/[id]/kyc`
  Body: form-data with files.
  Logic: Upload to Cloudinary private bucket. Store URLs. Status -> 'DOCUMENTS_PENDING'.
- `PATCH /api/admin/professionals/[id]/verify`
  Body: `{ status: 'APPROVED' | 'VERIFICATION_FAILED', reason }`
  Logic: Updates professional status. Sends WhatsApp notification (stub implementation).
- `GET /api/admin/professionals/[id]/documents`
  Logic: Returns signed URLs (24h expiry) for documents.
- `PATCH /api/admin/professionals/[id]/suspend`

## 8. Business Logic
- Status flow: APPLIED -> DOCUMENTS_PENDING -> UNDER_REVIEW -> APPROVED/VERIFICATION_FAILED -> TRAINING_PENDING -> TRAINING_COMPLETED -> ACTIVE
- Signed URL generation: Cloudinary private URLs must be signed before returning to Admin UI.

## 9. Validation
- Validate required file types.

## 10. Security
- Documents API ONLY accessible to HR_ADMIN or SUPER_ADMIN.
- Uploads must go to private bucket (prevent public access).

## 11. Error Handling
- `INVALID_FILE_TYPE` 400
- `UPLOAD_FAILED` 500
- `ALREADY_REGISTERED` 400

## 12. Edge Cases
- Re-application: If VERIFICATION_FAILED, allow re-upload of KYC docs, updating status back to UNDER_REVIEW.

## 13. Frontend Requirements
N/A

## 14. Backend Requirements
- Cloudinary signed URL service helper.

## 15. Testing
- Verify status transitions logic.
- Verify Admin access to signed URLs.

## 16. Files To Create
- `src/models/ProfessionalDocument.js`
- `src/app/api/professionals/register/route.js`
- `src/app/api/professionals/[id]/kyc/route.js`
- `src/app/api/admin/professionals/[id]/verify/route.js`
- `src/app/api/admin/professionals/[id]/documents/route.js`
- `src/app/api/admin/professionals/[id]/suspend/route.js`

## 17. Files To Modify
- None

## 18. Files NOT To Modify
- None

## 19. Completion Requirements
All API routes return exact JSON structure defined, Cloudinary upload stubbed if credentials not present.

## Acceptance Criteria
- [ ] Registration API creates both User and Professional documents.
- [ ] KYC Upload API accepts files and creates ProfessionalDocument records.
- [ ] Admin verify API transitions statuses and handles rejection reasons.
- [ ] Document retrieval API generates and returns 24h signed Cloudinary URLs.
- [ ] Suspend API changes status to SUSPENDED.
