"use client";

import Link from "next/link";
import type { NavSection } from "@/config/navigation";

type MegaMenuItemProps = Readonly<{
  section: NavSection;
  onLinkClick?: () => void;
}>;

export function MegaMenuItem({ section, onLinkClick }: MegaMenuItemProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
        {section.heading}
      </h3>
      <ul className="space-y-1">
        {section.links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onLinkClick}
              className="block rounded-md px-2 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-brand-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
