-- DEMO DATA. Fictional providers, skills, rates and reviews in real Windsor-Essex areas.
-- Run after migrations/0001_init.sql, and before anyone signs up
-- (new owners get demo bookings with these providers). Safe to run again.

insert into public.providers
  (id, name, tone, area_name, area_fsa, verified_in_person, rating, review_count, years_experience, featured, bio, host_capacity, is_demo)
values
  ('priya-s', 'Priya S.', 'sky', 'Downtown Windsor', 'N9A', true, 4.9, 48, 6, false,
   'Former vet clinic assistant. I keep older dogs on their routines and I''m comfortable giving pills hidden in treats or by hand.',
   'Space for 1 more dog on these dates', true),
  ('marc-t', 'Marc T.', 'mint', 'Tecumseh', 'N8N', true, 4.8, 31, 4, true,
   'Fenced yard near Lakewood Park. I board one or two dogs at a time so everyone gets attention.',
   'Space for 1 more dog on these dates', true),
  ('hannah-o', 'Hannah O.', 'coral', 'South Windsor', 'N9G', true, 5.0, 22, 3, false,
   'Certified in canine first aid. I work with nervous and reactive dogs using slow, reward-based introductions.',
   null, true),
  ('daniel-r', 'Daniel R.', 'navy', 'LaSalle', 'N9J', true, 4.7, 19, 5, true,
   'Big backyard near the Vollmer Centre. High-energy dogs and puppies welcome for daycare.',
   'Space for 2 more dogs on these dates', true),
  ('sophie-l', 'Sophie L.', 'sky', 'Central Windsor', 'N8X', false, 4.6, 9, 2, false,
   'Nursing student who grew up with cats. Happy to do drop-ins for cats and small dogs.',
   null, true),
  ('amir-h', 'Amir H.', 'mint', 'Amherstburg', 'N9V', true, 4.9, 27, 7, false,
   'Retired teacher with a quiet house and plenty of time. Senior dogs are my favourite guests.',
   'Space for 1 more dog on these dates', true),
  ('jess-m', 'Jess M.', 'coral', 'Downtown Windsor', 'N9A', false, 4.5, 6, 1, true,
   'I live by the riverfront trail and walk dogs before and after my classes.',
   null, true),
  ('kevin-l', 'Kevin L.', 'navy', 'Central Windsor', 'N8X', true, 4.8, 14, 4, false,
   'Vet tech by day. I can give injections, including insulin, and handle post-surgery care.',
   null, true)
on conflict (id) do update set
  name = excluded.name, tone = excluded.tone, area_name = excluded.area_name, area_fsa = excluded.area_fsa,
  verified_in_person = excluded.verified_in_person, rating = excluded.rating, review_count = excluded.review_count,
  years_experience = excluded.years_experience, featured = excluded.featured, bio = excluded.bio,
  host_capacity = excluded.host_capacity, is_demo = excluded.is_demo;

insert into public.provider_skills (provider_id, need, level) values
  ('priya-s', 'senior-care', 'proven'), ('priya-s', 'oral-medication', 'proven'),
  ('priya-s', 'anxiety', 'verified'), ('priya-s', 'injections', 'verified'),
  ('marc-t', 'senior-care', 'verified'), ('marc-t', 'oral-medication', 'proven'), ('marc-t', 'anxiety', 'self-declared'),
  ('hannah-o', 'anxiety', 'proven'), ('hannah-o', 'reactive-dog', 'proven'),
  ('hannah-o', 'senior-care', 'verified'), ('hannah-o', 'oral-medication', 'self-declared'),
  ('daniel-r', 'puppy-training', 'proven'), ('daniel-r', 'special-diet', 'verified'), ('daniel-r', 'senior-care', 'self-declared'),
  ('sophie-l', 'cat-care', 'verified'), ('sophie-l', 'oral-medication', 'self-declared'), ('sophie-l', 'special-diet', 'self-declared'),
  ('amir-h', 'senior-care', 'proven'), ('amir-h', 'oral-medication', 'verified'),
  ('amir-h', 'anxiety', 'verified'), ('amir-h', 'special-diet', 'verified'),
  ('jess-m', 'puppy-training', 'self-declared'), ('jess-m', 'anxiety', 'self-declared'),
  ('kevin-l', 'injections', 'proven'), ('kevin-l', 'oral-medication', 'proven'),
  ('kevin-l', 'senior-care', 'verified'), ('kevin-l', 'cat-care', 'verified')
