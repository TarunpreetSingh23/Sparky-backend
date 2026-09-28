import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import User from '@/models/User';
import Customer from '@/models/Customer';
import Professional from '@/models/Professional';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectDB();
    
    // Auth validation
    const { user: jwtUser, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    const user = await User.findById(jwtUser.userId);
    if (!user || !user.isActive) {
      return errorResponse('User not found or disabled', ERROR_CODES.UNAUTHORIZED, 401);
    }
    
    let profile = null;
    if (user.role === 'customer') {
      profile = await Customer.findOne({ userId: user._id });
    } else if (user.role === 'professional') {
      profile = await Professional.findOne({ userId: user._id });
    }
    
    const safeUser = {
      id: user._id,
      role: user.role,
      phone: user.phone.replace(/(\d{2})\d{6}(\d{2})/, '$1XXXXXX$2'),
      email: user.email,
      isActive: user.isActive,
      isPhoneVerified: user.isPhoneVerified,
      isEmailVerified: user.isEmailVerified,
    };
    
    if (profile) {
      safeUser.name = profile.name;
      safeUser.gender = profile.gender;
      safeUser.profilePhoto = profile.profilePhoto;
      
      if (user.role === 'customer') {
        safeUser.city = profile.currentCity;
        safeUser.walletBalance = profile.walletBalance;
        safeUser.loyaltyCoins = profile.loyaltyCoins;
        safeUser.membershipPlan = profile.membershipPlan;
        safeUser.referralCode = profile.referralCode;
      } else if (user.role === 'professional') {
        safeUser.cityId = profile.cityId;
        safeUser.rating = profile.rating;
        safeUser.reviewCount = profile.reviewCount;
        safeUser.isOnline = profile.isOnline;
        safeUser.verificationStatus = profile.verificationStatus;
      }
    } else {
      safeUser.isNewUser = true; // No profile created yet
    }
    
    return successResponse({ user: safeUser });
    
  } catch (error) {
    logger.error('Error in /api/auth/me', error, { endpoint: '/api/auth/me' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
