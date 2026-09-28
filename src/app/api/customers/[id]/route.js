import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import Customer from '@/models/Customer';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    // Ownership check: customer can only fetch their own profile, admins can fetch any
    const isOwner = user.userId === id;
    const isAdmin = user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return errorResponse('Access denied. You can only access your own profile.', ERROR_CODES.FORBIDDEN, 403);
    }
    
    // Find customer by userId or customer profileId
    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ userId: id }, { _id: id }] }
      : { userId: id };
      
    const customer = await Customer.findOne(query).populate('userId', 'phone email role isActive');
    if (!customer) {
      return errorResponse('Customer profile not found', ERROR_CODES.NOT_FOUND, 404);
    }
    
    return successResponse({ customer });
    
  } catch (error) {
    logger.error('Error fetching customer profile', error, { endpoint: `/api/customers/${params.id}` });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}

export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    // Ownership check: owner or admin
    const isOwner = user.userId === id;
    const isAdmin = user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return errorResponse('Access denied. You can only modify your own profile.', ERROR_CODES.FORBIDDEN, 403);
    }
    
    const body = await req.json().catch(() => ({}));
    const { name, gender, dob, profilePhoto, currentCity } = body;
    
    // Find customer by userId or customer profileId
    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ userId: id }, { _id: id }] }
      : { userId: id };
      
    let customer = await Customer.findOne(query);
    
    if (!customer) {
      // If profile doesn't exist but the user is the owner, we can initialize it (Onboarding)
      if (isOwner) {
        // Generate a simple unique referral code: NAME + random 3 digits
        const refSeed = (name || 'SP').substring(0, 5).toUpperCase().replace(/[^A-Z]/g, '');
        const refRand = Math.floor(100 + Math.random() * 900);
        const referralCode = `${refSeed}${refRand}`;
        
        customer = await Customer.create({
          userId: user.userId,
          name: name || 'Valued Customer',
          gender: gender || 'prefer_not_to_say',
          dateOfBirth: dob ? new Date(dob) : undefined,
          profilePhoto,
          currentCity: currentCity || 'amritsar',
          referralCode,
          walletBalance: 0,
          loyaltyCoins: 0
        });
      } else {
        return errorResponse('Customer profile not found', ERROR_CODES.NOT_FOUND, 404);
      }
    } else {
      // Update existing customer profile fields
      if (name !== undefined) customer.name = name;
      if (gender !== undefined) customer.gender = gender;
      if (dob !== undefined) customer.dateOfBirth = dob ? new Date(dob) : null;
      if (profilePhoto !== undefined) customer.profilePhoto = profilePhoto;
      if (currentCity !== undefined) customer.currentCity = currentCity;
      
      await customer.save();
    }
    
    return successResponse({ customer });
    
  } catch (error) {
    logger.error('Error updating customer profile', error, { endpoint: `/api/customers/${params.id}` });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
