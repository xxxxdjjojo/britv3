/**
 * AI-powered quote drafting for tradespeople and estate agents.
 *
 * Uses Claude Haiku to generate structured quotes from rate cards and market
 * pricing data. Returns null on any failure so callers show a manual form.
 */

import { callClaude } from "./claude-service";
import { QuoteDraftSchema, AgentProposalSchema } from "@/lib/ai/schemas";
import type { SupabaseClient } from "@supabase/supabase-js";

// -- Types -------------------------------------------------------------------

export type QuoteDraftLineItem = Readonly<{
  description: string;
  amount: number;
}>;

export type QuoteDraft = Readonly<{
  line_items: QuoteDraftLineItem[];
  total: number;
  estimated_duration: string;
  scope_of_work: string;
}>;

export type AgentProposal = Readonly<{
  valuation_range: { low: number; high: number };
  comparable_properties: Array<{
    address: string;
    price: number;
    date: string;
  }>;
  marketing_strategy: string;
  fee_structure: string;
}>;

// -- Prompt templates --------------------------------------------------------

const TRADES_SYSTEM_PROMPT =
  "You are a quoting assistant for a UK tradesperson. Generate competitive but fair quotes based on the trader's rate card and current market pricing. Respond with valid JSON only.";

const TRADES_USER_TEMPLATE = (
  rfqDescription: string,
  rateCard: Record<string, unknown>,
  marketPricing: Record<string, unknown>,
) =>
  `Generate a quote for this request:

${rfqDescription}

Trader's rate card:
${JSON.stringify(rateCard, null, 2)}

Current market pricing for this region/category:
${JSON.stringify(marketPricing, null, 2)}

Return JSON with this exact shape:
{
  "line_items": [{"description": "string", "amount": number}],
  "total": number,
  "estimated_duration": "string",
  "scope_of_work": "string"
}`;

const AGENT_SYSTEM_PROMPT =
  "You are a property valuation assistant for a UK estate agent. Generate professional proposals with realistic valuations based on comparable properties and market data. Respond with valid JSON only.";

const AGENT_USER_TEMPLATE = (
  propertyDetails: Record<string, unknown>,
  marketData: Record<string, unknown>,
) =>
  `Generate a proposal for this property:

${JSON.stringify(propertyDetails, null, 2)}

Market data and comparables:
${JSON.stringify(marketData, null, 2)}

Return JSON with this exact shape:
{
  "valuation_range": {"low": number, "high": number},
  "comparable_properties": [{"address": "string", "price": number, "date": "YYYY-MM-DD"}],
  "marketing_strategy": "string",
  "fee_structure": "string"
}`;

// -- Public API --------------------------------------------------------------

/**
 * Draft a tradesperson quote using AI.
 * Returns null on any failure (caller should show manual form).
 */
export async function draftTradesQuote(
  rfqDescription: string,
  rateCard: Record<string, unknown>,
  marketPricing: Record<string, unknown>,
  userId: string,
): Promise<QuoteDraft | null> {
  try {
    const result = await callClaude({
      feature: "quote_draft",
      userId,
      systemPrompt: TRADES_SYSTEM_PROMPT,
      userMessage: TRADES_USER_TEMPLATE(rfqDescription, rateCard, marketPricing),
      maxTokens: 1024,
      outputSchema: QuoteDraftSchema,
    });

    if (!result.ok || !result.data.parsed) return null;
    return result.data.parsed as QuoteDraft;
  } catch (err) {
    console.error("[AI] draftTradesQuote error:", err);
    return null;
  }
}

/**
 * Draft an estate agent proposal using AI.
 * Returns null on any failure (caller should show manual form).
 */
export async function draftAgentProposal(
  propertyDetails: Record<string, unknown>,
  marketData: Record<string, unknown>,
  userId: string,
): Promise<AgentProposal | null> {
  try {
    const result = await callClaude({
      feature: "agent_proposal",
      userId,
      systemPrompt: AGENT_SYSTEM_PROMPT,
      userMessage: AGENT_USER_TEMPLATE(propertyDetails, marketData),
      maxTokens: 1024,
      outputSchema: AgentProposalSchema,
    });

    if (!result.ok || !result.data.parsed) return null;
    return result.data.parsed as AgentProposal;
  } catch (err) {
    console.error("[AI] draftAgentProposal error:", err);
    return null;
  }
}

/**
 * Fetch market pricing for a service category and region.
 */
export async function getMarketPricing(
  supabase: SupabaseClient,
  serviceCategory: string,
  region: string,
): Promise<Record<string, unknown> | null> {
  try {
    const { data, error } = await supabase
      .from("market_pricing")
      .select("*")
      .eq("service_category", serviceCategory)
      .eq("region", region)
      .maybeSingle();

    if (error) {
      console.error("[AI] getMarketPricing error:", error);
      return null;
    }

    return data as Record<string, unknown> | null;
  } catch (err) {
    console.error("[AI] getMarketPricing error:", err);
    return null;
  }
}

/**
 * Fetch a service provider's rate card from their profile.
 */
export async function getRateCard(
  supabase: SupabaseClient,
  userId: string,
): Promise<Record<string, unknown> | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("provider_details")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("[AI] getRateCard error:", error);
      return null;
    }

    const details = data?.provider_details as Record<string, unknown> | null;
    return details?.rate_card as Record<string, unknown> ?? null;
  } catch (err) {
    console.error("[AI] getRateCard error:", err);
    return null;
  }
}
