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
  const {data, error} = await supabase.auth.signInWithPassword(payload);

  if (error || !data.session) {
    return badRequest(error?.message ?? 'Invalid email or password.');
  }

  const userClient = createSupabaseUserClient(data.session.access_token);
  const {data: profile} = await userClient
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  const response = NextResponse.json({user: data.user, profile});
  setAuthCookies(response, data.session);

  return response;
}
