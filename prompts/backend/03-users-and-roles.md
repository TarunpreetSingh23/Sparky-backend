# 03 — Users and Roles

## 1. Role
Backend Developer & Architect

## 2. Objective
Implement the domain-specific models and profiles for Customers, Professionals, and Admins, extending the base User model (from 02). Setup Role-Based Access Control (RBAC) helpers.

## 3. Read Before Coding
- `c:/RAG-frontend/mdfile/doc8_database_specification.md`
- `c:/RAG-frontend/mdfile/MASTER_IMPLEMENTATION_BLUEPRINT.md`
- `src/lib/auth.js`

## 4. Existing Architecture
- Next.js API Routes (App Router)
- Base User model exists with JWT auth in httpOnly cookies
- Mongoose for MongoDB

## 5. Requirements
- Create Customer, Professional (profile only), and Admin schemas extending base user.
- Implement RBAC permission matrix for Admin roles.
- Create generic RBAC enforcement helper function.
- Create APIs for accessing and updating profiles based on ownership/RBAC.

## 6. Database Changes
```javascript
// models/Customer.js
const customerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] },
  dob: Date,
  profilePhoto: String,
  currentCity: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
  walletBalance: { type: Number, default: 0 }, // paise
  loyaltyCoins: { type: Number, default: 0 },
  membershipPlan: { type: String, enum: ['FREE', 'PLUS', 'ELITE'], default: 'FREE' },
  referralCode: { type: String, unique: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  totalBookings: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 } // paise
}, { timestamps: true });

// models/Professional.js
const professionalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'] },
  cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
  homeAddress: {
    address: String,
    location: { type: { type: String, enum: ['Point'] }, coordinates: [Number] }
  },
  serviceRadius: { type: Number, default: 10000 }, // meters
  currentLocation: { type: { type: String, enum: ['Point'] }, coordinates: [Number] },
  verificationStatus: { type: String, enum: ['APPLIED', 'DOCUMENTS_PENDING', 'UNDER_REVIEW', 'APPROVED', 'VERIFICATION_FAILED', 'TRAINING_PENDING', 'TRAINING_COMPLETED', 'ACTIVE', 'SUSPENDED'], default: 'APPLIED' },
  experienceYears: Number,
  skillIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
  serviceCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  acceptanceRate: { type: Number, default: 100 },
  completionRate: { type: Number, default: 100 },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String
  },
  totalEarnings: { type: Number, default: 0 }, // paise
  isOnline: { type: Boolean, default: false }
}, { timestamps: true });

// models/Admin.js
const adminSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  adminRole: { type: String, enum: ['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'CITY_MANAGER', 'DISPATCH_MANAGER', 'CUSTOMER_SUPPORT', 'FINANCE_ADMIN', 'QUALITY_MANAGER', 'MARKETING_ADMIN', 'CONTENT_ADMIN', 'PROFESSIONAL_MANAGER', 'HR_ADMIN'], required: true },
  managedCities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'City' }]
}, { timestamps: true });
```
Indexes: `professionalSchema.index({ currentLocation: "2dsphere" });`

## 7. API Requirements
- `GET /api/customers/[id]`
  Auth: Required. Output: `{ success: true, data: { ...customer } }`
- `PATCH /api/customers/[id]`
  Auth: Required (Owner or Admin). Body: `{ name, gender, dob, profilePhoto }`
- `GET /api/professionals/[id]`
  Auth: Required.
- `PATCH /api/professionals/[id]`
  Auth: Required (Owner or Admin). Body: `{ name, gender, homeAddress, serviceRadius, bankDetails }`
- `GET /api/admin/users/[id]`
  Auth: Required (Admin only). Returns User + associated Profile.

## 8. Business Logic
- `checkRBAC(user, requiredRoles)` helper should check if user is admin and role is in `requiredRoles` array.
- Profile fetching must securely exclude sensitive info like bank details if requester is not the owner/finance admin.

## 9. Validation
- Validate coordinates are `[-180 to 180, -90 to 90]`.
- Verify mongoose ObjectIds are valid before querying.

## 10. Security
- Use `requireAuth(req)` to get user context.
- Ownership checks: A customer can only access/modify their own ID. E.g. `req.user.id !== req.params.id`.

## 11. Error Handling
- Invalid ID format -> `INVALID_ID` 400
- Profile not found -> `PROFILE_NOT_FOUND` 404
- Forbidden access -> `FORBIDDEN_ACCESS` 403

## 12. Edge Cases
- Requesting a profile for a userId that has no associated customer/professional doc.
- Modifying a professional profile when they are suspended.

## 13. Frontend Requirements (if applicable)
N/A (Backend only)

## 14. Backend Requirements (if applicable)
- Create `src/lib/rbac.js` for RBAC utilities.
- Controller and Service separation for User Profiles.

## 15. Testing
- Verify that a customer cannot GET/PATCH another customer's profile.
- Verify that SUPER_ADMIN can GET any profile.

## 16. Files To Create
- `src/models/Customer.js`
- `src/models/Professional.js`
- `src/models/Admin.js`
- `src/lib/rbac.js`
- `src/app/api/customers/[id]/route.js`
- `src/app/api/professionals/[id]/route.js`
- `src/app/api/admin/users/[id]/route.js`

## 17. Files To Modify
- None

## 18. Files NOT To Modify
- `src/models/User.js`

## 19. Completion Requirements
Code lints clean, schemas are exported, routes handle basic CRUD.

## Acceptance Criteria
- [ ] Mongoose schemas for Customer, Professional, Admin created accurately.
- [ ] 2dsphere index on Professional currentLocation.
- [ ] RBAC helper implemented.
- [ ] GET/PATCH APIs for Customer/Professional created with ownership checks.
- [ ] Admin GET API for users created with RBAC.
