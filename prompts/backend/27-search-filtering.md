# 27 - Search and Filtering

## 1. Role
Backend API Developer

## 2. Objective
Implement robust search and filtering for services and categories using MongoDB text search.

## 3. Read Before Coding
- MongoDB Text Search Documentation

## 4. Existing Architecture
- Standard Next.js App Router API Routes
- MongoDB + Mongoose

## 5. Requirements
- Implement `GET /api/search` for global search.
- Implement `GET /api/services` for filtered list.
- Use MongoDB text indexing for `name`, `description`, `keywords`.
- Apply pagination (page, limit) and caching (5 mins).
- Price filtering in paise (minPrice, maxPrice).
- Sorting by popular, rating, price_asc, price_desc.

## 6. Database Changes
```javascript
// Add to Service schema
ServiceSchema.index({ name: 'text', description: 'text', keywords: 'text' });
// Add to Category schema
CategorySchema.index({ name: 'text' });
```

## 7. API Requirements
1. `GET /api/search?q=waxing&city=amritsar`
   - Response: `{ success: true, data: { services: [], categories: [] } }`
2. `GET /api/services?category=beauty&city=amritsar&sort=popular&page=1&limit=12&minPrice=10000&maxPrice=50000`
   - Response: `{ success: true, data: [...], pagination: { page, limit, total, totalPages } }`

## 8. Business Logic
- Apply MongoDB text score for relevance sorting on search.
- Translate sort options to MongoDB sort parameters (`{ bookingCount: -1 }`, etc).

## 9. Validation
- Validate `page` and `limit` as positive integers.
- Validate `minPrice` <= `maxPrice`.

## 10. Security
- Sanitize `q` parameter to prevent NoSQL injection.

## 11. Error Handling
- `INVALID_QUERY_PARAMS`: format errors.

## 12. Edge Cases
- Empty query `q`.
- High pagination values.

## 13. Frontend Requirements
- N/A

## 14. Backend Requirements
- API route handlers for search and services.
- Update Mongoose models for text indexes.

## 15. Testing
- Test text search relevance.
- Test sorting and pagination.

## 16. Files To Create
- `src/app/api/search/route.js`
- `src/app/api/services/route.js`

## 17. Files To Modify
- `src/models/Service.js`
- `src/models/Category.js`

## 18. Files NOT To Modify
- User models.

## 19. Completion Requirements
- Run linter.

## Acceptance Criteria
- [ ] Text search returns relevant results across name/description.
- [ ] Sorting options apply correctly.
- [ ] Pagination returns correct metadata.
