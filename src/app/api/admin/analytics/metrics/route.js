import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { checkRBAC } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import Booking from '@/models/Booking';
import Professional from '@/models/Professional';
import SafetyIncident from '@/models/SafetyIncident';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectDB();
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    // RBAC validation: OPERATIONS_ADMIN, FINANCE_ADMIN, or SUPER_ADMIN
    const rbac = await checkRBAC(user, 'SUPER_ADMIN', 'OPERATIONS_ADMIN', 'FINANCE_ADMIN');
    if (!rbac.allowed) return rbac.error;
    
    const totalBookings = await Booking.countDocuments();
    
    // Compute total revenue from completed/confirmed bookings
    const completedBookingsFilter = {
      status: { $in: ['COMPLETED', 'SERVICE_COMPLETED', 'CUSTOMER_CONFIRMED'] }
    };
    
    const completedCount = await Booking.countDocuments(completedBookingsFilter);
    
    const revenueStats = await Booking.aggregate([
      { $match: completedBookingsFilter },
      { $group: { _id: null, totalRevenue: { $sum: '$pricing.total' } } }
    ]);
    
    const totalRevenue = revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;
    const avgBookingValue = completedCount > 0 ? Math.round(totalRevenue / completedCount) : 0;
    
    const activeIncidents = await SafetyIncident.countDocuments({ status: 'active' });
    const totalProfessionals = await Professional.countDocuments();
    const onlineProfessionals = await Professional.countDocuments({ isOnline: true, verificationStatus: 'ACTIVE' });
    
    return successResponse({
      metrics: {
        totalBookings,
        completedCount,
        totalRevenue,
        avgBookingValue,
        activeIncidents,
        totalProfessionals,
        onlineProfessionals
      }
    });
    
  } catch (error) {
    logger.error('Error computing analytics metrics', error, { endpoint: '/api/admin/analytics/metrics' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