on conflict (provider_id, need) do update set level = excluded.level;

insert into public.provider_services (provider_id, service, rate, unit) values
  ('priya-s', 'walking', 24, 'walk'), ('priya-s', 'drop-in', 22, 'visit'), ('priya-s', 'boarding', 55, 'night'),
  ('marc-t', 'boarding', 50, 'night'), ('marc-t', 'daycare', 35, 'day'), ('marc-t', 'walking', 22, 'walk'),
  ('hannah-o', 'walking', 26, 'walk'), ('hannah-o', 'drop-in', 24, 'visit'), ('hannah-o', 'sitting', 70, 'night'),
  ('daniel-r', 'daycare', 32, 'day'), ('daniel-r', 'boarding', 48, 'night'), ('daniel-r', 'walking', 20, 'walk'),
  ('sophie-l', 'drop-in', 18, 'visit'), ('sophie-l', 'sitting', 55, 'night'),
  ('amir-h', 'boarding', 45, 'night'), ('amir-h', 'sitting', 65, 'night'), ('amir-h', 'drop-in', 20, 'visit'),
  ('jess-m', 'walking', 18, 'walk'), ('jess-m', 'drop-in', 17, 'visit'),
  ('kevin-l', 'drop-in', 25, 'visit'), ('kevin-l', 'sitting', 75, 'night'), ('kevin-l', 'walking', 25, 'walk')
on conflict (provider_id, service) do update set rate = excluded.rate, unit = excluded.unit;

-- Reviews have generated ids, so replace the demo set instead of upserting.
delete from public.reviews where provider_id in (select id from public.providers where is_demo);

insert into public.reviews (provider_id, author_name, pet_name, rating, review_date, body) values
  ('priya-s', 'Melissa K.', 'Duke', 5, '2026-09-28', 'Duke is 13 and on two meds. Priya sent a note after every dose and he came home relaxed.'),
  ('priya-s', 'Tom B.', 'Hazel', 5, '2026-08-14', 'Calm, on time, and Hazel (very shy) let her pick up the leash on day one.'),
  ('priya-s', 'Aisha R.', 'Pepper', 4, '2026-07-02', 'Great care. Walks ran a few minutes short once but she told me why right away.'),
  ('marc-t', 'Jenna L.', 'Moose', 5, '2026-09-10', 'Photos every evening and Moose clearly loved the yard. Booking again for Christmas.'),
  ('marc-t', 'Chris P.', 'Lola', 4, '2026-06-22', 'Very reliable with Lola''s medication schedule.'),
  ('hannah-o', 'Dev S.', 'Nala', 5, '2026-10-04', 'Nala barks at everyone. Hannah took the time to meet her twice before the first walk.'),
  ('daniel-r', 'Kayla M.', 'Rocket', 5, '2026-09-19', 'Our puppy came home tired and happy, and he kept up the sit/stay practice.'),
  ('sophie-l', 'Ben W.', 'Mochi', 5, '2026-08-30', 'Mochi is picky about food and Sophie followed the feeding plan exactly.'),
  ('amir-h', 'Rosa D.', 'Biscuit', 5, '2026-09-05', 'Calm home, slow walks along the river, and every pill given on time.'),
  ('amir-h', 'Greg N.', 'Tucker', 5, '2026-07-18', 'Tucker is 14 and anxious. Amir made him feel at home.'),
  ('jess-m', 'Owen T.', 'Bruno', 4, '2026-09-25', 'Friendly and flexible with times.'),
  ('kevin-l', 'Lena F.', 'Oscar', 5, '2026-10-01', 'Oscar needs insulin twice a day. Kevin was precise and kept a written log.');
