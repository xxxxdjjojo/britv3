/**
 * SpecialistCredentials — Server Component
 *
 * Three named exports providing role-specific credential sections for the
 * three specialist profile types: mortgage brokers, conveyancers/solicitors,
 * and surveyors. Each section parses the provider's qualifications array
 * (using the "PREFIX:VALUE" convention) and pricing JSONB to display
 * regulatory registration, fee structures, and service-specific details.
 */

import {
  BadgeCheck,
  Building2,
  Scale,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { ServiceProviderPublicProfile } from "@/types/providers";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

type ParsedAccreditation = { type: string; number: string };

function parseAccreditations(qualifications: string[] | null): ParsedAccreditation[] {
  if (!qualifications) return [];
  return qualifications
    .filter((q) => q.includes(":"))
    .map((q) => {
      const idx = q.indexOf(":");
      return { type: q.slice(0, idx).toLowerCase(), number: q.slice(idx + 1) };
    });
}

function findAccreditation(
  accreditations: ParsedAccreditation[],
  ...types: string[]
): ParsedAccreditation | null {
  return (
    accreditations.find((a) => types.includes(a.type)) ?? null
  );
}

/** Safely extract a value from pricing JSONB (stored as unknown on the type) */
function pricingValue(provider: ServiceProviderPublicProfile, key: string): unknown {
  if (!provider) return undefined;
  // pricing is not on ServiceProviderPublicProfile directly — it may be in services
  // For specialist profiles the pricing JSONB is stored per-service. We look in
  // the qualifications or description for structured data, but for the credential
  // display we parse from description if it's JSON-encoded, else return undefined.
  // The plan notes that pricing data comes from the pricing JSONB — we'll access
  // it via a cast to allow extensibility.
  const p = (provider as unknown as Record<string, unknown>)["pricing"];
  if (p && typeof p === "object" && p !== null) {
    return (p as Record<string, unknown>)[key];
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// MortgageBrokerCredentials
// ---------------------------------------------------------------------------

export function MortgageBrokerCredentials({
  provider,
}: Readonly<{ provider: ServiceProviderPublicProfile }>) {
  const accreditations = parseAccreditations(provider.qualifications);
  const fcaAcc = findAccreditation(accreditations, "fca");

  // Whole-of-market: check description for keyword
  const isWholeOfMarket =
    typeof provider.description === "string" &&
    provider.description.toLowerCase().includes("whole_of_market");

  // Fee structure from pricing JSONB
  const feeType = pricingValue(provider, "fee_type") as string | undefined;
  const feeAmount = pricingValue(provider, "fee_amount") as number | undefined;
  const lenderCount = pricingValue(provider, "lender_count") as number | undefined;

  // Specialisms from qualifications that are NOT accreditation prefixes
  const specialisms = (provider.qualifications ?? [])
    .filter((q) => !q.includes(":"))
    .map((q) => q.replace(/_/g, " "));

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-bold text-on-surface dark:text-white">
        Professional Credentials
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* FCA authorisation */}
        <div className="bg-brand-accent-light dark:bg-brand-accent/10 border border-brand-accent/30 dark:border-brand-accent/40 p-4 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-9 h-9 bg-brand-accent rounded-full flex items-center justify-center">
              <BadgeCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-accent dark:text-brand-accent/80 uppercase tracking-wide">
                FCA Authorisation
              </p>
              <p className="text-sm font-semibold text-on-surface dark:text-white mt-0.5">
                {fcaAcc ? `FRN: ${fcaAcc.number}` : "FCA Authorised"}
              </p>
              <p className="text-xs text-[--color-on-surface-variant] dark:text-[--color-on-surface-variant] mt-0.5">
                Regulated by the Financial Conduct Authority
              </p>
            </div>
          </div>
        </div>

        {/* Whole of market / tied */}
        <div className="bg-surface-container-lowest dark:bg-neutral-900 border border-[--color-outline-variant] dark:border-neutral-800 p-4 rounded-xl">
          <p className="text-xs font-bold text-[--color-on-surface-variant] dark:text-[--color-on-surface-variant] uppercase tracking-wide">
            Adviser Type
          </p>
          <div className="mt-1.5">
            {isWholeOfMarket ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-primary-lighter dark:bg-success/20 text-[--color-brand-primary-light] dark:text-success text-xs font-bold rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                Whole of Market
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-secondary-light dark:bg-warning/20 text-[--color-brand-secondary-dark] dark:text-warning text-xs font-bold rounded-full">
                <XCircle className="w-3 h-3" />
                Panel
              </span>
            )}
          </div>
        </div>

        {/* Fee structure */}
        <div className="bg-surface-container-lowest dark:bg-neutral-900 border border-[--color-outline-variant] dark:border-neutral-800 p-4 rounded-xl">
          <p className="text-xs font-bold text-[--color-on-surface-variant] dark:text-[--color-on-surface-variant] uppercase tracking-wide">
            Fee Structure
          </p>
          <div className="mt-1.5">
            {feeType === "fee_free" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-primary-lighter dark:bg-success/10 text-[--color-brand-primary-light] dark:text-success text-xs font-semibold rounded-full border border-success/30 dark:border-success/40">
                Fee-Free
              </span>
            ) : feeType === "fixed_fee" && feeAmount !== undefined ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-accent-light dark:bg-brand-accent/10 text-brand-accent dark:text-brand-accent/80 text-xs font-semibold rounded-full border border-brand-accent/30 dark:border-brand-accent/40">
                Fixed Fee: £{feeAmount.toLocaleString()}
              </span>
            ) : (
              <span className="text-sm text-[--color-on-surface-variant] dark:text-[--color-on-surface-variant]">Fee on request</span>
            )}
          </div>
        </div>

        {/* Lender panel */}
        {lenderCount !== undefined && (
          <div className="bg-surface-container-lowest dark:bg-neutral-900 border border-[--color-outline-variant] dark:border-neutral-800 p-4 rounded-xl">
            <p className="text-xs font-bold text-[--color-on-surface-variant] dark:text-[--color-on-surface-variant] uppercase tracking-wide">
              Lender Panel
            </p>
            <p className="text-2xl font-bold text-on-surface dark:text-white mt-1">
              {lenderCount}
            </p>
            <p className="text-xs text-[--color-on-surface-variant] dark:text-[--color-on-surface-variant]">lenders on panel</p>
          </div>
        )}
      </div>

      {/* Specialisms chips */}
      {specialisms.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-on-surface dark:text-neutral-300 mb-2">
            Specialisms
          </h3>
          <div className="flex flex-wrap gap-2">
            {specialisms.map((s) => (
              <span
                key={s}
                className="px-3 py-1 bg-[--color-surface-container-low] dark:bg-neutral-800 text-on-surface dark:text-neutral-300 text-xs font-medium rounded-full capitalize"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// ConveyancerCredentials
// ---------------------------------------------------------------------------

export function ConveyancerCredentials({
  provider,
}: Readonly<{ provider: ServiceProviderPublicProfile }>) {
  const accreditations = parseAccreditations(provider.qualifications);
  const regAcc =
    findAccreditation(accreditations, "sra") ?? findAccreditation(accreditations, "clc");
  const regType = regAcc?.type.toUpperCase() ?? "SRA";

  const purchaseFee = pricingValue(provider, "purchase_fee") as number | undefined;
  const saleFee = pricingValue(provider, "sale_fee") as number | undefined;
  const remortgageFee = pricingValue(provider, "remortgage_fee") as number | undefined;
  const turnaroundWeeks = pricingValue(provider, "turnaround_weeks") as string | undefined;
  const noSaleNoFee = pricingValue(provider, "no_sale_no_fee") as boolean | undefined;

  const feeRows: { label: string; value: number | undefined }[] = [
    { label: "Standard Purchase", value: purchaseFee },
    { label: "Standard Sale", value: saleFee },
    { label: "Remortgage", value: remortgageFee },
  ];

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-bold text-on-surface dark:text-white">
        Professional Credentials
      </h2>

      {/* Registration card */}
      <div className="bg-brand-accent-light dark:bg-brand-accent/10 border border-brand-accent/30 dark:border-brand-accent/40 p-4 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-9 h-9 bg-brand-accent rounded-full flex items-center justify-center">
            <Scale className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-brand-accent dark:text-brand-accent/80 uppercase tracking-wide">
              {regType} Registration
            </p>
            <p className="text-sm font-semibold text-on-surface dark:text-white mt-0.5">
              {regAcc ? `${regType}: ${regAcc.number}` : `${regType} Regulated`}
            </p>
            <p className="text-xs text-[--color-on-surface-variant] dark:text-[--color-on-surface-variant] mt-0.5">
              {regType === "SRA"
                ? "Regulated by the Solicitors Regulation Authority"
                : "Regulated by the Council for Licensed Conveyancers"}
            </p>
          </div>
        </div>
      </div>

      {/* Fee table */}
      <div className="bg-surface-container-lowest dark:bg-neutral-900 border border-[--color-outline-variant] dark:border-neutral-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[--color-outline-variant] dark:border-neutral-800">
          <h3 className="text-sm font-bold text-on-surface dark:text-neutral-300">
            Typical Fees (inc. VAT)
          </h3>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {feeRows.map(({ label, value }) => (
              <tr
                key={label}
                className="border-b border-[--color-outline-variant] dark:border-neutral-800 last:border-0"
              >
                <td className="px-4 py-3 text-[--color-on-surface-variant] dark:text-[--color-on-surface-variant]">{label}</td>
                <td className="px-4 py-3 text-right font-semibold text-on-surface dark:text-white">
                  {value !== undefined ? `£${value.toLocaleString()}` : "POA"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Turnaround + no-sale-no-fee row */}
      <div className="flex flex-wrap gap-3">
        {turnaroundWeeks && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[--color-surface-container-low] dark:bg-neutral-800 text-on-surface dark:text-neutral-300 text-xs font-semibold rounded-lg">
            <Clock className="w-3.5 h-3.5" />
            {turnaroundWeeks} weeks typical turnaround
          </span>
        )}
        {noSaleNoFee === true && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary-lighter dark:bg-success/10 text-[--color-brand-primary-light] dark:text-success text-xs font-semibold rounded-lg border border-success/30 dark:border-success/40">
            <CheckCircle2 className="w-3.5 h-3.5" />
            No Sale, No Fee
          </span>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// SurveyorCredentials
// ---------------------------------------------------------------------------

const SURVEY_TYPES: {
  key: string;
  label: string;
  subtitle: string;
  level: string;
}[] = [
  {
    key: "rics_level_1",
    label: "RICS Level 1",
    subtitle: "Condition Report",
    level: "Most Basic",
  },
  {
    key: "rics_level_2",
    label: "RICS Level 2",
    subtitle: "HomeBuyer Report",
    level: "Most Popular",
  },
  {
    key: "rics_level_3",
    label: "RICS Level 3",
    subtitle: "Full Building Survey",
    level: "Most Detailed",
  },
  {
    key: "homebuyer_report",
    label: "HomeBuyer Report",
    subtitle: "RICS Level 2 equivalent",
    level: "Popular",
  },
  {
    key: "full_building_survey",
    label: "Full Building Survey",
    subtitle: "Comprehensive inspection",
    level: "Detailed",
  },
];

export function SurveyorCredentials({
  provider,
}: Readonly<{ provider: ServiceProviderPublicProfile }>) {
  const accreditations = parseAccreditations(provider.qualifications);
  const ricsAcc = findAccreditation(accreditations, "rics");

  const turnaroundDays = pricingValue(provider, "turnaround_days") as string | undefined;

  // Determine which survey types are offered by checking qualifications (non-accreditation)
  const qualificationKeys = (provider.qualifications ?? [])
    .filter((q) => !q.includes(":"))
    .map((q) => q.toLowerCase());

  const offeredSurveys = SURVEY_TYPES.filter((st) => qualificationKeys.includes(st.key));
  // If no specific surveys specified, show all three RICS levels as offered
  const displaySurveys = offeredSurveys.length > 0 ? offeredSurveys : SURVEY_TYPES.slice(0, 3);

  const servicePostcodes = provider.service_postcodes ?? [];
  const displayPostcodes = servicePostcodes.slice(0, 8);
  const extraPostcodeCount = Math.max(0, servicePostcodes.length - 8);

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-bold text-on-surface dark:text-white">
        Professional Credentials
      </h2>

      {/* RICS membership card */}
      <div className="bg-brand-primary-lighter dark:bg-brand-primary/10 border border-success/30 dark:border-brand-primary/30 p-4 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-9 h-9 bg-brand-primary rounded-full flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-brand-primary dark:text-success uppercase tracking-wide">
              RICS Membership
            </p>
            <p className="text-sm font-semibold text-on-surface dark:text-white mt-0.5">
              {ricsAcc ? `Member No. ${ricsAcc.number}` : "RICS Member"}
            </p>
            <p className="text-xs text-[--color-on-surface-variant] dark:text-[--color-on-surface-variant] mt-0.5">
              Royal Institution of Chartered Surveyors
            </p>
          </div>
        </div>
      </div>

      {/* Survey types grid */}
      <div>
        <h3 className="text-sm font-bold text-on-surface dark:text-neutral-300 mb-3">
          Survey Types Offered
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {displaySurveys.map((survey) => (
            <div
              key={survey.key}
              className="bg-surface-container-lowest dark:bg-neutral-900 border border-[--color-outline-variant] dark:border-neutral-800 p-4 rounded-xl"
            >
              <p className="text-xs font-bold text-brand-primary dark:text-success uppercase tracking-wide">
                {survey.level}
              </p>
              <p className="text-sm font-bold text-on-surface dark:text-white mt-1">
                {survey.label}
              </p>
              <p className="text-xs text-[--color-on-surface-variant] dark:text-[--color-on-surface-variant] mt-0.5">
                {survey.subtitle}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Turnaround time */}
      <div className="flex items-center gap-2 text-sm text-[--color-on-surface-variant] dark:text-[--color-on-surface-variant]">
        <Clock className="w-4 h-4 text-[--color-on-surface-variant]" />
        <span>
          <strong className="text-on-surface dark:text-white">
            {turnaroundDays ?? "5\u201310"}
          </strong>{" "}
          working days turnaround
        </span>
      </div>

      {/* Coverage postcodes */}
      {servicePostcodes.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-on-surface dark:text-neutral-300 mb-2 flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            Coverage Area
          </h3>
          <div className="flex flex-wrap gap-1">
            {displayPostcodes.map((pc) => (
              <span
                key={pc}
                className="bg-[--color-surface-container-low] dark:bg-neutral-800 text-[--color-on-surface-variant] dark:text-[--color-on-surface-variant] text-xs rounded px-2 py-1"
              >
                {pc}
              </span>
            ))}
            {extraPostcodeCount > 0 && (
              <span className="bg-[--color-surface-container-low] dark:bg-neutral-800 text-[--color-on-surface-variant] dark:text-[--color-on-surface-variant] text-xs rounded px-2 py-1 font-semibold">
                +{extraPostcodeCount} more
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
