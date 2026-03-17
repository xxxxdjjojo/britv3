import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Britestate",
  description:
    "Free for homebuyers and renters. Professional plans for agents, landlords, and agencies starting at £29/month.",
};

export default function PricingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
