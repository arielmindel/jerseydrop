import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "כניסת מנהל",
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: "/admin/login" },
};

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return <LoginForm errorParam={searchParams.error} />;
}
