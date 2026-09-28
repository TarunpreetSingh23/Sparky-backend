import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import Address from '@/models/Address';
import Zone from '@/models/Zone';
import Customer from '@/models/Customer';

export const dynamic = 'force-dynamic';

async function resolveUserId(id, user) {
  if (id === 'me' || id === user.userId) {
    return { targetUserId: user.userId, error: null };
  }
  if (mongoose.isValidObjectId(id)) {
    const customer = await Customer.findOne({ _id: id });
    if (customer) {
      if (customer.userId.toString() === user.userId || user.role === 'admin') {
        return { targetUserId: customer.userId.toString(), error: null };
      }
    }
  }
  if (user.role === 'admin') {
    return { targetUserId: id, error: null };
  }
  return { targetUserId: null, error: errorResponse('Access denied', ERROR_CODES.FORBIDDEN, 403) };
}

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    const { targetUserId, error: idError } = await resolveUserId(id, user);
    if (idError) return idError;
    
    const addresses = await Address.find({ userId: targetUserId, isActive: true }).sort({ isDefault: -1, createdAt: -1 });
    return successResponse({ addresses });
    
  } catch (error) {
    logger.error('Error fetching addresses', error, { endpoint: `/api/customers/${params.id}/addresses` });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    const { targetUserId, error: idError } = await resolveUserId(id, user);
    if (idError) return idError;
    
    // Count existing active addresses
    const count = await Address.countDocuments({ userId: targetUserId, isActive: true });
    if (count >= 5) {
      return errorResponse('Maximum address limit reached. You can only save up to 5 addresses.', 'ADDRESS_LIMIT_EXCEEDED', 400);
    }
    
    const body = await req.json().catch(() => ({}));
    const { label, addressLine1, addressLine2, landmark, city, state, pincode, isDefault } = body;
    let coords = body.coordinates;
    if (!coords && body.longitude !== undefined && body.latitude !== undefined) {
      coords = [Number(body.longitude), Number(body.latitude)];
    }
    
    if (!addressLine1 || !city || !state || !pincode || !coords || !Array.isArray(coords) || coords.length !== 2) {
      return errorResponse('Missing required fields or invalid coordinates format', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    const [lng, lat] = coords.map(Number);
    
    // Verify longitude/latitude limits
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return errorResponse('Invalid coordinates values', 'INVALID_COORDINATES', 400);
    }
    
    // Resolve Zone using geoIntersects
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
      return errorResponse('We do not serve this location yet. Out of service area.', 'OUT_OF_SERVICE_AREA', 400);
    }
    
    // If first address, auto-make default
    const shouldBeDefault = count === 0 ? true : !!isDefault;
    
    // If making default, reset other addresses default flag
    if (shouldBeDefault) {
      await Address.updateMany({ userId: targetUserId }, { isDefault: false });
    }
    
    const address = await Address.create({
      userId: targetUserId,
      label: label || 'HOME',
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      pincode,
      coordinates: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      zoneId: zone._id,
      isDefault: shouldBeDefault,
      isActive: true
    });
    
    return successResponse({ address }, 201);
    
  } catch (error) {
    logger.error('Error creating address', error, { endpoint: `/api/customers/${params.id}/addresses` });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
