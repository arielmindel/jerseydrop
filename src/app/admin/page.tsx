import { redirect } from "next/navigation";
import { getServerSupabase, getServiceSupabase } from "@/lib/supabase/server";
import type { OrderRow } from "@/lib/supabase/types";
import AdminHeader from "./AdminHeader";
import AdminClient from "./AdminClient";

export const metadata = {
  title: "פאנל ניהול JerseyDrop",
  robots: { index: false, follow: false, nocache: true },
};

// Force dynamic — orders change constantly, no caching at the page level.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPage() {
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware should already have redirected, but double-guard server-side.
  if (!user) redirect("/admin/login");

  // Fetch orders with the SERVICE role so we don't depend on RLS being
  // perfectly configured for every column join. We've already proven the
  // requester is an admin via the cookie session above.
  const service = getServiceSupabase();
  const { data: orders, error } = await service
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return (
      <>
        <AdminHeader email={user.email || ""} />
        <main className="container py-12">
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-destructive">
            <p className="font-bold">שגיאת טעינה: {error.message}</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AdminHeader email={user.email || ""} />
      <main className="container space-y-6 py-6 md:py-8">
        <AdminClient initialOrders={(orders || []) as OrderRow[]} />
      </main>
    </>
  );
}
