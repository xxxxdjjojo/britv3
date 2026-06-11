import { fetchNearbyPlanningApplications } from "@/services/properties/planit-service";
import type {
  PlanningApplication,
  PlanningStatus,
} from "@/services/properties/planit-service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SEARCH_RADIUS_KM = 0.5;

function statusBadgeClass(status: PlanningStatus): string {
  switch (status) {
    case "Permitted":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "Conditions":
      return "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400";
    case "Undecided":
    case "Referred":
    case "Unresolved":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    case "Rejected":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    case "Withdrawn":
    case "Other":
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800/60 dark:text-gray-300";
  }
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDistance(km: number | null): string | null {
  if (km == null || Number.isNaN(km)) return null;
  if (km < 0.1) return "< 0.1 km";
  return `${km.toFixed(1)} km`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PlanningDisclaimer() {
  return (
    <p className="text-xs text-muted-foreground leading-relaxed">
      Planning data is aggregated from local council websites via PlanIt.
      Coverage and freshness vary by council, and records may be incomplete or
      delayed. Always verify with the local planning authority before relying
      on this information.
    </p>
  );
}

function PlanningApplicationRow({
  app,
}: Readonly<{ app: PlanningApplication }>) {
  const startDate = formatDate(app.start_date);
  const decidedDate = formatDate(app.decided_date);
  const distance = formatDistance(app.distance_km);

  return (
    <li className="group p-4 transition-colors hover:bg-muted/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-snug">{app.description}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{app.address}</p>
        </div>
        <span
          className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(app.status)}`}
        >
          {app.status}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="font-mono">{app.reference}</span>
        {app.app_type && (
          <>
            <span aria-hidden="true">·</span>
            <span>{app.app_type}</span>
          </>
        )}
        {startDate && (
          <>
            <span aria-hidden="true">·</span>
            <span>Received {startDate}</span>
          </>
        )}
        {decidedDate && (
          <>
            <span aria-hidden="true">·</span>
            <span>Decided {decidedDate}</span>
          </>
        )}
        {distance && (
          <>
            <span aria-hidden="true">·</span>
            <span>{distance} away</span>
          </>
        )}
      </div>
      <a
        href={app.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline"
      >
        View on council site <span aria-hidden="true">→</span>
      </a>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export async function PlanningApplicationsSection({
  lat,
  lng,
}: Readonly<{ lat: number; lng: number }>) {
  const applications = await fetchNearbyPlanningApplications(lat, lng);

  if (applications === null) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          Planning application data is currently unavailable.
        </div>
        <PlanningDisclaimer />
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          No planning applications found within {SEARCH_RADIUS_KM} km.
        </div>
        <PlanningDisclaimer />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="divide-y rounded-xl border bg-card">
        {applications.map((app) => (
          <PlanningApplicationRow key={`${app.reference}-${app.url}`} app={app} />
        ))}
      </ul>
      <PlanningDisclaimer />
    </div>
  );
}

export function PlanningApplicationsSectionSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((n) => (
        <div key={n} className="h-24 rounded-xl bg-muted animate-pulse" />
      ))}
      <div className="h-8 rounded-lg bg-muted animate-pulse" />
    </div>
  );
}
