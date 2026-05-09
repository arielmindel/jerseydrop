import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * /admin/* gate. Runs on every admin route except /admin/login.
 *
 * Flow:
 *   1. Resolve current Supabase session from cookies via createServerClient
 *      (cookies are mirrored back onto the response for refresh handling).
 *   2. If no user → redirect to /admin/login?next=<original>.
 *   3. If user exists, look up the admin_users row by id (RLS allows users
 *      to SELECT their own admin_users row — this is the only way we can
 *      verify membership without trusting the JWT alone).
 *   4. If user exists but isn't in admin_users → signOut + redirect to
 *      /admin/login?error=no_access.
 */
export async function middleware(req: NextRequest) {
  // Allow the login page through without checks (otherwise users couldn't
  // log IN — every other check below would bounce them).
  if (req.nextUrl.pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const res = NextResponse.next({
    request: { headers: req.headers },
  });

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !ANON_KEY) {
    // No Supabase env yet — fail closed: send everyone to /admin/login,
    // which will also fail to load auth (and show a useful error). Better
    // than silently allowing access.
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("error", "no_access");
    return NextResponse.redirect(url);
  }

  const supabase = createServerClient(SUPABASE_URL, ANON_KEY, {
    cookies: {
      get: (name) => req.cookies.get(name)?.value,
      set: (name, value, options) => {
        res.cookies.set({ name, value, ...options });
      },
      remove: (name, options) => {
        res.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Verify admin membership. RLS policy "admins can read users" lets a
  // user SELECT their own row — if it doesn't exist (or fails) they're
  // not an admin.
  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminRow) {
    await supabase.auth.signOut();
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("error", "no_access");
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
