# 05 — Service Catalogue

## 1. Role
Backend Developer & Architect

## 2. Objective
Implement the core service catalogue schemas (Categories, Services, Packages, Addons, Cities, Zones) and APIs for both public browsing and admin management.

## 3. Read Before Coding
- `c:/RAG-frontend/mdfile/doc8_database_specification.md`
- `c:/RAG-frontend/mdfile/MASTER_IMPLEMENTATION_BLUEPRINT.md`

## 4. Existing Architecture
- Mongoose, Next.js API Routes

## 5. Requirements
- Model all catalogue entities: Categories, Services, ServicePackages, ServiceAddons, Cities, Zones.
- All prices strictly in PAISE (integer).
- Read-heavy APIs optimized and logic built for Amritsar seed data.
- Admin APIs for catalogue management.

## 6. Database Changes
(Implement detailed schemas per doc8)
- `Category` (name, slug, icon, description, parentCategory, isActive, sortOrder)
- `Service` (categoryId, name, slug, description, shortDescription, availableCities, isActive, basePrice, rating, reviewCount)
- `ServicePackage` (serviceId, name, description, price, duration, includes)
- `ServiceAddon` (serviceId, name, price, duration)
- `City` (name, state, country, centerCoordinates, isActive)
- `Zone` (cityId, name, polygon: Polygon GeoJSON, isActive)

## 7. API Requirements
**Public:**
- `GET /api/home`: Returns banners, categories, popularServices (cache 5 min).
- `GET /api/cities`: Active cities.
- `GET /api/categories`: Hierarchical category list.
- `GET /api/services`: Query params: `category`, `city`, `sort`, `page`. Filters services where `availableCities` includes requested city.
- `GET /api/services/[slug]`: Complete service details (packages, addons).

**Admin:**
- `POST/PATCH /api/admin/services`
- `POST/PATCH /api/admin/categories`
- `POST/PATCH /api/admin/packages`

## 8. Business Logic
- Pricing ALWAYS in paise. (e.g. ₹349 -> 34900).
- Availability Check: Ensure a service is returned only if `service.availableCities` array includes the provided `cityId`.
- Home API should sort by featured/popular.
- Seed data instructions: Generate a script to seed Amritsar city, 'Beauty' category, 3 services under Beauty, each with 2 packages and 1 addon.

## 9. Validation
- Slugs must be unique.
- Prices must be positive integers.

## 10. Security
- Admin APIs must require SUPER_ADMIN or CONTENT_ADMIN roles.
- Public APIs need no auth but should support rate limiting.

## 11. Error Handling
- `SERVICE_NOT_FOUND` 404
- `CITY_UNAVAILABLE` 400

## 12. Edge Cases
- Service has no packages.

## 13. Frontend Requirements
N/A

## 14. Backend Requirements
- Create a seed script in `scripts/seedCatalogue.js`.

## 15. Testing
- Verify public catalogue response payloads.
- Verify price validation (float rejected).

## 16. Files To Create
- `src/models/Category.js`, `src/models/Service.js`, `src/models/ServicePackage.js`, `src/models/ServiceAddon.js`, `src/models/City.js`, `src/models/Zone.js`
- `src/app/api/home/route.js`
- `src/app/api/categories/route.js`
- `src/app/api/services/route.js`, `src/app/api/services/[slug]/route.js`
- `src/app/api/cities/route.js`
- Admin routes under `src/app/api/admin/`
- `scripts/seedCatalogue.js`

## 17. Files To Modify
None

## 18. Files NOT To Modify
None

## 19. Completion Requirements
All APIs functional and seed data script works without error.

## Acceptance Criteria
- [ ] Models created matching doc8 exactly.
- [ ] All public catalogue APIs created.
- [ ] Prices enforced as integers (paise).
- [ ] Admin APIs for create/update built with RBAC checks.
- [ ] Seed script provided for Amritsar and initial catalogue data.
