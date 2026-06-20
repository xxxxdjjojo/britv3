/**
 * RenovationROIPanel
 *
 * Server component. Fetches ROI estimates for a property and renders
 * a list of RenovationScenarioCard components with a disclaimer.
 *
 * Renders a graceful "temporarily unavailable" state when the service
 * returns null (empty benchmarks — no crash, no NaN values).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Property } from "@/types/property";
import { estimateROI } from "@/services/properties/roi-estimation-service";
import {
  assessPermittedDevelopment,
  roiTypeToPdScenario,
} from "@/lib/properties/permitted-development-rules";
import { RenovationScenarioCard } from "./RenovationScenarioCard";
import { ROIConfidenceDisclosure } from "./ROIConfidenceDisclosure";

type Props = Readonly<{
  property: Property;
  supabase: SupabaseClient;
}>;

export async function RenovationROIPanel({ property, supabase }: Props) {
  const estimate = await estimateROI(property, supabase);

  const pd = assessPermittedDevelopment(property.property_type);
  const feasibilityFor = (roiType: string) => {
    const scenario = roiTypeToPdScenario(roiType);
    if (!scenario) return undefined;
    return pd.scenarios.find((s) => s.scenario === scenario)?.feasibility;
  };

  return (
    <section aria-labelledby="roi-heading" className="space-y-4">
      <h2
        id="roi-heading"
        className="font-semibold text-xl text-[#1B4D3E]"
        style={{ fontFamily: "var(--font-plus-jakarta-sans, 'Plus Jakarta Sans', sans-serif)" }}
      >
        Renovation ROI Estimates
      </h2>

      {estimate === null ? (
        /* Graceful unavailable state — not an error */
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-6 text-center">
          <p className="text-sm text-gray-500">
            ROI data temporarily unavailable for this property.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Estimates are generated using Land Registry data. Please check back later.
          </p>
        </div>
      ) : (
        <>
          {estimate.source === "fallback" && estimate.fallback_reason && (
            <p className="text-xs text-gray-400 italic">
              Showing benchmark estimates (AI analysis unavailable).
            </p>
          )}

          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="list">
            {estimate.renovations.map((renovation) => (
              <li key={renovation.type}>
                <RenovationScenarioCard
                  renovation={renovation}
                  feasibility={feasibilityFor(renovation.type)}
                />
              </li>
            ))}
          </ul>

          <ROIConfidenceDisclosure />
        </>
      )}
    </section>
  );
}
