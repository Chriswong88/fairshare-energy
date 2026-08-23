-- Seller listing preferences, progress tracking, validation, and timestamp maintenance.
alter table public.seller_listings
  add column sold_quantity_kwh numeric(8, 2) not null default 0,
  add column support_preference text not null default 'none',
  add column donation_percentage integer not null default 0,
  add constraint seller_listings_quantity_positive check (quantity_kwh > 0),
  add constraint seller_listings_sold_valid check (sold_quantity_kwh >= 0 and sold_quantity_kwh <= quantity_kwh),
  add constraint seller_listings_price_valid check (price_per_kwh_cents is null or price_per_kwh_cents >= 0),
  add constraint seller_listings_dates_valid check (available_until is null or available_from is null or available_until >= available_from),
  add constraint seller_listings_support_valid check (support_preference in ('renters', 'low-income', 'none')),
  add constraint seller_listings_donation_valid check (donation_percentage between 0 and 100);

create index seller_listings_seller_status_created_idx
  on public.seller_listings (seller_id, status, created_at desc);
create index seller_listings_active_availability_idx
  on public.seller_listings (status, available_from, available_until)
  where status = 'active';

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger seller_listings_set_updated_at before update on public.seller_listings
for each row execute function public.set_updated_at();
