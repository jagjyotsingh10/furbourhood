-- Dates follow Windsor time, not UTC.
-- The database clock is UTC, so after about 7-8 p.m. in Windsor current_date is already tomorrow,
-- while the app uses the phone's local date. That refused same-day requests in the evening and
-- stopped photo updates on a booking's last evening. Every date rule now uses local_today().
-- The four functions below are copied unchanged from their latest migration except for that swap.

create or replace function public.local_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/Toronto')::date;
$$;

-- From 0002_booking_requests.sql (1 date check)
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

  if not new.is_demo and new.start_date < public.local_today() then
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

-- From 0004_availability_and_completion.sql (1 date check)
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
    if old.end_date > public.local_today() then
      raise exception 'A booking can be marked completed from its last day onwards.';
    end if;
    return new;
  end if;
  raise exception 'A booking can''t go from % to %.', old.status, new.status;
end;
$$;

-- From 0005_reviews_and_capacity.sql (1 date check)
create or replace function public.prepare_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  b record;
  first_name text;
  last_name text;
begin
  if (select auth.uid()) is null then
    return new; -- seed data and the SQL Editor
  end if;

  select bk.owner_id, bk.provider_id, bk.status, pt.name as pet_name
  into b
  from public.bookings bk
  join public.pets pt on pt.id = bk.pet_id
  where bk.id = new.booking_id;

  if not found or b.owner_id <> (select auth.uid()) then
    raise exception 'You can only review your own bookings.';
  end if;
  if b.status <> 'completed' then
    raise exception 'You can review a booking once it is completed.';
  end if;

  select split_part(trim(pr.full_name), ' ', 1), split_part(trim(pr.full_name), ' ', 2)
  into first_name, last_name
  from public.profiles pr
  where pr.id = b.owner_id;

  new.owner_id := b.owner_id;
  new.provider_id := b.provider_id;
  new.pet_name := b.pet_name;
  new.review_date := public.local_today();
  -- Shown as "Jordan P.", like provider names.
  new.author_name := coalesce(nullif(first_name, ''), 'Owner')
    || case when coalesce(last_name, '') <> '' then ' ' || left(last_name, 1) || '.' else '' end;
  -- Only skills the provider lists can be confirmed.
  new.confirmed_needs := array(
    select distinct n
    from unnest(new.confirmed_needs) as n
    where exists (select 1 from public.provider_skills s where s.provider_id = b.provider_id and s.need = n)
  );
  return new;
end;
$$;

-- From 0006_photo_updates.sql (1 date check)
create or replace function public.can_post_booking_update(p_booking text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.bookings b
    join public.providers p on p.id = b.provider_id
    where b.id::text = p_booking
      and p.user_id = (select auth.uid())
      and b.status in ('accepted', 'paid')
      and public.local_today() between b.start_date and b.end_date
  );
$$;

-- Reviews default to today's Windsor date too (seed and SQL Editor inserts).
alter table public.reviews alter column review_date set default public.local_today();

-- Fix from 0007: providers could delete the file behind an approved certificate straight from storage.
-- Approved certificates (and their files) stay on record; only pending or declined files can be removed.
drop policy "Certificates: provider deletes files" on storage.objects;
create policy "Certificates: provider deletes unapproved files" on storage.objects
  for delete to authenticated using (
    bucket_id = 'provider-certificates'
    and public.is_my_listing((storage.foldername(name))[1])
    and not exists (
      select 1 from public.provider_certificates c
      where c.file_path = storage.objects.name and c.status = 'approved'
    )
  );
