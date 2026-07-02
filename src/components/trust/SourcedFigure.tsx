export type FigureSource = { url: string; label: string };

/**
 * A figure with an inline superscript citation link. The source is required:
 * no figure ships without attribution. Server-safe.
 */
export function SourcedFigure({
  value,
  source,
  className,
}: Readonly<{
  value: React.ReactNode;
  source: { url: string; label: string };
  className?: string;
}>) {
  return (
    <span className={className}>
      {value}
      <sup className="ml-0.5">
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[0.7em] font-medium text-brand-primary underline underline-offset-1 hover:text-brand-primary-dark"
        >
          {source.label}
        </a>
      </sup>
    </span>
  );
}
