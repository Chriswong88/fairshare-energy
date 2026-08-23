import {NextRequest, NextResponse} from 'next/server';
import {serverError, unauthorized} from '@/lib/backend/api-response';
import {getAccessToken} from '@/lib/backend/auth-cookies';
import {buildBillCredits} from '@/lib/bill-credits';
import {createSupabaseAnonClient, createSupabaseUserClient} from '@/lib/supabase/server';
import type {EnergyTransaction} from '@/lib/supabase/database.types';

export async function GET(request: NextRequest) {
  const accessToken = getAccessToken(request);
  if (!accessToken) return unauthorized('Sign in to view your bill credits.');

  const authClient = createSupabaseAnonClient();
  const {data: authData, error: authError} = await authClient.auth.getUser(accessToken);
  if (authError || !authData.user) return unauthorized(authError?.message ?? 'Invalid session.');

  const {data, error} = await createSupabaseUserClient(accessToken)
    .from('transactions')
    .select('*')
    .eq('seller_id', authData.user.id)
    .in('status', ['pending', 'completed'])
    .order('created_at', {ascending: false});

  if (error) return serverError(error.message);

  const credits = buildBillCredits((data ?? []) as EnergyTransaction[]);
  const totalCreditCents = credits.reduce((total, credit) => total + credit.retailerCreditCents, 0);
  return NextResponse.json({credits, totalCreditCents});
}
