import type { ReactNode } from "react";

import { MethodologyFooter } from "@/components/trust/MethodologyFooter";
import { ShareBar } from "@/components/trust/ShareBar";

/**
 * Editorial shell for a data report edition. Owns the hero (eyebrow, h1,
 * strapline, optional headline stat), then the report blocks passed as
 * children, then the Phase-1 trust kit (share row + sources/caveats footer).
 * Reports are editorial surfaces, not tools, so the header is styled locally
 * rather than via CalculatorPageHeader. Server-safe.
 */
export function ReportShell({
  eyebrow,
  title,
  strapline,
  heroStat,
  children,
  methodology,
  shareTitle,
  shareToolKey,
}: Readonly<{
  eyebrow: string;
  title: string;
  strapline?: string;
  heroStat?: { label: string; value: string; caption?: string };
  children: ReactNode;
  methodology: {
    sources: ReadonlyArray<{ label: string; url: string }>;
    caveats: ReadonlyArray<string>;
    methodologyHref: string;
  };
  shareTitle: string;
  shareToolKey: string;
}>) {
  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-14">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-primary">
          {eyebrow}
        </p>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
          {title}
        </h1>
        {strapline && (
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-neutral-600">
            {strapline}
          </p>
        )}
        {heroStat && (
          <div className="mt-10 rounded-2xl border border-brand-primary/20 bg-brand-primary-lighter p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
              {heroStat.label}
            </p>
            <p className="mt-2 font-heading text-5xl font-extrabold tracking-tight text-brand-primary-dark sm:text-6xl">
              {heroStat.value}
            </p>
            {heroStat.caption && (
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                {heroStat.caption}
              </p>
            )}
          </div>
        )}
      </header>

      <div className="space-y-14">{children}</div>

      <div className="mt-16 space-y-8 border-t border-border pt-10">
        <ShareBar title={shareTitle} toolKey={shareToolKey} />
        <MethodologyFooter
          sources={methodology.sources}
          caveats={methodology.caveats}
          methodologyHref={methodology.methodologyHref}
        />
      </div>
    </article>
  );
}
