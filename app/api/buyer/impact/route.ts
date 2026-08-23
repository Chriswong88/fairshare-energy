import {NextRequest, NextResponse} from 'next/server';
import {serverError} from '@/lib/backend/api-response';
import {requireSession} from '@/lib/backend/session';
import {buildBuyerImpactSummary} from '@/lib/buyer-impact';
import type {EnergyTransaction, Profile} from '@/lib/supabase/database.types';

export async function GET(request: NextRequest) {
  const session = await requireSession(request);

  if ('response' in session) {
    return session.response;
  }

  const [profileResult, buyerTransactionsResult, communityTransactionsResult] = await Promise.all([
    session.userClient
      .from('profiles')
      .select('full_name, suburb, postcode')
      .eq('id', session.userId)
      .single(),
    session.userClient
      .from('transactions')
      .select('*')
      .eq('buyer_id', session.userId)
      .in('status', ['pending', 'completed'])
      .order('created_at', {ascending: false}),
    session.userClient
      .from('transactions')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', {ascending: false})
      .limit(500),
  ]);

  const firstError = profileResult.error ?? buyerTransactionsResult.error ?? communityTransactionsResult.error;

  if (firstError) {
    return serverError(firstError.message);
  }

  const buyerTransactions = (buyerTransactionsResult.data ?? []) as EnergyTransaction[];
  const communityTransactions = (communityTransactionsResult.data ?? []) as EnergyTransaction[];
  const sellerIds = [...new Set(buyerTransactions.map((transaction) => transaction.seller_id).filter(Boolean))] as string[];

  let sellers: Pick<Profile, 'id' | 'full_name' | 'suburb'>[] = [];

  if (sellerIds.length) {
    const {data, error} = await session.userClient
      .from('profiles')
      .select('id, full_name, suburb')
      .in('id', sellerIds);

    if (error) {
      return serverError(error.message);
    }

    sellers = (data ?? []) as Pick<Profile, 'id' | 'full_name' | 'suburb'>[];
  }

  return NextResponse.json({
    profile: profileResult.data,
    summary: buildBuyerImpactSummary(buyerTransactions, sellers, communityTransactions),
    recentTransactions: buyerTransactions.slice(0, 10),
  });
}
