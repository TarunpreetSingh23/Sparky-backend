import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { logger } from '@/lib/logger';
import User from '@/models/User';
import Professional from '@/models/Professional';
import City from '@/models/City';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectDB();
    
    const body = await req.json().catch(() => ({}));
    const { name, gender, cityId, phone } = body;
    
    if (!name || !gender || !cityId || !phone) {
      return errorResponse('Missing required parameters', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    // Check if phone matches format
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return errorResponse('Invalid phone number format', ERROR_CODES.INVALID_PHONE, 400);
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return errorResponse('A user with this mobile number is already registered', 'ALREADY_REGISTERED', 400);
    }
    
    // Check if city exists
    const city = await City.findById(cityId);
    if (!city) {
      return errorResponse('Specified city is not active or serviced yet', 'CITY_UNAVAILABLE', 400);
    }
    
    // Create base user
    const user = await User.create({
      phone,
      role: 'professional',
      isActive: true,
      isPhoneVerified: false
    });
    
    // Create professional profile
    const professional = await Professional.create({
      userId: user._id,
      name,
      gender,
      cityId: city._id,
      verificationStatus: 'APPLIED',
      rating: 0,
      reviewCount: 0,
      acceptanceRate: 100,
      completionRate: 100,
      cancellationRate: 0,
      totalEarnings: 0,
      pendingPayout: 0,
      isOnline: false,
      isActive: true
    });
    
    return successResponse({
      user: user.toSafeObject(),
      professional
    }, 201);
    
  } catch (error) {
    logger.error('Error in professional registration', error, { endpoint: '/api/professionals/register' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
