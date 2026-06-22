import { permanentRedirect } from "next/navigation";

// Per-area sold-price pages were 100% fabricated (mock addresses, vs-asking,
// beds, a hardcoded 10-year trend, "market temperature") presented under a
// false "HM Land Registry" attribution. Redirect to the real postcode-first
// sold-price tool, which shows genuine Land Registry medians for any area.
export default function SoldPricesAreaPage() {
  permanentRedirect("/area-prices");
}
