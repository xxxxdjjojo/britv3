"use client";

import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { ChevronUp, Twitter, Linkedin, Instagram, Facebook } from "lucide-react";

const PROPERTIES_LINKS = [
  { href: "/search?type=buy", label: "Buy" },
  { href: "/search?type=rent", label: "Rent" },
  { href: "/search?type=new-builds", label: "New Builds" },
  { href: "/search?type=commercial", label: "Commercial" },
  { href: "/sold-prices", label: "Sold Prices" },
] as const;

const SERVICES_LINKS = [
  { href: "/marketplace", label: "Find Tradespeople" },
  { href: "/services/agents", label: "Estate Agents" },
  { href: "/services/mortgage", label: "Mortgage Brokers" },
  { href: "/valuation", label: "Valuations" },
] as const;

const COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/careers", label: "Careers" },
  { href: "/press", label: "Press" },
  { href: "/contact", label: "Contact" },
  { href: "/blog", label: "Blog" },
  { href: "/help", label: "Help" },
] as const;

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/cookies", label: "Cookies" },
  { href: "/accessibility", label: "Accessibility" },
  { href: "/complaints", label: "Complaints" },
] as const;

const SOCIAL_LINKS = [
  { href: "https://twitter.com/britestate", label: "X (Twitter)", Icon: Twitter },
  { href: "https://linkedin.com/company/britestate", label: "LinkedIn", Icon: Linkedin },
  { href: "https://instagram.com/britestate", label: "Instagram", Icon: Instagram },
  { href: "https://facebook.com/britestate", label: "Facebook", Icon: Facebook },
] as const;

type FooterLinkGroup = Readonly<{
  title: string;
  links: ReadonlyArray<{ readonly href: string; readonly label: string }>;
}>;

function FooterLinkColumn({ title, links }: FooterLinkGroup) {
  return (
    <div>
      <h4 className="mb-5 text-xs font-semibold uppercase tracking-widest text-white">
        {title}
      </h4>
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-neutral-400 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-neutral-900 pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main grid — 5 columns desktop */}
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8 mb-12">
          {/* Col 1: Brand */}
          <div className="lg:col-span-1 flex flex-col gap-5">
            <Logo size="md" />
            <p className="text-sm leading-relaxed text-neutral-400">
              The smarter way to find your home.
            </p>
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ href, label, Icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex size-9 items-center justify-center rounded-full bg-neutral-800 text-neutral-400 transition-colors hover:bg-brand-primary hover:text-white"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2: Properties */}
          <FooterLinkColumn title="Properties" links={PROPERTIES_LINKS} />

          {/* Col 3: Services */}
          <FooterLinkColumn title="Services" links={SERVICES_LINKS} />

          {/* Col 4: Company */}
          <FooterLinkColumn title="Company" links={COMPANY_LINKS} />

          {/* Col 5: Legal */}
          <FooterLinkColumn title="Legal" links={LEGAL_LINKS} />
        </div>

        {/* Divider */}
        <div className="border-t border-neutral-800 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-neutral-400">
              &copy; 2026 Britestate Ltd. All rights reserved.
              <span className="ml-4 text-neutral-600">Company No. 12345678</span>
            </p>
            <button
              type="button"
              className="flex items-center gap-2 text-sm font-medium text-neutral-400 transition-colors hover:text-white"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
            >
              Back to top
              <span className="flex size-7 items-center justify-center rounded-full bg-neutral-800">
                <ChevronUp className="size-4" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
