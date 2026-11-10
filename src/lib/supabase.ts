import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!url || !key) {
  throw new Error(
    "Missing Supabase settings. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local (see README).",
  );
}

/** One shared client. The publishable key is safe in the browser because every table uses Row Level Security. */
export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
});
