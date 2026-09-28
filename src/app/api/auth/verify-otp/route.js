import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { validate, schemas } from '@/lib/validate';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config';
import OtpSession from '@/models/OtpSession';
import User from '@/models/User';
import Customer from '@/models/Customer';
import Professional from '@/models/Professional';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectDB();
    
    const body = await req.json().catch(() => ({}));
    
    const { phone, otp, otpSessionId } = body;
    
    if (!phone || !otp || !otpSessionId) {
      return errorResponse('Missing required parameters', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    // Find OTP session
    const session = await OtpSession.findOne({ sessionId: otpSessionId, phone });
    if (!session) {
      return errorResponse('OTP session not found', ERROR_CODES.SESSION_NOT_FOUND, 400);
    }
    
    // Check if session has expired
    if (session.expiresAt < new Date()) {
      return errorResponse('OTP expired', ERROR_CODES.OTP_EXPIRED, 400);
    }
    
    // Check if session is already used
    if (session.isUsed || session.usedAt) {
      return errorResponse('OTP session already used', ERROR_CODES.OTP_EXPIRED, 400);
    }
    
    // Check session-level attempts limit
    if (session.attempts >= session.maxAttempts) {
      return errorResponse('Maximum OTP attempts exceeded for this session', ERROR_CODES.OTP_EXPIRED, 400);
    }
    
    // Find or locate User to enforce user-level lockout check
    let user = await User.findOne({ phone });
    if (user && user.lockUntil && user.lockUntil > new Date()) {
      return errorResponse('Account temporarily locked due to too many failed login attempts. Try again later.', ERROR_CODES.ACCOUNT_LOCKED, 423);
    }
    
    // Verify OTP
    const isOtpValid = await bcrypt.compare(otp, session.otpHash);
    
    // Increment attempts count on OtpSession
    session.attempts += 1;
    await session.save();
    
    if (!isOtpValid) {
      // User failed to enter correct OTP. Track loginAttempts on User doc if they exist.
      let loginAttemptsLeft = 5;
      if (user) {
        user.loginAttempts += 1;
        if (user.loginAttempts >= 5) {
          user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // lock for 30 minutes
          await user.save();
          return errorResponse('Account locked. Try after 30 minutes.', ERROR_CODES.ACCOUNT_LOCKED, 423);
        }
        await user.save();
        loginAttemptsLeft = 5 - user.loginAttempts;
      }
      
      const sessionAttemptsLeft = session.maxAttempts - session.attempts;
      return errorResponse('Invalid OTP', ERROR_CODES.INVALID_OTP, 400, {
        attemptsLeft: Math.min(sessionAttemptsLeft, loginAttemptsLeft)
      });
    }
    
    // Valid OTP: mark session as used
    session.isUsed = true;
    session.usedAt = new Date();
    await session.save();
    
    // Find or create User
    let isNewUser = false;
    if (!user) {
      user = await User.create({
        phone,
        role: 'customer',
        isActive: true,
        isPhoneVerified: true
      });
      isNewUser = true;
    } else {
      user.isPhoneVerified = true;
      user.loginAttempts = 0;
      user.lockUntil = null;
      user.lastLoginAt = new Date();
      await user.save();
    }
    
    // Fetch associated Customer or Professional profile details
    let profile = null;
    if (!isNewUser) {
      if (user.role === 'customer') {
        profile = await Customer.findOne({ userId: user._id });
        if (!profile) {
          isNewUser = true; // User doc exists but profile onboarding is incomplete
        }
      } else if (user.role === 'professional') {
        profile = await Professional.findOne({ userId: user._id });
      }
    }
    
    // Check if account is active
    if (!user.isActive) {
      return errorResponse('Your account is currently disabled', 'ACCOUNT_DISABLED', 403);
    }
    
    // Generate JWT access & refresh tokens
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role, phone: user.phone },
      config.jwt.secret,
      { expiresIn: config.jwt.accessExpiry }
    );
    
    const refreshToken = jwt.sign(
      { userId: user._id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiry }
    );
    
    // Set httpOnly cookies
    const cookieStore = cookies();
    cookieStore.set('sparky_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60 // 15 minutes
    });
    
    cookieStore.set('sparky_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });
    
    // Prepare safe user details response
    const responsePayload = {
      isNewUser,
      token: accessToken,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        role: user.role,
        phone: user.phone.replace(/(\d{2})\d{6}(\d{2})/, '$1XXXXXX$2'),
        isNewUser
      }
    };
    
    if (profile) {
      responsePayload.user.name = profile.name;
      responsePayload.user.city = profile.currentCity || (profile.homeAddress ? 'amritsar' : null);
      if (user.role === 'customer') {
        responsePayload.user.walletBalance = profile.walletBalance;
        responsePayload.user.loyaltyCoins = profile.loyaltyCoins;
      }
      if (profile.profilePhoto) {
        responsePayload.user.profilePhoto = profile.profilePhoto;
      }
    }
    
    return successResponse(responsePayload);
    
  } catch (error) {
    logger.error('Error in verify-otp handler', error, { endpoint: '/api/auth/verify-otp' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
