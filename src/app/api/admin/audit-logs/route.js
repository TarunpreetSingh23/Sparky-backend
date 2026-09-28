import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { checkRBAC } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import AuditLog from '@/models/AuditLog';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectDB();
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    // RBAC validation: Strictly SUPER_ADMIN for raw audit ledger inspects
    const rbac = await checkRBAC(user, 'SUPER_ADMIN');
    if (!rbac.allowed) return rbac.error;
    
    const { searchParams } = new URL(req.url);
    const userIdQuery = searchParams.get('userId');
    const actionQuery = searchParams.get('action');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    
    const filter = {};
    if (userIdQuery) filter.userId = userIdQuery;
    if (actionQuery) filter.action = actionQuery;
    
    const skip = (page - 1) * limit;
    const total = await AuditLog.countDocuments(filter);
    
    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
      
    return successResponse({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    logger.error('Error fetching audit logs', error, { endpoint: '/api/admin/audit-logs' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
