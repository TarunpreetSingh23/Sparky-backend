import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectDB();
    
    const body = await req.json().catch(() => ({}));
    const cookieStore = cookies();
    const refreshCookie = cookieStore.get('sparky_refresh');
    const refreshToken = body?.refreshToken || (refreshCookie ? refreshCookie.value : null);
    
    if (!refreshToken) {
      return errorResponse('Refresh token not found', ERROR_CODES.UNAUTHORIZED, 401);
    }
    
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    } catch (err) {
      return errorResponse('Invalid or expired refresh token', ERROR_CODES.UNAUTHORIZED, 401);
    }
    
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return errorResponse('User account disabled or not found', ERROR_CODES.UNAUTHORIZED, 401);
    }
    
    // Generate new access token
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role, phone: user.phone },
      config.jwt.secret,
      { expiresIn: config.jwt.accessExpiry }
    );
    
    // Set new access token cookie
    cookieStore.set('sparky_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60 // 15 minutes
    });
    
    return successResponse({ refreshed: true, accessToken, token: accessToken });
    
  } catch (error) {
    logger.error('Error in /api/auth/refresh', error, { endpoint: '/api/auth/refresh' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
