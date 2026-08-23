import type {UserRole} from '@/lib/backend/roles';

export type ListingType = 'sale' | 'donation' | 'fairshare';
export type ListingStatus = 'draft' | 'active' | 'paused' | 'cancelled' | 'completed';
export type TransactionStatus = 'pending' | 'completed' | 'cancelled' | 'refunded';

export type Profile = {
  id: string;
  full_name: string;
  address_line: string;
  suburb: string;
  postcode: string;
  electricity_provider: string;
  electricity_plan: string;
  active_role: UserRole;
  can_buy: boolean;
  can_sell: boolean;
  created_at: string;
  updated_at: string;
};

export type BuyerProfile = {
  user_id: string;
  household_size: number | null;
  support_credit_cents: number;
  priority_score: number;
  created_at: string;
  updated_at: string;
};

export type SellerProfile = {
  user_id: string;
  solar_system_size_kw: number | null;
  meter_reference: string | null;
  payout_method_status: string;
  created_at: string;
  updated_at: string;
};

export type SellerEnergyMonth = {
  id: string;
  seller_id: string;
  month_start: string;
  generated_kwh: number;
  used_at_home_kwh: number;
  battery_kwh: number;
  standard_export_kwh: number;
  created_at: string;
  updated_at: string;
};

export type SellerListing = {
  id: string;
  seller_id: string;
  quantity_kwh: number;
  sold_quantity_kwh: number;
  price_per_kwh_cents: number | null;
  listing_type: ListingType;
  status: ListingStatus;
  available_from: string | null;
  available_until: string | null;
  support_preference: 'renters' | 'low-income' | 'none';
  donation_percentage: number;
  created_at: string;
  updated_at: string;
};

export type EnergyTransaction = {
  id: string;
  buyer_id: string | null;
  seller_id: string | null;
  listing_id: string | null;
  quantity_kwh: number;
  amount_cents: number;
  status: TransactionStatus;
  created_at: string;
};

export type PaymentMethod = {
  id: string;
  user_id: string;
  card_brand: string;
  card_last4: string;
  provider_payment_method_id: string | null;
  is_default: boolean;
  created_at: string;
};
