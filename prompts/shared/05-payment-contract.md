# 05 - Payment Contract

## Razorpay Integration
1. Backend creates order -> Returns Order ID.
2. Frontend initializes Razorpay.js checkout.
3. On success, Razorpay webhook confirms payment on backend.

## Rules
- All prices in paise.
- Never trust frontend payment status.
- Payment methods: UPI, Cards, Netbanking.
- On failure: show retry, don't auto-retry.
