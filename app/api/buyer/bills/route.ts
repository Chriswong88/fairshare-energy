import {NextRequest, NextResponse} from 'next/server';
import {serverError} from '@/lib/backend/api-response';
import {requireSession} from '@/lib/backend/session';
import {buildBuyerBillsSummary} from '@/lib/buyer-bills';
import {getElectricityPlanInfo} from '@/lib/electricity-plans';
import type {EnergyTransaction} from '@/lib/supabase/database.types';

export async function GET(request: NextRequest) {
  const session = await requireSession(request);

  if ('response' in session) {
    return session.response;
  }

  const [profileResult, transactionsResult] = await Promise.all([
    session.userClient
      .from('profiles')
      .select('full_name, suburb, postcode, electricity_provider, electricity_plan')
      .eq('id', session.userId)
      .single(),
    session.userClient
      .from('transactions')
      .select('*')
      .eq('buyer_id', session.userId)
      .in('status', ['pending', 'completed'])
      .order('created_at', {ascending: false}),
  ]);

  const error = profileResult.error ?? transactionsResult.error;

  if (error) {
    return serverError(error.message);
  }

  const transactions = (transactionsResult.data ?? []) as EnergyTransaction[];

  return NextResponse.json({
    profile: profileResult.data,
    planInfo: getElectricityPlanInfo(profileResult.data?.electricity_provider, profileResult.data?.electricity_plan),
    summary: buildBuyerBillsSummary(transactions),
    recentTransactions: transactions.slice(0, 10),
  });
}
