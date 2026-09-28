# 03 - Authentication Contract

## JWT Payload
```json
{
  "userId": "123",
  "role": "customer|professional|admin",
  "iat": 123456,
  "exp": 123456
}
```

## Cookies
- `sparky_token`: 15min expiry, httpOnly, secure.
- `sparky_refresh`: 30day expiry, httpOnly, secure.

## Flows
- 401 response -> Frontend redirects to /login.
- Multi-device supported via multiple FCM tokens per user.
- Logout clears cookies and specific FCM token.
