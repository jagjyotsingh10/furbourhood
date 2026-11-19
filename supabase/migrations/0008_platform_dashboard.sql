-- Platform dashboard: Furbourhood staff (admins) see platform numbers and review certificates.
-- Rules enforced here (not just in the app):
--  - Admins are listed in platform_admins, a table nobody can read or write through the API.
--    It is not a profile role, so no one can become an admin through sign-up metadata.
--    Add an admin in the SQL Editor: insert into public.platform_admins (user_id) values ('<uuid>');
--  - platform_stats() returns numbers only to admins; everyone else gets an error.
--  - Admins can read every certificate (and its file) and approve or decline it.
--    Approval still goes through apply_certificate() (0007), which makes the skill Verified.

create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);

-- RLS on with no policies: invisible to the API; only security definer helpers and the SQL Editor see it.
alter table public.platform_admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.platform_admins a where a.user_id = (select auth.uid()));
$$;

-- ---------------------------------------------------------------------------
-- Certificate review
-- ---------------------------------------------------------------------------
create policy "Certificates: admins read all" on public.provider_certificates
  for select to authenticated using (public.is_admin());

create policy "Certificates: admins review" on public.provider_certificates
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Certificates: admins view files" on storage.objects
  for select to authenticated using (bucket_id = 'provider-certificates' and public.is_admin());

-- Admins may only change the review fields, not what was uploaded.
create or replace function public.guard_certificate_review()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return new;
  end if;
  if (new.provider_id, new.need, new.title, new.issuer, new.file_path, new.created_at)
     is distinct from
     (old.provider_id, old.need, old.title, old.issuer, old.file_path, old.created_at) then
    raise exception 'Only the review status and note of a certificate can be changed.';
  end if;
  return new;
end;
$$;

create trigger guard_certificate_review before update on public.provider_certificates
  for each row execute function public.guard_certificate_review();

-- Providers' names for the review queue: admins can already read all listings (any signed-in user can).

-- ---------------------------------------------------------------------------
-- Platform numbers (one call, admins only)
-- ---------------------------------------------------------------------------
create or replace function public.platform_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Only Furbourhood staff can see platform numbers.';
  end if;

  select jsonb_build_object(
    'owners', (select count(*) from public.profiles where role = 'owner'),
    'providers', (select count(*) from public.providers),
    'providers_verified_in_person', (select count(*) from public.providers where verified_in_person),
    'pets', (select count(*) from public.pets),
    'bookings', (select count(*) from public.bookings),
    'booking_value', (select coalesce(sum(total), 0) from public.bookings where status in ('paid', 'completed')),
    'reviews', (select count(*) from public.reviews),
    'average_rating', (select coalesce(round(avg(rating)::numeric, 1), 0) from public.reviews),
    'certificates_pending', (select count(*) from public.provider_certificates where status = 'pending'),
    'demo_share', (select coalesce(round(100.0 * count(*) filter (where is_demo) / nullif(count(*), 0)), 0) from public.bookings),
    'by_status', (
      select coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
      from (select status::text, count(*) as n from public.bookings group by status) s
    ),
    'by_service', (
      select coalesce(jsonb_object_agg(service, n), '{}'::jsonb)
      from (select service::text, count(*) as n from public.bookings group by service) s
    ),
    'by_area', (
      select coalesce(jsonb_object_agg(area_fsa, n), '{}'::jsonb)
      from (select area_fsa, count(*) as n from public.providers group by area_fsa) a
    ),
    'by_level', (
      select coalesce(jsonb_object_agg(level, n), '{}'::jsonb)
      from (select level::text, count(*) as n from public.provider_skills group by level) l
    )
  ) into result;

  return result;
end;
$$;

revoke execute on function public.platform_stats() from anon;
