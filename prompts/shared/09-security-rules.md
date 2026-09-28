# 09 - Security Rules

## Top Rules
1. Never trust client input.
2. Verify ownership on ALL requests.
3. Hash OTPs (bcrypt).
4. No PII in logs.
5. Parameterized queries only.
6. Verify Webhook HMAC signatures.
7. Use Signed URLs for private files.
8. Rate limit sensitive endpoints.
9. httpOnly JWTs.
10. Validate file MIME types.
