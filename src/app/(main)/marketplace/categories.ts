import {
  Wrench,
  Zap,
  Building2,
  Paintbrush,
  Hammer,
  Trees,
  SprayCan,
  Home,
  BriefcaseBusiness,
  Scale,
  Ruler,
  FileText,
} from "lucide-react";

export type CategoryCard = Readonly<{
  slug: string;
  label: string;
  blurb: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  group: "trade" | "professional";
}>;

/**
 * Marketplace service categories.
 *
 * Each `href` must resolve to a real implemented route. The trade categories
 * route into the existing tradespeople directory (filtered by `category`); the
 * professional categories route to their dedicated directory pages. The
 * marketplace link-integrity test asserts every href below resolves.
 */
export const CATEGORIES: readonly CategoryCard[] = [
  {
    slug: "plumbers",
    label: "Plumbers",
    blurb: "Leaks, boilers & bathrooms",
    icon: Wrench,
    href: "/services/tradespeople?category=plumber",
    group: "trade",
  },
  {
    slug: "electricians",
    label: "Electricians",
    blurb: "Rewires, EICRs & EV chargers",
    icon: Zap,
    href: "/services/tradespeople?category=electrician",
    group: "trade",
  },
  {
    slug: "builders",
    label: "Builders",
    blurb: "Extensions & renovations",
    icon: Building2,
    href: "/services/tradespeople?category=builder",
    group: "trade",
  },
  {
    slug: "plasterers",
    label: "Plasterers",
    blurb: "Skimming & rendering",
    icon: Paintbrush,
    href: "/services/tradespeople?category=plasterer",
    group: "trade",
  },
  {
    slug: "painters",
    label: "Painters & Decorators",
    blurb: "Interior & exterior finishes",
    icon: SprayCan,
    href: "/services/tradespeople?category=painter",
    group: "trade",
  },
  {
    slug: "carpenters",
    label: "Carpenters",
    blurb: "Joinery & fitted storage",
    icon: Hammer,
    href: "/services/tradespeople?category=carpenter",
    group: "trade",
  },
  {
    slug: "landscapers",
    label: "Landscapers",
    blurb: "Gardens, patios & fencing",
    icon: Trees,
    href: "/services/tradespeople?category=landscaping",
    group: "trade",
  },
  {
    slug: "cleaners",
    label: "Cleaners",
    blurb: "Domestic & end-of-tenancy",
    icon: Home,
    href: "/services/tradespeople?category=cleaning",
    group: "trade",
  },
  {
    slug: "estate-agents",
    label: "Estate Agents",
    blurb: "Sell or let your property",
    icon: BriefcaseBusiness,
    href: "/agents",
    group: "professional",
  },
  {
    slug: "mortgage-brokers",
    label: "Mortgage Brokers",
    blurb: "Whole-of-market advice",
    icon: FileText,
    href: "/mortgage-brokers",
    group: "professional",
  },
  {
    slug: "conveyancers",
    label: "Conveyancers",
    blurb: "Legal transfer of ownership",
    icon: Scale,
    href: "/conveyancers",
    group: "professional",
  },
  {
    slug: "surveyors",
    label: "Surveyors",
    blurb: "Homebuyer & building surveys",
    icon: Ruler,
    href: "/surveyors",
    group: "professional",
  },
];
