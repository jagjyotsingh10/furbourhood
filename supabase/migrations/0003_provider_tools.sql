-- Provider tools: care providers create and edit their own listing and answer booking requests.
-- Rules enforced here (not just in the app):
--  - Only accounts with role 'provider' can create a listing, and only one each.
--  - Providers can never set their own verification, featured placement, rating or review count.
--  - New skills are always 'self-declared'; providers can't raise a skill's level.
--  - Providers can only move a request from 'requested' to 'accepted' or 'declined', and can't change anything else.
--  - Users can't change their own role.

alter type public.booking_status add value if not exists 'declined';

-- Real listings get a generated id; demo providers keep their readable slugs.
alter table public.providers
  alter column id set default ('p-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

-- Bookings also point at the owner's profile, so a provider's request list can show the owner's name.
alter table public.bookings
  add constraint bookings_owner_profile_fkey foreign key (owner_id) references public.profiles (id) on delete cascade;

-- True when the listing belongs to the signed-in user. security definer so policies can use it
-- without re-checking providers' own RLS on every row.
create or replace function public.is_my_listing(pid text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.providers p where p.id = pid and p.user_id = (select auth.uid()));
$$;

-- ---------------------------------------------------------------------------
-- Guards. Each one skips requests with no signed-in user (SQL Editor, service role).
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null then
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger protect_profile before update on public.profiles
  for each row execute function public.protect_profile();

create or replace function public.protect_provider_listing()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
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

create trigger protect_provider_listing before insert or update on public.providers
  for each row execute function public.protect_provider_listing();

create or replace function public.protect_provider_skill()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
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

create trigger protect_provider_skill before insert or update on public.provider_skills
  for each row execute function public.protect_provider_skill();

create or replace function public.guard_booking_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return new;
  end if;
  if (new.owner_id, new.provider_id, new.pet_id, new.service, new.start_date, new.end_date, new.total, new.is_demo)
     is distinct from
     (old.owner_id, old.provider_id, old.pet_id, old.service, old.start_date, old.end_date, old.total, old.is_demo) then
    raise exception 'Only the status of a booking can be changed.';
  end if;
  return new;
end;
$$;

create trigger guard_booking_update before update on public.bookings
  for each row execute function public.guard_booking_update();

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------
create policy "Providers: create own listing" on public.providers
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.profiles pr where pr.id = (select auth.uid()) and pr.role = 'provider')
  );

create policy "Skills: provider manages own" on public.provider_skills
  for all to authenticated
  using (public.is_my_listing(provider_id))
  with check (public.is_my_listing(provider_id));

create policy "Services: provider manages own" on public.provider_services
  for all to authenticated
  using (public.is_my_listing(provider_id))
  with check (public.is_my_listing(provider_id));

-- status::text avoids using the new 'declined' value in the same transaction that adds it.
create policy "Bookings: provider answers a request" on public.bookings
  for update to authenticated
  using (public.is_my_listing(provider_id) and status = 'requested')
  with check (public.is_my_listing(provider_id) and status::text in ('accepted', 'declined'));

-- Pets and owner names a provider may see: only those in requests sent to their listing.
-- security definer functions read bookings without re-entering its policies (bookings' own
-- policies read pets, so a plain subquery here would be policy recursion).
create or replace function public.pet_in_my_requests(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.bookings b
    join public.providers p on p.id = b.provider_id
    where b.pet_id = pid and p.user_id = (select auth.uid())
  );
$$;

create or replace function public.owner_in_my_requests(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.bookings b
    join public.providers p on p.id = b.provider_id
    where b.owner_id = uid and p.user_id = (select auth.uid())
  );
$$;

create policy "Pets: provider sees pets in their requests" on public.pets
  for select to authenticated using (public.pet_in_my_requests(id));

create policy "Profiles: provider sees owners who requested them" on public.profiles
  for select to authenticated using (public.owner_in_my_requests(id));
