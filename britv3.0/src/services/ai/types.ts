/**
 * AI service domain types.
 * Shared across the AI service layer, API routes, and components.
 */

/** Supported AI features -- extend this union as new features are added */
export type AiFeature = "property_description" | "quote_draft" | "agent_proposal";

/** Result from a successful Claude API call */
export type AiCallResult = Readonly<{
  text: string;
  inputTokens: number;
  outputTokens: number;
}>;

/** Options passed to the callClaude wrapper */
export type AiCallOptions = Readonly<{
  feature: AiFeature;
  userId: string;
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
}>;

/** Shape of the ai_usage_log table row */
export type AiUsageLogEntry = Readonly<{
  id: string;
  feature: AiFeature;
  model: string;
  input_tokens: number;
  output_tokens: number;
  user_id: string;
  listing_id?: string | null;
  created_at: string;
}>;

/** AI feedback rating */
export type AiFeedbackRating = "positive" | "negative";

/** Shape of the ai_feedback table row */
export type AiFeedbackEntry = Readonly<{
  id: string;
  feature: string;
  reference_id: string;
  user_id: string;
  rating: AiFeedbackRating;
  comment: string | null;
  created_at: string;
}>;
