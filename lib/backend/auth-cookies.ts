import type {NextRequest, NextResponse} from 'next/server';
import type {Session} from '@supabase/supabase-js';

export const ACCESS_TOKEN_COOKIE = 'fairshare-access-token';
export const REFRESH_TOKEN_COOKIE = 'fairshare-refresh-token';

const secure = process.env.NODE_ENV === 'production';

export function setAuthCookies(response: NextResponse, session: Session) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, session.access_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: session.expires_in,
  });

  response.cookies.set(REFRESH_TOKEN_COOKIE, session.refresh_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
}

export function getAccessToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length);
  }

  return request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}
