import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { checkRBAC } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import SafetyIncident from '@/models/SafetyIncident';
import Booking from '@/models/Booking';

export const dynamic = 'force-dynamic';

export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { id } = params; // Incident ID
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    // RBAC validation: SAFETY_OFFICER or SUPER_ADMIN
    const rbac = await checkRBAC(user, 'SUPER_ADMIN', 'SAFETY_OFFICER');
    if (!rbac.allowed) return rbac.error;
    
    const incident = await SafetyIncident.findById(id);
    if (!incident) {
      return errorResponse('Safety incident not found', 'INCIDENT_NOT_FOUND', 404);
    }
    
    const body = await req.json().catch(() => ({}));
    const { resolutionNotes } = body;
    
    if (!resolutionNotes) {
      return errorResponse('Resolution notes are required to resolve an active SOS incident.', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    // Resolve incident
    incident.status = 'resolved';
    incident.resolvedAt = new Date();
    incident.resolvedBy = user.userId;
    incident.resolutionNotes = resolutionNotes;
    await incident.save();
    
    // Reset booking safety flag
    const booking = await Booking.findById(incident.bookingId);
    if (booking) {
      booking.isSafetyAlertActive = false;
      await booking.save();
    }
    
    logger.info(`Safety incident ${incident._id} resolved by safety officer ${user.userId}`);
    
    return successResponse({
      resolved: true,
      incident
    });
    
  } catch (error) {
    logger.error('Error resolving safety incident', error, { incidentId: params.id });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
