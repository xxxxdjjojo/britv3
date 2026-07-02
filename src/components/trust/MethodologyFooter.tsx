import Link from "next/link";

/**
 * Sources + known-caveats footer for data-backed tools and reports. The
 * caveats are rendered prominently — being upfront about limitations is the
 * credibility play. Server-safe.
 */
export function MethodologyFooter({
  sources,
  caveats,
  methodologyHref,
}: Readonly<{
  sources: ReadonlyArray<{ label: string; url: string }>;
  caveats: ReadonlyArray<string>;
  methodologyHref?: string;
}>) {
  return (
    <footer className="space-y-4 rounded-lg border border-border bg-muted p-4 text-sm">
      <section aria-label="Sources">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Sources
        </h3>
        <ul className="space-y-1">
          {sources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary underline underline-offset-2 hover:text-brand-primary-dark"
              >
                {source.label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Known caveats">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground">
          Known caveats
        </h3>
        <ul className="list-disc space-y-1 pl-5 text-foreground">
          {caveats.map((caveat) => (
            <li key={caveat}>{caveat}</li>
          ))}
        </ul>
      </section>

      {methodologyHref && (
        <Link
          href={methodologyHref}
          className="inline-block font-medium text-brand-primary underline underline-offset-2 hover:text-brand-primary-dark"
        >
          Read the full methodology
        </Link>
      )}
    </footer>
  );
}
