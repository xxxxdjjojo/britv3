import { fetchEpcByAddress, fetchEpcByPostcode } from "@/services/properties/epc-service";
import { EPCDisplay } from "@/components/properties/detail/EPCDisplay";
import type { EpcRating as PropertyEpcRating } from "@/types/property";
import type { EpcRating as ServiceEpcRating } from "@/services/properties/epc-service";

/** Map the service's rating union (which includes "Unknown") to the band-bar's A–G | null. */
function toBandRating(rating: ServiceEpcRating): PropertyEpcRating | null {
  return rating === "Unknown" ? null : rating;
}

type Props = Readonly<{
  postcode: string;
  /** Optional address line to disambiguate when a postcode has multiple EPCs. */
  addressLine?: string;
}>;

/**
 * Async server component that looks up the live EPC from the gov.uk register
 * and renders it via the existing {@link EPCDisplay} band bar. Used as a
 * fallback when a property has no stored EPC rating. Render inside a Suspense
 * boundary.
 */
export async function EpcLookupCard({ postcode, addressLine }: Props) {
  const cert = addressLine
    ? await fetchEpcByAddress(postcode, addressLine)
    : (await fetchEpcByPostcode(postcode))?.[0] ?? null;

  if (!cert) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          No EPC found on the national register for this postcode.{" "}
          <a
            href={`https://find-energy-certificate.service.gov.uk/find-a-certificate/search-by-postcode?postcode=${encodeURIComponent(postcode)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-primary hover:underline"
          >
            Search the register ↗
          </a>
        </p>
      </div>
    );
  }

  return (
    <EPCDisplay
      currentRating={toBandRating(cert.current_rating)}
      currentScore={cert.current_efficiency}
      potentialRating={toBandRating(cert.potential_rating)}
      potentialScore={cert.potential_efficiency}
    />
  );
}
