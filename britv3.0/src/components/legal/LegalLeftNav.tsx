"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
};

type NavCategory = {
  heading: string;
  items: NavItem[];
};

const NAV_CATEGORIES: NavCategory[] = [
  {
    heading: "User Agreements",
    items: [
      { href: "/legal/terms", label: "Terms of Service" },
      { href: "/legal/acceptable-use", label: "Acceptable Use Policy" },
    ],
  },
  {
    heading: "Privacy & Data Protection",
    items: [
      { href: "/legal/privacy", label: "Privacy Policy" },
      { href: "/legal/cookies", label: "Cookie Policy" },
      { href: "/legal/gdpr-rights", label: "GDPR Data Subject Rights" },
      { href: "/legal/data-processing", label: "Data Processing Agreement" },
    ],
  },
  {
    heading: "Compliance",
    items: [
      { href: "/legal/aml-policy", label: "AML Policy" },
      { href: "/legal/modern-slavery", label: "Modern Slavery Statement" },
    ],
  },
  {
    heading: "Platform",
    items: [
      { href: "/legal/accessibility", label: "Accessibility Statement" },
      { href: "/legal/complaints", label: "Complaints Procedure" },
      { href: "/legal/disclaimer", label: "Disclaimer" },
    ],
  },
];

const ALL_ITEMS: NavItem[] = NAV_CATEGORIES.flatMap((cat) => cat.items);

export default function LegalLeftNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: vertical categorised nav */}
      <nav className="hidden lg:block" aria-label="Legal pages navigation">
        <ul className="space-y-6">
          {NAV_CATEGORIES.map((category) => (
            <li key={category.heading}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">
                {category.heading}
              </p>
              <ul className="space-y-0.5">
                {category.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={
                          isActive
                            ? "block rounded-md px-3 py-1.5 text-sm font-medium bg-primary/10 text-primary"
                            : "block rounded-md px-3 py-1.5 text-sm text-neutral-600 hover:text-primary hover:bg-neutral-50 transition-colors"
                        }
                        aria-current={isActive ? "page" : undefined}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile: horizontal scrollable pill row */}
      <nav
        className="lg:hidden"
        aria-label="Legal pages navigation"
      >
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {ALL_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActive
                    ? "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium bg-primary text-white"
                    : "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
                }
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
