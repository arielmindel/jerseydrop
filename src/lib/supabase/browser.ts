"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client — used by client components for live queries
 * (admin dashboard) and Auth flows (login). Uses the anon/publishable key
 * which is safe to expose; RLS policies decide who can see what.
 */
export function getBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
