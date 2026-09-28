import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { checkRBAC } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import { runWeeklyPayouts } from '@/services/payoutService';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectDB();
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    // RBAC validation: FINANCE_ADMIN or SUPER_ADMIN
    const rbac = await checkRBAC(user, 'SUPER_ADMIN', 'FINANCE_ADMIN');
    if (!rbac.allowed) return rbac.error;
    
    const summary = await runWeeklyPayouts();
    
    return successResponse({
      runCompleted: true,
      payoutCount: summary.payoutCount,
      totalPayoutAmount: summary.totalPayoutAmount,
      message: `Successfully executed ${summary.payoutCount} professional payouts totaling ₹${(summary.totalPayoutAmount / 100).toFixed(2)}`
    });
    
  } catch (error) {
    logger.error('Error running weekly payouts batch', error, { endpoint: '/api/admin/payouts/run-weekly' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
