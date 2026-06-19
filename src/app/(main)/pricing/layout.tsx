import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | TrueDeed",
  description:
    "Free for homeowners. Tradespeople from £47/month. Estate agents pay nothing upfront — performance-based pricing.",
};

export default function PricingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
