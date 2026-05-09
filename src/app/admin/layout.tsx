import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "פאנל ניהול JerseyDrop",
  description: "פאנל ניהול הזמנות פנימי. דורש הרשאת מנהל.",
  // Belt-and-suspenders: middleware blocks /admin/* + robots.txt disallows
  // + we tell Google not to index even if it somehow reaches the page.
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: "/admin" },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Plain pass-through layout — the public Header/Footer wrap everything via
  // src/app/layout.tsx. Admin pages render their own header inside their
  // page component, so the marketing nav still appears (intentional — keeps
  // the admin grounded in the brand and gives a one-click "back to site" exit).
  return <div className="min-h-[80vh]">{children}</div>;
}
