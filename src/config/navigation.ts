/**
 * Centralized navigation configuration for TrueDeed.
 *
 * Consumed by Header, MegaMenu, Footer, Sidebar, BottomTabBar,
 * Breadcrumbs, and CommandPalette components.
 */

import {
  LayoutDashboard,
  Heart,
  Search,
  Eye,
  FileText,
  Home,
  ClipboardList,
  Building,
  Users,
  Wrench as WrenchIcon,
  PoundSterling,
  Shield,
  Tag,
  TrendingUp,
  Star,
  BadgeCheck,
  Briefcase,
  UserPlus,
  MessagesSquare,
  Calendar,
  MessageSquare,
  User,
  Building2,
  Banknote,
  ShieldCheck,
  FolderOpen,
  Scale,
  Calculator,
  BarChart3,
  Handshake,
  Grid3X3,
  Sparkles,
  Truck,
  Plug,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES, dashboardPathForRole } from "@/lib/routes";
import type { UserRole } from "@/types/auth";
import { brandConfig } from "@/config/brand";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NavLink = Readonly<{
  label: string;
  href: string;
  description?: string;
}>;

export type NavSection = Readonly<{
  heading: string;
  links: NavLink[];
}>;

export type NavItem = Readonly<{
  label: string;
  href?: string;
  sections?: NavSection[];
  isCta?: boolean;
}>;

export type FooterColumn = Readonly<{
  heading: string;
  tagline?: string;
  socialLinks?: Readonly<{ label: string; href: string }>[];
  links?: NavLink[];
}>;

export type BreadcrumbEntry = Readonly<{
  label: string;
  href?: string;
}>;

export type RoleNavItem = Readonly<{
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}>;

export type TabItem = Readonly<{
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}>;

export type CommandPaletteRoute = Readonly<{
  label: string;
  href: string;
  section: string;
  keywords: string[];
  roles?: UserRole[];
}>;

