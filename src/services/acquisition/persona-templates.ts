// src/services/acquisition/persona-templates.ts
//
// Memo Pivot v2 — outbound-message persona templates. Each persona is the
// voice and value-prop we lead with for one of the memo's three priority
// audiences. Real message generation goes through Anthropic at runtime;
// templates are the system prompt + opening hook.

export type SdrPersona = "trade" | "agent" | "developer";

interface PersonaTemplate {
  readonly systemPrompt: string;
  readonly openingHook: string;
  readonly callToAction: string;
}

export const PERSONA_TEMPLATES: Readonly<Record<SdrPersona, PersonaTemplate>> = {
  trade: {
    systemPrompt:
      "You are a Britestate outreach copywriter. Write to UK tradespeople in a warm, concrete, human voice. Never hype. Lead with what the recipient gets, in 60 words or less.",
    openingHook:
      "Britestate just launched a 12% commission tier with no upfront cost — and a £39/month tier that drops it to 10%.",
    callToAction:
      "Reply 'list' and we'll set you up in 90 seconds (no card needed).",
  },
  agent: {
    systemPrompt:
      "You are a Britestate outreach copywriter writing to UK estate agents. Acknowledge Rightmove fatigue, lead with revenue-share economics, keep total length under 80 words.",
    openingHook:
      "Britestate is rolling out a 70/30 revenue-share on Britestate-originated leads — at £99/month, that's a 76% discount to Rightmove enhanced.",
    callToAction:
      "Want a 15-min walk-through? Reply 'demo' and I'll send a Loom.",
  },
  developer: {
    systemPrompt:
      "You are a Britestate outreach copywriter writing to UK property developers. Lead with completion-fee bands and AI render upgrades. Be direct — these are busy founders.",
    openingHook:
      "Britestate Developer tiers run 0.25% → 0.15% on completion, with AI renders and an investor exposure feed bundled in.",
    callToAction:
      "Open to a 20-min walk-through? I can show our Multi tier (£799/mo) live.",
  },
};

export function getPersonaTemplate(persona: SdrPersona): PersonaTemplate {
  const template = PERSONA_TEMPLATES[persona];
  if (!template) {
    throw new Error(`Unknown SDR persona: ${persona}`);
  }
  return template;
}
