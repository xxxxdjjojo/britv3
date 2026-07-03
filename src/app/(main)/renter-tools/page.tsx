import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  CreditCard,
  TrendingUp,
  Shield,
  FileText,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { HomeSearchBar } from "@/components/search/HomeSearchBar";

export const metadata: Metadata = {
  title: "Tools for Renters | TrueDeed",
  description:
    "Everything you need to rent with confidence — affordability calculator, applications tracker, viewings manager, and more.",
  alternates: { canonical: "https://truedeed.co.uk/renter-tools" },
};

type ToolCard = Readonly<{
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  available: boolean;
  badge?: string;
}>;

const tools: ToolCard[] = [
  {
    icon: <Calculator className="size-5" />,
    title: "Rent affordability calculator",
    description: "See what rent you can comfortably afford based on your income and outgoings.",
    href: "/tools/rent-affordability-calculator",
    available: true,
  },
  {
    icon: <FileText className="size-5" />,
    title: "Your applications",
    description: "Track tenancy applications you've submitted and their status.",
    href: "/dashboard/renter/applications",
    available: true,
  },
  {
    icon: <Calendar className="size-5" />,
    title: "Manage your viewings",
    description: "See upcoming and past property viewings all in one place.",
    href: "/dashboard/renter/viewings",
    available: true,
  },
  {
    icon: <CreditCard className="size-5" />,
    title: "Pay your rent",
    description: "Set up and track rent payments to your landlord or agent.",
    href: "#",
    available: false,
    badge: "Coming soon",
  },
  {
    icon: <TrendingUp className="size-5" />,
    title: "Build your credit",
    description: "Turn your on-time rent payments into credit history.",
    href: "#",
    available: false,
    badge: "Planned",
  },
  {
    icon: <Shield className="size-5" />,
    title: "Renters & contents insurance",
    description: "Protect your belongings with tailored renters insurance.",
    href: "#",
    available: false,
    badge: "Planned",
  },
];

export default function RenterToolsPage() {
  return (
    <div className="min-h-dvh bg-background">
      {/* Hero */}
      <header className="border-b bg-gradient-to-br from-primary/5 to-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="text-foreground">Renter tools</span>
          </nav>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to rent with confidence
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            Free tools to help you find, secure, and manage your rental home.
          </p>
          <div className="mt-6 max-w-2xl">
            <HomeSearchBar
              defaultType="rent"
              showTabs={false}
              submitLabel="Search"
              placeholder="Search rentals by town, postcode or address…"
            />
          </div>
        </div>
      </header>

      {/* Tools grid */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Card
              key={tool.title}
              className={tool.available ? "transition-shadow hover:shadow-md" : "opacity-75"}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {tool.icon}
                  </div>
                  {tool.badge && (
                    <Badge variant="secondary">{tool.badge}</Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{tool.title}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {tool.available ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={tool.href}>
                      Open tool
                      <ArrowRight className="ml-2 size-3" />
                    </Link>
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {tool.badge === "Coming soon"
                      ? "We're working on this. Check back soon."
                      : "This feature is on our roadmap."}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info section */}
        <div className="mt-12 rounded-lg border bg-muted/30 p-6">
          <h2 className="mb-2 font-heading text-lg font-semibold">
            Your rights as a renter
          </h2>
          <p className="text-sm text-muted-foreground">
            In England, landlords must protect your deposit in a government-approved scheme
            (DPS, TDS, or mydeposits) within 30 days. The maximum deposit is 5 weeks&apos; rent
            (6 weeks for annual rents over £50,000). Holding deposits are capped at 1 week&apos;s rent.
            Right to Rent checks are required before a tenancy can begin.
          </p>
          <Button variant="link" size="sm" asChild className="mt-2 p-0">
            <Link href="/blog?category=renting">
              Read our renting guides
              <ArrowRight className="ml-1 size-3" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
