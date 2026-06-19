import Link from "next/link";
import { Twitter, Linkedin, Instagram, Facebook } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { FOOTER_LINKS, footerLinkClasses } from "@/config/navigation";
import type { FooterColumn } from "@/config/navigation";
import { CookiePreferencesButton } from "@/components/layout/CookiePreferencesButton";
import { BackToTopButton } from "@/components/layout/BackToTopButton";
import { brandConfig } from "@/config/brand";

// ---------------------------------------------------------------------------
// Social icon mapping
// ---------------------------------------------------------------------------

const SOCIAL_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Twitter,
  LinkedIn: Linkedin,
  Instagram,
  Facebook,
};

// ---------------------------------------------------------------------------
// FooterLinkColumn — renders a single column of links
// ---------------------------------------------------------------------------

function FooterLinkColumn({ column }: Readonly<{ column: FooterColumn }>) {
  const isLegal = column.heading === "Legal";
  const linkStyles = footerLinkClasses();

  return (
    <div>
      <h4 className="mb-5 text-xs font-semibold uppercase tracking-widest text-white">
        {column.heading}
      </h4>
      <ul className="flex flex-col gap-3">
        {column.links?.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={linkStyles}>
              {link.label}
            </Link>
          </li>
        ))}
        {isLegal && (
          <li>
            <CookiePreferencesButton />
          </li>
        )}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BrandColumn — Logo, tagline, social links
// ---------------------------------------------------------------------------

function BrandColumn({ column }: Readonly<{ column: FooterColumn }>) {
  return (
    <div className="flex flex-col gap-5">
      <Logo size="md" />
      {column.tagline && (
        <p className="text-sm leading-relaxed text-neutral-400">
          {column.tagline}
        </p>
      )}
      {column.socialLinks && (
        <div className="flex items-center gap-3">
          {column.socialLinks.map(({ href, label }) => {
            const Icon = SOCIAL_ICON_MAP[label];
            return (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex size-9 items-center justify-center rounded-full bg-neutral-800 text-neutral-400 transition-colors hover:bg-brand-primary hover:text-white"
              >
                {Icon && <Icon className="size-4" />}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Footer — Server Component (no "use client")
// ---------------------------------------------------------------------------

export function Footer() {
  const brandColumn = FOOTER_LINKS[0];
  const linkColumns = FOOTER_LINKS.slice(1);

  return (
    <footer className="bg-neutral-900 pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main grid — 7 columns desktop */}
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-7 lg:gap-8 mb-12">
          {/* Col 1: Brand */}
          <BrandColumn column={brandColumn} />

          {/* Cols 2-7: Link columns */}
          {linkColumns.map((column) => (
            <FooterLinkColumn key={column.heading} column={column} />
          ))}
        </div>

        {/* Divider + copyright */}
        <div className="border-t border-neutral-800 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-neutral-400">
              &copy; 2026 {brandConfig.displayName}. All rights reserved.
              <span className="ml-4 text-neutral-600">Company No. 12345678</span>
            </p>
            <BackToTopButton />
          </div>
        </div>
      </div>
    </footer>
  );
}
