import {NextRequest, NextResponse} from 'next/server';
import {badRequest} from '@/lib/backend/api-response';
import {setAuthCookies} from '@/lib/backend/auth-cookies';
import {parseLoginPayload} from '@/lib/backend/signup';
import {createSupabaseAnonClient, createSupabaseUserClient} from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  let payload;

  try {
    payload = parseLoginPayload(await request.json());
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : 'Invalid login request.');
  }

  const supabase = createSupabaseAnonClient();
  const {data, error} = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (error || !data.session) {
    return badRequest(error?.message ?? 'Invalid email or password.');
  }

  const userClient = createSupabaseUserClient(data.session.access_token);
  const {data: profile, error: profileError} = await userClient
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    return badRequest(profileError?.message ?? 'Account profile was not found.');
  }

  if (profile.active_role !== payload.activeRole) {
    const registeredRole = profile.active_role === 'seller' ? 'seller' : 'buyer';
    return badRequest(`This account is registered as a ${registeredRole}. Please use the ${registeredRole} login page.`);
  }

  const response = NextResponse.json({user: data.user, profile, session: {access_token: data.session.access_token, refresh_token: data.session.refresh_token}});
  setAuthCookies(response, data.session);

  return response;
}
