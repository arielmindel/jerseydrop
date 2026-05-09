import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Server-side Supabase client wired to Next.js cookies. RLS-aware: queries
 * run as whoever the caller is logged in as (or anon if no session). Use
 * inside server components, route handlers, and server actions.
 */
export function getServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(SUPABASE_URL, ANON_KEY, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      set: (name, value, options) => {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // `cookies().set` throws inside server components; safe to ignore
          // because middleware will re-set the cookie on the next request.
        }
      },
      remove: (name, options) => {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // see comment above
        }
      },
    },
  });
}

/**
 * Service-role Supabase client. Bypasses RLS — only use server-side for
 * trusted operations (e.g. inserting an order from the public checkout
 * before the customer has any auth session). NEVER ship the SERVICE_ROLE_KEY
 * to the browser.
 */
export function getServiceSupabase() {
  if (!SERVICE_KEY || SERVICE_KEY === "PASTE_SERVICE_ROLE_KEY_HERE") {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local and Vercel env vars.",
    );
  }
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
