import type {EnergyTransaction} from '@/lib/supabase/database.types';

export type BillCredit = {
  id: string;
  date: string;
  energyKwh: number;
  communityEarningsCents: number;
  retailerCreditCents: number;
  status: string;
};

export function buildBillCredits(transactions: EnergyTransaction[]): BillCredit[] {
  return transactions.map((transaction) => ({
    id: transaction.id,
    date: transaction.created_at,
    energyKwh: Number(transaction.quantity_kwh),
    communityEarningsCents: transaction.amount_cents,
    retailerCreditCents: Math.round(transaction.amount_cents / 2),
    status: transaction.status === 'completed' ? 'Confirmed' : 'Processing',
  }));
}

export function formatAud(cents: number) {
  return new Intl.NumberFormat('en-AU', {style: 'currency', currency: 'AUD'}).format(cents / 100);
}
