import {NextRequest, NextResponse} from 'next/server';
import {createSupabaseAnonClient} from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as {refreshToken?: string};
  if (!body.refreshToken) return NextResponse.json({error: 'Missing refresh token.'}, {status: 400});

  const {data, error} = await createSupabaseAnonClient().auth.refreshSession({refresh_token: body.refreshToken});
  if (error || !data.session) {
    return NextResponse.json({error: 'Session expired.'}, {status: 401});
  }
  return NextResponse.json({session: {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  }});
}
