import Link from "next/link";

/**
 * Small pill navigation between the published editions of a report
 * (e.g. quarterly releases). The current edition is highlighted and marked
 * with aria-current. Server-safe.
 */
export function EditionSwitcher({
  editions,
}: Readonly<{
  editions: ReadonlyArray<{
    id: string;
    label: string;
    href: string;
    current: boolean;
  }>;
}>) {
  return (
    <nav aria-label="Report editions">
      <ul className="flex flex-wrap items-center gap-2">
        {editions.map((edition) => (
          <li key={edition.id}>
            <Link
              href={edition.href}
              aria-current={edition.current ? "page" : undefined}
              className={
                edition.current
                  ? "inline-flex items-center rounded-full bg-brand-primary px-4 py-1.5 text-sm font-semibold text-white"
                  : "inline-flex items-center rounded-full border border-border px-4 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:border-brand-primary hover:text-brand-primary"
              }
            >
              {edition.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
