import { Separator } from "@/components/ui/separator";
import { RentalLettingDetails } from "@/components/properties/detail/RentalLettingDetails";
import { TenancyDepositExplainer } from "@/components/properties/detail/TenancyDepositExplainer";
import { RentMoveInCost } from "@/components/properties/detail/RentMoveInCost";
import { rentIncomeRequired } from "@/lib/properties/financial-snapshot";
import type { PropertyView } from "@/lib/properties/build-property-view";

const gbp = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;

/**
 * Block 04 (rent) — Tenancy & cost. The renter's "can I afford to move in?"
 * answer, surfaced high on the page: move-in cost breakdown, deposit cap +
 * scheme protection, and the full letting terms (furnishing, tenancy length,
 * pets, students, bills). Replaces the buy page's mortgage / SDLT / value
 * stack.
 */
export function TenancyCostBlock({ view }: { view: PropertyView }) {
  const { detail, monthlyRent } = view;
  const { listing, property } = detail;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">Tenancy &amp; cost</h2>
      <Separator className="mb-4" />
      <div className="space-y-6">
        <RentMoveInCost
          monthlyRent={monthlyRent}
          depositAmount={listing.depositAmount}
          holdingDepositAmount={listing.holdingDepositAmount}
          beds={property.bedrooms}
        />

        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">
            Estimated income required
          </p>
          <p className="mt-0.5 text-xl font-bold text-primary">
            {gbp(rentIncomeRequired(monthlyRent))}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              / year
            </span>
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Referencing agencies typically expect a gross annual income of about
            30× the monthly rent. Guideline only.
          </p>
        </div>

        <TenancyDepositExplainer
          monthlyRent={monthlyRent}
          depositAmount={listing.depositAmount}
          depositScheme={listing.depositScheme}
          availableFrom={listing.availableFrom}
          minimumTenancyMonths={listing.minimumTenancyMonths}
          maximumTenancyMonths={listing.maximumTenancyMonths}
        />

        <RentalLettingDetails
          price={listing.price}
          rentFrequency={listing.rentFrequency}
          availableFrom={listing.availableFrom}
          depositAmount={listing.depositAmount}
          holdingDepositAmount={listing.holdingDepositAmount}
          furnishing={listing.furnishing}
          minimumTenancyMonths={listing.minimumTenancyMonths}
          maximumTenancyMonths={listing.maximumTenancyMonths}
          billsIncluded={listing.billsIncluded}
          billsIncludedDetails={listing.billsIncludedDetails}
          petsPolicy={listing.petsPolicy}
          studentsPolicy={listing.studentsPolicy}
          depositScheme={listing.depositScheme}
          councilTaxBand={property.councilTaxBand}
          epcRating={property.epcRating}
        />
      </div>
    </section>
  );
}
