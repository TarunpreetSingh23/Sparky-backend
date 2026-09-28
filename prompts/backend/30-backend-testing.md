# 30 - Backend Testing

## 1. Role
QA / Backend Developer

## 2. Objective
Implement robust API test suites using Jest, supertest, and mongodb-memory-server.

## 3. Read Before Coding
- Jest documentation

## 4. Existing Architecture
- Next.js API Routes

## 5. Requirements
- Setup Jest environment for Next.js API.
- Use `mongodb-memory-server` for test database.
- Mock MSG91, Razorpay, Firebase.
- Test suites: Auth, Booking, Pricing, Payment, Dispatch, Admin RBAC.
- Pre-commit hook integration.

## 6. Database Changes
None.

## 7. API Requirements
N/A

## 8. Business Logic
N/A

## 9. Validation
N/A

## 10. Security
N/A

## 11. Error Handling
Test all error states.

## 12. Edge Cases
- Zero discount, max cap discount, surge.

## 13. Frontend Requirements
N/A

## 14. Backend Requirements
- Test files in `src/__tests__/`.

## 15. Testing
- Target 70%+ coverage on business logic.

## 16. Files To Create
- `jest.config.js`
- `src/__tests__/setup.js`
- `src/__tests__/api/auth.test.js`
- `src/__tests__/api/booking.test.js`

## 17. Files To Modify
- `package.json`

## 18. Files NOT To Modify
- Production code.

## 19. Completion Requirements
- Run tests.

## Acceptance Criteria
- [ ] Jest runs successfully with in-memory Mongo.
- [ ] Minimum test suites created for core flows.
