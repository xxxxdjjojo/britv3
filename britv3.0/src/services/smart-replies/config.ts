/**
 * Static smart reply configuration.
 * Maps conversation types and keywords to pre-defined reply suggestions.
 * Zero AI cost -- pure config-driven matching.
 */

export const CONVERSATION_TYPE_REPLIES: Readonly<Record<string, readonly string[]>> = {
  viewing_request: [
    "I'd love to arrange a viewing",
    "What times are available?",
    "Is the property still available?",
    "Can I bring someone along?",
  ],
  quote_response: [
    "Thank you for the quote",
    "Can you break down the costs?",
    "When could you start?",
    "I'd like to proceed",
  ],
  offer_discussion: [
    "I'd like to make an offer",
    "What's the asking price?",
    "Is there room for negotiation?",
    "Has there been much interest?",
  ],
  maintenance: [
    "The issue is urgent",
    "When can someone visit?",
    "I've attached photos",
    "This has been ongoing",
  ],
  general: [
    "Thank you for getting back to me",
    "Could you provide more details?",
    "When would be convenient to discuss?",
    "I'll get back to you shortly",
  ],
};

export const KEYWORD_REPLIES: Readonly<Record<string, readonly string[]>> = {
  price: [
    "What's the asking price?",
    "Is there room for negotiation?",
    "I'd like to make an offer",
  ],
  urgent: [
    "The issue is urgent",
    "Can this be dealt with today?",
    "This needs immediate attention",
  ],
  available: [
    "Is the property still available?",
    "When can I view it?",
    "I'm very interested",
  ],
  repair: [
    "When can someone visit?",
    "I've attached photos of the issue",
    "This needs fixing urgently",
  ],
  viewing: [
    "I'd love to arrange a viewing",
    "What times are available?",
    "Can I bring someone along?",
  ],
};

export const MAX_SUGGESTIONS = 4;
