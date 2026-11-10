# Furbourhood

Local pet-care marketplace for Windsor-Essex, Ontario. University capstone MVP.
A React web app that will later be packaged for Android with Capacitor.

Current phase: Supabase backend connected (email log-in, providers, pets, bookings) and pet management. Next:
booking request flow, provider tools.

## Commands
- `npm run dev` starts the dev server
- `npm run typecheck` runs TypeScript (strict)
- `npm run build` type-checks and builds

## Stack
- Vite + React + TypeScript (strict, `noUncheckedIndexedAccess`)
- Tailwind CSS v4 (tokens in `src/index.css`, no tailwind.config) + shadcn/ui (`src/components/ui/`, see `components.json`)
- Lucide icons, React Router
- Fonts via `@fontsource` (bundled, never a CDN, because the app must work offline in Android):
  Nunito 700/800 for headings (`font-heading`), Inter 400/500/600 for body (`font-sans`)
- Import alias: `@/` = `src/`
- Supabase (`@supabase/supabase-js`) for auth and Postgres. Settings in `.env.local` (git-ignored, see `.env.example`):
  `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Only ever the publishable key; never the secret key.

## Backend (Supabase)
- Schema and security rules: `supabase/migrations/` (run in order in the Supabase SQL Editor). Demo providers: `supabase/seed.sql` (run after the migrations, before anyone signs up).
- Every table has Row Level Security. Owners only see their own pets and bookings; providers only see bookings sent to their listing; listings and reviews are readable by any signed-in user. Any new table needs RLS and policies in its migration.
- Schema changes go in a new numbered migration file; never edit one that has already been run.
- A trigger on `auth.users` creates the `profiles` row (role and name come from sign-up metadata) and gives new owners demo pets and bookings (`is_demo = true`).
- All reads go through `src/data/api.ts`, which maps snake_case rows onto the types in `src/types.ts`. Screens use the hooks in `src/data/hooks.ts` and show `LoadingState`, `ErrorState` and `EmptyState` (`src/components/States.tsx`). Screens never call `supabase` directly, except the auth calls in `Auth.tsx` and log-out in `Profile.tsx`.
- `src/auth/`: `AuthProvider` (session) and `RequireAuth` (guards every tab screen; signed-out users go to `/login`).

## Out of scope
Messaging, live GPS, iOS, real payments. Also not yet: Stripe, Capacitor.

## Brand
| Token | Hex | Use |
|---|---|---|
| `navy` | #203B56 | Text and primary buttons (white text on navy) |
| `sky` | #74C7EC | Primary accent, selected states (navy text, never white) |
| `mint` | #A8E6CF | Success and "Proven" badges |
| `coral` | #FF927D | Highlights and the "Featured" badge |
| `cloud` | #F7FBFF | App background; cards are white |
| `slate` | #4A5D70 | Muted text and outlines |

- Every text/background pair must meet WCAG AA. Sky, mint and coral are fills only: always navy text on them, never use them as text colour.
- Radius: 16px on cards (`rounded-card`), 12px on buttons and inputs (`rounded-control`).
- Soft shadows on cards only (`shadow-card`). No shadows on buttons, inputs or badges.
- Full logo (`public/brand/furbourhood-logo.png`) on the Welcome screen only; square mark (`furbourhood-mark.png`) in the app bar.
- People and pets use initials avatars in brand colours (`Avatar`). No stock photos or images from the internet.
- UX reference is Rover (layout patterns only). Never copy Rover's colours, logo, fonts, illustrations, icons or wording. `design-reference/` is git-ignored and must never be committed.

## Layout
- Phone-first: design at 390px wide. Content max 480px, centred on larger screens (`PhoneFrame`).
- Owner bottom tabs: Find care · Bookings · My pets · Profile. No messaging tab.
- Screens use `AppBar` + `ScreenBody`; sticky actions sit directly above `BottomTabs`.

## Component rules
Screens in `src/screens/` only assemble components. Reusable UI lives in `src/components/`:
- `AppBar`, `BottomTabs`, `AppShell` (`PhoneFrame`, `ScreenBody`, `SectionTitle`, `DemoNote`)
- `ProviderCard`, `PetCard`, `BookingCard`, `ServiceTile`, `Avatar`, `PetForm`
- Forms: `Field`, `FormError`, `ChoiceGroup` (`Field.tsx`) and `NeedPicker`. Choices are real radio buttons and checkboxes styled as tiles (selected = sky fill, navy text), so keyboards and screen readers work.
- `LevelBadge`, `NeedChip`, `Badges` (`VerifiedBadge`, `FeaturedBadge`, `StatusChip`, `Rating`)

Skill levels always render through `LevelBadge`, the same way everywhere:
- Self-declared: grey outline
- Verified: sky fill, navy text, shield icon
- Proven: mint fill, navy text, check icon, tooltip "Confirmed by 3+ owners"
Tooltips must open on tap as well as hover (Android).

`NeedChip` is a pet's care need (Senior care, Oral medication, Anxiety…). It is square-cornered so it never looks like a level badge.

Booking status chips (`StatusChip`): Requested (outline), Accepted (sky), Paid (navy), Completed (mint).

Results rules:
- Two tabs: "Best match" and "All providers".
- Best match is ranked only by fit to the pet's needs, then verification and rating (`src/lib/match.ts`).
- The coral "Featured" badge appears on All providers only, never on Best match.

## Demo data
8 fictional providers in real Windsor-Essex areas (Windsor N9A, N8X, N9G; Tecumseh N8N; LaSalle N9J; Amherstburg N9V)
live in `supabase/seed.sql`; new owners get 3 demo pets and 5 demo bookings from the sign-up trigger. It is all
labelled as demo data in code, in the database (`is_demo`) and on screen (`DemoNote`).
`src/mocks/` keeps a static copy used only by `/styleguide`.

## Routes
`/` Welcome · `/signup?role=owner|provider` Sign up · `/login` Log in ·
`/find` Find care · `/results` Results · `/providers/:id` Provider profile ·
`/pets` My pets · `/pets/new` Add pet · `/pets/:id/edit` Edit pet · `/bookings` Bookings · `/profile` Profile · `/styleguide` Style guide
