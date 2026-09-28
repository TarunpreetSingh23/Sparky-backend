import jwt from 'jsonwebtoken';
import { errorResponse, ERROR_CODES } from './apiResponse';
import { config } from './config';

export function getTokenFromRequest(req) {
  // Check Authorization header first (Bearer <token>)
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // Fallback to cookie
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(/sparky_token=([^;]+)/);
  return match ? match[1] : null;
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch {
    return null;
  }
}

export async function requireAuth(req) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return { user: null, error: errorResponse('Authentication required', ERROR_CODES.UNAUTHORIZED, 401) };
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return { user: null, error: errorResponse('Invalid or expired session', ERROR_CODES.UNAUTHORIZED, 401) };
  }
  return { user: decoded, error: null };
}

export async function requireRole(req, ...allowedRoles) {
  const { user, error } = await requireAuth(req);
  if (error) return { user: null, error };
  if (!allowedRoles.includes(user.role)) {
    return { user: null, error: errorResponse('Insufficient permissions', ERROR_CODES.FORBIDDEN, 403) };
  }
  return { user, error: null };
}
