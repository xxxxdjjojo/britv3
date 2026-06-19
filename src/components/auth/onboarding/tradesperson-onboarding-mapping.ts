/**
 * Pure mapping from tradesperson-onboarding form state to a
 * `service_provider_details` row payload.
 *
 * Excludes `user_id` and `slug` — those are supplied in `handleComplete`
 * (user from the session, slug from `generateUniqueSlug`). Also deliberately
 * omits `companies_house_*`: those trust fields are set server-side by a DB
 * trigger from the authoritative `company_verifications` record.
 */

import { sanitize } from "@/lib/sanitize";

/** A `service_category` enum value (subset used by tradesperson onboarding). */
type ServiceCategory =
  | "plumber"
  | "electrician"
  | "carpenter"
  | "surveying"
  | "conveyancing"
  | "painter"
  | "builder"
  | "plasterer"
  | "other";

export type ProviderOnboardingForm = {
  tradeCategories: string[];
  qualifications: string;
  insuranceNumber: string;
  companyNumber: string;
  accreditations: string[];
  responseTime: string;
};

/** Row payload for `service_provider_details`, minus `user_id` and `slug`. */
export type ProviderRow = {
  services: ServiceCategory[];
  qualifications: string[];
  accreditations: string[];
  response_time_hours: number;
  insurance_details: { policy_number: string } | null;
  company_number?: string;
};

/** Maps onboarding trade labels to `service_category` enum values. */
const TRADE_TO_SERVICE: Record<string, ServiceCategory> = {
  Plumber: "plumber",
  Electrician: "electrician",
  Carpenter: "carpenter",
  Surveyor: "surveying",
  Conveyancer: "conveyancing",
  "Gas Engineer": "plumber",
  "Painter & Decorator": "painter",
  Builder: "builder",
  Roofer: "builder",
  Plasterer: "plasterer",
};

/** Maps response-time selection values to numeric hours. */
const RESPONSE_TIME_HOURS: Record<string, number> = {
  same_day: 4,
  "24h": 24,
  "48h": 48,
  "1_week": 168,
};

function mapServices(tradeCategories: string[]): ServiceCategory[] {
  const mapped = tradeCategories
    .map((label) => TRADE_TO_SERVICE[label])
    .filter((value): value is ServiceCategory => Boolean(value));
  const deduped = Array.from(new Set(mapped));
  return deduped.length > 0 ? deduped : ["other"];
}

export function buildProviderRow(form: ProviderOnboardingForm): ProviderRow {
  const qualification = form.qualifications.trim();
  const insurance = form.insuranceNumber.trim();
  const company = form.companyNumber.trim();

  const row: ProviderRow = {
    services: mapServices(form.tradeCategories),
    qualifications: qualification ? [sanitize(qualification)] : [],
    accreditations: form.accreditations,
    response_time_hours: RESPONSE_TIME_HOURS[form.responseTime] ?? 24,
    insurance_details: insurance ? { policy_number: sanitize(insurance) } : null,
  };

  if (company) {
    row.company_number = sanitize(company);
  }

  return row;
}
