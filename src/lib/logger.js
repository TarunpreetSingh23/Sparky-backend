// Structured logging. Never log OTPs, passwords, or PII.

export const logger = {
  info: (message, meta = {}) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(JSON.stringify({ level: 'info', message, ...sanitizeMeta(meta), ts: new Date().toISOString() }));
    }
  },
  warn: (message, meta = {}) => {
    console.warn(JSON.stringify({ level: 'warn', message, ...sanitizeMeta(meta), ts: new Date().toISOString() }));
  },
  error: (message, error, meta = {}) => {
    console.error(JSON.stringify({
      level: 'error', message,
      error: error?.message,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      ...sanitizeMeta(meta),
      ts: new Date().toISOString()
    }));
  },
};

function sanitizeMeta(meta) {
  if (!meta || typeof meta !== 'object') return meta;
  const redacted = { ...meta };
  const sensitiveKeys = ['otp', 'password', 'token', 'secret', 'aadhaar', 'pan', 'bank', 'otpHash', 'startOtpHash', 'completeOtpHash'];
  for (const key of sensitiveKeys) {
    if (key in redacted) redacted[key] = '[REDACTED]';
  }
  // Mask phone numbers
  if (redacted.phone && typeof redacted.phone === 'string') {
    redacted.phone = redacted.phone.replace(/(\d{2})\d{6}(\d{2})/, '$1XXXXXX$2');
  }
  return redacted;
}
