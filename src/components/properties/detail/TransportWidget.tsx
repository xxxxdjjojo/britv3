import { Train, Circle, Bus, Cable, Ship } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TransportStop = {
  name: string;
  type: "rail" | "tube" | "bus" | "tram" | "ferry";
  distance_miles: number;
  lines?: string[];
};

type TransportWidgetProps = Readonly<{
  nearbyStations?: TransportStop[] | null;
}>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StopIcon({ type }: { type: TransportStop["type"] }) {
  switch (type) {
    case "rail":
      return <Train className="size-4 shrink-0 text-muted-foreground" />;
    case "tube":
      return <Circle className="size-4 shrink-0 text-muted-foreground" />;
    case "bus":
      return <Bus className="size-4 shrink-0 text-muted-foreground" />;
    case "tram":
      return <Cable className="size-4 shrink-0 text-muted-foreground" />;
    case "ferry":
      return <Ship className="size-4 shrink-0 text-muted-foreground" />;
  }
}

function typeLabel(type: TransportStop["type"]): string {
  switch (type) {
    case "rail":
      return "Rail";
    case "tube":
      return "Tube";
    case "bus":
      return "Bus";
    case "tram":
      return "Tram";
    case "ferry":
      return "Ferry";
  }
}

function formatDistance(miles: number): string {
  if (miles < 0.1) return "< 0.1 mi";
  return `${miles.toFixed(1)} mi`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Displays nearby transport stops/stations for a property.
 * Server Component — purely presentational, driven by the `nearbyStations` prop.
 */
export function TransportWidget({ nearbyStations }: TransportWidgetProps) {
  // Graceful absence: render nothing when there is no data to show.
  if (!nearbyStations || nearbyStations.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Train className="size-4" /> Transport
      </h3>
      <ul className="space-y-3">
        {nearbyStations.map((stop, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <StopIcon type={stop.type} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate">{stop.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDistance(stop.distance_miles)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-xs text-muted-foreground">
                  {typeLabel(stop.type)}
                </span>
                {stop.lines && stop.lines.length > 0 && (
                  <>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      {stop.lines.join(", ")}
                    </span>
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
