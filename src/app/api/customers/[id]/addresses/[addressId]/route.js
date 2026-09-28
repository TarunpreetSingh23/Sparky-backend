import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import Address from '@/models/Address';
import Zone from '@/models/Zone';

export const dynamic = 'force-dynamic';

export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { id, addressId } = params;
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    // Ownership check
    if (user.userId !== id && user.role !== 'admin') {
      return errorResponse('Access denied', ERROR_CODES.FORBIDDEN, 403);
    }
    
    const address = await Address.findOne({ _id: addressId, userId: id, isActive: true });
    if (!address) {
      return errorResponse('Address not found', ERROR_CODES.ADDRESS_NOT_FOUND, 404);
    }
    
    const body = await req.json().catch(() => ({}));
    const { label, addressLine1, addressLine2, landmark, city, state, pincode, coordinates, isDefault } = body;
    
    if (label !== undefined) address.label = label;
    if (addressLine1 !== undefined) address.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
    if (landmark !== undefined) address.landmark = landmark;
    if (city !== undefined) address.city = city;
    if (state !== undefined) address.state = state;
    if (pincode !== undefined) address.pincode = pincode;
    
    // If coordinates updated, re-evaluate Zone
    if (coordinates !== undefined) {
      if (!Array.isArray(coordinates) || coordinates.length !== 2) {
        return errorResponse('Invalid coordinates format', ERROR_CODES.VALIDATION_ERROR, 400);
      }
      
      const [lng, lat] = coordinates;
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        return errorResponse('Invalid coordinates values', 'INVALID_COORDINATES', 400);
      }
      
      const zone = await Zone.findOne({
        boundary: {
          $geoIntersects: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            }
          }
        },
        isActive: true
      });
      
      if (!zone) {
        return errorResponse('Out of service area', 'OUT_OF_SERVICE_AREA', 400);
      }
      
      address.coordinates = {
        type: 'Point',
        coordinates: [lng, lat]
      };
      address.zoneId = zone._id;
    }
    
    // Manage default status
    if (isDefault === true && !address.isDefault) {
      await Address.updateMany({ userId: id }, { isDefault: false });
      address.isDefault = true;
    } else if (isDefault === false && address.isDefault) {
      // Cannot set false if it's the only address
      const activeCount = await Address.countDocuments({ userId: id, isActive: true });
      if (activeCount > 1) {
        address.isDefault = false;
        // Make another address default
        const another = await Address.findOne({ userId: id, _id: { $ne: addressId }, isActive: true });
        if (another) {
          another.isDefault = true;
          await another.save();
        }
      }
    }
    
    await address.save();
    return successResponse({ address });
    
  } catch (error) {
    logger.error('Error updating address', error, { endpoint: `/api/customers/${params.id}/addresses/${params.addressId}` });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id, addressId } = params;
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    // Ownership check
    if (user.userId !== id && user.role !== 'admin') {
      return errorResponse('Access denied', ERROR_CODES.FORBIDDEN, 403);
    }
    
    const address = await Address.findOne({ _id: addressId, userId: id, isActive: true });
    if (!address) {
      return errorResponse('Address not found', ERROR_CODES.ADDRESS_NOT_FOUND, 404);
    }
    
    // Soft delete
    address.isActive = false;
    const wasDefault = address.isDefault;
    address.isDefault = false;
    await address.save();
    
    // If deleted address was the default, make another one default
    if (wasDefault) {
      const another = await Address.findOne({ userId: id, isActive: true }).sort({ createdAt: -1 });
      if (another) {
        another.isDefault = true;
        await another.save();
      }
    }
    
    return successResponse({ deleted: true });
    
  } catch (error) {
    logger.error('Error deleting address', error, { endpoint: `/api/customers/${params.id}/addresses/${params.addressId}` });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
