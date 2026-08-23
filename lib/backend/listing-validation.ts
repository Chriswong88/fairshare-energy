import type {ListingStatus, ListingType} from '@/lib/supabase/database.types';

export type ListingInput = {
  quantityKwh?: unknown;
  pricePerKwhCents?: unknown;
  listingType?: unknown;
  status?: unknown;
  availableFrom?: unknown;
  availableUntil?: unknown;
  supportPreference?: unknown;
  donationPercentage?: unknown;
};

const listingTypes: ListingType[] = ['sale', 'donation', 'fairshare'];
const editableStatuses: ListingStatus[] = ['draft', 'active', 'paused'];
const supportPreferences = ['renters', 'low-income', 'none'];

export function parseListingInput(payload: ListingInput, partial = false) {
  const result: Record<string, string | number | null> = {};

  if (!partial || payload.quantityKwh !== undefined) {
    const value = Number(payload.quantityKwh);
    if (!Number.isFinite(value) || value <= 0 || value > 100000) {
      throw new Error('Quantity must be between 0 and 100,000 kWh.');
    }
    result.quantity_kwh = Math.round(value * 100) / 100;
  }

  if (!partial || payload.pricePerKwhCents !== undefined) {
    const value = Number(payload.pricePerKwhCents ?? 12);
    if (!Number.isInteger(value) || value < 0 || value > 10000) {
      throw new Error('Price must be a whole number from 0 to 10,000 cents per kWh.');
    }
    result.price_per_kwh_cents = value;
  }

  if (!partial || payload.listingType !== undefined) {
    const value = String(payload.listingType ?? 'sale') as ListingType;
    if (!listingTypes.includes(value)) throw new Error('Invalid listing type.');
    result.listing_type = value;
  }

  if (payload.status !== undefined) {
    const value = String(payload.status) as ListingStatus;
    if (!editableStatuses.includes(value)) throw new Error('Status must be draft, active, or paused.');
    result.status = value;
  }

  if (!partial || payload.availableFrom !== undefined) {
    result.available_from = parseDate(payload.availableFrom, 'availableFrom');
  }
  if (!partial || payload.availableUntil !== undefined) {
    result.available_until = parseDate(payload.availableUntil, 'availableUntil');
  }

  const from = result.available_from;
  const until = result.available_until;
  if (typeof from === 'string' && typeof until === 'string' && until < from) {
    throw new Error('End date must be on or after the start date.');
  }

  if (!partial || payload.supportPreference !== undefined) {
    const value = String(payload.supportPreference ?? 'none');
    if (!supportPreferences.includes(value)) throw new Error('Invalid support preference.');
    result.support_preference = value;
  }

  if (!partial || payload.donationPercentage !== undefined) {
    const value = Number(payload.donationPercentage ?? 0);
    if (!Number.isInteger(value) || value < 0 || value > 100) {
      throw new Error('Donation percentage must be a whole number from 0 to 100.');
    }
    result.donation_percentage = value;
  }

  if (partial && Object.keys(result).length === 0) throw new Error('No listing fields were provided.');
  return result;
}

function parseDate(value: unknown, field: string) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${field} must be a date in YYYY-MM-DD format.`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`${field} is not a valid date.`);
  }
  return date.toISOString();
}
