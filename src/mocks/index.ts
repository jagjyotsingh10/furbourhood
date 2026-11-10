/**
 * DEMO DATA used only by the /styleguide page. The app itself reads from Supabase;
 * the same providers live in supabase/seed.sql and new owners get the same pets from the sign-up trigger.
 */
export { providers, getProvider, IS_DEMO_DATA } from "./providers";
export { pets, getPet } from "./pets";
