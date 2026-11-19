-- Photo updates during a booking (report Table 9, usability task U8).
--  - Providers post a photo and a short note while a confirmed booking is under way
--    (accepted or paid, from its first day to its last).
--  - Only the owner and the provider of that booking can see its photos.
--  - Photos live in a private storage bucket, one folder per booking: <booking id>/<file>.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('booking-photos', 'booking-photos', false, 5242880, '{image/jpeg,image/png,image/webp}')
on conflict (id) do nothing;

-- Booking ids arrive as text (storage folder names), so compare as text: a bad folder name is just "no".
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
      and current_date between b.start_date and b.end_date
  );
$$;

create or replace function public.can_view_booking(p_booking text)
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
      and (b.owner_id = (select auth.uid()) or p.user_id = (select auth.uid()))
  );
$$;

create table public.booking_updates (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  photo_path text not null,
  note text not null default '' check (char_length(note) <= 280),
  created_at timestamptz not null default now()
);

create index on public.booking_updates (booking_id, created_at);

alter table public.booking_updates enable row level security;

create policy "Updates: owner and provider read" on public.booking_updates
  for select to authenticated using (public.can_view_booking(booking_id::text));

create policy "Updates: provider posts during the booking" on public.booking_updates
  for insert to authenticated with check (
    author_id = (select auth.uid())
    and public.can_post_booking_update(booking_id::text)
    and photo_path like booking_id::text || '/%'
  );

-- Storage: the provider uploads into the booking's folder; owner and provider can view.
create policy "Booking photos: provider uploads" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'booking-photos' and public.can_post_booking_update((storage.foldername(name))[1])
  );

create policy "Booking photos: owner and provider view" on storage.objects
  for select to authenticated using (
    bucket_id = 'booking-photos' and public.can_view_booking((storage.foldername(name))[1])
  );
