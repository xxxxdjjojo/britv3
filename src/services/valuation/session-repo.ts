import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashSessionToken, generateSessionToken } from "@/lib/valuation/session-token";
import type {
  SelectedAddress,
  UserPropertyDetails,
  ValuationResult,
  ValuationSubject,
  ComparableSale,
  EvidenceQuality,
  FallbackLevel,
} from "@/types/valuation";

type SessionRow = {
  id: string;
  status: string;
  postcode: string | null;
  outward_code: string | null;
  paon: string | null;
  saon: string | null;
  street: string | null;
  address_label: string | null;
  property_details: UserPropertyDetails | Record<string, never>;
  latest_result_id: string | null;
  user_id: string | null;
  expires_at: string;
};

export type ValuationSession = Readonly<{
  id: string;
  status: string;
  address: SelectedAddress | null;
  details: UserPropertyDetails | null;
  latestResultId: string | null;
  userId: string | null;
}>;

function toSession(row: SessionRow): ValuationSession {
  const hasAddress = Boolean(row.postcode && row.outward_code);
  const hasDetails = row.property_details && "subtype" in row.property_details;
  return {
    id: row.id,
    status: row.status,
    address: hasAddress
      ? {
          postcode: row.postcode!,
          outwardCode: row.outward_code!,
          paon: row.paon,
          saon: row.saon,
          street: row.street,
          label: row.address_label ?? "",
        }
      : null,
    details: hasDetails ? (row.property_details as UserPropertyDetails) : null,
    latestResultId: row.latest_result_id,
    userId: row.user_id,
  };
}

/** Create a new anonymous session; returns the raw token (set as an httpOnly cookie). */
export async function createSession(): Promise<{ sessionId: string; token: string }> {
  const token = generateSessionToken();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("valuation_sessions")
    .insert({ token_hash: hashSessionToken(token) })
    .select("id")
    .single();
  if (error) throw new Error(`createSession: ${error.message}`);
  return { sessionId: data.id, token };
}

export async function getSessionByToken(token: string): Promise<ValuationSession | null> {
  if (!token) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("valuation_sessions")
    .select("*")
    .eq("token_hash", hashSessionToken(token))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw new Error(`getSessionByToken: ${error.message}`);
  return data ? toSession(data as SessionRow) : null;
}

export async function saveAddress(token: string, address: SelectedAddress): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("valuation_sessions")
    .update({
      postcode: address.postcode,
      outward_code: address.outwardCode,
      paon: address.paon,
      saon: address.saon,
      street: address.street,
      address_label: address.label,
      updated_at: new Date().toISOString(),
    })
    .eq("token_hash", hashSessionToken(token))
    .gt("expires_at", new Date().toISOString());
  if (error) throw new Error(`saveAddress: ${error.message}`);
}

export async function saveDetails(token: string, details: UserPropertyDetails): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("valuation_sessions")
    .update({ property_details: details, updated_at: new Date().toISOString() })
    .eq("token_hash", hashSessionToken(token))
    .gt("expires_at", new Date().toISOString());
  if (error) throw new Error(`saveDetails: ${error.message}`);
}

/** Persist an engine result + its comparables; mark the session calculated. */
export async function saveResult(
  sessionId: string,
  subject: ValuationSubject,
  result: ValuationResult,
  userId?: string | null,
): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("valuation_results")
    .insert({
      session_id: sessionId,
      user_id: userId ?? null,
      model_version: result.modelVersion,
      estimated_value: result.estimatedValue,
      estimated_low: result.estimatedLow,
      estimated_high: result.estimatedHigh,
      evidence_quality: result.evidenceQuality,
      fallback_level: result.fallbackLevel,
      comparable_count: result.comparableCount,
      effective_comparable_count: result.effectiveComparableCount,
      valuation_date: result.valuationDate,
      data_cutoff_date: result.dataCutoffDate,
      subject,
      inputs_used: result.inputsUsed,
      missing_inputs: result.missingInputs,
      limitations: result.limitations,
    })
    .select("id")
    .single();
  if (error) throw new Error(`saveResult: ${error.message}`);
  const resultId = data.id as string;

  if (result.comparableSales.length > 0) {
    const rows = result.comparableSales.map((c) => ({
      result_id: resultId,
      transaction_id: c.transactionId,
      price: c.price,
      adjusted_price: c.adjustedPrice,
      sale_date: c.saleDate,
      postcode: c.postcode,
      outward_code: c.outwardCode,
      property_type: c.propertyType,
      new_build: c.newBuild,
      tenure: c.tenure,
      paon: c.paon,
      saon: c.saon,
      street: c.street,
      distance_metres: c.distanceMetres,
      weight: c.weight,
    }));
    const { error: compErr } = await supabase.from("valuation_comparables").insert(rows);
    if (compErr) throw new Error(`saveResult comparables: ${compErr.message}`);
  }

  await supabase
    .from("valuation_sessions")
    .update({ latest_result_id: resultId, status: "calculated", updated_at: new Date().toISOString() })
    .eq("id", sessionId);
  return resultId;
}

