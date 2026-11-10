-- Reviews with skill confirmation, Proven skills, and the host capacity limit.
--  - Owners review a booking once it is completed, and can confirm skills the provider used.
--  - A skill becomes Proven when 3 or more owners have confirmed it (report Table 8).
--  - Providers record their own pets. For care at the host's home (boarding, daycare), own pets and
--    guest pets together stay within City of Windsor By-law 8156: 3 dogs and 4 cats per premises.

-- ---------------------------------------------------------------------------
-- System updates (ratings, Proven levels) are made by triggers below while an owner is signed in.
-- The provider guards from 0003 let them through only when this transaction-local flag is on;
-- the flag can't be set from the app (set_config is not exposed by the API).
-- ---------------------------------------------------------------------------
create or replace function public.protect_provider_listing()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or current_setting('furbourhood.system', true) = 'on' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.user_id := (select auth.uid());
    new.verified_in_person := false;
    new.featured := false;
    new.rating := 0;
    new.review_count := 0;
    new.is_demo := false;
  else
    new.id := old.id;
    new.user_id := old.user_id;
    new.verified_in_person := old.verified_in_person;
    new.featured := old.featured;
    new.rating := old.rating;
    new.review_count := old.review_count;
    new.is_demo := old.is_demo;
  end if;
  return new;
end;
$$;

create or replace function public.protect_provider_skill()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or current_setting('furbourhood.system', true) = 'on' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.level := 'self-declared';
  else
    new.level := old.level;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------
alter table public.reviews
  add column booking_id uuid unique references public.bookings (id) on delete cascade,
  add column owner_id uuid references auth.users (id) on delete set null,
  add column confirmed_needs public.care_need[] not null default '{}';

-- Fills in who and what the review is about from the booking, so the app can't misstate it.
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
  new.review_date := current_date;
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

create trigger prepare_review before insert on public.reviews
  for each row execute function public.prepare_review();

-- Updates the provider's rating and promotes skills confirmed by 3+ owners to Proven.
create or replace function public.apply_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('furbourhood.system', 'on', true);

  update public.providers p
  set rating = round(((p.rating * p.review_count) + new.rating) / (p.review_count + 1), 1),
      review_count = p.review_count + 1
  where p.id = new.provider_id;

  update public.provider_skills s
  set level = 'proven'
  where s.provider_id = new.provider_id
    and s.level <> 'proven'
    and s.need = any (new.confirmed_needs)
    and (
      select count(distinct r.owner_id)
      from public.reviews r
      where r.provider_id = s.provider_id and s.need = any (r.confirmed_needs)
    ) >= 3;

  perform set_config('furbourhood.system', 'off', true);
  return new;
end;
$$;

create trigger apply_review after insert on public.reviews
  for each row execute function public.apply_review();

create policy "Reviews: owner reviews a completed booking" on public.reviews
  for insert to authenticated with check (owner_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Host capacity (City of Windsor By-law 8156)
-- ---------------------------------------------------------------------------
alter table public.providers
  add column own_dogs integer not null default 0 check (own_dogs between 0 and 10),
  add column own_cats integer not null default 0 check (own_cats between 0 and 10);

create or replace function public.household_limit(p_species text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_species when 'Dog' then 3 when 'Cat' then 4 else 0 end;
$$;

-- Guest pets of one species at the host's home on the busiest day of a date range.
create or replace function public.peak_guests(p_provider text, p_species text, p_from date, p_to date)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(max(per_day.guests), 0)::integer
  from (
    select d::date as day, count(*) as guests
    from generate_series(p_from, p_to, interval '1 day') as d
    join public.bookings b
      on b.provider_id = p_provider
     and b.status in ('accepted', 'paid')
     and b.service in ('boarding', 'daycare')
     and d::date between b.start_date and b.end_date
    join public.pets pt on pt.id = b.pet_id and pt.species = p_species
    group by d
  ) as per_day;
$$;

-- Space left for guest dogs and cats on the busiest day of a range. Exposes counts only.
create or replace function public.host_space(p_provider text, p_from date, p_to date)
returns table (dogs_left integer, cats_left integer)
language sql
stable
security definer
set search_path = ''
as $$
  select
    greatest(public.household_limit('Dog') - p.own_dogs - public.peak_guests(p_provider, 'Dog', p_from, p_to), 0),
    greatest(public.household_limit('Cat') - p.own_cats - public.peak_guests(p_provider, 'Cat', p_from, p_to), 0)
  from public.providers p
  where p.id = p_provider;
$$;

grant execute on function public.host_space(text, date, date) to authenticated;

-- Refuses a request, or accepting one, that would take the home over the limit.
create or replace function public.check_host_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pet_species text;
  own integer;
  peak integer;
  max_pets integer;
begin
  if new.is_demo or new.service not in ('boarding', 'daycare') then
    return new;
  end if;
  -- On update, only the step into accepted counts; other changes don't add a pet.
  if tg_op = 'UPDATE' and not (old.status = 'requested' and new.status = 'accepted') then
    return new;
  end if;

  select pt.species into pet_species from public.pets pt where pt.id = new.pet_id;
  select case pet_species when 'Dog' then p.own_dogs else p.own_cats end into own
  from public.providers p where p.id = new.provider_id;
  peak := public.peak_guests(new.provider_id, pet_species, new.start_date, new.end_date);
  max_pets := public.household_limit(pet_species);

  if own + peak + 1 > max_pets then
    raise exception 'No space: this would put % % at the home on the busiest day, over the limit of % in City of Windsor By-law 8156.',
      own + peak + 1, lower(pet_species) || 's', max_pets;
  end if;
  return new;
end;
$$;

create trigger check_host_capacity before insert or update on public.bookings
  for each row execute function public.check_host_capacity();
