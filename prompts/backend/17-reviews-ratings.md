# 17 — Reviews and Ratings

## 1. Role
You are a senior backend engineer implementing the Reviews and Ratings system for Sparky.

## 2. Objective
Build a review and rating system where customers can rate professionals after a completed booking, updating aggregate ratings in real-time.

## 3. Read Before Coding
- `src/models/Booking.js`
- `src/models/Professional.js`
- `src/models/Service.js`
- `src/lib/auth.js`

## 4. Existing Architecture
Next.js API routes with MongoDB/Mongoose. Auth uses JWT httpOnly cookies.

## 5. Requirements
- Customers can submit one review per booking, only if the status is `COMPLETED`, within 7 days.
- Reviews include a 1-5 overall rating and specific criteria ratings.
- Max 1000 chars for review text, max 3 Cloudinary photo URLs.
- Aggregate ratings for the Professional and Service must be updated atomically on review creation.
- Admin can flag/unflag reviews; professionals can respond.

## 6. Database Changes
```javascript
// src/models/Review.js
const reviewSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  overallRating: { type: Number, required: true, min: 1, max: 5 },
  professionalRating: { type: Number, min: 1, max: 5 },
  serviceQualityRating: { type: Number, min: 1, max: 5 },
  punctualityRating: { type: Number, min: 1, max: 5 },
  cleanlinessRating: { type: Number, min: 1, max: 5 },
  reviewText: { type: String, maxlength: 1000 },
  positiveTagIds: [{ type: String }],
  photos: [{ type: String }], // Cloudinary URLs
  isApproved: { type: Boolean, default: true },
  isFlagged: { type: Boolean, default: false },
  professionalResponse: { type: String, maxlength: 1000 },
}, { timestamps: true });

reviewSchema.index({ serviceId: 1, createdAt: -1 });
reviewSchema.index({ professionalId: 1, createdAt: -1 });
```

## 7. API Requirements
- `POST /api/reviews`
  - Auth: Customer
  - Request: `{ bookingId, overallRating, reviewText, photos, ... }`
  - Response: `{ success: true, data: { review } }`
- `GET /api/reviews`
  - Query: `serviceId` or `professionalId`, `page`, `limit`
  - Response: Paginated reviews.

## 8. Business Logic
- Check booking status `COMPLETED` and time since completion <= 7 days.
- Check if review already exists.
- Atomic updates:
  ```javascript
  // Update professional rating
  const p = await Professional.findById(professionalId);
  p.rating = ((p.rating * p.reviewCount) + newRating) / (p.reviewCount + 1);
  p.reviewCount += 1;
  await p.save();
  ```

## 9. Validation
- `bookingId` exists and belongs to the customer.
- Ratings must be integers between 1 and 5.
- Max 3 photos.

## 10. Security
- Verify JWT for `customerId`.
- Authorization: only the customer of the booking can write a review.

## 11. Error Handling
- `BOOKING_NOT_FOUND`
- `BOOKING_NOT_COMPLETED`
- `REVIEW_TIME_EXPIRED`
- `REVIEW_ALREADY_EXISTS`

## 12. Edge Cases
- Professional gets 0 reviews initial state.
- Floating point precision issues with ratings.

## 13. Frontend Requirements (if applicable)
N/A

## 14. Backend Requirements (if applicable)
- Create `src/models/Review.js`
- Create controllers and services for reviews.

## 15. Testing
- Test atomic updates on Professional and Service models.
- Test double-submission of review.
- Test out-of-bounds ratings.

## 16. Files To Create
- `src/models/Review.js`
- `src/app/api/reviews/route.js`

## 17. Files To Modify
- `src/models/Professional.js`
- `src/models/Service.js`

## 18. Files NOT To Modify
- `src/lib/db.js`

## 19. Completion Requirements
- Build passes without errors.
- Endpoints successfully tested via cURL or Postman.

## Acceptance Criteria
- [ ] Review creation succeeds for valid booking.
- [ ] Professional and Service models' ratings are updated.
- [ ] Returns error if booking not COMPLETED.
- [ ] Returns error if review > 7 days after completion.
