/**
 * PermittedDevelopmentSummary
 *
 * Server component. Indicative "what you could build" block scoped to the
 * property type. Self-gating: shows the scenario list for house types and a
 * short not-applicable message for flats/maisonettes/land/other. Always
 * renders the standard caveat. Not legal advice.
 */

import {
  assessPermittedDevelopment,
  PD_CAVEAT,
} from "@/lib/properties/permitted-development-rules";
import { FeasibilityBadge } from "@/components/properties/roi/FeasibilityBadge";

type Props = Readonly<{
  propertyType: string;
}>;

export function PermittedDevelopmentSummary({ propertyType }: Props) {
  const pd = assessPermittedDevelopment(propertyType);

  return (
    <section aria-labelledby="pd-heading" className="space-y-4">
      <h2
        id="pd-heading"
        className="font-semibold text-xl text-[#1B4D3E]"
        style={{ fontFamily: "var(--font-plus-jakarta-sans, 'Plus Jakarta Sans', sans-serif)" }}
      >
        What you could build
      </h2>

      <p className="text-sm text-gray-600">{pd.headline}</p>

      {pd.applicable && (
        <ul className="space-y-3" role="list">
          {pd.scenarios.map((s) => (
            <li
              key={s.scenario}
              className="flex flex-col gap-1.5 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:gap-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-[#1B4D3E] text-sm">{s.label}</p>
                <p className="text-xs text-gray-500">{s.note}</p>
              </div>
              <FeasibilityBadge feasibility={s.feasibility} />
            </li>
          ))}
        </ul>
      )}

      <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
        {PD_CAVEAT}
      </p>
    </section>
  );
}
