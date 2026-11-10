# Furbourhood

**Pet care from neighbours you can trust, across Windsor-Essex, Ontario.**

Furbourhood is a local pet-care marketplace that matches pet owners with walkers, sitters and boarders
based on what their pet actually needs (senior care, oral medication, anxiety and more), not on who paid
for placement. It is my university capstone MVP: a phone-first React app that will later be packaged for
Android with Capacitor.

> **Status:** connected to a Supabase backend with email log-in. Providers, pets and bookings come from the
> database; the providers and starter pets are fictional demo data.

<p>
  <img src="docs/screenshots/welcome.png" width="200" alt="Welcome screen" />
  <img src="docs/screenshots/find.png" width="200" alt="Find care screen" />
  <img src="docs/screenshots/results.png" width="200" alt="Best match results" />
</p>
<p>
  <img src="docs/screenshots/provider.png" width="200" alt="Provider profile with skill levels" />
  <img src="docs/screenshots/pets.png" width="200" alt="My pets with care needs" />
  <img src="docs/screenshots/bookings.png" width="200" alt="Bookings with status chips" />
</p>

## Highlights

- **Needs-based matching.** The "Best match" tab ranks providers only by how many of the pet's care needs
  they cover, then by the strength of those skills, in-person verification and rating
  ([`src/lib/match.ts`](src/lib/match.ts)). Featured (paid) placement can never change this list; it only
  appears on the separate "All providers" tab.
- **Three-tier trust model.** Every provider skill is Self-declared, Verified (checked by the platform) or
  Proven (confirmed by 3+ owners), rendered through one shared `LevelBadge` component so the meaning is
  consistent on every screen.
- **Component-driven UI.** Screens only assemble reusable components (`ProviderCard`, `PetCard`,
  `BookingCard`, `LevelBadge`, `NeedChip`, `StatusChip`…). A living style guide lives at `/styleguide`.
- **Accessible brand system.** Colour tokens chosen so every text/background pair meets WCAG AA; tooltips
  open on tap as well as hover for Android.
- **Offline-ready.** Fonts are bundled with `@fontsource` rather than loaded from a CDN, so the app works
  inside an Android WebView with no network.
- **Strict TypeScript** with `noUncheckedIndexedAccess`, and typed mock data in `src/types.ts` ready to be
  swapped for a real backend.

## Tech stack

React 19 · TypeScript (strict) · Vite · Tailwind CSS v4 · shadcn/ui (Radix) · React Router · Lucide icons · Supabase (auth + Postgres)

## Run it locally

Requires Node.js 20.19 or newer and a free [Supabase](https://supabase.com) project.

1. **Set up the database.** In the Supabase dashboard, open **SQL Editor** and run, in order:
   `supabase/migrations/0001_init.sql`, `supabase/seed.sql`, `supabase/migrations/0002_booking_requests.sql`,
   `supabase/migrations/0003_provider_tools.sql`, `supabase/migrations/0004_availability_and_completion.sql`,
   then `supabase/migrations/0005_reviews_and_capacity.sql`.
2. **Connect the app.** Copy `.env.example` to `.env.local` and fill in the Project URL and the
   **publishable** key from **Project Settings → API Keys**. Never use the secret key here.
3. **Run it:**

   ```bash
   npm install
   npm run dev
   ```

Then open http://localhost:5173 and sign up. New owner accounts start with three demo pets and a few
demo bookings. Supabase asks new users to confirm their email by default; for quick local testing you
can turn that off under **Authentication → Sign In / Providers → Email**.

Other scripts: `npm run typecheck` and `npm run build`.

## Payments (Stripe test mode)

Checkout runs through two Supabase Edge Functions in `supabase/functions/`. The Stripe secret key lives
only in Supabase, never in the app, and only `sk_test_` keys are accepted, so no real card is charged.

1. Create a free Stripe account and stay in **Test mode**. Copy the **Secret key** (`sk_test_...`) from
   Developers → API keys.
2. In Supabase, open **Edge Functions → Secrets** and add `STRIPE_SECRET_KEY` (the test key) and
   `ALLOWED_ORIGINS` (the app's address, e.g. `http://localhost:5173,https://your-app.vercel.app`).
3. Deploy the functions `create-checkout` and `confirm-payment`, with the shared `_shared/common.ts`:
   `npx supabase functions deploy create-checkout` and `npx supabase functions deploy confirm-payment`
   (after `npx supabase login` and `npx supabase link`).
4. Pay for an accepted booking with the test card `4242 4242 4242 4242`, any future date and any CVC.

## Hosting a test build

The app is a static site, so any static host works. `vercel.json` and `public/_redirects` send every
path to `index.html`, so links to any screen work.

1. Import the GitHub repository in Vercel (or Netlify). Build command `npm run build`, output folder `dist`.
2. Add the environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (same as `.env.local`).
3. In Supabase, **Authentication → URL Configuration**: set the Site URL to the hosted address and add
   `https://your-app.vercel.app/**` to the Redirect URLs, so confirmation emails open the app.

## Screens

| Route | Screen |
|---|---|
| `/` | Welcome (owner or provider) |
| `/signup`, `/login` | Sign up and Log in (email and password) |
| `/find` | Find care: service, pet, area and dates |
| `/results` | Best match / All providers |
| `/providers/:id` | Provider profile with skills and rates |
| `/providers/:id/request` | Request booking: service, pet, dates and price estimate |
| `/requests` | Provider: new, upcoming and past requests, with Accept and Decline |
| `/listing` | Provider: create or edit their listing, services, rates and skills |
| `/listing/availability` | Provider: block the dates they can't take bookings |
| `/pets` | My pets and their care needs |
| `/pets/new`, `/pets/:id/edit` | Add, edit or delete a pet |
| `/bookings` | Bookings: Requested → Accepted → Paid → Completed |
| `/profile` | Profile |
| `/styleguide` | Component style guide |

## Project structure

```
src/
  auth/           session provider and the guard for signed-in screens
  components/     reusable UI (cards, badges, app bar, tabs, loading/error states) + shadcn/ui primitives in ui/
  data/           Supabase queries mapped to app types, and the hooks screens use
  screens/        one file per route; screens only assemble components
  lib/            matching, search, formatting and the Supabase client
  mocks/          static demo data for the /styleguide page
  types.ts        domain types shared by the whole app
supabase/
  migrations/     schema and Row Level Security policies
  seed.sql        fictional Windsor-Essex providers, skills, rates and reviews
```

## Security

Every table has Row Level Security. Owners can only read and change their own pets and bookings, providers
only see bookings sent to them, and listings and reviews are visible to signed-in users only. That is what
makes it safe for the app to ship the publishable key.

## Roadmap

- [x] Brand system, component library and all owner screens
- [x] Supabase backend: auth, providers, pets, bookings
- [x] Add, edit and delete pets
- [x] Booking requests: send, price check and withdraw
- [x] Provider tools: listing setup, accept or decline requests
- [x] Availability calendar and marking bookings completed
- [x] Reviews with skill confirmation and automatic Proven level
- [x] Host capacity limit (City of Windsor By-law 8156) and provider's own pets
- [x] Area search within 15 km
- [x] Stripe test-mode checkout (Edge Functions; deploy and add the test key to use it)
- [ ] Android build with Capacitor

## Notes

All people, pets, reviews and bookings in this app are fictional demo data.
