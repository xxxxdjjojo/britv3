import {
  CONVERSATION_TYPE_REPLIES,
  KEYWORD_REPLIES,
  MAX_SUGGESTIONS,
} from "./config";

/**
 * Get suggested reply strings based on conversation type and message content.
 * Pure function -- no API calls, no async. Zero AI cost.
 *
 * 1. Looks up type-specific suggestions from config
 * 2. Scans message content for keyword matches
 * 3. Deduplicates and returns max 4 suggestions
 */
export function getSuggestedReplies(
  conversationType: string,
  messageContent: string,
): string[] {
  const suggestions: string[] = [];

  // 1. Type-specific suggestions
  const typeReplies = CONVERSATION_TYPE_REPLIES[conversationType];
  if (typeReplies) {
    suggestions.push(...typeReplies);
  } else {
    // Fallback to general for unknown types
    const generalReplies = CONVERSATION_TYPE_REPLIES["general"];
    if (generalReplies) {
      suggestions.push(...generalReplies);
    }
  }

  // 2. Keyword-based suggestions from message content
  if (messageContent) {
    const lowerContent = messageContent.toLowerCase();
    for (const [keyword, replies] of Object.entries(KEYWORD_REPLIES)) {
      if (lowerContent.includes(keyword)) {
        suggestions.push(...replies);
      }
    }
  }

  // 3. Deduplicate
  const unique = [...new Set(suggestions)];

  // 4. Return max MAX_SUGGESTIONS
  return unique.slice(0, MAX_SUGGESTIONS);
}
