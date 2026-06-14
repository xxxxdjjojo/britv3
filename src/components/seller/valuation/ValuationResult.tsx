
import type { LandRegistryComparable } from "@/types/seller";

type Props = Readonly<{
  postcode: string;
  aiEstimate: number;
  estimateLow: number;
  estimateHigh: number;
  confidence: number;
  basedOn: number;
  comparables: LandRegistryComparable[];
}>;

function poundStr(pence: number): string {
  return `£${(pence / 100).toLocaleString("en-GB")}`;
}

export function ValuationResult({
  postcode, aiEstimate, estimateLow, estimateHigh, confidence, basedOn, comparables,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-brand-primary rounded-2xl p-8 text-white">
        <p className="text-white/60 text-sm font-medium">Estimated Value for {postcode}</p>
        <p className="text-5xl font-extrabold mt-2 font-['Plus_Jakarta_Sans']">
          {poundStr(aiEstimate)}
        </p>
        <p className="text-white/70 text-sm mt-1">
          Range: {poundStr(estimateLow)} — {poundStr(estimateHigh)}
        </p>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-white/60 mb-2">
            <span>Confidence</span>
            <span className="font-semibold text-white">{confidence}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${confidence}%` }}
            />
          </div>
          <p className="text-white/50 text-xs mt-2">
            Based on {basedOn} comparable sale{basedOn !== 1 ? "s" : ""} in the area
          </p>
        </div>
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