// ---------------------------------------------------------------------------
// NAV_ITEMS — 6 top-level items with nested dropdown sections
// ---------------------------------------------------------------------------

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Buy",
    sections: [
      {
        heading: "Search",
        links: [
          { label: "Property Search", href: "/search?type=buy" },
          { label: "New Homes", href: "/new-homes" },
          { label: "Map Search", href: "/search?view=map&type=buy" },
        ],
      },
      {
        heading: "Data",
        links: [
          { label: "Sold Prices", href: "/sold-prices" },
          { label: "UK Sold Price Map", href: "/search/map" },
          { label: "Area Prices", href: "/area-prices" },
          { label: "Market Trends", href: "/market-trends" },
        ],
      },
      {
        heading: "Tools",
        links: [
          { label: "Mortgage Calculator", href: "/tools/mortgage-calculator" },
          { label: "Stamp Duty Calculator", href: "/tools/stamp-duty-calculator" },
          { label: "Affordability Calculator", href: "/tools/affordability-calculator" },
        ],
      },
      {
        heading: "Guides",
        links: [
          { label: "First-Time Buyer Guide", href: "/tools/first-time-buyer-guide" },
          { label: "Buying Advice", href: "/blog?category=buying" },
        ],
      },
    ],
  },
  {
    label: "Rent",
    sections: [
      {
        heading: "Search",
        links: [
          { label: "Rental Search", href: "/search?type=rent" },
          { label: "Map Search", href: "/search?view=map&type=rent" },
        ],
      },
      {
        heading: "Tools",
        links: [
          { label: "Renter Tools Hub", href: "/renter-tools" },
          { label: "Renters' Rights Checker", href: "/tools/renters-rights-checker" },
          { label: "Rent Affordability", href: "/tools/rent-affordability-calculator" },
          { label: "Buy vs Rent Calculator", href: "/tools/buy-vs-rent-calculator" },
          { label: "Rental Yield Calculator", href: "/tools/rental-yield-calculator" },
        ],
      },
      {
        heading: "Your Rental",
        links: [
          { label: "Applications", href: "/dashboard/renter/applications" },
          { label: "Viewings", href: "/dashboard/renter/viewings" },
        ],
      },
      {
        heading: "Guides",
        links: [
          { label: "Renter's Guide", href: "/blog?category=renting" },
          { label: "Tenancy Rights", href: "/blog?category=tenant-rights" },
        ],
      },
    ],
  },
  {
    label: "Services",
    sections: [
      {
        heading: "Find Professionals",
        links: [
          { label: "Estate Agents", href: "/agents" },
          { label: "Mortgage Brokers", href: "/mortgage-brokers" },
          { label: "Conveyancers & Solicitors", href: "/conveyancers" },
          { label: "Surveyors", href: "/surveyors" },
          { label: "Architects", href: "/architects" },
        ],
      },
      {
        heading: "Find Tradespeople",
        links: [
          { label: "Browse All Trades", href: "/marketplace" },
          { label: "Plumbers", href: "/services/tradespeople?category=plumber" },
          { label: "Electricians", href: "/services/tradespeople?category=electrician" },
          { label: "Builders", href: "/services/tradespeople?category=builder" },
        ],
      },
      {
        heading: "Get Work Done",
        links: [
          { label: "Post a Job", href: "/post-a-job" },
        ],
      },
      {
        heading: "Trust",
        links: [
          { label: "Read Reviews", href: "/reviews" },
        ],
      },
    ],
  },
  {
    label: "Tools & Valuations",
    sections: [
      {
        heading: "Valuations",
        links: [
          { label: "Value My Property", href: "/value-my-property" },
          { label: "Free Instant Valuation", href: "/valuation" },
        ],
      },
      {
        heading: "Calculators",
        links: [
          { label: "Mortgage Calculator", href: "/tools/mortgage-calculator" },
          { label: "Stamp Duty Calculator", href: "/tools/stamp-duty-calculator" },
          { label: "Affordability Calculator", href: "/tools/affordability-calculator" },
          { label: "Buy vs Rent Calculator", href: "/tools/buy-vs-rent-calculator" },
          { label: "Rental Yield Calculator", href: "/tools/rental-yield-calculator" },
          { label: "Remortgage Calculator", href: "/tools/remortgage-calculator" },
          { label: "Moving Cost Estimator", href: "/tools/moving-cost-estimator" },
          { label: "Energy Bill Estimator", href: "/tools/energy-bill-estimator" },
        ],
      },
      {
        heading: "Comparison",
        links: [
          { label: "Compare Properties", href: "/compare" },
          { label: "Mortgage Comparison", href: "/tools/mortgage-comparison" },
        ],
      },
      {
        heading: "Data",
        links: [
          { label: "Area Guides", href: "/areas" },
          { label: "Market Trends", href: "/market-trends" },
          { label: "UK Sold Price Map", href: "/search/map" },
        ],
      },
      {
        heading: "Truth & tools",
        links: [
          { label: "Renters' Rights Checker", href: "/tools/renters-rights-checker" },
          { label: "True Equity Checker", href: "/area-prices" },
          { label: "Reality Gap Report", href: "/reports/reality-gap" },
          { label: "Time to Sell", href: "/reports/time-to-sell" },
          { label: "Open Metrics", href: "/metrics" },
          { label: "Our Pledges", href: "/pledges" },
          { label: "Compliance Library", href: "/compliance" },
          { label: "Agent Briefing", href: "/agent-briefing" },
          { label: "Honest Agent Awards", href: "/awards" },
          { label: "Fair Landlord Register", href: "/fair-landlord-register" },
          { label: "Landlord Deadline Diary", href: "/landlords/deadline-diary" },
        ],
      },
    ],
  },
  {
    label: "Advice",
    sections: [
      {
        heading: "Content",
        links: [
          { label: "Blog & Guides", href: "/blog" },
          { label: "How It Works", href: "/how-it-works" },
          { label: "Help Centre", href: "/help" },
          { label: "Area Guides", href: "/areas" },
        ],
      },
      {
        heading: "For Professionals",
        links: [
          { label: "Agent Resources", href: "/blog?category=agents" },
          { label: "Landlord Guides", href: "/blog?category=landlords" },
        ],
      },
    ],
  },
  {
    label: "List / Sell",
    isCta: true,
    sections: [
      {
        heading: "Sellers",
        links: [
          { label: "Sell Your Home", href: "/sellers" },
          { label: "Get a Valuation", href: "/valuation" },
          { label: "Find an Estate Agent", href: "/agents" },
        ],
      },
      {
        heading: "Landlords",
        links: [
          { label: "List a Rental", href: "/dashboard/landlord/properties" },
          { label: "Landlord Dashboard", href: "/dashboard/landlord" },
        ],
      },
      {
        heading: "Developers & Traders",
        links: [
          { label: "Developers", href: "/developers" },
          { label: "Developer Dashboard", href: "/dashboard/developer" },
          { label: "Traders", href: "/traders" },
        ],
      },
      {
        heading: "Agents",
        links: [
          { label: "Agent Dashboard", href: "/dashboard/agent" },
          { label: "Pricing & Plans", href: "/pricing" },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// FOOTER_LINKS — 7 columns
// ---------------------------------------------------------------------------

export const FOOTER_LINKS: FooterColumn[] = [
  {
    heading: "Brand",
    tagline: "The smarter way to find your home.",
    socialLinks: [
      { label: "Twitter", href: brandConfig.social.x },
      { label: "LinkedIn", href: brandConfig.social.linkedIn },
      { label: "Instagram", href: brandConfig.social.instagram },
      { label: "Facebook", href: brandConfig.social.facebook },
    ],
  },
  {
    heading: "Properties",
    links: [
      { label: "Buy", href: "/search?type=buy" },
      { label: "Rent", href: "/search?type=rent" },
      { label: "New Homes", href: "/new-homes" },
      { label: "Top Properties", href: "/top-properties" },
      { label: "Commercial", href: "/search?type=commercial" },
      { label: "Sold Prices", href: "/sold-prices" },
    ],
  },
  {
    heading: "Services",
    links: [
      { label: "Find Tradespeople", href: "/marketplace" },
      { label: "Local Professionals", href: "/professionals" },
      { label: "Sellers", href: "/sellers" },
      { label: "Developers", href: "/developers" },
      { label: "Traders", href: "/traders" },
      { label: "Estate Agents", href: "/agents" },
    ],
  },
  {
    heading: "Tools",
    links: [
      { label: "Stamp Duty Calculator", href: "/tools/stamp-duty-calculator" },
      { label: "Mortgage Calculator", href: "/tools/mortgage-calculator" },
      { label: "Valuation", href: "/valuation" },
      { label: "Area Guides", href: "/areas" },
      { label: "Market Trends", href: "/market-trends" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Pricing & Plans", href: "/pricing" },
      { label: "Fee Transparency", href: "/fee-transparency" },
      { label: "Our Pledges", href: "/pledges" },
      { label: "Compliance Library", href: "/compliance" },
      { label: "Agent Briefing", href: "/agent-briefing" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
      { label: "Blog", href: "/blog" },
      { label: "Free Landlord Guide", href: "/guides/landlord-guide" },
      { label: "Help Centre", href: "/help" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Legal Hub", href: "/legal" },
      { label: "Terms", href: "/legal/terms" },
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Cookies", href: "/legal/cookies" },
      { label: "Accessibility", href: "/legal/accessibility" },
      { label: "Complaints", href: "/legal/complaints" },
      { label: "Fair Housing", href: "/legal/fair-housing" },
      { label: "Regulatory", href: "/legal/regulatory" },
    ],
  },
  {
    heading: "Popular Areas",
    links: [
      { label: "London", href: "/areas/london" },
      { label: "Manchester", href: "/areas/manchester" },
      { label: "Birmingham", href: "/areas/birmingham" },
      { label: "Bristol", href: "/areas/bristol" },
      { label: "Leeds", href: "/areas/leeds" },
      { label: "Edinburgh", href: "/areas/edinburgh" },
      { label: "Oxford", href: "/areas/oxford" },
      { label: "Cambridge", href: "/areas/cambridge" },
    ],
  },
];

// ---------------------------------------------------------------------------
// BREADCRUMB_MAP — Route pattern → breadcrumb trail
//
// Keys use exact query string matching (e.g. "/search?type=buy").
// The Breadcrumbs component must handle partial matches for routes
// whose query parameters may differ at runtime.
// ---------------------------------------------------------------------------

export const BREADCRUMB_MAP: Record<string, BreadcrumbEntry[]> = {
  "/search?type=buy": [
    { label: "Home", href: "/" },
    { label: "Buy Property" },
  ],
  "/search?type=rent": [
    { label: "Home", href: "/" },
    { label: "Rent Property" },
  ],
  "/sold-prices": [
    { label: "Home", href: "/" },
    { label: "Sold Prices" },
  ],
  "/market-trends": [
    { label: "Home", href: "/" },
    { label: "Market Trends" },
  ],
  "/valuation": [
    { label: "Home", href: "/" },
    { label: "Valuation" },
  ],
  "/agents": [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: "Estate Agents" },
  ],
  "/marketplace": [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: "Find Tradespeople" },
  ],
  "/blog": [
    { label: "Home", href: "/" },
    { label: "Advice", href: "/blog" },
    { label: "Blog" },
  ],
  "/areas": [
    { label: "Home", href: "/" },
    { label: "Area Guides" },
  ],
  "/compare": [
    { label: "Home", href: "/" },
    { label: "Tools" },
    { label: "Compare Properties" },
  ],
  "/help": [
    { label: "Home", href: "/" },
    { label: "Help Centre" },
  ],
  "/how-it-works": [
    { label: "Home", href: "/" },
    { label: "How It Works" },
  ],
  "/pricing": [
    { label: "Home", href: "/" },
    { label: "Pricing & Plans" },
  ],
  "/reviews": [
    { label: "Home", href: "/" },
    { label: "Reviews" },
  ],
  "/about": [
    { label: "Home", href: "/" },
    { label: "About" },
  ],
  "/contact": [
    { label: "Home", href: "/" },
    { label: "Contact" },
  ],
};

/**
 * Dynamic breadcrumb patterns — resolved at render time by the Breadcrumbs
 * component using route params.
 *
 * Pattern tokens:
 * - [slug]   → resolved from URL segment
 * - [city]   → resolved from URL segment
 * - [area]   → resolved from URL segment
 * - [tool]   → resolved from URL segment (title-cased)
 * - [title]  → resolved via data fetch (property/article/agent name)
 */
export const BREADCRUMB_PATTERNS: Record<string, BreadcrumbEntry[]> = {
  "/properties/[slug]": [
    { label: "Home", href: "/" },
    { label: "Buy Property", href: "/search?type=buy" },
    { label: "[city]" },
    { label: "[title]" },
  ],
  "/agents/[slug]": [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: "Estate Agents", href: "/agents" },
    { label: "[title]" },
  ],
  "/tools/[tool]": [
    { label: "Home", href: "/" },
    { label: "Tools" },
    { label: "[tool]" },
  ],
  "/areas/[city]": [
    { label: "Home", href: "/" },
    { label: "Area Guides", href: "/areas" },
    { label: "[city]" },
  ],
  "/areas/[city]/[area]": [
    { label: "Home", href: "/" },
    { label: "Area Guides", href: "/areas" },
    { label: "[city]", href: "/areas/[city]" },
    { label: "[area]" },
  ],
  "/blog/[slug]": [
    { label: "Home", href: "/" },
    { label: "Advice" },
    { label: "Blog", href: "/blog" },
    { label: "[title]" },
  ],
};

// ---------------------------------------------------------------------------
// ROLE_NAV_ITEMS — Dashboard sidebar navigation per role
// ---------------------------------------------------------------------------

export const ROLE_NAV_ITEMS: Record<UserRole, RoleNavItem[]> = {
  homebuyer: [
    { href: "/dashboard/homebuyer", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/homebuyer/saved", label: "Saved Properties", icon: Heart },
    { href: "/dashboard/homebuyer/searches", label: "Searches", icon: Search },
    { href: "/dashboard/homebuyer/viewings", label: "Viewings", icon: Eye },
    { href: "/dashboard/homebuyer/offers", label: "Offers", icon: PoundSterling },
    { href: "/dashboard/homebuyer/ai-match", label: "AI Match", icon: Sparkles },
    { href: "/dashboard/homebuyer/documents", label: "Documents", icon: FileText },
    { href: "/dashboard/homebuyer/moving", label: "Moving Checklist", icon: Truck },
    { href: "/dashboard/homebuyer/calculators", label: "Financial Tools", icon: Calculator },
  ],
  renter: [
    { href: "/dashboard/renter", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/renter/saved", label: "Saved Rentals", icon: Heart },
    { href: "/dashboard/renter/applications", label: "Applications", icon: ClipboardList },
    { href: "/dashboard/renter/tenancy", label: "Tenancy", icon: Home },
    { href: "/dashboard/renter/documents", label: "Documents", icon: FileText },
  ],
  seller: [
    { href: "/dashboard/seller", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/seller/listings", label: "My Listings", icon: Tag },
    { href: "/dashboard/seller/viewings", label: "Viewings", icon: Eye },
    { href: "/dashboard/seller/offers", label: "Offers", icon: PoundSterling },
    { href: "/dashboard/seller/documents", label: "Documents", icon: FileText },
  ],
  landlord: [
    { href: "/dashboard/landlord", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/landlord/properties", label: "Properties", icon: Building2 },
    { href: "/dashboard/landlord/viewings", label: "Viewings", icon: Eye },
    { href: "/dashboard/landlord/tenants", label: "Tenants", icon: Users },
    { href: "/dashboard/landlord/rent", label: "Rent", icon: Banknote },
    { href: "/dashboard/landlord/compliance", label: "Compliance", icon: ShieldCheck },
    { href: "/dashboard/landlord/compliance/matrix", label: "Compliance Matrix", icon: Grid3X3 },
    { href: "/dashboard/landlord/maintenance", label: "Maintenance", icon: WrenchIcon },
    { href: "/dashboard/landlord/finance/expenses", label: "Finance", icon: TrendingUp },
    { href: "/dashboard/landlord/deposits", label: "Documents", icon: FolderOpen },
    { href: "/dashboard/landlord/legal/notices", label: "Legal", icon: Scale },
    { href: "/dashboard/landlord/tools/yield-calculator", label: "Tools", icon: Calculator },
    { href: "/dashboard/landlord/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/dashboard/landlord/insurance", label: "Insurance", icon: Shield },
    { href: "/dashboard/landlord/find-agent", label: "Find Agent", icon: Handshake },
  ],
  agent: [
    { href: "/dashboard/agent", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/agent/listings", label: "Listings", icon: Building },
    { href: "/dashboard/agent/integrations/feeds", label: "Feeds", icon: Plug },
    { href: "/dashboard/agent/leads", label: "Leads", icon: UserPlus },
    { href: "/dashboard/agent/viewings", label: "Viewings", icon: Eye },
    { href: "/dashboard/agent/revenue", label: "Revenue", icon: TrendingUp },
    { href: "/dashboard/agent/team", label: "Team", icon: Briefcase },
  ],
  service_provider: [
    { href: "/dashboard/provider", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/provider/jobs/leads", label: "Jobs", icon: ClipboardList },
    { href: "/dashboard/provider/quotes/builder", label: "Quotes", icon: MessagesSquare },
    { href: "/dashboard/provider/reviews", label: "Reviews", icon: Star },
    { href: "/dashboard/provider/verification", label: "Verification", icon: BadgeCheck },
    { href: "/dashboard/provider/referrals", label: "Referrals", icon: UserPlus },
    { href: "/dashboard/provider/payments", label: "Earnings", icon: PoundSterling },
    { href: "/dashboard/provider/boost", label: "Boost My Profile", icon: Sparkles },
  ],
  mortgage_broker: [
    { href: dashboardPathForRole("mortgage_broker"), label: "Overview", icon: LayoutDashboard },
    { href: dashboardPathForRole("mortgage_broker", "leads"), label: "Leads", icon: FileText },
    { href: dashboardPathForRole("mortgage_broker", "pipeline"), label: "Pipeline", icon: Users },
    { href: dashboardPathForRole("mortgage_broker", "products"), label: "Products", icon: ClipboardList },
    { href: dashboardPathForRole("mortgage_broker", "analytics"), label: "Analytics", icon: TrendingUp },
    { href: dashboardPathForRole("mortgage_broker", "fca-verification"), label: "FCA Verification", icon: BadgeCheck },
  ],
  developer: [
    { href: "/dashboard/developer", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/developer/developments", label: "Developments", icon: Building2 },
    { href: "/dashboard/developer/leads", label: "Leads", icon: UserPlus },
    { href: "/dashboard/developer/viewings", label: "Viewings", icon: Calendar },
  ],
};

// ---------------------------------------------------------------------------
// ROLE_PRIMARY_CTA — Stitch sidebar bottom call-to-action per role.
// Each href targets an existing route (no invented destinations).
// ---------------------------------------------------------------------------

export const ROLE_PRIMARY_CTA: Record<UserRole, { label: string; href: string }> = {
  homebuyer: { label: "Book a Viewing", href: "/search" },
  renter: { label: "Find a Rental", href: "/search" },
  seller: { label: "List New Property", href: "/dashboard/seller/listings/create" },
  landlord: { label: "Add Property", href: "/dashboard/landlord/properties/add" },
  agent: { label: "New Listing", href: "/dashboard/agent/listings/create" },
  service_provider: { label: "Find Work", href: "/dashboard/provider/jobs/leads" },
  mortgage_broker: { label: "New Lead", href: "/dashboard/broker/leads" },
  developer: { label: "View Leads", href: "/dashboard/developer/leads" },
};

// ---------------------------------------------------------------------------
// TAB_CONFIG — Mobile bottom tab bar per role
// ---------------------------------------------------------------------------

export const TAB_CONFIG: Record<UserRole, TabItem[]> = {
  homebuyer: [
    { label: "Search", href: "/search", icon: Search },
    { label: "Saved", href: "/dashboard/homebuyer/saved", icon: Heart },
    { label: "Viewings", href: "/dashboard/homebuyer/viewings", icon: Calendar },
    { label: "Messages", href: ROUTES.inbox, icon: MessageSquare },
    { label: "Profile", href: "/profile", icon: User },
  ],
  renter: [
    { label: "Search", href: "/search", icon: Search },
    { label: "Saved", href: "/dashboard/renter/saved", icon: Heart },
    { label: "Applications", href: "/dashboard/renter/applications", icon: FileText },
    { label: "Messages", href: ROUTES.inbox, icon: MessageSquare },
    { label: "Profile", href: "/profile", icon: User },
  ],
  seller: [
    { label: "Listings", href: "/dashboard/seller/listings", icon: Home },
    { label: "Viewings", href: "/dashboard/seller/viewings", icon: Calendar },
    { label: "Offers", href: "/dashboard/seller/offers", icon: FileText },
    { label: "Messages", href: ROUTES.inbox, icon: MessageSquare },
    { label: "Profile", href: "/profile", icon: User },
  ],
  landlord: [
    { label: "Portfolio", href: "/dashboard/landlord/properties", icon: Building2 },
    { label: "Tenants", href: "/dashboard/landlord/tenants", icon: Users },
    { label: "Maintenance", href: "/dashboard/landlord/maintenance", icon: WrenchIcon },
    { label: "Messages", href: ROUTES.inbox, icon: MessageSquare },
    { label: "Profile", href: "/profile", icon: User },
  ],
  agent: [
    { label: "Listings", href: "/dashboard/agent/listings", icon: Home },
    { label: "Leads", href: "/dashboard/agent/leads", icon: Users },
    { label: "Viewings", href: "/dashboard/agent/viewings", icon: Calendar },
    { label: "Messages", href: ROUTES.inbox, icon: MessageSquare },
    { label: "Profile", href: "/profile", icon: User },
  ],
  service_provider: [
    { label: "Jobs", href: "/dashboard/provider/jobs/leads", icon: Briefcase },
    { label: "Quotes", href: "/dashboard/provider/quotes/builder", icon: ClipboardList },
    { label: "Calendar", href: "/dashboard/provider/availability", icon: Calendar },
    { label: "Messages", href: ROUTES.inbox, icon: MessageSquare },
    { label: "Profile", href: "/profile", icon: User },
  ],
  mortgage_broker: [
    { label: "Leads", href: dashboardPathForRole("mortgage_broker", "leads"), icon: Briefcase },
    { label: "Pipeline", href: dashboardPathForRole("mortgage_broker", "pipeline"), icon: Users },
    { label: "Products", href: dashboardPathForRole("mortgage_broker", "products"), icon: ClipboardList },
    { label: "Messages", href: ROUTES.inbox, icon: MessageSquare },
    { label: "Profile", href: "/profile", icon: User },
  ],
  developer: [
    { label: "Overview", href: "/dashboard/developer", icon: Home },
    { label: "Leads", href: "/dashboard/developer/leads", icon: Users },
    { label: "Viewings", href: "/dashboard/developer/viewings", icon: Calendar },
    { label: "Messages", href: ROUTES.inbox, icon: MessageSquare },
    { label: "Profile", href: "/profile", icon: User },
  ],
};

// ---------------------------------------------------------------------------
// COMMAND_PALETTE_ROUTES — Flat array of searchable routes
// ---------------------------------------------------------------------------

export const COMMAND_PALETTE_ROUTES: CommandPaletteRoute[] = [
  // Public — Search
  { label: "Property Search", href: "/search", section: "Search", keywords: ["buy", "rent", "property", "search", "find"] },
  { label: "Buy Property", href: "/search?type=buy", section: "Search", keywords: ["buy", "purchase", "property"] },
  { label: "Rent Property", href: "/search?type=rent", section: "Search", keywords: ["rent", "rental", "let", "property"] },
  { label: "New Homes", href: "/new-homes", section: "Search", keywords: ["new", "homes", "builds", "development", "new-build"] },
  { label: "Map Search (Buy)", href: "/search?view=map&type=buy", section: "Search", keywords: ["map", "buy", "search"] },
  { label: "Map Search (Rent)", href: "/search?view=map&type=rent", section: "Search", keywords: ["map", "rent", "search"] },

  // Public — Data
  { label: "Sold Prices", href: "/sold-prices", section: "Data", keywords: ["sold", "prices", "history", "data"] },
  { label: "Market Trends", href: "/market-trends", section: "Data", keywords: ["market", "trends", "data", "analytics"] },
  { label: "UK Sold Price Map", href: "/search/map", section: "Data", keywords: ["map", "heatmap", "median", "sold", "price", "area", "national", "postcode", "borough", "lsoa"] },
  { label: "Area Prices", href: "/area-prices", section: "Data", keywords: ["area", "prices", "postcode", "my area", "flat", "house", "average", "sold", "what is my area worth"] },

  // Public — Tools & Valuations
  { label: "Free Instant Valuation", href: "/valuation", section: "Tools", keywords: ["valuation", "value", "estimate", "free"] },
  { label: "Mortgage Calculator", href: "/tools/mortgage-calculator", section: "Tools", keywords: ["mortgage", "calculator", "repayment"] },
  { label: "Stamp Duty Calculator", href: "/tools/stamp-duty-calculator", section: "Tools", keywords: ["stamp", "duty", "sdlt", "tax"] },
  { label: "Affordability Calculator", href: "/tools/affordability-calculator", section: "Tools", keywords: ["affordability", "budget", "income"] },
  { label: "Rent Affordability Calculator", href: "/tools/rent-affordability-calculator", section: "Tools", keywords: ["rent", "affordability", "budget", "income", "tenant"] },
  { label: "Renter Tools Hub", href: "/renter-tools", section: "Tools", keywords: ["renter", "tools", "rent", "tenant", "applications", "viewings"] },
  { label: "Buy vs Rent Calculator", href: "/tools/buy-vs-rent-calculator", section: "Tools", keywords: ["buy", "rent", "compare", "calculator"] },
  { label: "Rental Yield Calculator", href: "/tools/rental-yield-calculator", section: "Tools", keywords: ["rental", "yield", "roi", "return"] },
  { label: "Remortgage Calculator", href: "/tools/remortgage-calculator", section: "Tools", keywords: ["remortgage", "refinance", "calculator"] },
  { label: "Moving Cost Estimator", href: "/tools/moving-cost-estimator", section: "Tools", keywords: ["moving", "cost", "estimate", "removal"] },
  { label: "Energy Bill Estimator", href: "/tools/energy-bill-estimator", section: "Tools", keywords: ["energy", "bill", "gas", "electric", "epc"] },
  { label: "Compare Properties", href: "/compare", section: "Tools", keywords: ["compare", "properties", "side-by-side"] },
  { label: "Mortgage Comparison", href: "/tools/mortgage-comparison", section: "Tools", keywords: ["mortgage", "compare", "rates"] },

  // Public — Services
  { label: "Estate Agents", href: "/agents", section: "Services", keywords: ["agent", "estate", "find", "professional"] },
  { label: "Mortgage Brokers", href: "/mortgage-brokers", section: "Services", keywords: ["mortgage", "broker", "advisor"] },
  { label: "Conveyancers & Solicitors", href: "/conveyancers", section: "Services", keywords: ["conveyancer", "solicitor", "legal"] },
  { label: "Surveyors", href: "/surveyors", section: "Services", keywords: ["surveyor", "survey", "inspection"] },
  { label: "Architects", href: "/architects", section: "Services", keywords: ["architect", "design", "planning"] },
  { label: "Browse All Trades", href: "/marketplace", section: "Services", keywords: ["trades", "marketplace", "tradespeople"] },
  { label: "Plumbers", href: "/services/tradespeople?category=plumber", section: "Services", keywords: ["plumber", "plumbing", "leak"] },
  { label: "Electricians", href: "/services/tradespeople?category=electrician", section: "Services", keywords: ["electrician", "electrical", "wiring"] },
  { label: "Builders", href: "/services/tradespeople?category=builder", section: "Services", keywords: ["builder", "construction", "extension"] },
  { label: "Post a Job", href: "/post-a-job", section: "Services", keywords: ["post", "job", "work", "request"] },
  { label: "Read Reviews", href: "/reviews", section: "Services", keywords: ["reviews", "ratings", "trust"] },

  // Public — Advice & Content
  { label: "Blog & Guides", href: "/blog", section: "Advice", keywords: ["blog", "guides", "articles", "advice"] },
  { label: "How It Works", href: "/how-it-works", section: "Advice", keywords: ["how", "works", "guide"] },
  { label: "Help Centre", href: "/help", section: "Advice", keywords: ["help", "support", "faq"] },
  { label: "Area Guides", href: "/areas", section: "Advice", keywords: ["area", "guides", "neighbourhood", "location"] },

  // Public — Company
  { label: "About", href: "/about", section: "Company", keywords: ["about", "company", "team"] },
  { label: "Careers", href: "/careers", section: "Company", keywords: ["careers", "jobs", "hiring"] },
  { label: "Press", href: "/press", section: "Company", keywords: ["press", "media", "news"] },
  { label: "Contact", href: "/contact", section: "Company", keywords: ["contact", "support", "email"] },
  { label: "Pricing & Plans", href: "/pricing", section: "Company", keywords: ["pricing", "plans", "subscription"] },
  { label: "Sellers", href: "/sellers", section: "Services", keywords: ["sellers", "sell", "listing", "completion"] },
  { label: "Developers", href: "/developers", section: "Services", keywords: ["developers", "schemes", "new build", "investor"] },
  { label: "Traders", href: "/traders", section: "Services", keywords: ["traders", "flippers", "off-market", "resale"] },
  { label: "Fee Transparency", href: "/fee-transparency", section: "Company", keywords: ["fee", "commission", "transparency", "rates"] },

  // Public — Legal
  { label: "Legal Hub", href: "/legal", section: "Legal", keywords: ["legal", "terms", "privacy"] },
  { label: "Terms of Service", href: "/legal/terms", section: "Legal", keywords: ["terms", "service", "conditions"] },
  { label: "Privacy Policy", href: "/legal/privacy", section: "Legal", keywords: ["privacy", "policy", "data"] },
  { label: "Cookies", href: "/legal/cookies", section: "Legal", keywords: ["cookies", "tracking"] },
  { label: "Accessibility", href: "/legal/accessibility", section: "Legal", keywords: ["accessibility", "a11y"] },

  // Dashboard — Homebuyer
  { label: "Homebuyer Overview", href: "/dashboard/homebuyer", section: "Dashboard", keywords: ["dashboard", "overview", "homebuyer"], roles: ["homebuyer"] },
  { label: "Saved Properties", href: "/dashboard/homebuyer/saved", section: "Dashboard", keywords: ["saved", "properties", "favourites"], roles: ["homebuyer"] },
  { label: "My Searches", href: "/dashboard/homebuyer/searches", section: "Dashboard", keywords: ["searches", "alerts"], roles: ["homebuyer"] },
  { label: "Viewings (Homebuyer)", href: "/dashboard/homebuyer/viewings", section: "Dashboard", keywords: ["viewings", "appointments"], roles: ["homebuyer"] },
  { label: "Documents (Homebuyer)", href: "/dashboard/homebuyer/documents", section: "Dashboard", keywords: ["documents", "files"], roles: ["homebuyer"] },

  // Dashboard — Renter
  { label: "Renter Overview", href: "/dashboard/renter", section: "Dashboard", keywords: ["dashboard", "overview", "renter"], roles: ["renter"] },
  { label: "Saved Rentals", href: "/dashboard/renter/saved", section: "Dashboard", keywords: ["saved", "rentals", "favourites"], roles: ["renter"] },
  { label: "Applications (Renter)", href: "/dashboard/renter/applications", section: "Dashboard", keywords: ["applications", "apply"], roles: ["renter"] },
  { label: "Tenancy", href: "/dashboard/renter/tenancy", section: "Dashboard", keywords: ["tenancy", "lease", "contract"], roles: ["renter"] },
  { label: "Documents (Renter)", href: "/dashboard/renter/documents", section: "Dashboard", keywords: ["documents", "files"], roles: ["renter"] },

  // Dashboard — Seller
  { label: "Seller Overview", href: "/dashboard/seller", section: "Dashboard", keywords: ["dashboard", "overview", "seller"], roles: ["seller"] },
  { label: "My Listings (Seller)", href: "/dashboard/seller/listings", section: "Dashboard", keywords: ["listings", "properties"], roles: ["seller"] },
  { label: "Viewings (Seller)", href: "/dashboard/seller/viewings", section: "Dashboard", keywords: ["viewings", "appointments"], roles: ["seller"] },
  { label: "Offers", href: "/dashboard/seller/offers", section: "Dashboard", keywords: ["offers", "bids"], roles: ["seller"] },
  { label: "Documents (Seller)", href: "/dashboard/seller/documents", section: "Dashboard", keywords: ["documents", "files"], roles: ["seller"] },

  // Dashboard — Landlord
  { label: "Landlord Overview", href: "/dashboard/landlord", section: "Dashboard", keywords: ["dashboard", "overview", "landlord"], roles: ["landlord"] },
  { label: "Portfolio", href: "/dashboard/landlord/properties", section: "Dashboard", keywords: ["portfolio", "properties", "rentals"], roles: ["landlord"] },
  { label: "Tenants", href: "/dashboard/landlord/tenants", section: "Dashboard", keywords: ["tenants", "occupants"], roles: ["landlord"] },
  { label: "Maintenance", href: "/dashboard/landlord/maintenance", section: "Dashboard", keywords: ["maintenance", "repairs", "issues"], roles: ["landlord"] },
  { label: "Finances", href: "/dashboard/landlord/finance/expenses", section: "Dashboard", keywords: ["finances", "expenses", "income"], roles: ["landlord"] },
  { label: "Compliance", href: "/dashboard/landlord/compliance", section: "Dashboard", keywords: ["compliance", "certificates", "gas", "epc"], roles: ["landlord"] },

  // Dashboard — Agent
  { label: "Agent Overview", href: "/dashboard/agent", section: "Dashboard", keywords: ["dashboard", "overview", "agent"], roles: ["agent"] },
  { label: "Listings (Agent)", href: "/dashboard/agent/listings", section: "Dashboard", keywords: ["listings", "properties"], roles: ["agent"] },
  { label: "Feed Integrations", href: "/dashboard/agent/integrations/feeds", section: "Dashboard", keywords: ["feeds", "integrations", "import", "reapit", "alto", "jupix"], roles: ["agent"] },
  { label: "Leads", href: "/dashboard/agent/leads", section: "Dashboard", keywords: ["leads", "enquiries", "prospects"], roles: ["agent"] },
  { label: "Viewings (Agent)", href: "/dashboard/agent/viewings", section: "Dashboard", keywords: ["viewings", "appointments"], roles: ["agent"] },
  { label: "Revenue (Agent)", href: "/dashboard/agent/revenue", section: "Dashboard", keywords: ["revenue", "income", "earnings"], roles: ["agent"] },
  { label: "Team", href: "/dashboard/agent/team", section: "Dashboard", keywords: ["team", "staff", "members"], roles: ["agent"] },

  // Dashboard — Service Provider
  { label: "Provider Overview", href: "/dashboard/provider", section: "Dashboard", keywords: ["dashboard", "overview", "provider"], roles: ["service_provider"] },
  { label: "Jobs", href: "/dashboard/provider/jobs/leads", section: "Dashboard", keywords: ["jobs", "work", "tasks"], roles: ["service_provider"] },
  { label: "Quotes", href: "/dashboard/provider/quotes/builder", section: "Dashboard", keywords: ["quotes", "estimates", "pricing"], roles: ["service_provider"] },
  { label: "Reviews (Provider)", href: "/dashboard/provider/reviews", section: "Dashboard", keywords: ["reviews", "ratings", "feedback"], roles: ["service_provider"] },
  { label: "Verification (Provider)", href: "/dashboard/provider/verification", section: "Dashboard", keywords: ["verification", "identity", "documents"], roles: ["service_provider"] },
  { label: "Earnings", href: "/dashboard/provider/payments", section: "Dashboard", keywords: ["earnings", "income", "payments"], roles: ["service_provider"] },

  // Dashboard — Mortgage Broker
  { label: "Broker Overview", href: dashboardPathForRole("mortgage_broker"), section: "Dashboard", keywords: ["dashboard", "overview", "broker"], roles: ["mortgage_broker"] },
  { label: "Leads", href: dashboardPathForRole("mortgage_broker", "leads"), section: "Dashboard", keywords: ["leads", "cases", "files", "applications"], roles: ["mortgage_broker"] },
  { label: "Pipeline", href: dashboardPathForRole("mortgage_broker", "pipeline"), section: "Dashboard", keywords: ["pipeline", "clients", "customers", "contacts"], roles: ["mortgage_broker"] },
  { label: "Products (Broker)", href: dashboardPathForRole("mortgage_broker", "products"), section: "Dashboard", keywords: ["products", "applications", "submissions"], roles: ["mortgage_broker"] },
  { label: "Analytics (Broker)", href: dashboardPathForRole("mortgage_broker", "analytics"), section: "Dashboard", keywords: ["analytics", "revenue", "income", "commission"], roles: ["mortgage_broker"] },
  { label: "FCA Verification (Broker)", href: dashboardPathForRole("mortgage_broker", "fca-verification"), section: "Dashboard", keywords: ["verification", "fca", "compliance"], roles: ["mortgage_broker"] },
];

// ---------------------------------------------------------------------------
// navLinkClasses — Utility for nav link styling
// ---------------------------------------------------------------------------

export function navLinkClasses(options?: {
  active?: boolean;
  variant?: "default" | "transparent" | "sidebar" | "mobile" | "footer";
}): string {
  const { active = false, variant = "default" } = options ?? {};

  const base = "text-base font-medium transition-colors";

  switch (variant) {
    case "transparent":
      return cn(
        base,
        active
          ? "text-white bg-white/20"
          : "text-white/80 hover:text-white hover:bg-white/10",
      );
    case "sidebar":
      return cn(
        base,
        "flex items-center gap-3 rounded-lg px-3 py-2",
        active
          ? "bg-brand-primary/10 text-brand-primary border-r-2 border-brand-primary rounded-r-none font-semibold"
          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
      );
    case "mobile":
      return cn(
        base,
        "flex items-center min-h-11 px-4 py-2",
        active
          ? "text-brand-primary bg-brand-primary/5"
          : "text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900",
      );
    case "footer":
      return cn(
        "text-base text-neutral-400 hover:text-white transition-colors",
      );
    default:
      return cn(
        base,
        active
          ? "text-brand-primary"
          : "text-neutral-700 hover:text-neutral-900",
      );
  }
}

// ---------------------------------------------------------------------------
// footerLinkClasses — Simpler utility for footer links
// ---------------------------------------------------------------------------

export function footerLinkClasses(): string {
  return navLinkClasses({ variant: "footer" });
}
