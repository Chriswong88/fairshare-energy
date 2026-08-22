import {NextRequest, NextResponse} from 'next/server';
import {getAccessToken} from '@/lib/backend/auth-cookies';
import {serverError, unauthorized} from '@/lib/backend/api-response';
import {createSupabaseAnonClient, createSupabaseUserClient} from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const accessToken = getAccessToken(request);

  if (!accessToken) {
    return unauthorized();
  }

  const supabase = createSupabaseAnonClient();
  const {data: userData, error: userError} = await supabase.auth.getUser(accessToken);

  if (userError || !userData.user) {
    return unauthorized(userError?.message ?? 'Invalid session.');
  }

  const userClient = createSupabaseUserClient(accessToken);
  const {data: profile, error: profileError} = await userClient
    .from('profiles')
    .select('*, buyer_profiles(*), seller_profiles(*), payment_methods(*)')
    .eq('id', userData.user.id)
    .single();

  if (profileError) {
    return serverError(profileError.message);
  }

  return NextResponse.json({user: userData.user, profile});
}
