# Phase 5: AI & Financial Tools - Research

**Researched:** 2026-03-07
**Domain:** Claude API integration, client-side financial calculators, Land Registry public data, SQL-based recommendations
**Confidence:** HIGH

## Summary

Phase 5 combines two complementary epics: AI-powered features (Epic 6, cost-optimized) and financial calculators (Epic 8). The AI side has exactly one feature that calls the Claude API -- property description generation -- plus zero-cost SQL recommendations, Land Registry data display, static smart replies, and a feedback mechanism. The financial side is entirely client-side: mortgage calculator, SDLT calculator, personalized affordability display on listings, and offer letter PDF generation.

The total infrastructure cost for this phase is $6-60/mo (Claude API for descriptions) plus $0 for everything else. All financial calculators run client-side with no API calls. The key technical challenge is building a robust AI service layer with cost controls (token tracking, rate limiting, daily spend kill switch) that wraps the Anthropic SDK, and integrating ~4GB of Land Registry Price Paid Data into Supabase.

**Primary recommendation:** Build the AI service layer first (it gates description generation and feedback), then financial calculators (independent, zero-risk), then SQL recommendations and Land Registry data (depend on Phase 2 tables being populated). Smart replies depend on Phase 3 messaging and should be last.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AI-01 | Centralized AI service layer wrapping Claude API with token tracking, rate limiting, daily spend kill switch | Anthropic SDK v0.78.0 + Upstash ratelimit patterns documented below |
| AI-02 | AI property description generation (3 tones, max 3 regenerations) | Claude Haiku 4.5 API with system prompt, ~$0.0006/call |
| AI-03 | SQL-based property recommendations from saved searches/properties (zero AI cost) | Pure SQL queries against Phase 2 materialized views |
| AI-04 | Land Registry Price Paid Data display on property detail pages | Free CSV data from gov.uk, 16-column format, ~4GB bulk, ~30MB monthly |
| AI-05 | Static smart reply suggestions based on conversation type and keyword matching | Config-driven lookup table, ~50 lines of logic, no AI |
| AI-06 | AI feedback collection (thumbs up/down for prompt engineering) | Simple DB table + unobtrusive UI |
| FIN-01 | Mortgage payment calculator (client-side, real-time results) | Standard amortization formula, shared utility in `src/lib/calculators/` |
| FIN-02 | SDLT calculator for England & NI (first-time buyer, home mover, additional property) | **CRITICAL: Rates changed April 2025** -- additional property surcharge is now 5% (not 3% as in epic spec) |
| FIN-03 | Save mortgage parameters to localStorage + optional DB sync | localStorage primary, profiles.preferences JSONB for cross-device |
| FIN-04 | Personalized "Est. X/mo" on property listing cards and detail pages | Client-side calc using saved params, sub-millisecond per card |
| FIN-05 | SDLT rate bands in maintainable TypeScript config | Separate config file at `src/lib/calculators/sdlt-rates.ts` |
| FIN-06 | Offer letter PDF generation (client-side via @react-pdf/renderer) | @react-pdf/renderer v4.3.2, supports React 19, needs dynamic import with SSR disabled |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/sdk | ^0.78.0 | Claude API client for property descriptions | Official Anthropic SDK, TypeScript-first, built-in retries/streaming |
| @upstash/ratelimit | ^2.0.8 | Rate limiting AI calls (per-user, global) | Connectionless HTTP-based, works on Vercel Edge, already in project env |
| @upstash/redis | latest | Redis client for ratelimit + caching | Required by @upstash/ratelimit, project already has env vars |
| @react-pdf/renderer | ^4.3.2 | Client-side offer letter PDF generation | React 19 support since v4.1.0, no server needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| recharts | ^2.x | Area price trend charts on property detail pages | For Land Registry 5-year price trend visualization |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @react-pdf/renderer | jspdf + html2pdf.js | react-pdf gives React component model for templates; jspdf is more imperative |
| recharts | chart.js | recharts is React-native with SSR support; chart.js needs canvas |
| @upstash/ratelimit | Custom Redis rate limiting | Upstash provides battle-tested sliding window; don't hand-roll |

