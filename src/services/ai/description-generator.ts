/**
 * Property description generation using Claude AI.
 * Formats property attributes into structured prompts and calls the AI service.
 */

import { getDescriptionPrompt } from "@/config/prompts/property-description";
import type { Tone } from "@/config/prompts/property-description";
import { callClaude } from "./claude-service";
import type { CallClaudeResult } from "./claude-service";

/** Input attributes for generating a property description */
export type PropertyDescriptionInput = Readonly<{
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  features: string[];
  location: string;
  price: number;
  tenure?: "freehold" | "leasehold";
}>;

/** Options for description generation */
export type GenerateDescriptionOptions = Readonly<{
  userId: string;
  listing: PropertyDescriptionInput;
  tone: Tone;
}>;

/**
 * Formats property attributes into a structured user message for the AI.
 */
export function buildUserMessage(attrs: PropertyDescriptionInput): string {
  const priceFormatted = attrs.price.toLocaleString("en-GB");
  const featuresList = attrs.features.join(", ");
  const tenureLine = attrs.tenure ? `Tenure: ${attrs.tenure}` : "";

  return [
    `Property type: ${attrs.propertyType}`,
    `Bedrooms: ${attrs.bedrooms}`,
    `Bathrooms: ${attrs.bathrooms}`,
    `Key features: ${featuresList}`,
    `Location: ${attrs.location}`,
    `Price: ${priceFormatted}`,
    tenureLine,
    "",
    "Please write a property listing description based on the details above.",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Generate a property description using Claude AI.
 * Returns a discriminated union — callers should branch on `result.ok` and
 * surface `result.userMessage` when degrading gracefully.
 */
export async function generatePropertyDescription(
  options: GenerateDescriptionOptions,
): Promise<CallClaudeResult<unknown>> {
  const systemPrompt = getDescriptionPrompt(options.tone);
  const userMessage = buildUserMessage(options.listing);

  return callClaude({
    feature: "property_description",
    userId: options.userId,
    systemPrompt,
    userMessage,
    maxTokens: 512,
  });
}
