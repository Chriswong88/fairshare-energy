export type Listing = {
  id: number;
  title: string;
  detail: string;
  result: string;
  kind: 'sale' | 'donation';
  quantityKwh?: number;
  pricePerKwhCents?: number;
  availableFrom?: string;
  availableUntil?: string;
  status?: 'active' | 'paused';
  supportPreference?: 'renters' | 'low-income' | 'none';
  donationPercentage?: number;
};
export const LISTINGS_KEY = 'fairshare-seller-listings';
export const DEFAULT_LISTINGS: Listing[] = [];
export function loadListings(): Listing[] {
  if (typeof window === 'undefined') return DEFAULT_LISTINGS;
  const saved = window.localStorage.getItem(LISTINGS_KEY);
  if (!saved) return DEFAULT_LISTINGS;
  try {
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed as Listing[] : DEFAULT_LISTINGS;
  } catch {
    return DEFAULT_LISTINGS;
  }
}
export function saveListings(listings: Listing[]) {
  window.localStorage.setItem(LISTINGS_KEY, JSON.stringify(listings));
}
