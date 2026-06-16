import type { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";
import { fetchNearbySchools } from "@/services/properties/ofsted-service";
import { getAreaCrime } from "@/services/properties/crime-service";
import { getNearbyTransport } from "@/services/properties/transport-service";
import { getBroadbandCoverage } from "@/services/properties/broadband-service";
import { getFloodRisk } from "@/services/properties/flood-service";
import { SchoolCatchmentWidget } from "./SchoolCatchmentWidget";
import { CrimeStatsChart } from "./CrimeStatsChart";
import { TransportWidget } from "./TransportWidget";
import { BroadbandWidget } from "./BroadbandWidget";
import { FloodRiskWidget } from "./FloodRiskWidget";

type LocalAreaSectionProps = Readonly<{
  lat: number;
  lng: number;
  postcode: string;
}>;

function SourceNote({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-[11px] text-muted-foreground">{children}</p>;
}

/**
 * Server component. Fetches local-area layers for a property's coordinates and
 * renders ONLY the widgets that have real data, each with a visible source
 * label. The whole section is omitted when no layer has data — graceful
 * absence, per the no-empty-widgets rule. Each layer degrades independently.
 *
 * Currently wired: nearest schools (GIAS/Ofsted), crime (data.police.uk),
 * transport stations (NaPTAN/DfT), broadband availability (Ofcom) and flood
 * risk (Environment Agency NaFRA2).
 */
export async function LocalAreaSection({
  lat,
  lng,
  postcode,
}: LocalAreaSectionProps) {
  const [schools, crime, transport, broadband, flood] = await Promise.all([
    fetchNearbySchools(lat, lng).catch(() => null),
    getAreaCrime(lat, lng).catch(() => null),
    getNearbyTransport(lat, lng).catch(() => null),
    getBroadbandCoverage(postcode).catch(() => null),
    getFloodRisk(lat, lng).catch(() => null),
  ]);

  const hasSchools = !!schools && schools.length > 0;
  const hasCrime = !!crime && crime.stats.length > 0;
  const hasTransport = !!transport && transport.length > 0;
  const hasBroadband =
    !!broadband &&
    (broadband.superfastPct != null ||
      broadband.ultrafastPct != null ||
      broadband.gigabitPct != null);
  const hasFlood = !!flood;
  if (!hasSchools && !hasCrime && !hasTransport && !hasBroadband && !hasFlood)
    return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">Local area</h2>
      <Separator className="mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {hasSchools && (
          <div>
            <SchoolCatchmentWidget schools={schools} />
            <SourceNote>
              Source: GIAS / Ofsted (Open Government Licence v3.0)
            </SourceNote>
          </div>
        )}
        {hasCrime && crime && (
          <div>
            <CrimeStatsChart stats={crime.stats} boroughAvg={crime.boroughAvg} />
            <SourceNote>
              Source: data.police.uk · {crime.month} (Open Government Licence
              v3.0)
            </SourceNote>
          </div>
        )}
        {hasTransport && (
          <div>
            <TransportWidget nearbyStations={transport} />
            <SourceNote>
              Source: NaPTAN / DfT (Open Government Licence v3.0)
            </SourceNote>
          </div>
        )}
        {hasBroadband && broadband && (
          <div>
            <BroadbandWidget
              superfastPct={broadband.superfastPct}
              ultrafastPct={broadband.ultrafastPct}
              gigabitPct={broadband.gigabitPct}
              belowUsoPct={broadband.belowUsoPct}
            />
            <SourceNote>
              Source: Ofcom Connected Nations 2025 (Open Government Licence
              v3.0)
            </SourceNote>
          </div>
        )}
        {hasFlood && flood && (
          <div>
            <FloodRiskWidget riskLevel={flood.riskLevel} />
            <SourceNote>
              Source: Environment Agency · Risk of Flooding from Rivers and Sea
              (Open Government Licence v3.0)
            </SourceNote>
          </div>
        )}
      </div>
    </section>
  );
}