/** Attach the session + all its results to a verified user, return the latest result id. */
export async function claimSessionToUser(token: string, userId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const session = await getSessionByToken(token);
  if (!session) return null;

  const { error: sErr } = await supabase
    .from("valuation_sessions")
    .update({ user_id: userId, status: "claimed", updated_at: new Date().toISOString() })
    .eq("id", session.id);
  if (sErr) throw new Error(`claimSessionToUser session: ${sErr.message}`);
  const { error: rErr } = await supabase
    .from("valuation_results")
    .update({ user_id: userId })
    .eq("session_id", session.id);
  if (rErr) throw new Error(`claimSessionToUser results: ${rErr.message}`);
  return session.latestResultId;
}

type ResultRow = {
  id: string;
  user_id: string | null;
  model_version: string;
  estimated_value: number | null;
  estimated_low: number | null;
  estimated_high: number | null;
  evidence_quality: EvidenceQuality;
  fallback_level: FallbackLevel;
  comparable_count: number;
  effective_comparable_count: number;
  valuation_date: string;
  data_cutoff_date: string | null;
  subject: ValuationSubject;
  inputs_used: string[];
  missing_inputs: string[];
  limitations: string[];
};

export type StoredValuation = Readonly<{
  id: string;
  result: ValuationResult;
  subject: ValuationSubject;
}>;

/** Authorised fetch: a result is only returned to the user who owns it. */
export async function getResultForUser(resultId: string, userId: string): Promise<StoredValuation | null> {
  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("valuation_results")
    .select("*")
    .eq("id", resultId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`getResultForUser: ${error.message}`);
  if (!row) return null;
  const r = row as ResultRow;

  const { data: comps } = await supabase
    .from("valuation_comparables")
    .select("*")
    .eq("result_id", resultId)
    .order("weight", { ascending: false });

  const comparableSales: ComparableSale[] = (comps ?? []).map((c) => ({
    transactionId: c.transaction_id,
    price: c.price,
    adjustedPrice: c.adjusted_price,
    saleDate: c.sale_date,
    postcode: c.postcode ?? "",
    outwardCode: c.outward_code ?? "",
    propertyType: c.property_type,
    newBuild: c.new_build,
    tenure: c.tenure,
    paon: c.paon,
    saon: c.saon,
    street: c.street,
    distanceMetres: c.distance_metres,
    weight: c.weight,
  }));

  return {
    id: r.id,
    subject: r.subject,
    result: {
      modelVersion: r.model_version,
      estimatedValue: r.estimated_value,
      estimatedLow: r.estimated_low,
      estimatedHigh: r.estimated_high,
      evidenceQuality: r.evidence_quality,
      fallbackLevel: r.fallback_level,
      comparableCount: r.comparable_count,
      effectiveComparableCount: Number(r.effective_comparable_count),
      valuationDate: r.valuation_date,
      dataCutoffDate: r.data_cutoff_date,
      lastRegisteredSale: null,
      inputsUsed: r.inputs_used ?? [],
      missingInputs: r.missing_inputs ?? [],
      limitations: r.limitations ?? [],
      comparableSales,
    },
  };
}
