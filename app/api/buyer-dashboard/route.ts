import {NextRequest, NextResponse} from 'next/server';
import {serverError} from '@/lib/backend/api-response';
import {requireSession} from '@/lib/backend/session';
import {buildBuyerDashboardSummary} from '@/lib/buyer-dashboard';
import {getElectricityPlanInfo} from '@/lib/electricity-plans';
import type {EnergyTransaction, SellerListing} from '@/lib/supabase/database.types';

export async function GET(request: NextRequest) {
  const session = await requireSession(request);

  if ('response' in session) {
    return session.response;
  }

  const transactionsQuery = session.userClient
    .from('transactions')
    .select('*')
    .eq('buyer_id', session.userId)
    .in('status', ['pending', 'completed'])
    .order('created_at', {ascending: false});

  const [profileResult, transactionsResult] = await Promise.all([
    session.userClient
      .from('profiles')
      .select('full_name, electricity_provider, electricity_plan')
      .eq('id', session.userId)
      .single(),
    transactionsQuery,
  ]);

  const error = profileResult.error ?? transactionsResult.error;
  if (error) return serverError(error.message);

  const transactions = (transactionsResult.data ?? []) as EnergyTransaction[];
  const activeListingId = transactions.find((transaction) => transaction.listing_id)?.listing_id;
  const activeListing = await findActiveListing(session.userClient, activeListingId);

  return NextResponse.json({
    planInfo: getElectricityPlanInfo(profileResult.data?.electricity_provider, profileResult.data?.electricity_plan),
    summary: buildBuyerDashboardSummary({
      fullName: profileResult.data?.full_name,
      transactions,
      activeListing,
    }),
  });
}

async function findActiveListing(
  userClient: ReturnType<typeof requireSession> extends Promise<infer Session>
    ? Session extends {userClient: infer Client}
      ? Client
      : never
    : never,
  listingId?: string | null,
) {
  if (listingId) {
    const {data} = await userClient
      .from('seller_listings')
      .select('*')
      .eq('id', listingId)
      .maybeSingle();

    if (data) return data as SellerListing;
  }

  const {data} = await userClient
    .from('seller_listings')
    .select('*')
    .eq('status', 'active')
    .order('created_at', {ascending: false})
    .limit(1)
    .maybeSingle();

  return (data ?? null) as SellerListing | null;
}
