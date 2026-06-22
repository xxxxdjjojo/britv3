/**
 * Rental letting details panel — renders UK-specific rental terms.
 *
 * Displays: monthly/weekly rent, deposit, holding deposit, available date,
 * furnishing, minimum tenancy, council tax, EPC, bills, pets/students policy,
 * deposit scheme, right-to-rent notice.
 *
 * Only renders when listing_type === "rent". Each field self-gates:
 * if the data is null, the row is omitted entirely (no "—" placeholders).
 *
 * This is a Server Component — no client-side state needed.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import {
  monthlyToWeekly,
  formatMonthlyRent,
  formatWeeklyRent,
  furnishingLabel,
  petsPolicyLabel,
  studentsPolicyLabel,
  formatAvailableFrom,
} from "@/lib/properties/rental-format";

export type RentalLettingDetailsProps = Readonly<{
  price: number;
  rentFrequency: string | null;
  availableFrom: string | null;
  depositAmount: number | null;
  holdingDepositAmount: number | null;
  furnishing: string | null;
  minimumTenancyMonths: number | null;
  maximumTenancyMonths: number | null;
  billsIncluded: boolean | null;
  billsIncludedDetails: string | null;
  petsPolicy: string | null;
  studentsPolicy: string | null;
  depositScheme: string | null;
  councilTaxBand: string | null;
  epcRating: string | null;
}>;

type DetailRow = Readonly<{
  label: string;
  value: string;
}>;

function buildDetails(props: RentalLettingDetailsProps): DetailRow[] {
  const rows: DetailRow[] = [];

  // Monthly rent (primary price)
  const monthly = props.rentFrequency === "weekly"
    ? Math.round(props.price * (52 / 12))
    : props.price;
  rows.push({ label: "Monthly rent", value: formatMonthlyRent(monthly) });

  // Weekly rent (derived)
  const weekly = props.rentFrequency === "weekly"
    ? props.price
    : monthlyToWeekly(monthly);
  const weeklyStr = formatWeeklyRent(weekly);
  if (weeklyStr) {
    rows.push({ label: "Weekly rent", value: weeklyStr });
  }

  // Deposit
  if (props.depositAmount != null && props.depositAmount > 0) {
    const weeksEquivalent = monthly > 0
      ? Math.round((props.depositAmount / (monthly / (52 / 12))) * 10) / 10
      : null;
    const suffix = weeksEquivalent != null && weeksEquivalent > 0
      ? ` (${weeksEquivalent === Math.round(weeksEquivalent) ? weeksEquivalent : weeksEquivalent.toFixed(1)} weeks' rent)`
      : "";
    rows.push({ label: "Deposit", value: `£${props.depositAmount.toLocaleString("en-GB")}${suffix}` });
  }

  // Holding deposit
  if (props.holdingDepositAmount != null && props.holdingDepositAmount > 0) {
    rows.push({ label: "Holding deposit", value: `£${props.holdingDepositAmount.toLocaleString("en-GB")} (1 week)` });
  }

  // Available from
  const availableStr = formatAvailableFrom(props.availableFrom);
  if (availableStr) {
    rows.push({ label: "Available from", value: availableStr });
  }

  // Furnishing
  const furnishingStr = furnishingLabel(props.furnishing);
  if (furnishingStr) {
    rows.push({ label: "Furnishing", value: furnishingStr });
  }

  // Minimum tenancy
  if (props.minimumTenancyMonths != null && props.minimumTenancyMonths > 0) {
    rows.push({ label: "Minimum tenancy", value: `${props.minimumTenancyMonths} months` });
  }

  // Maximum tenancy (only if different from minimum)
  if (props.maximumTenancyMonths != null && props.maximumTenancyMonths > 0) {
    rows.push({ label: "Maximum tenancy", value: `${props.maximumTenancyMonths} months` });
  }

  // Council tax band
  if (props.councilTaxBand) {
    rows.push({ label: "Council tax band", value: `Band ${props.councilTaxBand}` });
  }

  // EPC rating
  if (props.epcRating) {
    rows.push({ label: "EPC rating", value: props.epcRating });
  }

  // Bills included
  if (props.billsIncluded === true) {
    const details = props.billsIncludedDetails || "";
    rows.push({
      label: "Bills included",
      value: details || "Yes",
    });
  } else if (props.billsIncluded === false) {
    rows.push({ label: "Bills included", value: "No" });
  }

  // Pets policy
  const petsStr = petsPolicyLabel(props.petsPolicy);
  if (petsStr) {
    rows.push({ label: "Pets", value: petsStr });
  }

  // Students policy
  const studentsStr = studentsPolicyLabel(props.studentsPolicy);
  if (studentsStr) {
    rows.push({ label: "Students", value: studentsStr });
  }

  // Deposit scheme
  if (props.depositScheme) {
    rows.push({
      label: "Deposit protected via",
      value: props.depositScheme,
    });
  }

  return rows;
}

export function RentalLettingDetails(props: RentalLettingDetailsProps) {
  const details = buildDetails(props);

  if (details.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="size-4 text-primary" />
          Letting details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {details.map((row) => (
            <div key={row.label} className="flex flex-col gap-0.5">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {row.label}
              </dt>
              <dd className="text-sm font-medium">
                {row.value}
              </dd>
            </div          >
          ))}
        </dl>
        <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
          Right to Rent checks apply. You will need to show immigration status
          documents to the landlord or agent before the tenancy starts.
        </p>
      </CardContent>
    </Card>
  );
}
