import { SourcedFigure } from "@/components/trust/SourcedFigure";

/**
 * Grid of labelled headline stats for a report block. Figures with a `source`
 * render their inline superscript citation via SourcedFigure. Server-safe.
 */
export function ReportStatRow({
  stats,
}: Readonly<{
  stats: ReadonlyArray<{
    label: string;
    value: string;
    caption?: string;
    source?: { label: string; url: string };
  }>;
}>) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border bg-surface p-5"
        >
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {stat.label}
          </dt>
          <dd className="mt-2 font-heading text-2xl font-bold text-neutral-900">
            {stat.source ? (
              <SourcedFigure value={stat.value} source={stat.source} />
            ) : (
              stat.value
            )}
          </dd>
          {stat.caption && (
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">
              {stat.caption}
            </p>
          )}
        </div>
      ))}
    </dl>
  );
}
