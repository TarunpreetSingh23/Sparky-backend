import { NextResponse } from 'next/server';

const envOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : [];
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001', // Customer app
  'http://localhost:3002', // Worker app
  'http://localhost:3003', // Admin app
  'http://localhost:5173', // Vite app
  'https://sparky.in',
  'https://worker.sparky.in',
  'https://admin.sparky.in',
  ...envOrigins
];

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  'Access-Control-Allow-Headers':
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

export function middleware(request) {
  const origin = request.headers.get('origin') ?? '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin);

  // Handle pre-flight OPTIONS request
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    if (isAllowed) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // For actual requests, add CORS headers to the response
  const response = NextResponse.next();
  if (isAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

export const config = {
  // Only run middleware on API routes
  matcher: '/api/:path*',
};
