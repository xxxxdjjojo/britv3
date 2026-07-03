import type { ReactNode } from "react";

import { embargoSecret, verifyEmbargoToken } from "@/lib/reports/embargo-token";

/**
 * Publication gate for a report edition. Renders children when the edition is
 * published, or when a valid embargo preview token (signed for this exact
 * report + edition) is supplied — in which case a visible "do not share"
 * banner sits above the content. Otherwise renders a quiet holding panel that
 * leaks nothing about the unpublished data. Server Component: the signing
 * secret is only ever read server-side.
 */
export function EmbargoGate({
  published,
  reportKey,
  edition,
  previewToken,
  children,
}: Readonly<{
  published: boolean;
  reportKey: string;
  edition: string;
  previewToken?: string;
  children: ReactNode;
}>) {
  if (published) {
    return <>{children}</>;
  }

  const verified = previewToken
    ? verifyEmbargoToken(previewToken, embargoSecret())
    : null;
  const isValidPreview =
    verified !== null &&
    verified.reportKey === reportKey &&
    verified.edition === edition;

  if (!isValidPreview) {
    return (
      <section
        role="status"
        aria-label="Edition not yet published"
        className="rounded-2xl border border-border bg-muted p-10 text-center"
      >
        <h2 className="font-heading text-xl font-bold text-neutral-900">
          This edition is not yet published.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          Check back once the edition goes live.
        </p>
      </section>
    );
  }

  return (
    <div>
      <p
        role="note"
        className="mb-8 rounded-lg border border-border bg-muted px-4 py-3 text-sm font-semibold text-foreground"
      >
        Embargoed preview — do not share
      </p>
      {children}
    </div>
  );
}
