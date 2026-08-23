import type {EnergyTransaction, Profile} from '@/lib/supabase/database.types';

const CO2_AVOIDED_KG_PER_KWH = 0.75;
const STANDARD_RATE_CENTS = 35;
const COMMUNITY_RATE_CENTS = 27;
const DEFAULT_USAGE_KWH = 150;

export type BuyerImpactSource = {
  sellerId: string;
  name: string;
  suburb: string;
  energyKwh: number;
  sharePercent: number;
};

export type BuyerImpactSummary = {
  localRenewableKwh: number;
  solarHouseholdsSupported: number;
  co2AvoidedKg: number;
  householdUsageKwh: number;
  localEnergySharePercent: number;
  localEnergyGoalPercent: number;
  sources: BuyerImpactSource[];
  community: {
    participatingHouseholds: number;
    sharedThisMonthKwh: number;
    communitySavingsCents: number;
  };
};

type SellerProfile = Pick<Profile, 'id' | 'full_name' | 'suburb'>;

const fallbackSources: BuyerImpactSource[] = [
  {sellerId: 'demo-emily', name: 'Emily Carter', suburb: 'Warrawong', energyKwh: 42, sharePercent: 44},
  {sellerId: 'demo-jack', name: 'Jack Thompson', suburb: 'Dapto', energyKwh: 28, sharePercent: 29},
  {sellerId: 'demo-sophie', name: 'Sophie Nguyen', suburb: 'Wollongong', energyKwh: 26, sharePercent: 27},
];

export function buildBuyerImpactSummary(
  transactions: EnergyTransaction[],
  sellers: SellerProfile[],
  communityTransactions: EnergyTransaction[],
): BuyerImpactSummary {
  const completed = transactions.filter((transaction) => transaction.status === 'completed');
  const sellerMap = new Map(sellers.map((seller) => [seller.id, seller]));
  const sourceTotals = new Map<string, number>();

  completed.forEach((transaction) => {
    if (!transaction.seller_id) return;
    sourceTotals.set(
      transaction.seller_id,
      (sourceTotals.get(transaction.seller_id) ?? 0) + Number(transaction.quantity_kwh),
    );
  });

  const totalLocalKwh = roundKwh(
    [...sourceTotals.values()].reduce((total, value) => total + value, 0),
  );
  const sources =
    totalLocalKwh > 0
      ? [...sourceTotals.entries()].map(([sellerId, energy]) => {
          const seller = sellerMap.get(sellerId);

          return {
            sellerId,
            name: seller?.full_name ?? 'Local solar seller',
            suburb: seller?.suburb ?? 'Wollongong',
            energyKwh: roundKwh(energy),
            sharePercent: Math.round((energy / totalLocalKwh) * 100),
          };
        })
      : fallbackSources;

  const localRenewableKwh = totalLocalKwh || 96;
  const communitySharedKwh = roundKwh(
    communityTransactions
      .filter((transaction) => transaction.status === 'completed')
      .reduce((total, transaction) => total + Number(transaction.quantity_kwh), 0),
  );

  return {
    localRenewableKwh,
    solarHouseholdsSupported: Math.max(new Set(sources.map((source) => source.sellerId)).size, 4),
    co2AvoidedKg: Math.round(localRenewableKwh * CO2_AVOIDED_KG_PER_KWH),
    householdUsageKwh: DEFAULT_USAGE_KWH,
    localEnergySharePercent: Math.round((localRenewableKwh / DEFAULT_USAGE_KWH) * 100),
    localEnergyGoalPercent: 75,
    sources,
    community: {
      participatingHouseholds: Math.max(126, new Set(communityTransactions.map((transaction) => transaction.buyer_id).filter(Boolean)).size),
      sharedThisMonthKwh: communitySharedKwh || 4820,
      communitySavingsCents:
        communitySharedKwh > 0
          ? Math.round(communitySharedKwh * (STANDARD_RATE_CENTS - COMMUNITY_RATE_CENTS))
          : 124000,
    },
  };
}

function roundKwh(value: number) {
  return Math.round(value * 10) / 10;
}
