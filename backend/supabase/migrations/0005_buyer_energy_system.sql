create type public.purchase_status as enum ('active', 'matched', 'cancelled');
create table public.buyer_energy_purchases (
  id uuid primary key default gen_random_uuid(), buyer_id uuid not null references public.profiles(id) on delete cascade,
  offer_id text not null, seller_name text not null, seller_suburb text not null,
  quantity_kwh numeric(8,2) not null check(quantity_kwh > 0), price_per_kwh_cents integer not null check(price_per_kwh_cents >= 0),
  standard_rate_cents integer not null check(standard_rate_cents >= price_per_kwh_cents), status public.purchase_status not null default 'matched',
  purchased_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.buyer_energy_usage (
  id uuid primary key default gen_random_uuid(), buyer_id uuid not null references public.profiles(id) on delete cascade,
  usage_date date not null, total_kwh numeric(8,2) not null check(total_kwh >= 0),
  local_matched_kwh numeric(8,2) not null default 0 check(local_matched_kwh >= 0 and local_matched_kwh <= total_kwh),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(buyer_id,usage_date)
);
create index buyer_energy_purchases_buyer_date_idx on public.buyer_energy_purchases(buyer_id,purchased_at desc);
create index buyer_energy_usage_buyer_date_idx on public.buyer_energy_usage(buyer_id,usage_date desc);
alter table public.buyer_energy_purchases enable row level security;
alter table public.buyer_energy_usage enable row level security;
create policy "Buyers manage their purchases" on public.buyer_energy_purchases for all using(auth.uid()=buyer_id) with check(auth.uid()=buyer_id);
create policy "Buyers manage their usage" on public.buyer_energy_usage for all using(auth.uid()=buyer_id) with check(auth.uid()=buyer_id);
create trigger buyer_energy_purchases_set_updated_at before update on public.buyer_energy_purchases for each row execute function public.set_updated_at();
create trigger buyer_energy_usage_set_updated_at before update on public.buyer_energy_usage for each row execute function public.set_updated_at();
notify pgrst, 'reload schema';