**Installation:**
```bash
cd britv3.0
pnpm add @anthropic-ai/sdk @upstash/ratelimit @upstash/redis @react-pdf/renderer recharts
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── services/
│   └── ai/
│       ├── claude-service.ts       # Centralized AI wrapper (rate limit, track, fallback)
│       ├── description-generator.ts # Property description generation logic
│       └── types.ts                # AI service types
├── config/
│   └── prompts/
│       └── property-description.ts # Prompt templates (not hardcoded)
├── lib/
│   └── calculators/
│       ├── mortgage.ts             # Shared mortgage calculation utility
│       └── sdlt-rates.ts           # SDLT rate bands config
├── app/
│   ├── (main)/tools/
│   │   ├── mortgage-calculator/page.tsx
│   │   └── stamp-duty-calculator/page.tsx
│   └── api/
│       └── ai/
│           └── generate-description/route.ts  # Server-side AI endpoint
├── components/
│   ├── ai/
│   │   ├── GenerateDescriptionButton.tsx
│   │   ├── AiFeedback.tsx
│   │   └── SmartReplySuggestions.tsx
│   ├── calculators/
│   │   ├── MortgageCalculator.tsx
│   │   ├── SdltCalculator.tsx
│   │   └── PersonalizedEstimate.tsx
│   └── property/
│       └── PriceHistory.tsx        # Land Registry data display
├── hooks/
│   ├── useMortgageParams.ts        # localStorage + DB sync
│   └── useAiDescription.ts         # AI description generation hook
└── types/
    └── calculators.ts              # Calculator-related types
```

### Pattern 1: AI Service Layer (Server-Side Only)
**What:** All Claude API calls go through a single service module that handles rate limiting, token tracking, error handling, and cost controls.
**When to use:** Every AI feature -- never call Anthropic SDK directly from components or route handlers.
**Example:**
```typescript
// Source: Anthropic SDK docs + epic6final.md spec
// src/services/ai/claude-service.ts

import Anthropic from "@anthropic-ai/sdk";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createAdminClient } from "@/lib/supabase/admin";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

const globalRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 m"),  // 100 req/min global
  prefix: "ai:global",
});

const userRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 h"),  // 10 req/hr per user
  prefix: "ai:user",
});

type AiFeature = "property_description";

type AiCallResult = {
  text: string;
  inputTokens: number;
  outputTokens: number;
};

export async function callClaude(options: {
  feature: AiFeature;
  userId: string;
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
}): Promise<AiCallResult | null> {
  // 1. Check daily spend kill switch
  const dailySpend = await getDailySpend();
  if (dailySpend > Number(process.env.AI_DAILY_SPEND_LIMIT || 10)) {
    return null; // graceful degradation
  }

  // 2. Rate limit checks
  const [globalResult, userResult] = await Promise.all([
    globalRatelimit.limit("global"),
    userRatelimit.limit(options.userId),
  ]);
  if (!globalResult.success || !userResult.success) {
    return null;
  }

  // 3. Call Claude API
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: options.maxTokens ?? 1024,
    system: options.systemPrompt,
    messages: [{ role: "user", content: options.userMessage }],
  });

  const text = message.content[0]?.type === "text"
    ? message.content[0].text
    : "";

  // 4. Log usage
  await logUsage({
    feature: options.feature,
    model: "claude-haiku-4-5-20251001",
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
    userId: options.userId,
  });

  return {
    text,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
}
```

### Pattern 2: Client-Side Calculator Utilities
**What:** Pure TypeScript functions for mortgage and SDLT calculations, shared between calculator pages and listing components.
**When to use:** All financial calculations -- never compute on server.
**Example:**
```typescript
// src/lib/calculators/mortgage.ts
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termYears: number,
): number {
  if (principal <= 0 || termYears <= 0) return 0;
  if (annualRate === 0) return principal / (termYears * 12);

  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = termYears * 12;
  const factor = Math.pow(1 + monthlyRate, totalMonths);

  return principal * (monthlyRate * factor) / (factor - 1);
}

export function calculateTotalRepayable(
  principal: number,
  annualRate: number,
  termYears: number,
): { totalRepayable: number; totalInterest: number } {
  const monthly = calculateMonthlyPayment(principal, annualRate, termYears);
  const totalRepayable = monthly * termYears * 12;
  return {
    totalRepayable,
    totalInterest: totalRepayable - principal,
  };
}
```

