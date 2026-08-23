-- FairShare Energy initial Supabase schema.
-- Uses Supabase Auth's auth.users table as the source of login identity.

create type public.user_role as enum ('buyer', 'seller');
create type public.listing_type as enum ('sale', 'donation', 'fairshare');
create type public.listing_status as enum ('draft', 'active', 'paused', 'cancelled', 'completed');
create type public.transaction_status as enum ('pending', 'completed', 'cancelled', 'refunded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  address_line text not null,
  suburb text not null,
  postcode text not null,
  electricity_provider text not null,
  electricity_plan text not null,
  active_role public.user_role not null default 'buyer',
  can_buy boolean not null default true,
  can_sell boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.buyer_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  household_size integer,
  support_credit_cents integer not null default 0,
  priority_score numeric(6, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.seller_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  solar_system_size_kw numeric(6, 2),
  meter_reference text,
  payout_method_status text not null default 'not_set',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.seller_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  quantity_kwh numeric(8, 2) not null,
  price_per_kwh_cents integer,
  listing_type public.listing_type not null,
  status public.listing_status not null default 'active',
  available_from timestamptz,
  available_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references public.profiles(id) on delete set null,
  seller_id uuid references public.profiles(id) on delete set null,
  listing_id uuid references public.seller_listings(id) on delete set null,
  quantity_kwh numeric(8, 2) not null,
  amount_cents integer not null default 0,
  status public.transaction_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  card_brand text not null,
  card_last4 text not null,
  provider_payment_method_id text,
  is_default boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.buyer_profiles enable row level security;
alter table public.seller_profiles enable row level security;
alter table public.seller_listings enable row level security;
alter table public.transactions enable row level security;
alter table public.payment_methods enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can read their buyer profile"
  on public.buyer_profiles for select
  using (auth.uid() = user_id);

create policy "Users can update their buyer profile"
  on public.buyer_profiles for update
  using (auth.uid() = user_id);

create policy "Users can read their seller profile"
  on public.seller_profiles for select
  using (auth.uid() = user_id);

create policy "Users can update their seller profile"
  on public.seller_profiles for update
  using (auth.uid() = user_id);

create policy "Anyone logged in can read active listings"
  on public.seller_listings for select
  using (auth.role() = 'authenticated' and status = 'active');

create policy "Sellers can manage their own listings"
  on public.seller_listings for all
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

create policy "Users can read transactions involving them"
  on public.transactions for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Users can read their own payment methods"
  on public.payment_methods for select
  using (auth.uid() = user_id);

create policy "Users can manage their own payment methods"
  on public.payment_methods for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
