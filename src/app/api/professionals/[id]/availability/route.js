import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import Professional from '@/models/Professional';
import ProfessionalAvailability from '@/models/ProfessionalAvailability';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    // Find professional
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
      return errorResponse('Access denied.', ERROR_CODES.FORBIDDEN, 403);
    }
    
    let availability = await ProfessionalAvailability.findOne({ professionalId: professional._id });
    if (!availability) {
      // Return default empty structure
      availability = {
        professionalId: professional._id,
        weeklySchedule: {
          mon: { available: true, start: '09:00', end: '18:00', breaks: [] },
          tue: { available: true, start: '09:00', end: '18:00', breaks: [] },
          wed: { available: true, start: '09:00', end: '18:00', breaks: [] },
          thu: { available: true, start: '09:00', end: '18:00', breaks: [] },
          fri: { available: true, start: '09:00', end: '18:00', breaks: [] },
          sat: { available: true, start: '09:00', end: '18:00', breaks: [] },
          sun: { available: false, start: '09:00', end: '18:00', breaks: [] }
        },
        blockedDates: [],
        dateOverrides: []
      };
    }
    
    return successResponse({ availability });
    
  } catch (error) {
    logger.error('Error fetching availability', error, { endpoint: `/api/professionals/${params.id}/availability` });
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
    
    // Find professional
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
      return errorResponse('Access denied.', ERROR_CODES.FORBIDDEN, 403);
    }
    
    const body = await req.json().catch(() => ({}));
    const { weeklySchedule, blockedDates, dateOverrides } = body;
    
    let availability = await ProfessionalAvailability.findOne({ professionalId: professional._id });
    if (!availability) {
      availability = new ProfessionalAvailability({
        professionalId: professional._id
      });
    }
    
    if (weeklySchedule !== undefined) {
      availability.weeklySchedule = {
        mon: weeklySchedule.mon || availability.weeklySchedule?.mon || { available: true, start: '09:00', end: '18:00', breaks: [] },
        tue: weeklySchedule.tue || availability.weeklySchedule?.tue || { available: true, start: '09:00', end: '18:00', breaks: [] },
        wed: weeklySchedule.wed || availability.weeklySchedule?.wed || { available: true, start: '09:00', end: '18:00', breaks: [] },
        thu: weeklySchedule.thu || availability.weeklySchedule?.thu || { available: true, start: '09:00', end: '18:00', breaks: [] },
        fri: weeklySchedule.fri || availability.weeklySchedule?.fri || { available: true, start: '09:00', end: '18:00', breaks: [] },
        sat: weeklySchedule.sat || availability.weeklySchedule?.sat || { available: true, start: '09:00', end: '18:00', breaks: [] },
        sun: weeklySchedule.sun || availability.weeklySchedule?.sun || { available: false, start: '09:00', end: '18:00', breaks: [] }
      };
    }
    
    if (blockedDates !== undefined) {
      availability.blockedDates = blockedDates.map(d => new Date(d));
    }
    
    if (dateOverrides !== undefined) {
      availability.dateOverrides = dateOverrides.map(o => ({
        date: new Date(o.date),
        available: o.available,
        start: o.start,
        end: o.end
      }));
    }
    
    await availability.save();
    return successResponse({ availability });
    
  } catch (error) {
    logger.error('Error updating availability', error, { endpoint: `/api/professionals/${params.id}/availability` });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
