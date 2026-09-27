import {NextRequest, NextResponse} from 'next/server';

const allowedOrigin = 'https://chriswong88.github.io';

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const isApi = request.nextUrl.pathname.startsWith('/api/');
  if (!isApi || origin !== allowedOrigin) return NextResponse.next();

  const headers = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
  if (request.method === 'OPTIONS') return new NextResponse(null, {status: 204, headers});

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
  return response;
}

export const config = {matcher: '/api/:path*'};
