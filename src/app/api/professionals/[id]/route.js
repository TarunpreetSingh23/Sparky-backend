import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { checkRBAC } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import Professional from '@/models/Professional';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    
    // Auth validation (optional for public, but required here for sensitive fields check)
    const { user, error: authError } = await requireAuth(req).catch(() => ({ user: null }));
    
    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ userId: id }, { _id: id }] }
      : { userId: id };
      
    const professional = await Professional.findOne(query).populate('userId', 'phone email role isActive');
    if (!professional) {
      return errorResponse('Professional profile not found', ERROR_CODES.NOT_FOUND, 404);
    }
    
    const isOwner = user && user.userId === professional.userId.toString();
    
    let isFinanceAdmin = false;
    if (user && user.role === 'admin') {
      const rbacResult = await checkRBAC(user, 'SUPER_ADMIN', 'FINANCE_ADMIN');
      if (rbacResult.allowed) isFinanceAdmin = true;
    }
    
    // Scrub sensitive bank account data if requester is not owner/finance admin
    const responseData = professional.toObject();
    if (!isOwner && !isFinanceAdmin) {
      delete responseData.bankAccountNumber;
      delete responseData.bankIFSC;
      delete responseData.bankAccountName;
      delete responseData.bankDetails;
      delete responseData.razorpayContactId;
      delete responseData.razorpayFundAccountId;
      delete responseData.pendingPayout;
    }
    
    return successResponse({ professional: responseData });
    
  } catch (error) {
    logger.error('Error fetching professional profile', error, { endpoint: `/api/professionals/${params.id}` });
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
    
    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ userId: id }, { _id: id }] }
      : { userId: id };
      
    const professional = await Professional.findOne(query);
    if (!professional) {
      return errorResponse('Professional profile not found', ERROR_CODES.NOT_FOUND, 404);
    }
    
    // Ownership check: owner or admin
    const isOwner = user.userId === professional.userId.toString();
    const isAdmin = user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return errorResponse('Access denied. You can only modify your own profile.', ERROR_CODES.FORBIDDEN, 403);
    }
    
    const body = await req.json().catch(() => ({}));
    const { name, gender, homeAddress, serviceRadius, bankDetails, bio, experienceYears, languages } = body;
    
    // Validate coordinates if provided
    if (homeAddress && homeAddress.coordinates) {
      const [lng, lat] = homeAddress.coordinates;
      if (typeof lng !== 'number' || typeof lat !== 'number' || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        return errorResponse('Invalid coordinates format. Expected [longitude, latitude] within boundaries.', 'INVALID_COORDINATES', 400);
      }
    }
    
    // Update non-critical fields
    if (name !== undefined) professional.name = name;
    if (gender !== undefined) professional.gender = gender;
    if (bio !== undefined) professional.bio = bio;
    if (experienceYears !== undefined) professional.experienceYears = experienceYears;
    if (languages !== undefined) professional.languages = languages;
    if (serviceRadius !== undefined) professional.serviceRadius = serviceRadius;
    
    if (homeAddress !== undefined) {
      professional.homeAddress = {
        addressLine1: homeAddress.addressLine1 || professional.homeAddress?.addressLine1,
        area: homeAddress.area || professional.homeAddress?.area,
        pincode: homeAddress.pincode || professional.homeAddress?.pincode,
        coordinates: homeAddress.coordinates ? {
          type: 'Point',
          coordinates: homeAddress.coordinates
        } : professional.homeAddress?.coordinates
      };
    }
    
    // Bank details updates (encrypted in real DB, stored securely here)
    if (bankDetails !== undefined) {
      professional.bankAccountNumber = bankDetails.accountNumber || professional.bankAccountNumber;
      professional.bankIFSC = bankDetails.ifscCode || professional.bankIFSC;
      professional.bankAccountName = bankDetails.accountName || professional.bankAccountName;
      if (bankDetails.bankName) professional.bankAccountName = bankDetails.accountName;
    }
    
    await professional.save();
    
    return successResponse({ professional });
    
  } catch (error) {
    logger.error('Error updating professional profile', error, { endpoint: `/api/professionals/${params.id}` });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
