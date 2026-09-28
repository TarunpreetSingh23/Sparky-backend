// Centralize environment variable access
// Fail fast if required variables are missing

function requireEnv(key) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

// Config object. Do NOT call/evaluate properties at module import time
// in Vercel edge functions/middleware. Call it inside the function body only.
export const config = {
  jwt: {
    get secret() { return requireEnv('JWT_SECRET'); },
    get refreshSecret() { return requireEnv('JWT_REFRESH_SECRET'); },
    accessExpiry: '15m',
    refreshExpiry: '30d',
  },
  razorpay: {
    get keyId() { return requireEnv('RAZORPAY_KEY_ID'); },
    get keySecret() { return requireEnv('RAZORPAY_KEY_SECRET'); },
    get webhookSecret() { return requireEnv('RAZORPAY_WEBHOOK_SECRET'); },
  },
  google: {
    get mapsApiKey() { return requireEnv('GOOGLE_MAPS_API_KEY'); },
  },
  cloudinary: {
    get cloudName() { return requireEnv('CLOUDINARY_CLOUD_NAME'); },
    get apiKey() { return requireEnv('CLOUDINARY_API_KEY'); },
    get apiSecret() { return requireEnv('CLOUDINARY_API_SECRET'); },
  },
  msg91: {
    get authKey() { return requireEnv('MSG91_AUTH_KEY'); },
    get senderId() { return process.env.MSG91_SENDER_ID || 'SPARKY'; },
    get templateId() { return requireEnv('MSG91_TEMPLATE_ID'); },
  },
  aisensy: {
    get apiKey() { return requireEnv('AISENSY_API_KEY'); },
  },
  firebase: {
    get projectId() { return requireEnv('FIREBASE_PROJECT_ID'); },
    get clientEmail() { return requireEnv('FIREBASE_CLIENT_EMAIL'); },
    get privateKey() { return requireEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'); },
  },
  resend: {
    get apiKey() { return requireEnv('RESEND_API_KEY'); },
    get from() { return process.env.EMAIL_FROM || 'noreply@sparky.in'; },
  },
  whatsapp: {
    get token() { return requireEnv('WHATSAPP_TOKEN'); },
    get phoneNumberId() { return requireEnv('WHATSAPP_PHONE_NUMBER_ID'); },
    get verifyToken() { return requireEnv('WHATSAPP_VERIFY_TOKEN'); },
    get apiVersion() { return process.env.WHATSAPP_API_VERSION || 'v19.0'; },
  },
};
