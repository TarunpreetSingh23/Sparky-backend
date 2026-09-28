# 06 - Notification Contract

## Events
| Event | Push Title | Push Body | Channels |
|---|---|---|---|
| BOOKING_CONFIRMED | Booking Confirmed | Your booking is confirmed! | Push, SMS, WA |
| PROFESSIONAL_ARRIVED | Professional Arrived | Professional is at your location | Push, WA |

## Rules
- Prompt for push permissions AFTER first booking.
- Sync FCM tokens on login.
