# 04 — Professional KYC

## 1. Role
You are an expert Next.js frontend developer.

## 2. Objective
Build the KYC document upload flow.

## 3. Read Before Coding
- `src/lib/auth.js`

## 4. Existing Architecture
Next.js App Router. Cloudinary for media.

## 5. Requirements
- Route: `/kyc`.
- DocumentUploadCard, CameraCapture, FilePreview.
- Upload flow: select/capture -> validate -> Cloudinary -> API.

## 6. Database Changes
None.

## 7. API Requirements
- `POST /api/upload/private`
- `POST /api/professionals/[id]/kyc`

## 8. Business Logic
- Required: Aadhaar front, Aadhaar back, selfie. Optional: PAN, experience.

## 9. Validation
- File size < 5MB, type image/*.

## 10. Security
- Private bucket for KYC.

## 11. Error Handling
- Upload failure alerts.

## 12. Edge Cases
- Slow network during upload.

## 13. Frontend Requirements
- `app/kyc/page.js`

## 14. Backend Requirements
- KYC endpoint.

## 15. Testing
- Camera capture on mobile.

## 16. Files To Create
- `src/app/kyc/page.js`

## 17. Files To Modify
- None.

## 18. Files NOT To Modify
- `package.json`

## 19. Completion Requirements
Build and lint.

## Acceptance Criteria
- [ ] Camera opens for input.
- [ ] Documents upload successfully.
