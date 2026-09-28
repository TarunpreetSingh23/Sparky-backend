# 01 - API Contracts

## Standard Formats
**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Human readable message",
  "code": "ERROR_CODE",
  "errors": [ { "field": "email", "message": "Invalid format" } ]
}
```

## Types
- **IDs**: MongoDB ObjectId (String).
- **Dates**: ISO 8601 string.
- **Prices**: Integer (paise).
- **Phones**: Masked `97XXXXXX10`.

## Pagination
```json
{
  "data": [],
  "pagination": { "page": 1, "limit": 10, "total": 50, "totalPages": 5 }
}
```

## Headers
- Auth: `sparky_token` httpOnly cookie.
- Rate Limit: `X-RateLimit-Limit`, `X-RateLimit-Remaining`.
