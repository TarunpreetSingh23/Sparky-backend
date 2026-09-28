# 29 - Security Hardening

## 1. Role
Security Engineer

## 2. Objective
Perform a security hardening pass across the entire backend.

## 3. Read Before Coding
- OWASP Top 10

## 4. Existing Architecture
- Complete Next.js application

## 5. Requirements
1. IDOR Prevention: Enforce ownership checks.
2. Input Sanitization: Strip MongoDB operators ($, .).
3. Rate Limiting: Apply to all auth/sensitive endpoints.
4. Injection Prevention: Parameterized queries only.
5. Webhooks: Signature verification check.
6. Secret Rotation: Review .env usage.
7. Error Messages: Hide stack traces and internal IDs.
8. File Uploads: Strict MIME type validation.
9. Phone Masking: Mask phone numbers in logs and normal API responses.
10. JWT: 15m access, 30d refresh.

## 6. Database Changes
None.

## 7. API Requirements
All endpoints affected.

## 8. Business Logic
- Implement middleware or utility for sanitization and masking.

## 9. Validation
- Global strict validation.

## 10. Security
- Everything.

## 11. Error Handling
- Secure error formatting.

## 12. Edge Cases
- Edge cases in sanitizing valid inputs.

## 13. Frontend Requirements
- N/A

## 14. Backend Requirements
- Security utility files.

## 15. Testing
- Test injection payloads.

## 16. Files To Create
- `src/lib/security.js`

## 17. Files To Modify
- `src/lib/auth.js`
- `src/middleware.js`
- Global error handler.

## 18. Files NOT To Modify
- UI files.

## 19. Completion Requirements
- Run linter.

## Acceptance Criteria
- [ ] MongoDB operators stripped from inputs.
- [ ] Phone numbers masked in non-admin responses.
- [ ] Errors never expose stack traces.
