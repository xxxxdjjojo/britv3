import type { SellerOffer } from "@/types/seller";

type Props = Readonly<{ offers: SellerOffer[] }>;

export function OfferCompareTable({ offers }: Props) {
  const displayed = offers.slice(0, 3);
  const asking = (displayed[0]?.listing as any)?.asking_price ?? null;

  const rows = [
    { label: "Offer Amount", getValue: (o: SellerOffer) => `£${(o.amount / 100).toLocaleString("en-GB")}` },
    { label: "vs Asking", getValue: (o: SellerOffer) => asking ? `${((o.amount - asking) / asking * 100).toFixed(1)}%` : "—" },
    { label: "Buyer", getValue: (o: SellerOffer) => o.buyer_name },
    { label: "Buyer Type", getValue: (o: SellerOffer) => o.buyer_type ?? "—" },
    { label: "Chain Status", getValue: (o: SellerOffer) => o.chain_status?.replace("_", " ") ?? "—" },
    { label: "Chain Length", getValue: (o: SellerOffer) => o.chain_status === "in_chain" ? String(o.chain_length ?? "?") : "N/A" },
    { label: "Verified", getValue: (o: SellerOffer) => o.is_verified ? "Yes" : "No" },
    { label: "Submitted", getValue: (o: SellerOffer) => new Date(o.offered_at).toLocaleDateString("en-GB") },
    { label: "Status", getValue: (o: SellerOffer) => o.status },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left text-xs font-semibold text-slate-500 px-6 py-4 w-40">Detail</th>
            {displayed.map((offer) => (
              <th key={offer.id} className="text-left text-sm font-bold text-slate-900 px-6 py-4">{offer.buyer_name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ label, getValue }) => (
            <tr key={label} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
              <td className="text-xs font-semibold text-slate-500 px-6 py-3">{label}</td>
              {displayed.map((offer) => (
                <td key={offer.id} className="text-sm text-slate-700 px-6 py-3 capitalize">{getValue(offer)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
