import {NextRequest} from 'next/server';
import {unauthorized} from '@/lib/backend/api-response';
import {getAccessToken} from '@/lib/backend/auth-cookies';
import {createSupabaseAnonClient, createSupabaseUserClient} from '@/lib/supabase/server';

export async function requireSession(request: NextRequest) {
  const accessToken = getAccessToken(request);

  if (!accessToken) return {response: unauthorized()} as const;

  const {data, error} = await createSupabaseAnonClient().auth.getUser(accessToken);
  if (error || !data.user) {
    return {response: unauthorized(error?.message ?? 'Invalid session.')} as const;
  }

  return {
    user: data.user,
    userId: data.user.id,
    userClient: createSupabaseUserClient(accessToken),
  };
}
