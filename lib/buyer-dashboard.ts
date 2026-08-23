import type {EnergyTransaction, SellerListing} from '@/lib/supabase/database.types';

const STANDARD_RATE_CENTS = 35;
const FALLBACK_COMMUNITY_RATE_CENTS = 27;
const DEFAULT_USAGE_KWH = 150;

export type BuyerDashboardSummary = {
  fullName: string;
  savedThisMonthCents: number;
  localEnergyKwh: number;
  localEnergySharePercent: number;
  communityRateCents: number;
  standardRateCents: number;
  activeListing: {
    id: string | null;
    title: string;
    monthlyLimitKwh: number;
    matchedThisMonthKwh: number;
    status: string;
    pricePerKwhCents: number;
  };
  recentActivity: Array<{
    id: string;
    title: string;
    source: string;
    dateLabel: string;
    energyLabel: string;
  }>;
};

export function buildBuyerDashboardSummary({
  fullName,
  transactions,
  activeListing,
  date = new Date(),
}: {
  fullName?: string | null;
  transactions: EnergyTransaction[];
  activeListing?: SellerListing | null;
  date?: Date;
}): BuyerDashboardSummary {
  const completed = transactions.filter((transaction) => transaction.status === 'completed');
  const localEnergyKwh = roundKwh(completed.reduce((total, transaction) => total + Number(transaction.quantity_kwh), 0)) || 96;
  const communityRateCents = activeListing?.price_per_kwh_cents ?? estimateCommunityRate(completed) ?? FALLBACK_COMMUNITY_RATE_CENTS;
  const savedThisMonthCents = Math.max(0, Math.round(localEnergyKwh * (STANDARD_RATE_CENTS - communityRateCents)));
  const monthlyLimitKwh = activeListing ? roundKwh(Number(activeListing.quantity_kwh)) : 120;

  return {
    fullName: fullName?.trim() || 'Bob Lee',
    savedThisMonthCents: savedThisMonthCents || 1280,
    localEnergyKwh,
    localEnergySharePercent: Math.round((localEnergyKwh / DEFAULT_USAGE_KWH) * 100),
    communityRateCents,
    standardRateCents: STANDARD_RATE_CENTS,
    activeListing: {
      id: activeListing?.id ?? null,
      title: activeListing ? describeListing(activeListing) : 'Local energy listing',
      monthlyLimitKwh,
      matchedThisMonthKwh: Math.min(localEnergyKwh, monthlyLimitKwh),
      status: activeListing?.status ?? 'active',
      pricePerKwhCents: communityRateCents,
    },
    recentActivity: buildRecentActivity(transactions, date),
  };
}

function buildRecentActivity(transactions: EnergyTransaction[], date: Date) {
  const rows = transactions
    .slice(0, 5)
    .map((transaction) => ({
      id: transaction.id,
      title: transaction.status === 'completed' ? 'Matched energy credit' : 'Energy match pending',
      source: transaction.listing_id ? 'Local energy listing' : 'FairShare marketplace',
      dateLabel: formatRelativeDate(new Date(transaction.created_at), date),
      energyLabel: `+${roundKwh(Number(transaction.quantity_kwh))} kWh`,
    }));

  if (rows.length) return rows;

  return [
    {id: 'demo-1', title: 'Matched energy credit', source: 'Local energy listing', dateLabel: 'Today', energyLabel: '+8.6 kWh'},
    {id: 'demo-2', title: 'Matched energy credit', source: 'Local energy listing', dateLabel: '18 May 2026', energyLabel: '+7.2 kWh'},
    {id: 'demo-3', title: 'Matched energy credit', source: 'Local energy listing', dateLabel: '11 May 2026', energyLabel: '+6.4 kWh'},
    {id: 'demo-4', title: 'Matched energy credit', source: 'Local energy listing', dateLabel: '4 May 2026', energyLabel: '+7.8 kWh'},
    {id: 'demo-5', title: 'Matched energy credit', source: 'Local energy listing', dateLabel: '27 Apr 2026', energyLabel: '+6.1 kWh'},
  ];
}

function estimateCommunityRate(transactions: EnergyTransaction[]) {
  const paid = transactions.filter((transaction) => Number(transaction.quantity_kwh) > 0 && transaction.amount_cents > 0);
  if (!paid.length) return null;

  const totalAmount = paid.reduce((sum, transaction) => sum + transaction.amount_cents, 0);
  const totalKwh = paid.reduce((sum, transaction) => sum + Number(transaction.quantity_kwh), 0);
  return Math.round(totalAmount / totalKwh);
}

function describeListing(listing: SellerListing) {
  if (listing.listing_type === 'donation') return 'Donated local energy';
  if (listing.listing_type === 'fairshare') return 'FairShare local listing';
  return 'Local energy listing';
}

function formatRelativeDate(value: Date, date: Date) {
  const startOfToday = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const startOfValue = new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const days = Math.round((startOfToday - startOfValue) / 86400000);

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return new Intl.DateTimeFormat('en-AU', {day: 'numeric', month: 'short', year: 'numeric'}).format(value);
}

function roundKwh(value: number) {
  return Math.round(value * 10) / 10;
}
