-- One verified meter summary per seller per calendar month. Dashboard totals are
-- derived from this row plus seller_listings and transactions.
create table public.seller_energy_months (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  month_start date not null,
  generated_kwh numeric(8, 2) not null check (generated_kwh >= 0),
  used_at_home_kwh numeric(8, 2) not null default 0 check (used_at_home_kwh >= 0),
  battery_kwh numeric(8, 2) not null default 0 check (battery_kwh >= 0),
  standard_export_kwh numeric(8, 2) not null default 0 check (standard_export_kwh >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (seller_id, month_start),
  check (used_at_home_kwh + battery_kwh + standard_export_kwh <= generated_kwh)
);

alter table public.seller_energy_months enable row level security;

create policy "Sellers can read their monthly energy"
  on public.seller_energy_months for select using (auth.uid() = seller_id);

create policy "Sellers can manage their monthly energy"
  on public.seller_energy_months for all using (auth.uid() = seller_id) with check (auth.uid() = seller_id);

-- Listing progress is derived from the buyer transactions linked to that offer.
create or replace function public.refresh_seller_listing_progress(target_listing_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  matched_kwh numeric(8, 2);
  offered_kwh numeric(8, 2);
begin
  if target_listing_id is null then return; end if;
  select quantity_kwh into offered_kwh from public.seller_listings where id = target_listing_id;
  if not found then return; end if;
  select coalesce(sum(quantity_kwh), 0) into matched_kwh from public.transactions
    where listing_id = target_listing_id and status in ('pending', 'completed');
  update public.seller_listings
    set sold_quantity_kwh = least(matched_kwh, offered_kwh),
        status = case when matched_kwh >= offered_kwh then 'completed' else status end
    where id = target_listing_id and status not in ('cancelled', 'paused');
end;
$$;

create or replace function public.refresh_seller_listing_progress_after_transaction()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op <> 'INSERT' then perform public.refresh_seller_listing_progress(old.listing_id); end if;
  if tg_op <> 'DELETE' then perform public.refresh_seller_listing_progress(new.listing_id); end if;
  return null;
end;
$$;

create trigger transactions_refresh_seller_listing_progress
after insert or update or delete on public.transactions
for each row execute function public.refresh_seller_listing_progress_after_transaction();
