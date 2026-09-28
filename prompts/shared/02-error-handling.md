# 02 - Error Handling

## Client Errors (4xx)
- 400: Validation Error
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 422: Invalid State Transition
- 423: Account Locked
- 429: Rate Limited

## Server Errors (5xx)
- 500: Internal Server Error
- 503: Service Unavailable

## Rules
- Never expose stack traces or Mongo IDs in errors.
- Always include `code` string.
- Client: Retry 5xx and 429. Do not retry 4xx.
