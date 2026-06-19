/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * EPC (Energy Performance Certificate) service.
 *
 * Fetches domestic EPC records from the gov.uk Open Data Communities API — a
 * free public dataset covering all registered EPCs in England and Wales.
 * Requires HTTP Basic auth: base64(email:api-key). Register for a key at
 * https://epc.opendatacommunities.org/ (instant, free).
 *
 * Results are Redis-cached for 30 days (EPCs are valid for 10 years and change
 * rarely). Returns null on any error — never throws.
 *
 * Set EPC_API_KEY="disabled" to turn the feature off (mirrors ofsted-service).
 */

import { z } from "zod";
import { getCached, setCache, propertyDetailCacheKey, PROPERTY_DETAIL_TTL } from "@/lib/cache/redis";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type EpcRating = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "Unknown";

export type EpcCertificate = Readonly<{
  lmk_key: string;
  address: string;
  postcode: string;
  current_rating: EpcRating;
  potential_rating: EpcRating;
  current_efficiency: number | null;
  potential_efficiency: number | null;
  inspection_date: string | null;
  property_type: string | null;
}>;

// ---------------------------------------------------------------------------
// Zod schema for the Open Data Communities response
// ---------------------------------------------------------------------------

const EpcRowSchema = z
  .object({
    "lmk-key": z.string().optional(),
    address: z.string().optional(),
    postcode: z.string().optional(),
    "current-energy-rating": z.string().optional(),
    "potential-energy-rating": z.string().optional(),
    "current-energy-efficiency": z.union([z.number(), z.string()]).optional(),
    "potential-energy-efficiency": z.union([z.number(), z.string()]).optional(),
    "inspection-date": z.string().optional(),
    "property-type": z.string().optional(),
  })
  .passthrough();

const EpcResponseSchema = z
  .object({
    rows: z.array(EpcRowSchema).optional(),
  })
  .passthrough();

type EpcRow = z.infer<typeof EpcRowSchema>;

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function normaliseRating(raw: string | undefined): EpcRating {
  const v = (raw ?? "").trim().toUpperCase();
  if (["A", "B", "C", "D", "E", "F", "G"].includes(v)) return v as EpcRating;
  return "Unknown";
}

function parseEfficiency(raw: number | string | undefined): number | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isNaN(n) ? null : Math.round(n);
}

function transformRow(row: EpcRow): EpcCertificate | null {
  const lmkKey = row["lmk-key"]?.trim();
  if (!lmkKey) return null;
  return {
    lmk_key: lmkKey,
    address: row.address?.trim() ?? "Address not available",
    postcode: row.postcode?.trim() ?? "",
    current_rating: normaliseRating(row["current-energy-rating"]),
    potential_rating: normaliseRating(row["potential-energy-rating"]),
    current_efficiency: parseEfficiency(row["current-energy-efficiency"]),
    potential_efficiency: parseEfficiency(row["potential-energy-efficiency"]),
    inspection_date: row["inspection-date"]?.trim() ?? null,
    property_type: row["property-type"]?.trim() ?? null,
  };
}

function getAuthHeader(): string | null {
  const apiKey = process.env.EPC_API_KEY;
  const email = process.env.EPC_API_EMAIL;
  if (!apiKey || !email) return null;
  return `Basic ${Buffer.from(`${email}:${apiKey}`).toString("base64")}`;
}

async function fetchEpcRows(postcode: string): Promise<EpcCertificate[] | null> {
  if (process.env.EPC_API_KEY === "disabled") {
    console.warn("[epc-service] EPC_API_KEY set to 'disabled' — skipping fetch");
    return null;
  }

  const authHeader = getAuthHeader();
  if (!authHeader) {
    console.warn("[epc-service] EPC_API_KEY / EPC_API_EMAIL not set — skipping fetch");
    return null;
  }

  const normalisedPostcode = postcode.replace(/\s+/g, "").toUpperCase();
  const cacheKey = propertyDetailCacheKey.epc(normalisedPostcode);
  const cached = await getCached<EpcCertificate[]>(cacheKey);
  if (cached) return cached;

  const url = new URL("https://epc.opendatacommunities.org/api/v1/domestic/search");
  url.searchParams.set("postcode", normalisedPostcode);
  url.searchParams.set("size", "100");

  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(5000),
    headers: {
      Accept: "application/json",
      Authorization: authHeader,
    },
  });

  if (response.status === 404) {
    // No certificates for this postcode — cache the empty result.
    await setCache(cacheKey, [], PROPERTY_DETAIL_TTL.EPC);
    return [];
  }

  if (!response.ok) {
    console.warn("[epc-service] API error", { status: response.status });
    return null;
  }

  let raw: unknown;
  try {
    raw = await response.json();
  } catch (parseError) {
    console.error("[epc-service] JSON parse failed", {
      error_type: parseError instanceof Error ? parseError.name : "unknown",
    });
    return null;
  }

  const validated = EpcResponseSchema.safeParse(raw);
  if (!validated.success) {
    console.error("[epc-service] Schema validation failed");
    return null;
  }

  const certificates: EpcCertificate[] = [];
  for (const row of validated.data.rows ?? []) {
    const cert = transformRow(row);
    if (cert) certificates.push(cert);
  }

  await setCache(cacheKey, certificates, PROPERTY_DETAIL_TTL.EPC);
  return certificates;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch all EPC certificates registered against a postcode.
 * Redis-cached for 30 days. Returns null on any error — never throws.
 */
export async function fetchEpcByPostcode(
  postcode: string,
): Promise<EpcCertificate[] | null> {
  try {
    return await fetchEpcRows(postcode);
  } catch (error) {
    console.error("[epc-service] Fetch failed", {
      error_type: error instanceof Error ? error.name : "unknown",
    });
    return null;
  }
}

/**
 * Fetch the single best-matching EPC for a specific address line within a
 * postcode (case-insensitive substring match on the first address token).
 * Returns null when no confident match is found.
 */
export async function fetchEpcByAddress(
  postcode: string,
  addressLine: string,
): Promise<EpcCertificate | null> {
  const rows = await fetchEpcByPostcode(postcode);
  if (!rows || rows.length === 0) return null;

  const needle = addressLine.trim().toLowerCase();
  if (!needle) return rows[0] ?? null;

  const match = rows.find((r) => r.address.toLowerCase().includes(needle));
  return match ?? null;
}
