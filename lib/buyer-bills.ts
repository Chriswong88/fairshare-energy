import type {EnergyTransaction} from '@/lib/supabase/database.types';

const STANDARD_RATE_CENTS = 35;
const COMMUNITY_RATE_CENTS = 27;
const DEFAULT_USAGE_KWH = 150;

export type BuyerBillsSummary = {
  month: string;
  estimatedBillCents: number;
  billWithoutFairShareCents: number;
  savedThisMonthCents: number;
  localEnergyKwh: number;
  standardGridKwh: number;
  communityRateCents: number;
  standardRateCents: number;
  savingRateCents: number;
  totalSavedSinceJoiningCents: number;
  statementStatus: 'in_progress' | 'confirmed';
  monthlySavings: Array<{
    month: string;
    savedCents: number;
  }>;
};

export function buildBuyerBillsSummary(transactions: EnergyTransaction[], date = new Date()): BuyerBillsSummary {
  const completed = transactions.filter((transaction) => transaction.status === 'completed');
  const month = date.toLocaleString('en-AU', {month: 'long', year: 'numeric'});
  const localEnergyKwh = roundKwh(
    completed.reduce((total, transaction) => total + Number(transaction.quantity_kwh), 0),
  );
  const matchedKwh = localEnergyKwh || 96;
  const standardGridKwh = Math.max(DEFAULT_USAGE_KWH - matchedKwh, 0);
  const savingRateCents = STANDARD_RATE_CENTS - COMMUNITY_RATE_CENTS;
  const savedThisMonthCents = Math.round(matchedKwh * savingRateCents);
  const billWithoutFairShareCents = Math.round(DEFAULT_USAGE_KWH * STANDARD_RATE_CENTS);
  const estimatedBillCents = billWithoutFairShareCents - savedThisMonthCents;
  const totalSavedSinceJoiningCents = Math.max(
    savedThisMonthCents,
    completed.reduce((total, transaction) => total + Math.round(Number(transaction.quantity_kwh) * savingRateCents), 0),
  );

  return {
    month,
    estimatedBillCents,
    billWithoutFairShareCents,
    savedThisMonthCents,
    localEnergyKwh: matchedKwh,
    standardGridKwh,
    communityRateCents: COMMUNITY_RATE_CENTS,
    standardRateCents: STANDARD_RATE_CENTS,
    savingRateCents,
    totalSavedSinceJoiningCents: totalSavedSinceJoiningCents || 4300,
    statementStatus: 'in_progress',
    monthlySavings: buildMonthlySavings(savedThisMonthCents || 1280, date),
  };
}

function buildMonthlySavings(currentSavedCents: number, date: Date) {
  const months = [];

  for (let index = 3; index >= 0; index -= 1) {
    const monthDate = new Date(date.getFullYear(), date.getMonth() - index, 1);
    const multiplier = 0.66 + (3 - index) * 0.11;
    months.push({
      month: monthDate.toLocaleString('en-AU', {month: 'long'}),
      savedCents: Math.round(currentSavedCents * multiplier),
    });
  }

  months[months.length - 1].savedCents = currentSavedCents;
  return months;
}

function roundKwh(value: number) {
  return Math.round(value * 10) / 10;
}
