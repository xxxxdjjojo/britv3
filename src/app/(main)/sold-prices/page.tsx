import { permanentRedirect } from "next/navigation";

// The former neighbourhood "sold prices" pages presented fabricated figures
// (vs-asking, beds, growth, 10-year trends) that HM Land Registry does not
// supply. The honest, real replacement is the postcode-first /area-prices tool,
// which reads genuine flat/house median sold prices from Land Registry data.
export default function SoldPricesIndexPage() {
  permanentRedirect("/area-prices");
}
