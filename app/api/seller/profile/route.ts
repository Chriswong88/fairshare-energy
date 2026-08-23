import {NextRequest, NextResponse} from 'next/server';
import {badRequest, serverError} from '@/lib/backend/api-response';
import {requireSession} from '@/lib/backend/session';

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if ('response' in session) return session.response;
  const [profile, seller] = await Promise.all([
    session.userClient.from('profiles').select('*').eq('id', session.userId).single(),
    session.userClient.from('seller_profiles').select('*').eq('user_id', session.userId).single(),
  ]);
  if (profile.error || seller.error) return serverError(profile.error?.message ?? seller.error?.message);
  return NextResponse.json({profile: profile.data, sellerProfile: seller.data});
}

export async function PATCH(request: NextRequest) {
  const session = await requireSession(request);
  if ('response' in session) return session.response;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return badRequest('Invalid profile request.');
  const values: Record<string, number | string | null> = {};
  if (body.solarSystemSizeKw !== undefined) {
    const size = Number(body.solarSystemSizeKw);
    if (!Number.isFinite(size) || size <= 0 || size > 10000) return badRequest('Solar system size is invalid.');
    values.solar_system_size_kw = Math.round(size * 100) / 100;
  }
  if (body.meterReference !== undefined) {
    const meter = String(body.meterReference).trim();
    if (meter.length > 100) return badRequest('Meter reference is too long.');
    values.meter_reference = meter || null;
  }
  if (!Object.keys(values).length) return badRequest('No seller profile fields were provided.');
  const {data, error} = await session.userClient.from('seller_profiles')
    .update({...values, updated_at: new Date().toISOString()})
    .eq('user_id', session.userId).select('*').single();
  if (error) return serverError(error.message);
  return NextResponse.json({sellerProfile: data});
}
