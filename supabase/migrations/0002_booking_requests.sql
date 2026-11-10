-- Booking requests from owners.
-- 1. The database sets every booking's total from the provider's own rate (the app's
--    estimate in src/lib/pricing.ts uses the same formula, but this is the one that counts).
-- 2. Owners can only request real (non-demo) bookings for future dates, up to 30 days long.
-- 3. Owners can withdraw a booking while it is still 'requested'.

create or replace function public.price_booking()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  svc_rate numeric;
  units integer;
begin
  select ps.rate into svc_rate
  from public.provider_services ps
  where ps.provider_id = new.provider_id and ps.service = new.service;

  if svc_rate is null then
    raise exception 'This provider does not offer that service.';
  end if;

  if new.end_date - new.start_date > 30 then
    raise exception 'Bookings can be at most 30 days long.';
  end if;

  if not new.is_demo and new.start_date < current_date then
    raise exception 'Choose a start date from today onwards.';
  end if;

  -- Overnight services are charged per night (at least one); the rest once per day.
  if new.service in ('boarding', 'sitting') then
    units := greatest(new.end_date - new.start_date, 1);
  else
    units := new.end_date - new.start_date + 1;
  end if;

  new.total := svc_rate * units;
  return new;
end;
$$;

create trigger price_booking_before_insert
  before insert on public.bookings
  for each row execute function public.price_booking();

-- Replace the insert policy so owners cannot create demo rows or skip the 'requested' status.
drop policy "Bookings: owner can request" on public.bookings;
create policy "Bookings: owner can request" on public.bookings
  for insert to authenticated with check (
    owner_id = (select auth.uid())
    and status = 'requested'
    and not is_demo
    and pet_id in (select pt.id from public.pets pt where pt.owner_id = (select auth.uid()))
  );

create policy "Bookings: owner can withdraw a request" on public.bookings
  for delete to authenticated using (
    owner_id = (select auth.uid()) and status = 'requested'
  );
