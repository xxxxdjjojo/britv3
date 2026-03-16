import type { SupabaseClient } from "@supabase/supabase-js";
import type { SaleProgressionStage, SaleStageNumber } from "@/types/seller";

export async function getSaleProgression(
  supabase: SupabaseClient,
  offerId: string,
): Promise<SaleProgressionStage | null> {
  const { data, error } = await supabase
    .from("sale_progression_stages")
    .select("*")
    .eq("offer_id", offerId)
    .maybeSingle();
  if (error) throw error;
  return data as SaleProgressionStage | null;
}

export async function getSaleProgressionById(
  supabase: SupabaseClient,
  progressionId: string,
): Promise<SaleProgressionStage | null> {
  const { data, error } = await supabase
    .from("sale_progression_stages")
    .select("*")
    .eq("id", progressionId)
    .maybeSingle();
  if (error) throw error;
  return data as SaleProgressionStage | null;
}

export async function advanceStage(
  supabase: SupabaseClient,
  progressionId: string,
  currentStage: SaleStageNumber,
): Promise<void> {
  if (currentStage >= 8) throw new Error("Already at final stage");

  const nextStage = (currentStage + 1) as SaleStageNumber;
  const today = new Date().toISOString().split("T")[0];

  const { data, error: fetchError } = await supabase
    .from("sale_progression_stages")
    .select("stage_dates")
    .eq("id", progressionId)
    .single<{ stage_dates: Record<string, string> }>();

  if (fetchError) throw fetchError;
  const stageDates = { ...(data?.stage_dates ?? {}), [String(currentStage)]: today };

  const { error } = await supabase
    .from("sale_progression_stages")
    .update({ current_stage: nextStage, stage_dates: stageDates })
    .eq("id", progressionId);
  if (error) throw error;
}

export async function createSaleProgression(
  supabase: SupabaseClient,
  offerId: string,
  sellerId: string,
): Promise<SaleProgressionStage> {
  const { data, error } = await supabase
    .from("sale_progression_stages")
    .insert({
      offer_id: offerId,
      seller_id: sellerId,
      current_stage: 1,
      stage_dates: { "1": new Date().toISOString().split("T")[0] },
    })
    .select()
    .single();
  if (error) throw error;
  return data as SaleProgressionStage;
}
