type DataAttributionProps = Readonly<{ source: string; lastUpdated?: string; methodology?: string; className?: string }>;

export function DataAttribution({ source, lastUpdated, methodology, className = "" }: DataAttributionProps) {
  return (
    <p className={`text-[11px] text-neutral-400 italic ${className}`}>
      Source: {source}
      {lastUpdated && <> &middot; Last updated: {lastUpdated}</>}
      {methodology && <> &middot; {methodology}</>}
    </p>
  );
}
