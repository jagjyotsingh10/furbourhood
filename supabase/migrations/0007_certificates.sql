-- Certificates: providers upload proof of a skill (e.g. a pet first-aid course), Furbourhood reviews it,
-- and an approved certificate makes that skill Verified.
-- Rules enforced here (not just in the app):
--  - Only the listing's provider can upload, see or delete its certificate files.
--  - New certificates are always 'pending'; providers can't approve or edit them (no update policy).
--  - Review happens outside the app (SQL Editor / service role) until the platform dashboard exists.
--  - Approving a certificate raises that skill to 'verified' (never lowers a 'proven' skill).
--  - Any signed-in user can read approved certificates' title, issuer and skill (not the file),
--    so owners can see what was checked on a provider's profile.

create type public.certificate_status as enum ('pending', 'approved', 'rejected');

create table public.provider_certificates (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null references public.providers (id) on delete cascade,
  need public.care_need not null,
  title text not null check (char_length(title) between 2 and 120),
  issuer text not null default '' check (char_length(issuer) <= 120),
  file_path text not null,
  status public.certificate_status not null default 'pending',
  review_note text not null default '' check (char_length(review_note) <= 280),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index on public.provider_certificates (provider_id, created_at);

alter table public.provider_certificates enable row level security;

create policy "Certificates: provider reads own, everyone reads approved" on public.provider_certificates
  for select to authenticated using (status = 'approved' or public.is_my_listing(provider_id));

create policy "Certificates: provider uploads own" on public.provider_certificates
  for insert to authenticated with check (
    public.is_my_listing(provider_id)
    and file_path like provider_id || '/%'
  );

create policy "Certificates: provider removes own unapproved" on public.provider_certificates
  for delete to authenticated using (public.is_my_listing(provider_id) and status <> 'approved');

-- New uploads always start pending, whatever the app sends. Skips requests with no signed-in user.
create or replace function public.protect_certificate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if (select auth.uid()) is not null then
      new.status := 'pending';
      new.review_note := '';
      new.reviewed_at := null;
    end if;
  elsif new.status is distinct from old.status then
    new.reviewed_at := case when new.status = 'pending' then null else now() end;
  end if;
  return new;
end;
$$;

create trigger protect_certificate before insert or update on public.provider_certificates
  for each row execute function public.protect_certificate();

-- Approval makes the skill Verified. Sets the system flag so the skill guard (0005) lets it through.
create or replace function public.apply_certificate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    perform set_config('furbourhood.system', 'on', true);
    insert into public.provider_skills (provider_id, need, level)
    values (new.provider_id, new.need, 'verified')
    on conflict (provider_id, need) do update
      set level = 'verified'
      where public.provider_skills.level = 'self-declared';
    perform set_config('furbourhood.system', 'off', true);
  end if;
  return new;
end;
$$;

create trigger apply_certificate after update of status on public.provider_certificates
  for each row execute function public.apply_certificate();

-- ---------------------------------------------------------------------------
-- Storage: private bucket, one folder per listing (<provider_id>/<file>). Only that provider can use it.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('provider-certificates', 'provider-certificates', false, 10485760,
        array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Certificates: provider uploads files" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'provider-certificates' and public.is_my_listing((storage.foldername(name))[1])
  );

create policy "Certificates: provider views files" on storage.objects
  for select to authenticated using (
    bucket_id = 'provider-certificates' and public.is_my_listing((storage.foldername(name))[1])
  );

create policy "Certificates: provider deletes files" on storage.objects
  for delete to authenticated using (
    bucket_id = 'provider-certificates' and public.is_my_listing((storage.foldername(name))[1])
  );
