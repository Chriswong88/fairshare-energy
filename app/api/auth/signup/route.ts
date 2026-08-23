import {NextRequest, NextResponse} from 'next/server';
import {badRequest, serverError} from '@/lib/backend/api-response';
import {setAuthCookies} from '@/lib/backend/auth-cookies';
import {parseSignupPayload} from '@/lib/backend/signup';
import {createSupabaseAdminClient, createSupabaseAnonClient} from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  let payload;

  try {
    payload = parseSignupPayload(await request.json());
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : 'Invalid signup request.');
  }

  const admin = createSupabaseAdminClient();
  const {data: createdUser, error: createError} = await admin.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
    user_metadata: {
      full_name: payload.fullName,
      active_role: payload.activeRole,
      electricity_provider: payload.electricityProvider,
      electricity_plan: payload.electricityPlan,
    },
  });

  if (createError || !createdUser.user) {
    return badRequest(createError?.message ?? 'Could not create user.');
  }

  const userId = createdUser.user.id;
  const {error: profileError} = await admin.from('profiles').insert({
    id: userId,
    full_name: payload.fullName,
    address_line: payload.addressLine,
    suburb: payload.suburb,
    postcode: payload.postcode,
    electricity_provider: payload.electricityProvider,
    electricity_plan: payload.electricityPlan,
    active_role: payload.activeRole,
    can_buy: true,
    can_sell: true,
  });

  const profileRows = [
    admin.from('buyer_profiles').insert({user_id: userId}),
    admin.from('seller_profiles').insert({user_id: userId}),
  ];
  const [buyerResult, sellerResult] = await Promise.all(profileRows);
  const setupError = profileError ?? buyerResult.error ?? sellerResult.error;

  if (setupError) {
    await admin.auth.admin.deleteUser(userId);

    if (setupError.message.includes('electricity_plan') || setupError.message.includes('electricity_provider')) {
      return serverError(
        'Database schema is missing account profile fields. Run backend/supabase/migrations/0002_add_account_profile_fields.sql in Supabase SQL Editor, then try again.',
      );
    }

    return serverError(setupError.message);
  }

  const supabase = createSupabaseAnonClient();
  const {data: sessionData, error: sessionError} = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (sessionError || !sessionData.session) {
    return serverError(sessionError?.message ?? 'Account created, but login failed.');
  }

  const response = NextResponse.json({
    user: sessionData.user,
    profile: {
      id: userId,
      full_name: payload.fullName,
      address_line: payload.addressLine,
      suburb: payload.suburb,
      postcode: payload.postcode,
      electricity_provider: payload.electricityProvider,
      electricity_plan: payload.electricityPlan,
      active_role: payload.activeRole,
      can_buy: true,
      can_sell: true,
    },
  });

  setAuthCookies(response, sessionData.session);

  return response;
}
