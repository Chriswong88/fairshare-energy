import {NextRequest, NextResponse} from 'next/server';
import {serverError} from '@/lib/backend/api-response';
import {requireSession} from '@/lib/backend/session';
import {createSupabaseAdminClient} from '@/lib/supabase/server';
import type {EnergyTransaction, SellerEnergyMonth, SellerListing} from '@/lib/supabase/database.types';

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if ('response' in session) return session.response;
  const monthStart = currentMonthStart();
  const [profileResult, listingsResult, transactionsResult, energyResult] = await Promise.all([
    session.userClient.from('profiles').select('full_name, suburb, postcode').eq('id', session.userId).single(),
    session.userClient.from('seller_listings').select('*').eq('seller_id', session.userId).neq('status', 'cancelled'),
    session.userClient.from('transactions').select('*').eq('seller_id', session.userId).in('status', ['pending', 'completed']).order('created_at', {ascending: false}),
    session.userClient.from('seller_energy_months').select('*').eq('seller_id', session.userId).eq('month_start', monthStart).maybeSingle(),
  ]);
  const error = profileResult.error ?? listingsResult.error ?? transactionsResult.error ?? energyResult.error;
  if (error) return serverError(error.message);
  const listings = (listingsResult.data ?? []) as SellerListing[];
  const transactions = (transactionsResult.data ?? []) as EnergyTransaction[];
  const energy = energyResult.data as SellerEnergyMonth | null;
  const currentMonthTransactions = transactions.filter((item) => item.created_at >= `${monthStart}T00:00:00.000Z`);
  const soldThisMonthKwh = sumKwh(currentMonthTransactions);
  const earningsThisMonthCents = currentMonthTransactions.reduce((sum, item) => sum + Number(item.amount_cents), 0);
  const activeListing = listings.find((item) => item.status === 'active' || item.status === 'paused') ?? null;
  const generatedKwh = asNumber(energy?.generated_kwh);
  const usedAtHomeKwh = asNumber(energy?.used_at_home_kwh);
  const batteryKwh = asNumber(energy?.battery_kwh);
  const standardExportKwh = asNumber(energy?.standard_export_kwh);
  const buyerNames = await getBuyerNames(transactions);
  return NextResponse.json({
    profile: profileResult.data,
    monthStart,
    summary: {
      generatedKwh, usedAtHomeKwh, batteryKwh, standardExportKwh,
      sharedLocallyKwh: soldThisMonthKwh,
      availableSurplusKwh: Math.max(0, generatedKwh - usedAtHomeKwh - batteryKwh - standardExportKwh - soldThisMonthKwh),
      currentPricePerKwhCents: activeListing?.price_per_kwh_cents ?? 12,
      energySoldThisMonthKwh: soldThisMonthKwh,
      earningsThisMonthCents,
    },
    activeOffer: activeListing && {
      id: activeListing.id, quantityKwh: asNumber(activeListing.quantity_kwh), soldKwh: asNumber(activeListing.sold_quantity_kwh),
      pricePerKwhCents: activeListing.price_per_kwh_cents ?? 12, status: activeListing.status,
    },
    activity: transactions.slice(0, 10).map((item) => ({
      id: item.id, date: item.created_at,
      buyerName: item.buyer_id ? buyerNames.get(item.buyer_id) ?? 'Community household' : 'Community household',
      quantityKwh: asNumber(item.quantity_kwh), amountCents: Number(item.amount_cents),
      ratePerKwhCents: asNumber(item.quantity_kwh) ? Math.round(Number(item.amount_cents) / asNumber(item.quantity_kwh)) : 0,
      status: item.status,
    })),
  });
}

async function getBuyerNames(transactions: EnergyTransaction[]) {
  const ids = [...new Set(transactions.map((item) => item.buyer_id).filter((id): id is string => Boolean(id)))];
  if (!ids.length) return new Map<string, string>();
  const {data, error} = await createSupabaseAdminClient().from('profiles').select('id, full_name').in('id', ids);
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((profile) => [profile.id, profile.full_name]));
}

function currentMonthStart() { const now = new Date(); return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`; }
function sumKwh(transactions: EnergyTransaction[]) { return transactions.reduce((sum, item) => sum + asNumber(item.quantity_kwh), 0); }
function asNumber(value: number | null | undefined) { return Number(value ?? 0); }
