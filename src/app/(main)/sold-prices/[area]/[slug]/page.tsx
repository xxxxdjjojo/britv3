import { permanentRedirect } from "next/navigation";

// Per-property sold-price pages were fabricated: a "TrueDeed estimate", a
// "market performance" growth figure, an invented price history and "nearby"
// table, all under a false "HM Land Registry" attribution. Land Registry has
// no per-property estimate, growth or asking price. Redirect to the real
// postcode-first sold-price tool.
export default function SoldPricesPropertyPage() {
  permanentRedirect("/area-prices");
}
