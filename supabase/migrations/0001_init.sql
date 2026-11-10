-- Furbourhood schema: profiles, providers (with skills, services, reviews), pets and bookings.
-- Run once in the Supabase SQL Editor, then run seed.sql.
-- Every table has Row Level Security on, so the publishable key is safe in the browser.

-- ---------------------------------------------------------------------------
-- Types (values match src/types.ts)
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('owner', 'provider');
create type public.skill_level as enum ('self-declared', 'verified', 'proven');
create type public.service_id as enum ('walking', 'drop-in', 'sitting', 'boarding', 'daycare');
create type public.care_need as enum (
  'senior-care', 'oral-medication', 'injections', 'anxiety',
  'puppy-training', 'reactive-dog', 'special-diet', 'cat-care'
);
create type public.brand_tone as enum ('navy', 'sky', 'mint', 'coral');
create type public.booking_status as enum ('requested', 'accepted', 'paid', 'completed');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'owner',
  full_name text not null default '',
  area_fsa text check (area_fsa ~ '^[A-Z][0-9][A-Z]$'),
  created_at timestamptz not null default now()
);

-- Providers are readable by every signed-in user. Demo providers have no user_id.
create table public.providers (
  id text primary key,
  user_id uuid unique references auth.users (id) on delete set null,
  name text not null,
  tone public.brand_tone not null default 'sky',
  area_name text not null,
  area_fsa text not null check (area_fsa ~ '^[A-Z][0-9][A-Z]$'),
  verified_in_person boolean not null default false,
  rating numeric(2, 1) not null default 0 check (rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  years_experience integer not null default 0 check (years_experience >= 0),
  featured boolean not null default false,
  bio text not null default '',
  host_capacity text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.provider_skills (
  provider_id text not null references public.providers (id) on delete cascade,
  need public.care_need not null,
  level public.skill_level not null default 'self-declared',
  primary key (provider_id, need)
);

create table public.provider_services (
  provider_id text not null references public.providers (id) on delete cascade,
  service public.service_id not null,
  rate numeric(8, 2) not null check (rate > 0),
  unit text not null,
  primary key (provider_id, service)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null references public.providers (id) on delete cascade,
  author_name text not null,
  pet_name text not null,
  rating integer not null check (rating between 1 and 5),
  review_date date not null default current_date,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  species text not null check (species in ('Dog', 'Cat')),
  breed text not null default '',
  age_years integer not null default 0 check (age_years >= 0),
  weight_kg numeric(5, 1) not null default 0 check (weight_kg >= 0),
  tone public.brand_tone not null default 'sky',
  needs public.care_need[] not null default '{}',
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  provider_id text not null references public.providers (id) on delete restrict,
  pet_id uuid not null references public.pets (id) on delete cascade,
  service public.service_id not null,
  start_date date not null,
  end_date date not null,
  status public.booking_status not null default 'requested',
  total numeric(8, 2) not null default 0 check (total >= 0),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index on public.provider_skills (provider_id);
create index on public.provider_services (provider_id);
create index on public.reviews (provider_id);
create index on public.pets (owner_id);
create index on public.bookings (owner_id);
create index on public.bookings (provider_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.providers enable row level security;
alter table public.provider_skills enable row level security;
alter table public.provider_services enable row level security;
alter table public.reviews enable row level security;
alter table public.pets enable row level security;
alter table public.bookings enable row level security;

-- Profiles: each user sees and edits only their own.
create policy "Own profile: read" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "Own profile: update" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Provider listings: any signed-in user can browse; providers edit only their own listing.
create policy "Providers: read" on public.providers
  for select to authenticated using (true);
create policy "Providers: update own" on public.providers
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "Skills: read" on public.provider_skills
  for select to authenticated using (true);
create policy "Services: read" on public.provider_services
  for select to authenticated using (true);
create policy "Reviews: read" on public.reviews
  for select to authenticated using (true);

-- Pets: owners manage only their own pets.
create policy "Own pets: read" on public.pets
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "Own pets: insert" on public.pets
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "Own pets: update" on public.pets
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "Own pets: delete" on public.pets
  for delete to authenticated using (owner_id = (select auth.uid()));

-- Bookings: owners see their own; providers see requests sent to their listing.
create policy "Bookings: owner or provider can read" on public.bookings
  for select to authenticated using (
    owner_id = (select auth.uid())
    or provider_id in (select p.id from public.providers p where p.user_id = (select auth.uid()))
  );
create policy "Bookings: owner can request" on public.bookings
  for insert to authenticated with check (
    owner_id = (select auth.uid())
    and status = 'requested'
    and pet_id in (select pt.id from public.pets pt where pt.owner_id = (select auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- New users: create a profile, and give owners demo pets and bookings
-- so every screen has something to show while the MVP is being built.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_role public.user_role := coalesce(nullif(new.raw_user_meta_data ->> 'role', ''), 'owner')::public.user_role;
  biscuit uuid;
  mochi uuid;
  rocket uuid;
begin
  insert into public.profiles (id, role, full_name)
  values (new.id, new_role, coalesce(new.raw_user_meta_data ->> 'full_name', ''));

  if new_role = 'owner' then
    insert into public.pets (owner_id, name, species, breed, age_years, weight_kg, tone, needs, is_demo)
    values (new.id, 'Biscuit', 'Dog', 'Golden Retriever', 11, 31, 'coral',
            '{senior-care,oral-medication,anxiety}', true)
    returning id into biscuit;

    insert into public.pets (owner_id, name, species, breed, age_years, weight_kg, tone, needs, is_demo)
    values (new.id, 'Mochi', 'Cat', 'Domestic Shorthair', 4, 5, 'sky', '{cat-care,special-diet}', true)
    returning id into mochi;

    insert into public.pets (owner_id, name, species, breed, age_years, weight_kg, tone, needs, is_demo)
    values (new.id, 'Rocket', 'Dog', 'Beagle mix', 1, 11, 'mint', '{puppy-training}', true)
    returning id into rocket;

    -- Dates are relative to sign-up so Upcoming and Past always have entries.
    insert into public.bookings (owner_id, provider_id, pet_id, service, start_date, end_date, status, total, is_demo)
    values
      (new.id, 'priya-s',   biscuit, 'walking',  current_date + 3,  current_date + 3,  'requested', 24,  true),
      (new.id, 'amir-h',    biscuit, 'boarding', current_date + 10, current_date + 13, 'accepted',  135, true),
      (new.id, 'sophie-l',  mochi,   'drop-in',  current_date + 18, current_date + 19, 'paid',      36,  true),
      (new.id, 'daniel-r',  rocket,  'daycare',  current_date - 11, current_date - 11, 'completed', 32,  true),
      (new.id, 'kevin-l',   mochi,   'drop-in',  current_date - 38, current_date - 36, 'completed', 75,  true);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
