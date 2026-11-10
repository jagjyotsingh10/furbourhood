// Shared helpers for Furbourhood's Edge Functions (Deno).
import { createClient } from "jsr:@supabase/supabase-js@2";

// The browser origins allowed to call the functions and be sent back to after checkout.
// Set ALLOWED_ORIGINS in the function secrets, comma separated, e.g. "https://furbourhood.vercel.app".
const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0]!,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

export function appOrigin(req: Request): string | null {
  const origin = req.headers.get("origin") ?? "";
  return allowed.includes(origin) ? origin : null;
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

/** Stripe secret key, test mode only: a live key is refused so no real card is ever charged. */
export function stripeKey(): string {
  const key = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
  if (!key.startsWith("sk_test_")) throw new Error("Payments are set up for Stripe test mode only (a sk_test_ key).");
  return key;
}

/** The signed-in user who called the function, from their Authorization header. */
export async function callerId(req: Request): Promise<string | null> {
  const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

/** Service-role client: bypasses RLS, so every use checks ownership itself first. */
export function adminClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}
