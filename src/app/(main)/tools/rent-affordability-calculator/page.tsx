import type { Metadata } from "next";
import Link from "next/link";
import { ModeTabs } from "./_components/ModeTabs";

export const metadata: Metadata = {
  title: "Rent Affordability Calculator | TrueDeed",
  description:
    "Work out what rent you can comfortably afford, the income a rent needs, and how to split rent with roommates — with a budget breakdown and move-in cost estimate.",
  alternates: { canonical: "https://truedeed.co.uk/tools/rent-affordability-calculator" },
};

export default function RentAffordabilityCalculatorPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-gradient-to-br from-primary/5 to-background">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            <Link href="/renter-tools" className="hover:text-foreground">
              Renter tools
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Rent affordability</span>
          </nav>
          <h1 className="mb-3 font-heading text-4xl font-bold">Rent affordability calculator</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Plan your budget, find the income a rent needs, or split a tenancy with roommates — all
            in one place.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <ModeTabs />
      </main>
    </div>
  );
}
