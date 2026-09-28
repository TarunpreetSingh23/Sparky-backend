import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { checkRBAC } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import User from '@/models/User';
import Customer from '@/models/Customer';
import Professional from '@/models/Professional';
import Admin from '@/models/Admin';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    
    // Auth validation
    const { user: authUser, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    // RBAC check: any admin role is allowed to view users
    const rbac = await checkRBAC(authUser);
    if (!rbac.allowed) return rbac.error;
    
    const user = await User.findById(id);
    if (!user) {
      return errorResponse('User not found', ERROR_CODES.NOT_FOUND, 404);
    }
    
    let profile = null;
    if (user.role === 'customer') {
      profile = await Customer.findOne({ userId: user._id });
    } else if (user.role === 'professional') {
      profile = await Professional.findOne({ userId: user._id });
    } else if (user.role === 'admin') {
      profile = await Admin.findOne({ userId: user._id });
    }
    
    return successResponse({
      user: user.toSafeObject(),
      profile
    });
    
  } catch (error) {
    logger.error('Error fetching admin user detail', error, { endpoint: `/api/admin/users/${params.id}` });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
