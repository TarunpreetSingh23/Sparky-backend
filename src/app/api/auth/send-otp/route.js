import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { validate, schemas, validationErrorResponse } from '@/lib/validate';
import { logger } from '@/lib/logger';
import { otpRateLimit, ipRateLimit } from '@/lib/rateLimit';
import { sendOtpSms } from '@/lib/sms';
import OtpSession from '@/models/OtpSession';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectDB();
    
    const body = await req.json().catch(() => ({}));
    
    // Validate phone number format
    const { valid, errors, data } = validate(schemas.phone, body.phone);
    if (!valid) {
      return errorResponse('Invalid phone number format', ERROR_CODES.INVALID_PHONE, 400);
    }
    
    const phone = data;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1';
    
    // Rate limit checks
    const phoneLimit = otpRateLimit(phone);
    if (!phoneLimit.allowed) {
      return errorResponse('Too many OTP requests for this phone number. Try again in 1 hour.', ERROR_CODES.RATE_LIMITED, 429);
    }
    
    const ipLimit = ipRateLimit(ip, 'send-otp');
    if (!ipLimit.allowed) {
      return errorResponse('Too many requests from this IP. Try again in 1 hour.', ERROR_CODES.RATE_LIMITED, 429);
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    
    // Create new OTP session
    const sessionId = `sess_${crypto.randomBytes(16).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    await OtpSession.create({
      sessionId,
      phone,
      otpHash,
      attempts: 0,
      maxAttempts: 5,
      expiresAt,
      ipAddress: ip
    });
    
    // Deliver SMS
    try {
      await sendOtpSms(phone, otp);
    } catch (smsError) {
      logger.error(`Failed to send SMS to ${phone}`, smsError);
      return errorResponse('SMS delivery failed', 'SMS_FAILED', 500);
    }
    
    return successResponse({
      otpSessionId: sessionId,
      expiresIn: 600 // 10 minutes in seconds
    });
    
  } catch (error) {
    logger.error('Error in send-otp handler', error, { endpoint: '/api/auth/send-otp' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
