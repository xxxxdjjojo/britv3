/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * Companies House verification service.
 *
 * Looks up a UK company via the free gov.uk Companies House API and assesses
 * onboarding eligibility (registered >= 2 years and active). Get a free API key
 * at https://developer.company-information.service.gov.uk/.
 *
 * Auth: HTTP Basic with the API key as the username and a blank password.
 * Profiles are Redis-cached for 7 days.
 *
 * Unlike the read-only property services, this returns a typed result so the
 * caller can distinguish "company not found" from "service unavailable" — the
 * onboarding gate fails differently for each (block confirmed under-age vs.
 * queue for manual review on outage).
 */

import { z } from "zod";
import { getCached, setCache } from "@/lib/cache/redis";

const MIN_COMPANY_AGE_YEARS = 2;
const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type CompanyHouseResult = Readonly<{
  found: boolean;
  companyName?: string;
  companyStatus?: string;
  incorporationDate?: string;
  ageYears?: number;
  /** True when the lookup could not be completed (key unset/"disabled", network, or 5xx). */
  serviceError?: boolean;
}>;

export type EligibilityAssessment = Readonly<{
  eligible: boolean;
  reason?: string;
}>;

// ---------------------------------------------------------------------------
// Zod schema for the company profile response
// ---------------------------------------------------------------------------

const CompanyProfileSchema = z
  .object({
    company_name: z.string().optional(),
    company_status: z.string().optional(),
    date_of_creation: z.string().optional(),
  })
  .passthrough();

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function yearsSince(isoDate: string): number {
  const created = new Date(isoDate);
  if (Number.isNaN(created.getTime())) return 0;
  const ms = Date.now() - created.getTime();
  return ms / (365.25 * 24 * 60 * 60 * 1000);
}

/** Companies House numbers are 8 chars: 8 digits, or 2 letters + 6 digits. */
function normaliseCompanyNumber(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Look up a company by its registration number. Never throws — failures are
 * reported via `serviceError: true` so the caller can decide how to degrade.
 */
export async function lookupCompany(
  companyNumber: string,
): Promise<CompanyHouseResult> {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;

  if (!apiKey || apiKey === "disabled") {
    console.warn(
      "[companies-house] COMPANIES_HOUSE_API_KEY unset or 'disabled' — skipping lookup",
    );
    return { found: false, serviceError: true };
  }

  const number = normaliseCompanyNumber(companyNumber);
  if (!number) return { found: false };

  const cacheKey = `ch:company:${number}`;
  const cached = await getCached<CompanyHouseResult>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `https://api.company-information.service.gov.uk/company/${encodeURIComponent(number)}`,
      {
        signal: AbortSignal.timeout(5000),
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
        },
      },
    );

    if (response.status === 404) {
      const result: CompanyHouseResult = { found: false };
      await setCache(cacheKey, result, CACHE_TTL_SECONDS);
      return result;
    }

    if (!response.ok) {
      // 401 (bad key), 429 (rate limited), 5xx — treat as service error, don't cache.
      console.warn("[companies-house] API error", { status: response.status });
      return { found: false, serviceError: true };
    }

    const raw: unknown = await response.json();
    const validated = CompanyProfileSchema.safeParse(raw);
    if (!validated.success) {
      console.error("[companies-house] Schema validation failed");
      return { found: false, serviceError: true };
    }

    const { company_name, company_status, date_of_creation } = validated.data;
    const result: CompanyHouseResult = {
      found: true,
      companyName: company_name,
      companyStatus: company_status,
      incorporationDate: date_of_creation,
      ageYears: date_of_creation ? yearsSince(date_of_creation) : undefined,
    };
    await setCache(cacheKey, result, CACHE_TTL_SECONDS);
    return result;
  } catch (error) {
    console.error("[companies-house] Lookup failed", {
      error_type: error instanceof Error ? error.name : "unknown",
    });
    return { found: false, serviceError: true };
  }
}

/**
 * Decide whether a company may onboard. Returns ineligible ONLY for a
 * confirmed under-age or inactive company. A service error or unknown age is
 * NOT treated as ineligible here — the caller routes those to manual review.
 */
export function assessEligibility(
  result: CompanyHouseResult,
): EligibilityAssessment {
  if (result.serviceError) {
    return { eligible: false, reason: "verification_unavailable" };
  }
  if (!result.found) {
    return { eligible: false, reason: "company_not_found" };
  }
  if (result.companyStatus && result.companyStatus !== "active") {
    return { eligible: false, reason: "company_not_active" };
  }
  if (result.ageYears !== undefined && result.ageYears < MIN_COMPANY_AGE_YEARS) {
    return { eligible: false, reason: "company_under_two_years" };
  }
  return { eligible: true };
}

export { MIN_COMPANY_AGE_YEARS };
