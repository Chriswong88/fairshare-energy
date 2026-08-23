-- Safe repair for Supabase projects created before seller listing fields were
-- added. Every statement is idempotent, so it can be run on an up-to-date DB.
alter table public.seller_listings
  add column if not exists price_per_kwh_cents integer,
  add column if not exists listing_type public.listing_type,
  add column if not exists status public.listing_status not null default 'active',
  add column if not exists available_from timestamptz,
  add column if not exists available_until timestamptz,
  add column if not exists sold_quantity_kwh numeric(8, 2) not null default 0,
  add column if not exists support_preference text not null default 'none',
  add column if not exists donation_percentage integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

-- Existing rows remain valid and can be displayed while new listings use the
-- full set of fields above.
update public.seller_listings
set listing_type = 'sale'
where listing_type is null;

alter table public.seller_listings
  alter column listing_type set default 'sale',
  alter column listing_type set not null;

create index if not exists seller_listings_seller_status_created_idx
  on public.seller_listings (seller_id, status, created_at desc);
