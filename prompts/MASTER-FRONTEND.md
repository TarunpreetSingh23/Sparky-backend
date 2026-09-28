# MASTER-FRONTEND — Sparky Frontend Implementation Guide

## Role

You are a senior frontend engineer implementing the complete Sparky frontend. Read this document before starting any frontend implementation.

---

## Three Frontend Apps

Sparky has THREE separate frontend applications:

| App | Domain | Folder | Users |
|---|---|---|---|
| Customer App | sparky.in | `apps/customer/` | End customers |
| Professional App | worker.sparky.in | `apps/worker/` | Service professionals |
| Admin Panel | admin.sparky.in | `apps/admin/` | Sparky operations team |

Each is a separate Next.js project. They share the same API backend but have completely separate UIs.

---

## Technology Stack

- **Framework:** Next.js (App Router, JavaScript — no TypeScript)
- **Styling:** Tailwind CSS only
- **State:** Zustand (lightweight, no Redux)
- **API calls:** Custom fetch wrapper in `src/lib/api.js`
- **Forms:** React Hook Form (or native controlled components)
- **Charts (admin only):** Recharts
- **Maps:** Google Maps JavaScript API
- **Payments:** Razorpay.js (loaded dynamically)
- **Notifications:** Firebase FCM

---

## Design System

**Always read `shared/07-design-system.md` before building any component.**

```
Primary:    #7C3AED (purple/violet)
Accent:     #F59E0B (gold/amber)
Success:    #10B981
Warning:    #F59E0B
Error:      #EF4444
Background: #0F0F1A (dark), #FFFFFF (light)
Font:       Inter (Google Fonts)
```

All components must have:
- Loading state (skeleton or spinner)
- Error state (human-readable message + retry)
- Empty state (meaningful message + action)
- Mobile-first responsive design

---

## Implementation Order

### Customer App
Always implement corresponding backend first.

```
01-frontend-foundation     (needs backend/01)
02-customer-authentication (needs backend/02)
03-customer-home           (needs backend/05)
04-service-discovery       (needs backend/05, 27)
05-service-details         (needs backend/05, 17)
06-booking-flow            (needs backend/08, 10, 12, 13)
07-checkout-payment        (needs backend/14)
08-booking-tracking        (needs backend/09, 20, 21)
09-booking-history         (needs backend/08)
10-customer-profile        (needs backend/03, 04)
11-customer-reviews        (needs backend/17)
```

### Professional App
```
professional/01-authentication    (needs backend/02, 07)
professional/02-dashboard         (needs backend/06, 08)
professional/03-onboarding        (needs backend/07, 26)
professional/04-kyc               (needs backend/07, 26)
professional/05-availability      (needs backend/10)
professional/06-bookings          (needs backend/08, 11)
professional/07-job-details       (needs backend/06, 08)
professional/08-navigation        (needs backend/21)
professional/09-active-job        (needs backend/09)
professional/10-completion        (needs backend/09)
professional/11-earnings          (needs backend/16)
professional/12-payouts           (needs backend/16)
professional/13-performance       (needs backend/17)
professional/14-profile           (needs backend/06)
professional/15-notifications     (needs backend/19)
```

### Admin App
All admin frontend needs `backend/23-admin-backend` completed first.
```
admin/01-foundation → 02-dashboard → 05-verification → 08-bookings → 09-dispatch
→ 03-customers → 04-professionals → 06-services → 07-categories
→ 10-payments → 11-refunds → 12-coupons → 13-reviews → 14-support
→ 15-payouts → 16-reports → 17-analytics → 18-notifications → 19-audit-logs
→ 20-settings → 21-rbac
```

---

## Rules (Non-Negotiable)

### Rule 1 — API Client
Always use the shared API client:
```javascript
import { api } from '@/lib/api';

// CORRECT
const { data } = await api.get('/api/bookings');

// WRONG — never use raw fetch without the wrapper
const response = await fetch('/api/bookings'); // ❌
```

### Rule 2 — Never Show Raw Errors to Users
```javascript
// WRONG
catch (error) {
  alert(error.message); // ❌ May expose internals
}

// RIGHT
catch (error) {
  toast.error('Something went wrong. Please try again.'); // ✅
  logger.error(error); // ✅ Log for debugging
}
```

### Rule 3 — Loading States
Every async operation must have a loading state:
```javascript
const [isLoading, setIsLoading] = useState(false);

const handleBooking = async () => {
  setIsLoading(true);
  try {
    await api.post('/api/bookings', data);
  } finally {
    setIsLoading(false);
  }
};

// In JSX
<button disabled={isLoading}>
  {isLoading ? <Spinner /> : 'Book Now'}
</button>
```

### Rule 4 — Price Display
```javascript
// All prices come from API in paise
// Display: divide by 100, format as Indian rupees
function formatPrice(paise) {
  return `₹${(paise / 100).toFixed(0)}`;
}
// ₹349, ₹1,299, etc.
```

### Rule 5 — Date/Time Display
```javascript
// Dates from API are ISO strings
// Display in Indian format
function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}
// "15 February 2024"
```

### Rule 6 — Booking Status Display
Use status-to-color mapping from `shared/04-booking-state-contract.md`. Never hardcode colors for status.

### Rule 7 — Mobile First
Write CSS for mobile width first, then use `md:` and `lg:` prefixes for wider screens. Test every screen at 375px width.

### Rule 8 — SEO (Customer App)
Every page must have:
```javascript
export const metadata = {
  title: 'Service Name — Sparky Amritsar',
  description: 'Book professional service at home in Amritsar...',
};
```

### Rule 9 — Accessibility
- All interactive elements must have `aria-label` or visible label
- Color is not the only indicator of state (add text/icon)
- Keyboard navigation must work for all forms

### Rule 10 — No Fake Data
Never use hardcoded sample data in production components. Always fetch from API. Use skeleton loading while fetching.

---

## PWA Configuration (Customer + Professional Apps)

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({ /* next config */ });
```

---

## After Each Prompt

```bash
npm run build    # Must pass
npm run lint     # Must pass
# Test on mobile viewport (375px) in browser devtools
# Test all loading/error/empty states
```
