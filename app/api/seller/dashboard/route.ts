import {NextRequest, NextResponse} from 'next/server';
import {serverError} from '@/lib/backend/api-response';
import {requireSession} from '@/lib/backend/session';

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if ('response' in session) return session.response;
  const [profileResult, listingsResult, transactionsResult] = await Promise.all([
    session.userClient.from('profiles').select('full_name, suburb, postcode').eq('id', session.userId).single(),
    session.userClient.from('seller_listings').select('*').eq('seller_id', session.userId).neq('status', 'cancelled'),
    session.userClient.from('transactions').select('*').eq('seller_id', session.userId).order('created_at', {ascending: false}).limit(10),
  ]);
  const error = profileResult.error ?? listingsResult.error ?? transactionsResult.error;
  if (error) return serverError(error.message);
  const listings = listingsResult.data ?? [];
  const transactions = transactionsResult.data ?? [];
  const activeListings = listings.filter((item) => item.status === 'active');
  const totalOfferedKwh = listings.reduce((sum, item) => sum + Number(item.quantity_kwh), 0);
  const totalSoldKwh = listings.reduce((sum, item) => sum + Number(item.sold_quantity_kwh ?? 0), 0);
  const totalEarningsCents = transactions
    .filter((item) => item.status === 'completed')
    .reduce((sum, item) => sum + Number(item.amount_cents), 0);
  return NextResponse.json({
    profile: profileResult.data,
    metrics: {
      activeListingCount: activeListings.length,
      totalOfferedKwh,
      totalSoldKwh,
      totalEarningsCents,
      matchRate: totalOfferedKwh ? Math.round((totalSoldKwh / totalOfferedKwh) * 100) : 0,
    },
    activeListings,
    recentTransactions: transactions,
  });
}
