# 26 - File Storage

## 1. Role
Backend Developer / Cloudinary Integration Specialist

## 2. Objective
Implement secure file storage integration using Cloudinary for both public files (service images, profile photos) and private files (KYC documents like Aadhaar, PAN) using signed URLs.

## 3. Read Before Coding
- `src/lib/cloudinary.js` (to be created)
- Cloudinary Node.js SDK documentation
- DPDP Act guidelines for data retention

## 4. Existing Architecture
- Next.js App Router API routes
- Authentication middleware (`src/lib/auth.js`)
- MongoDB models

## 5. Requirements
- Create `src/lib/cloudinary.js` with Cloudinary configuration.
- Setup two types of upload flows: Public (direct URL access) and Private (signed URL access).
- Public uploads: max 5MB, JPEG/PNG only. Bucket: public.
- Private uploads: max 10MB, JPEG/PNG/PDF. Bucket: private.
- Never store direct Cloudinary URLs for private documents in the database, only store `public_id`.
- Generate 24-hour signed URLs for accessing private documents.
- Implement server-side MIME type validation (not just file extension).
- Setup automated deletion of documents 30 days after a professional is deactivated.

## 6. Database Changes
Update `Professional` schema:
```javascript
documents: {
  aadhaar: { publicId: String, uploadedAt: Date },
  pan: { publicId: String, uploadedAt: Date },
  experienceCert: { publicId: String, uploadedAt: Date }
},
profilePhoto: { url: String, publicId: String }
```

## 7. API Requirements
1. `POST /api/upload/public`
   - Auth: Required (Any role)
   - Request: `multipart/form-data` with `file`
   - Validation: Max 5MB, JPEG/PNG.
   - Response: `{ success: true, data: { url: '...', publicId: '...' } }`
2. `POST /api/upload/private`
   - Auth: Required (Professional only)
   - Request: `multipart/form-data` with `file`, `docType` (aadhaar, pan, etc.)
   - Validation: Max 10MB, JPEG/PNG/PDF.
   - Response: `{ success: true, data: { publicId: '...' } }`
3. `GET /api/admin/professionals/:id/documents/:docType`
   - Auth: Required (Admin only)
   - Response: `{ success: true, data: { signedUrl: '...', expiresAt: '...' } }`

## 8. Business Logic
- Validate incoming file MIME types using a library like `file-type` or strict buffer checking.
- For private files, configure Cloudinary upload to `type: 'private'`.
- Generate signed URLs using `cloudinary.utils.private_download_url` with 24-hour expiration.

## 9. Validation
- Frontend: File size and type checks before upload.
- Backend: Authoritative size and MIME type checks.

## 10. Security
- Private files must NOT be accessible without a signed URL.
- Admin APIs require strict RBAC check.
- File uploads must not execute malicious code.

## 11. Error Handling
- `FILE_TOO_LARGE`: > 5MB/10MB.
- `INVALID_FILE_TYPE`: Incorrect MIME.
- `UPLOAD_FAILED`: Cloudinary API error.

## 12. Edge Cases
- Network interruption during upload.
- Malformed files with fake extensions.

## 13. Frontend Requirements
- Upload components with progress bars.

## 14. Backend Requirements
- `src/lib/cloudinary.js` config and helper methods.
- Upload API routes.

## 15. Testing
- Test MIME type spoofing (e.g., PHP file renamed to PNG).
- Test file size limits.
- Test signed URL expiry.

## 16. Files To Create
- `src/lib/cloudinary.js`
- `src/app/api/upload/public/route.js`
- `src/app/api/upload/private/route.js`
- `src/app/api/admin/professionals/[id]/documents/[docType]/route.js`

## 17. Files To Modify
- `src/models/Professional.js`

## 18. Files NOT To Modify
- `src/lib/auth.js`

## 19. Completion Requirements
- Run linter.

## Acceptance Criteria
- [ ] Public upload accepts PNG/JPEG up to 5MB.
- [ ] Private upload accepts PNG/JPEG/PDF up to 10MB.
- [ ] Private files return signed URLs lasting 24 hours.
- [ ] MIME type checked strictly on backend.
