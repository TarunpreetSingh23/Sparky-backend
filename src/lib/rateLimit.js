// Simple in-memory rate limiter for Vercel serverless
// Resets on function restart — acceptable for MVP
// Upgrade to Upstash Redis when scaling

const store = new Map();

export function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const entry = store.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }

  entry.count++;
  store.set(key, entry);

  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}

// Convenience functions
export function otpRateLimit(phone) {
  return rateLimit(`otp:${phone}`, 3, 60 * 60 * 1000); // 3 per hour per phone
}

export function ipRateLimit(ip, endpoint) {
  return rateLimit(`ip:${ip}:${endpoint}`, 10, 60 * 60 * 1000); // 10 per hour per IP per endpoint
}

export function apiRateLimit(userId) {
  return rateLimit(`api:${userId}`, 100, 60 * 1000); // 100 per minute per user
}
