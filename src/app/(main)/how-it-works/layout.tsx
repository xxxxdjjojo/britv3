import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Learn how Britestate works for buyers, sellers, landlords, agents, and tradespeople. Simple steps to navigate the UK property market.",
};

export default function HowItWorksLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
