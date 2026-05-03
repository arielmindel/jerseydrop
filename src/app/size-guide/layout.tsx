import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "מדריך מידות",
  description:
    "מדריך מידות לחולצות כדורגל — איך למדוד נכון ולהזמין את המידה הנכונה.",
  alternates: { canonical: "/size-guide" },
};

export default function SizeGuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
