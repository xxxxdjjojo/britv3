
import type { LandRegistryComparable } from "@/types/seller";
import {
  POUNDS_TO_PENCE,
  type SoldPriceEvidence,
} from "@/lib/seller/sold-price-comparables";

type Props = Readonly<{
  postcode: string;
  estimate: number;
  rangeLow: number;
  rangeHigh: number;
  evidence: SoldPriceEvidence;
  basedOn: number;
  comparables: LandRegistryComparable[];
}>;

const EVIDENCE_LABEL: Record<SoldPriceEvidence, string> = {
  unavailable: "No nearby sales",
  low: "Few nearby sales",
  medium: "Some nearby sales",
  high: "Many nearby sales",
};

function poundStr(pence: number): string {
  return `£${(pence / POUNDS_TO_PENCE).toLocaleString("en-GB")}`;
}

export function ValuationResult({
  postcode, estimate, rangeLow, rangeHigh, evidence, basedOn, comparables,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-brand-primary rounded-2xl p-8 text-white">
        <p className="text-white/60 text-sm font-medium">Average recent sold price near {postcode}</p>
        <p className="text-5xl font-extrabold mt-2 font-['Plus_Jakarta_Sans']">
          {poundStr(estimate)}
        </p>
        <p className="text-white/70 text-sm mt-1">
          Recent sales ranged {poundStr(rangeLow)} — {poundStr(rangeHigh)}
        </p>

        <div className="mt-6 flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
            {EVIDENCE_LABEL[evidence]}
          </span>
          <span className="text-white/60 text-xs">
            Based on {basedOn} sale{basedOn !== 1 ? "s" : ""} nearby
          </span>
        </div>

        <p className="text-white/50 text-xs mt-4 leading-relaxed">
          This is an average of nearby sold prices, not a valuation of any specific property.
          Actual values depend on size, condition, and exact location.
        </p>
      </div>

      {comparables.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 font-['Plus_Jakarta_Sans']">Recent Sales Nearby</h3>
            <p className="text-xs text-slate-400 mt-0.5">Land Registry data (free public data)</p>
          </div>
          <ul className="divide-y divide-slate-50">
            {comparables.map((comp, i) => (
              <li key={i} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">{comp.address || "Address withheld"}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {comp.property_type} · {comp.tenure} · {new Date(comp.sale_date).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                  </p>
                </div>
                <p className="text-sm font-bold text-slate-900 flex-shrink-0 ml-4">
                  {poundStr(comp.price)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {comparables.length === 0 && (
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <p className="text-sm text-amber-800 font-medium">No recent sales found</p>
          <p className="text-xs text-amber-700 mt-1">
            The Land Registry database may not have recent sales for this postcode area. Try a nearby postcode.
          </p>
        </div>
      )}
    </div>
  );
}
