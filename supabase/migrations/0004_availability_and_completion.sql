-- Availability and completing bookings.
--  - Providers block the dates they can't take bookings; requests that overlap a blocked date are rejected.
--  - Booking status can only move along allowed steps, enforced in one place (guard_booking_update):
--      requested           -> accepted | declined   (provider)
--      accepted | paid     -> completed             (provider, once the booking's last day has arrived)
--    Anything else, and any change to fields other than status, is rejected.

create table public.provider_unavailable_dates (
  provider_id text not null references public.providers (id) on delete cascade,
  day date not null,
  primary key (provider_id, day)
);

create index on public.provider_unavailable_dates (day);

alter table public.provider_unavailable_dates enable row level security;

-- Owners need blocked dates to filter search; providers manage only their own.
create policy "Unavailable dates: read" on public.provider_unavailable_dates
  for select to authenticated using (true);
create policy "Unavailable dates: provider manages own" on public.provider_unavailable_dates
  for all to authenticated
  using (public.is_my_listing(provider_id))
  with check (public.is_my_listing(provider_id));

-- New requests can't include a date the provider has blocked.
create or replace function public.check_booking_availability()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  first_blocked date;
begin
  if new.is_demo then
    return new;
  end if;
  select min(u.day) into first_blocked
  from public.provider_unavailable_dates u
  where u.provider_id = new.provider_id and u.day between new.start_date and new.end_date;
  if first_blocked is not null then
    raise exception 'This provider is not available on %. Choose other dates.', to_char(first_blocked, 'Mon FMDD');
  end if;
  return new;
end;
$$;

create trigger check_booking_availability before insert on public.bookings
  for each row execute function public.check_booking_availability();

-- Status steps, replacing the "only status may change" guard from 0003.
create or replace function public.guard_booking_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  step text := old.status::text || '->' || new.status::text;
begin
  if (select auth.uid()) is null then
    return new;
  end if;
  if (new.owner_id, new.provider_id, new.pet_id, new.service, new.start_date, new.end_date, new.total, new.is_demo)
     is distinct from
     (old.owner_id, old.provider_id, old.pet_id, old.service, old.start_date, old.end_date, old.total, old.is_demo) then
    raise exception 'Only the status of a booking can be changed.';
  end if;
  if step in ('requested->accepted', 'requested->declined') then
    return new;
  end if;
  if step in ('accepted->completed', 'paid->completed') then
    if old.end_date > current_date then
      raise exception 'A booking can be marked completed from its last day onwards.';
    end if;
    return new;
  end if;
  raise exception 'A booking can''t go from % to %.', old.status, new.status;
end;
$$;

-- One provider update policy; the trigger above decides which status steps are allowed.
drop policy "Bookings: provider answers a request" on public.bookings;
create policy "Bookings: provider updates status" on public.bookings
  for update to authenticated
  using (public.is_my_listing(provider_id))
  with check (public.is_my_listing(provider_id));
