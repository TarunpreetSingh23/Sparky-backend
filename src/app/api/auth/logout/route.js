import { cookies } from 'next/headers';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const cookieStore = cookies();
    
    // Clear cookies by setting maxAge to 0
    cookieStore.set('sparky_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0
    });
    
    cookieStore.set('sparky_refresh', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0
    });
    
    return successResponse({ loggedOut: true });
    
  } catch (error) {
    logger.error('Error in /api/auth/logout', error, { endpoint: '/api/auth/logout' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
