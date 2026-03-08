import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

const FOOTER_SECTIONS = [
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/careers", label: "Careers" },
      { href: "/press", label: "Press" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/help", label: "Help Centre" },
      { href: "/contact", label: "Contact Us" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/cookies", label: "Cookie Policy" },
      { href: "/gdpr", label: "GDPR" },
    ],
  },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Top section */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Logo size="sm" />
            <p className="mt-3 text-sm leading-relaxed text-neutral-500">
              The all-in-one UK property portal. Search, compare, and transact
              with confidence.
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="font-heading text-sm font-semibold text-neutral-900">
                {section.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-neutral-500 transition-colors hover:text-brand-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-neutral-200 pt-6">
          <p className="text-center text-xs text-neutral-400">
            &copy; {year} Britestate Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