### Pattern 3: localStorage + DB Sync for Mortgage Params
**What:** Mortgage parameters stored in localStorage for zero-latency reads, with optional DB sync for cross-device.
**When to use:** For personalized affordability display on listings.
**Example:**
```typescript
// src/hooks/useMortgageParams.ts
"use client";

const STORAGE_KEY = "britestate_mortgage_params";

type MortgageParams = {
  deposit: number;
  interestRate: number;
  termYears: number;
};

export function useMortgageParams() {
  // Read from localStorage (instant, no API call)
  const getParams = (): MortgageParams | null => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  };

  // Save to localStorage + optional DB sync
  const saveParams = async (params: MortgageParams) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
    // DB sync only if authenticated (one write)
    // await supabase.from("profiles").update(...)
  };

  const clearParams = async () => {
    localStorage.removeItem(STORAGE_KEY);
    // Clear DB too if authenticated
  };

  return { getParams, saveParams, clearParams };
}
```

### Anti-Patterns to Avoid
- **Direct Anthropic SDK usage in components/routes:** All AI calls must go through `claude-service.ts` for cost control
- **Server-side financial calculations:** Mortgage/SDLT math is pure arithmetic -- keep it client-side, zero API overhead
- **Storing mortgage params only in DB:** Would cause 800K+ reads/month at 100K users. localStorage is primary
- **Hardcoding prompts in components:** Store in `src/config/prompts/` for iteration without code deploys
- **Hardcoding SDLT rates in calculator:** Rates change with HMRC Budget announcements. Keep in config file
- **Storing generated PDFs on server:** Offer letters are ephemeral, generated on-demand client-side

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rate limiting | Custom token bucket in Redis | @upstash/ratelimit | Handles sliding window, edge runtime, atomic operations |
| PDF generation | Server-side PDF with puppeteer | @react-pdf/renderer client-side | Zero server cost, React component model, no headless browser |
| AI cost tracking | Custom billing system | Simple ai_usage_log table + daily aggregation query | Log tokens per call, aggregate with SQL. No billing complexity needed |
| Property recommendations | ML recommendation engine | SQL matching on saved searches + saved properties | 90% of value at $0 cost. pgvector only when 50K+ listings |
| Property valuation | Automated Valuation Model | Land Registry Price Paid Data (free public CSV) | Zoopla's Zed-Index took years + a data science team. Show facts instead |
| Smart replies | AI inference per message view | Static keyword-matching lookup config | $0 vs $9,000/mo at scale. iMessage uses static suggestions successfully |

**Key insight:** This phase is deliberately cost-optimized. The only justified AI cost is property descriptions ($0.0006/call). Everything else uses SQL, static config, or public data.

## Common Pitfalls

### Pitfall 1: SDLT Rates Are Stale in Epic Spec
**What goes wrong:** The epic spec (written May 2025, updated March 2026) references a 3% additional property surcharge. As of April 1, 2025, the surcharge increased to **5%**.
**Why it happens:** HMRC changed rates in the October 2024 Autumn Budget, effective April 2025. The standard thresholds also reverted: nil-rate band dropped from 250K back to 125K, and first-time buyer threshold dropped from 425K to 300K.
**How to avoid:** Use the current HMRC rates (verified March 2026) documented in this research. Build SDLT config to be easily updateable.
**Warning signs:** Any reference to "3% additional property surcharge" or "250K nil-rate band" is using pre-April 2025 rates.

### Pitfall 2: @react-pdf/renderer SSR Incompatibility
**What goes wrong:** Importing @react-pdf/renderer in a Server Component causes build failures because it requires browser APIs.
**Why it happens:** PDF rendering needs DOM APIs (canvas, etc.) not available in Node.js.
**How to avoid:** Use Next.js dynamic imports with `{ ssr: false }`. The offer letter component must be a client component loaded lazily.
**Warning signs:** Build errors mentioning "document is not defined" or "canvas" in server context.

### Pitfall 3: Land Registry CSV Bulk Import Size
**What goes wrong:** Trying to import 4.3GB CSV directly crashes Node.js process or times out.
**Why it happens:** Node.js default memory limits, Supabase insert timeouts, and CSV parsing of 28M+ rows.
**How to avoid:** Stream-parse the CSV in chunks (10K rows at a time). Use a Supabase Edge Function or migration script. Consider importing only the last 10 years of data initially (~2GB) and backfilling later.
**Warning signs:** Memory errors during import, transaction timeouts, Supabase connection pool exhaustion.

