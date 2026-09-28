import Admin from '@/models/Admin';
import { errorResponse, ERROR_CODES } from './apiResponse';

export async function checkRBAC(user, ...requiredAdminRoles) {
  if (!user || user.role !== 'admin') {
    return { allowed: false, error: errorResponse('Insufficient permissions', ERROR_CODES.FORBIDDEN, 403) };
  }
  
  const adminProfile = await Admin.findOne({ userId: user.userId });
  if (!adminProfile) {
    return { allowed: false, error: errorResponse('Admin profile not found', ERROR_CODES.FORBIDDEN, 403) };
  }
  
  // SUPER_ADMIN always has full access
  if (adminProfile.adminRole === 'SUPER_ADMIN') {
    return { allowed: true, adminProfile, error: null };
  }
  
  if (requiredAdminRoles.length > 0 && !requiredAdminRoles.includes(adminProfile.adminRole)) {
    return { allowed: false, error: errorResponse('Insufficient administrative privileges', ERROR_CODES.FORBIDDEN, 403) };
  }
  
  return { allowed: true, adminProfile, error: null };
}

export function enforceRBAC(...requiredAdminRoles) {
  return async (req, user) => {
    return await checkRBAC(user, ...requiredAdminRoles);
  };
}
