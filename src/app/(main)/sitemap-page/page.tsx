import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sitemap | Britestate",
  description: "Browse all pages on Britestate.",
};

const sections = [
  {
    heading: "Property",
    links: [
      { label: "Search Properties", href: "/search" },
      { label: "Properties for Sale", href: "/properties?type=sale" },
      { label: "Properties to Rent", href: "/properties?type=rent" },
      { label: "Sold Prices", href: "/sold-prices" },
      { label: "Market Trends", href: "/market-trends" },
      { label: "Area Guides", href: "/areas" },
    ],
  },
  {
    heading: "Services",
    links: [
      { label: "Marketplace", href: "/marketplace" },
      { label: "Find an Agent", href: "/agents" },
      { label: "Conveyancers", href: "/conveyancers" },
      { label: "Mortgage Brokers", href: "/mortgage-brokers" },
      { label: "Surveyors", href: "/surveyors" },
      { label: "Architects", href: "/architects" },
      { label: "Post a Job", href: "/post-a-job" },
    ],
  },
  {
    heading: "Sell & Develop",
    links: [
      { label: "Sellers", href: "/sellers" },
      { label: "Developers", href: "/developers" },
      { label: "Traders", href: "/traders" },
      { label: "Pricing & Plans", href: "/pricing" },
      { label: "Fee Transparency", href: "/fee-transparency" },
    ],
  },
  {
    heading: "Tools",
    links: [
      { label: "Mortgage Calculator", href: "/tools" },
      { label: "Stamp Duty Calculator", href: "/tools" },
      { label: "Compare Properties", href: "/compare" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Pricing", href: "/pricing" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" },
      { label: "Partners", href: "/partners" },
      { label: "Investors", href: "/investors" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Help",
    links: [
      { label: "Help Centre", href: "/help" },
      { label: "Contact Support", href: "/help/contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms of Service", href: "/legal/terms" },
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Cookie Policy", href: "/legal/cookies" },
      { label: "Accessibility", href: "/legal/accessibility" },
    ],
  },
];

export default function SitemapPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="text-center">
        <h1 className="font-heading text-4xl font-bold text-neutral-900 sm:text-5xl">
          Sitemap
        </h1>
        <p className="mt-3 text-base text-neutral-600">
          Browse all pages on Britestate.
        </p>
      </div>

      <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <div key={section.heading}>
            <h2 className="font-heading text-lg font-bold text-neutral-900">
              {section.heading}
            </h2>
            <ul className="mt-3 space-y-2">
              {section.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-600 underline-offset-4 hover:text-brand-primary hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