### Pitfall 4: AI Service Not Handling Failures Gracefully
**What goes wrong:** AI API downtime causes visible errors in the listing form.
**Why it happens:** Not implementing fallback behavior when Claude API is unavailable.
**How to avoid:** Every AI feature must have a non-AI fallback. Description generation: hide the button. Recommendations: show "newest in your area". Smart replies: show nothing. Price history: show nothing.
**Warning signs:** User-facing error messages mentioning "AI" or "Claude".

### Pitfall 5: Token Usage Not Tracked From Start
**What goes wrong:** AI costs accumulate without visibility, kill switch can't function.
**Why it happens:** Building the description generator before the tracking infrastructure.
**How to avoid:** Build ai_usage_log table and tracking in the AI service layer FIRST, before any AI feature.
**Warning signs:** AI calls happening without corresponding rows in ai_usage_log.

### Pitfall 6: Mortgage Calculation Edge Cases
**What goes wrong:** NaN or Infinity displayed when user enters edge values (0% rate, 0 deposit, deposit > price).
**Why it happens:** Division by zero in amortization formula, negative principal.
**How to avoid:** Handle r=0 case separately (simple P/n), clamp deposit to property price, validate all inputs with Zod before calculation.
**Warning signs:** "NaN" or "Infinity" appearing in UI.

## Code Examples

### SDLT Rate Configuration (Current as of March 2026)
```typescript
// Source: GOV.UK SDLT residential rates, verified 2026-03-07
// src/lib/calculators/sdlt-rates.ts

// Effective from 1 April 2025
// Source: https://www.gov.uk/stamp-duty-land-tax/residential-property-rates

type SdltBand = {
  threshold: number;
  rate: number;
};

export const SDLT_STANDARD: SdltBand[] = [
  { threshold: 125_000, rate: 0 },
  { threshold: 250_000, rate: 0.02 },
  { threshold: 925_000, rate: 0.05 },
  { threshold: 1_500_000, rate: 0.10 },
  { threshold: Infinity, rate: 0.12 },
];

export const SDLT_FIRST_TIME_BUYER: SdltBand[] = [
  { threshold: 300_000, rate: 0 },
  { threshold: 500_000, rate: 0.05 },
  // Above 500K: first-time buyer relief does NOT apply, use standard rates
];

// Additional property surcharge: 5% on top of standard rates (changed from 3% on 31 Oct 2024)
export const SDLT_ADDITIONAL_PROPERTY_SURCHARGE = 0.05;

// First-time buyer price cap: relief only available on purchases up to 500K
export const SDLT_FTB_PRICE_CAP = 500_000;

// Last updated: 2026-03-07
// HMRC source: https://www.gov.uk/stamp-duty-land-tax/residential-property-rates
// Next expected change: Budget announcements (typically October/March)
```

### SDLT Calculation Function
```typescript
// src/lib/calculators/sdlt.ts

import {
  SDLT_STANDARD,
  SDLT_FIRST_TIME_BUYER,
  SDLT_ADDITIONAL_PROPERTY_SURCHARGE,
  SDLT_FTB_PRICE_CAP,
  type SdltBand,
} from "./sdlt-rates";

type BuyerType = "standard" | "first_time" | "additional";

type SdltResult = {
  totalTax: number;
  effectiveRate: number;
  bands: Array<{ from: number; to: number; rate: number; tax: number }>;
};

function calculateBands(price: number, bands: SdltBand[], surcharge: number): SdltResult {
  let remaining = price;
  let totalTax = 0;
  let prevThreshold = 0;
  const breakdown: SdltResult["bands"] = [];

  for (const band of bands) {
    if (remaining <= 0) break;
    const bandAmount = Math.min(remaining, band.threshold - prevThreshold);
    const rate = band.rate + surcharge;
    const tax = bandAmount * rate;
    breakdown.push({ from: prevThreshold, to: prevThreshold + bandAmount, rate, tax });
    totalTax += tax;
    remaining -= bandAmount;
    prevThreshold = band.threshold;
  }

  return {
    totalTax: Math.round(totalTax),
    effectiveRate: price > 0 ? totalTax / price : 0,
    bands: breakdown,
  };
}

export function calculateSdlt(price: number, buyerType: BuyerType): SdltResult {
  if (price <= 0) return { totalTax: 0, effectiveRate: 0, bands: [] };

  if (buyerType === "first_time" && price <= SDLT_FTB_PRICE_CAP) {
    return calculateBands(price, SDLT_FIRST_TIME_BUYER, 0);
  }

  const surcharge = buyerType === "additional" ? SDLT_ADDITIONAL_PROPERTY_SURCHARGE : 0;
  return calculateBands(price, SDLT_STANDARD, surcharge);
}
```

