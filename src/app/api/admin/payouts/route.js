import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { checkRBAC } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import ProfessionalPayout from '@/models/ProfessionalPayout';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectDB();
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    // RBAC validation
    const rbac = await checkRBAC(user, 'SUPER_ADMIN', 'FINANCE_ADMIN');
    if (!rbac.allowed) return rbac.error;
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    const filter = {};
    if (status) {
      filter.status = status;
    }
    
    const skip = (page - 1) * limit;
    const total = await ProfessionalPayout.countDocuments(filter);
    
    const payouts = await ProfessionalPayout.find(filter)
      .populate('professionalId', 'name bankAccountNumber bankIFSC')
      .sort({ processedAt: -1 })
      .skip(skip)
      .limit(limit);
      
    return successResponse({
      payouts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    logger.error('Error fetching payouts', error, { endpoint: '/api/admin/payouts' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