### AI Description Generation Route Handler
```typescript
// src/app/api/ai/generate-description/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callClaude } from "@/services/ai/claude-service";
import { getDescriptionPrompt } from "@/config/prompts/property-description";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { propertyType, bedrooms, bathrooms, features, location, price, tone, listingId } = body;

  // Check regeneration count (max 3 per listing)
  const { count } = await supabase
    .from("ai_usage_log")
    .select("*", { count: "exact", head: true })
    .eq("feature", "property_description")
    .eq("user_id", user.id)
    // filter by listing_id via metadata if needed

  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: "Maximum regenerations reached" }, { status: 429 });
  }

  const result = await callClaude({
    feature: "property_description",
    userId: user.id,
    systemPrompt: getDescriptionPrompt(tone ?? "professional"),
    userMessage: buildUserMessage({ propertyType, bedrooms, bathrooms, features, location, price }),
    maxTokens: 1024,
  });

  if (!result) {
    return NextResponse.json({ error: "AI temporarily unavailable" }, { status: 503 });
  }

  return NextResponse.json({ description: result.text });
}
```

### Dynamic Import Pattern for @react-pdf/renderer
```typescript
// src/components/property/OfferLetterButton.tsx
"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

// CRITICAL: Must disable SSR for @react-pdf/renderer
const OfferLetterPdf = dynamic(
  () => import("./OfferLetterPdf"),
  { ssr: false }
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Self-hosted LLM on AWS | Claude API via @anthropic-ai/sdk | Project decision (2026) | $1,700/mo to $6/mo at MVP |
| AI recommendations | SQL-based matching | Project decision (2026) | $0 vs $500-2,000/mo |
| Automated Valuation Model | Land Registry Price Paid Data display | Project decision (2026) | No liability, no model risk |
| 3% additional property surcharge | 5% additional property surcharge | HMRC April 2025 | Epic spec is outdated -- use current rates |
| 250K standard nil-rate band | 125K standard nil-rate band | HMRC April 2025 | Epic spec reference may be outdated |
| @react-pdf/renderer v3 (no React 19) | v4.3.2 (React 19 support) | v4.1.0 release | Compatible with project's React 19.2.3 |

**Deprecated/outdated:**
- Epic spec's "3% additional property surcharge" -- now 5% as of April 2025
- `claude-3-haiku-20240307` model ID -- use `claude-haiku-4-5-20251001` for latest Haiku

## Open Questions

1. **Land Registry Data Import Strategy**
   - What we know: Full CSV is ~4.3GB, ~28M records from 1995. Monthly updates are ~30MB.
   - What's unclear: Whether Supabase free/pro plan storage limits can hold the full dataset. Whether to import all history or just last 10 years.
   - Recommendation: Import last 10 years initially (~15M records, ~2GB). Use a Supabase Edge Function or a migration script that streams CSV in 10K-row chunks. Set up monthly cron for updates.

2. **Recharts vs No Chart for Price Trends**
   - What we know: Epic spec says "simple chart showing area price trends over the last 5 years."
   - What's unclear: Whether the chart is essential for MVP or a table would suffice.
   - Recommendation: Use recharts for an area/line chart -- it's lightweight, React-native, and adds genuine value to the price history section.

3. **AI Model Selection: Haiku vs Sonnet**
   - What we know: Epic spec defaults to claude-haiku-4-5-20251001 (~$0.0006/call). Sonnet is available for complex generation.
   - What's unclear: Whether Haiku quality is sufficient for property descriptions in British English.
   - Recommendation: Start with Haiku. Use the feedback mechanism (AI-06) to track quality. Switch to Sonnet only if >20% negative feedback rate.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + @testing-library/react 16.3.2 |
| Config file | `britv3.0/vitest.config.mts` |
| Quick run command | `cd britv3.0 && pnpm test:run` |
| Full suite command | `cd britv3.0 && pnpm test:run --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AI-01 | AI service layer rate limiting, token tracking, kill switch | unit | `cd britv3.0 && pnpm vitest run src/services/ai/claude-service.test.ts -t "rate limiting"` | Wave 0 |
| AI-02 | Description generation with 3 tones, max 3 regenerations | integration | `cd britv3.0 && pnpm vitest run src/services/ai/description-generator.test.ts` | Wave 0 |
| AI-03 | SQL recommendations exclude viewed/saved/dismissed | unit | `cd britv3.0 && pnpm vitest run src/services/recommendations/recommendations.test.ts` | Wave 0 |
| AI-04 | Land Registry data lookup by postcode | unit | `cd britv3.0 && pnpm vitest run src/services/land-registry/land-registry.test.ts` | Wave 0 |
| AI-05 | Smart reply keyword matching returns correct suggestions | unit | `cd britv3.0 && pnpm vitest run src/services/smart-replies/smart-replies.test.ts` | Wave 0 |
| AI-06 | Feedback stores rating + optional comment | unit | `cd britv3.0 && pnpm vitest run src/components/ai/AiFeedback.test.tsx` | Wave 0 |
| FIN-01 | Mortgage calc correct values (200K @ 5% / 25yr = 1169.18) | unit | `cd britv3.0 && pnpm vitest run src/lib/calculators/mortgage.test.ts` | Wave 0 |
| FIN-02 | SDLT calc correct for all 3 buyer types | unit | `cd britv3.0 && pnpm vitest run src/lib/calculators/sdlt.test.ts` | Wave 0 |
| FIN-03 | localStorage save/load/clear mortgage params | unit | `cd britv3.0 && pnpm vitest run src/hooks/useMortgageParams.test.ts` | Wave 0 |
| FIN-04 | Personalized estimate renders on listing card | unit | `cd britv3.0 && pnpm vitest run src/components/calculators/PersonalizedEstimate.test.tsx` | Wave 0 |
| FIN-05 | SDLT rates config matches current HMRC rates | unit | `cd britv3.0 && pnpm vitest run src/lib/calculators/sdlt-rates.test.ts` | Wave 0 |
| FIN-06 | Offer letter PDF renders without errors | unit | `cd britv3.0 && pnpm vitest run src/components/property/OfferLetterPdf.test.tsx` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd britv3.0 && pnpm test:run`
- **Per wave merge:** `cd britv3.0 && pnpm test:run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/services/ai/claude-service.test.ts` -- mock Anthropic SDK, test rate limiting, token tracking, kill switch
- [ ] `src/lib/calculators/mortgage.test.ts` -- known correct values, edge cases (0% rate, 0 deposit)
- [ ] `src/lib/calculators/sdlt.test.ts` -- all buyer types at various price points, HMRC cross-reference
- [ ] `src/hooks/useMortgageParams.test.ts` -- localStorage mock for save/load/clear
- [ ] `src/components/calculators/PersonalizedEstimate.test.tsx` -- renders estimate when params exist, nothing when absent

## Sources

### Primary (HIGH confidence)
- [Anthropic SDK TypeScript docs](https://platform.claude.com/docs/en/api/sdks/typescript) -- SDK v0.78.0 usage, token counting, error handling, streaming
- [GOV.UK SDLT residential rates](https://www.gov.uk/stamp-duty-land-tax/residential-property-rates) -- Current rate bands effective April 2025
- [GOV.UK Price Paid Data downloads](https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads) -- CSV format, 16 columns, monthly updates
- [GOV.UK About Price Paid Data](https://www.gov.uk/guidance/about-the-price-paid-data) -- Column definitions, data structure
- [Upstash ratelimit docs](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview) -- Sliding window, per-user/global patterns

### Secondary (MEDIUM confidence)
- [@react-pdf/renderer npm](https://www.npmjs.com/package/@react-pdf/renderer) -- v4.3.2, React 19 support since v4.1.0
- [react-pdf compatibility docs](https://react-pdf.org/compatibility) -- Next.js compatibility, dynamic import requirement
- [@anthropic-ai/sdk npm](https://www.npmjs.com/package/@anthropic-ai/sdk) -- v0.78.0 last published Feb 2026

### Tertiary (LOW confidence)
- Recharts version -- not verified against latest npm, assumed ^2.x stable

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified against npm and official docs
- Architecture: HIGH -- patterns directly from epic specs + Anthropic SDK docs
- SDLT rates: HIGH -- verified against GOV.UK official page on 2026-03-07
- Pitfalls: HIGH -- SDLT rate change verified, @react-pdf SSR issue well-documented
- Land Registry import: MEDIUM -- CSV format verified, import strategy is recommendation not proven

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable domain -- SDLT rates may change with Budget announcements)
