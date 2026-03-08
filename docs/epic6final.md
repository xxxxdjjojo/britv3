# Epic 6 Final: AI-Powered Features (Cost-Optimized)

**Epic Number:** E06
**Epic Title:** AI-Powered Features Implementation
**Date Created:** May 13, 2025
**Last Updated:** March 7, 2026
**Status:** Revised -- Cost-Optimized for Pre-Revenue Startup

---

## Executive Summary

This is a complete rewrite of the original Epic 6 spec. The original proposed self-hosting a 7B parameter LLM on AWS GPU instances ($1,700+/mo at zero users), routing AI through Twilio SMS/WhatsApp ($3,000-4,750/mo), building an AVM from scratch (6+ months of data engineering), and firing an AI inference call on every search query, every message view, and every review submission.

**Total original spec cost at 100K users: $8,500-28,000/mo in AI infrastructure alone.**

This rewrite reduces that to **$50-200/mo** by applying three rules:

1. **Use Claude API (already in the stack) -- never self-host until API costs exceed $2,000/mo consistently**
2. **Don't use AI where rules, templates, or simple SQL work**
3. **Every AI call must justify its cost per invocation against the human time it saves**

The single AI feature worth building at MVP is **AI property description generation** (E06-S06). Everything else is deferred, replaced with cheaper alternatives, or restructured as a premium feature.

---

## 1. Goals (Revised)

1. Deliver one high-value AI feature at launch: AI-generated property descriptions that save agents 10+ minutes per listing and drive platform adoption.
2. Lay the groundwork for future AI features with a clean, API-based architecture that costs near-zero at low volume and scales linearly.
3. Avoid all self-hosted AI infrastructure, GPU instances, and per-message external channels (Twilio) until post-revenue.
4. Replace AI with smarter defaults wherever possible: template-based quote builders, SQL-based recommendations, static smart reply suggestions, and public data for valuations.

---

## 2. Scope

### In Scope (MVP -- Phase 4)

| ID | Feature | AI Required? | Cost Profile |
|----|---------|-------------|-------------|
| E06-S01 | AI service layer (Claude API integration) | Yes | ~$0/mo at low volume |
| E06-S06 | AI property description generation | Yes | ~$6/mo at 10K listings |
| E06-S08 | Property recommendations | No -- SQL matching | $0 |
| E06-S09 | Property valuation display | No -- Land Registry data | $0 |
| E06-S10 | Smart reply suggestions | No -- static lookup | $0 |
| E06-S12 | AI feedback mechanism | No -- simple UI + table | $0 |

### Deferred (Post-Revenue -- Phase 7+)

| ID | Feature | Why Deferred | Trigger to Build |
|----|---------|-------------|-----------------|
| E06-S03 | AI assistant via SMS/WhatsApp | Twilio costs $3K-5K/mo | Revenue from premium subscriptions covers Twilio |
| E06-S04 | AI quote drafting | Template builder covers 90% | Provider feedback requests AI-assisted quoting |
| E06-S05 | Intent/sentiment classification | Rule-based routing works | 100K+ messages/month with human routing bottleneck |
| E06-S07 | NLP natural language search | Structured search works | User research shows search abandonment from filter UX |
| E06-S11 | AI assistant configuration panel | No AI assistant at MVP | AI assistant ships |

### Out of Scope (Unchanged)

- Predictive market analytics beyond AVM
- Full unsupervised AI autonomy
- AI document/contract analysis
- Voice-controlled AI interactions
- AR features powered by AI
- Self-hosted LLM infrastructure (until API costs exceed $2,000/mo)
- Fine-tuning or model retraining pipelines

---

## 3. Architecture Decision: API vs. Self-Hosted

### The Numbers

| Approach | Cost at MVP (5K requests/mo) | Cost at 100K users | Cost at 1M users |
|----------|----------------------------|-------------------|-----------------|
| Self-hosted DeepSeek on AWS | **$1,700/mo** | **$3,600-8,700/mo** | **$21,000+/mo** |
| Claude Haiku 4.5 API | **$6/mo** | **$80/mo** | **$600/mo** |
| DeepSeek hosted API | **$2/mo** | **$30/mo** | **$250/mo** |

Self-hosting breaks even at ~280,000 API requests/month. That is post product-market fit territory. Until then, every dollar spent on GPU instances is a dollar not spent on acquiring users.

### Decision

Use **Claude API via Anthropic SDK** (already specified in CLAUDE.md and the project tech stack). Two models:

| Model | Use Case | Cost per 1M input tokens | Cost per 1M output tokens |
|-------|----------|------------------------|-------------------------|
| Claude Haiku 4.5 | Property descriptions, smart features | $0.80 | $4.00 |
| Claude Sonnet 4.6 | Complex generation (future) | $3.00 | $15.00 |

Default to Haiku for everything. Sonnet only when Haiku quality is insufficient for a specific task.

### Migration Trigger

Revisit self-hosting when:
- Monthly Claude API spend exceeds $2,000/mo for 3 consecutive months
- You have a dedicated DevOps engineer to maintain GPU infrastructure
- You need custom model behavior that prompt engineering cannot achieve

---

## 4. User Stories & Acceptance Criteria

### E06-S01: AI Service Layer (Claude API Integration)

**User Story:** As a Developer, I want a centralized AI service layer that wraps the Claude API with rate limiting, error handling, cost tracking, and prompt management, so all AI features use a consistent, cost-controlled interface.

**Priority:** Must
**Status:** To Do
**Estimated effort:** 2-3 days

**What this replaces:** The original E06-S01 called for deploying DeepSeek on AWS with Docker, auto-scaling, API Gateway, CloudWatch, and a CI/CD pipeline. That entire infrastructure is eliminated.

**Acceptance Criteria:**

1. A service module at `src/services/ai/claude-service.ts` wraps the Anthropic SDK with:
   - Model selection (default: `claude-haiku-4-5-20251001`)
   - System prompt management (loaded from config, not hardcoded)
   - Token usage tracking (log input/output tokens per call to a `ai_usage_log` table)
   - Error handling with graceful fallbacks (if Claude API is down, feature degrades silently -- no user-facing errors)
   - Rate limiting via Upstash Redis (max 100 requests/minute globally, adjustable)

2. Environment variable `ANTHROPIC_API_KEY` is validated at build time (already in `.env.example`).

3. All AI calls go through this service -- no direct Anthropic SDK usage in components or route handlers.

4. A monthly cost dashboard query exists:
   ```sql
   SELECT
     DATE_TRUNC('day', created_at) AS day,
     COUNT(*) AS calls,
     SUM(input_tokens) AS total_input_tokens,
     SUM(output_tokens) AS total_output_tokens,
     SUM(input_tokens * 0.0000008 + output_tokens * 0.000004) AS estimated_cost_usd
   FROM ai_usage_log
   GROUP BY day
   ORDER BY day DESC;
   ```

5. A kill switch: if daily spend exceeds a configurable threshold (default: $10), AI features return cached/default responses instead of making API calls.

**Database:**

```sql
CREATE TABLE ai_usage_log (
  id BIGSERIAL PRIMARY KEY,
  feature TEXT NOT NULL, -- 'property_description', 'nlp_search', etc.
  model TEXT NOT NULL, -- 'claude-haiku-4-5-20251001'
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  latency_ms INTEGER,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_feature_date ON ai_usage_log (feature, created_at DESC);

-- No RLS needed -- this is an internal analytics table accessed via service role only
```

**Cost at MVP:** $0/mo (table exists, no AI calls until E06-S06 is built).

---

### E06-S06: AI Property Description Generation

**User Story:** As an Estate Agent or Landlord, I want to generate an engaging property description from the listing details I've entered, so I can create professional listings in seconds instead of spending 10-15 minutes writing.

**Priority:** Must
**Status:** To Do
**Estimated effort:** 3-4 days

**This is the only AI feature that justifies its cost at MVP.** One Claude Haiku call per listing generation. At 10K listings/month: ~$6. The value: high agent adoption (saves real time), competitive differentiator vs Rightmove/Zoopla (neither offers this), and it makes the platform immediately useful to the agent persona.

**Acceptance Criteria:**

1. On the listing creation/edit form (Epic 2), a "Generate Description" button appears after the user has filled in property details (type, beds, baths, key features, location).

2. Clicking the button calls the AI service with a prompt that includes:
   - Property type, bedrooms, bathrooms, reception rooms
   - Key features (garden, parking, heating type, etc.)
   - Location (city, area)
   - Listing type (sale/rent)
   - Price
   - Any additional notes the agent typed

3. The AI returns a draft description (200-400 words) that:
   - Highlights key selling points
   - Is grammatically correct British English
   - Avoids superlatives that could breach UK advertising standards ("best", "most affordable")
   - Does not fabricate features not provided in the input
   - Includes a natural flow: opening hook, property details, location highlights, closing call-to-action

4. The user can select a tone before generating:
   - **Professional** (default) -- suitable for most listings
   - **Friendly** -- for family homes, rentals
   - **Premium** -- for luxury properties

5. The generated description appears in an editable text area. The user can:
   - Edit freely before saving
   - Click "Regenerate" for a different version (max 3 regenerations per listing to control costs)
   - Copy to clipboard

6. AI-generated descriptions are labelled internally (stored flag `is_ai_generated: boolean` on the listing) for analytics. This label is NOT shown to property searchers.

7. The generation completes in under 5 seconds (p95).

8. If the AI service is unavailable, the button is hidden or disabled with a tooltip "AI generation temporarily unavailable." The listing form works normally without it.

**Prompt Template (stored in config, not hardcoded):**

```
You are a UK estate agent writing a property listing description.

Property details:
- Type: {{property_type}}
- Bedrooms: {{bedrooms}}
- Bathrooms: {{bathrooms}}
- Reception rooms: {{reception_rooms}}
- Key features: {{features_list}}
- Location: {{city}}, {{postcode_area}}
- Listing type: {{listing_type}}
- Price: {{price}}
- Additional notes: {{agent_notes}}

Write a {{tone}} property description in 200-400 words. Use British English.
Do NOT invent features not listed above. Do NOT use superlatives like "best" or
"cheapest." Focus on factual highlights and lifestyle benefits.
```

**Cost per call:** ~$0.0006 (500 input tokens + 400 output tokens at Haiku rates).
**Cost at 10K listings/month:** ~$6.
**Cost at 100K listings/month:** ~$60.

---

### E06-S08: Property Recommendations (SQL-Based, No AI)

**User Story:** As a Homebuyer or Renter, I want to see recommended properties based on my saved searches and saved properties, so I can discover relevant listings I might have missed.

**Priority:** Must
**Status:** To Do
**Estimated effort:** 2-3 days

**What this replaces:** The original E06-S08 called for an AI recommendation engine tracking page views, scroll depth, time-on-page, and running AI inference for every user daily. At 100K active users = 3M AI calls/month + massive event tracking infrastructure.

**This version uses zero AI. Simple SQL matching provides 90% of the value at $0 cost.**

**Acceptance Criteria:**

1. A "Recommended for You" section appears on the homebuyer/renter dashboard showing up to 12 properties.

2. Recommendations are generated from two sources:

   **Source A -- Saved search matching:**
   - Query active listings that match the user's saved search criteria
   - Exclude listings the user has already viewed or saved
   - Order by newest first

   **Source B -- Similar properties:**
   - For each of the user's saved properties, find listings with:
     - Same postcode district (first half of postcode)
     - Same property type
     - Price within +/- 20%
     - Same or higher bedroom count
   - Exclude listings the user has already viewed or saved

3. Results are blended: 60% from saved search matches, 40% from similar properties. Deduplicated.

4. Recommendations refresh when the user loads their dashboard (no background job, no periodic recalculation).

5. Users can dismiss a recommendation ("Not interested"). Dismissed listings are excluded from future recommendations for that user.

**Database:**

```sql
-- Dismissed recommendations (lightweight)
CREATE TABLE dismissed_recommendations (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, listing_id)
);

ALTER TABLE dismissed_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own dismissals"
  ON dismissed_recommendations
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());
```

**Recommendation query (simplified):**

```sql
-- Saved search based recommendations
SELECT l.*
FROM search_listings l
WHERE l.listing_type = :saved_search_type
  AND l.price BETWEEN :min_price AND :max_price
  AND l.bedrooms >= :min_bedrooms
  AND (:city IS NULL OR l.city = :city)
  AND l.listing_id NOT IN (SELECT listing_id FROM saved_properties WHERE user_id = :user_id)
  AND l.listing_id NOT IN (SELECT listing_id FROM dismissed_recommendations WHERE user_id = :user_id)
  AND l.listing_id NOT IN (SELECT listing_id FROM viewing_history WHERE user_id = :user_id)
ORDER BY l.listed_date DESC
LIMIT 12;
```

**Cost:** $0/mo. Uses existing materialized view indexes.

**Future upgrade path (post-revenue):**
- Add collaborative filtering: "Users who saved this also saved..." via simple SQL aggregation on `saved_properties` table.
- Add pgvector embeddings for semantic similarity only when you have 50K+ listings and SQL matching quality plateaus.
- Add behavior tracking only when you have a dedicated analytics engineer.

---

### E06-S09: Property Valuation Display (Land Registry Data, No AI)

**User Story:** As a User, I want to see historical price data for properties and areas, so I can understand pricing context without needing to research separately.

**Priority:** Should
**Status:** To Do
**Estimated effort:** 3-4 days

**What this replaces:** The original E06-S09 called for building an Automated Valuation Model from scratch. Zoopla's Zed-Index took a dedicated data science team years to build with proprietary data from millions of listings. We are not doing that.

**This version shows free public data. No AI, no model, no estimates, no liability.**

**Acceptance Criteria:**

1. On the property detail page, a "Price History" section shows:
   - **Last sold price** and date (from HM Land Registry Price Paid Data)
   - **Area average prices** for the same property type and postcode district
   - A simple chart showing area price trends over the last 5 years

2. Data source: HM Land Registry Price Paid Data (free, public, updated monthly).
   - Bulk download: https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads
   - CSV format, ~4GB for all historical data, ~30MB monthly updates
   - Import into a `land_registry_prices` table

3. Display is clearly labelled: "Based on Land Registry records. Past sales may not reflect current market value."

4. No AI-generated estimates. No confidence scores. No "estimated value." Just facts.

5. If no Land Registry data exists for the specific address, show area averages only with a note: "No sales history found for this address."

**Database:**

```sql
CREATE TABLE land_registry_prices (
  id BIGSERIAL PRIMARY KEY,
  transaction_id TEXT UNIQUE NOT NULL, -- Land Registry unique ID
  price INTEGER NOT NULL,
  date_of_transfer DATE NOT NULL,
  postcode TEXT,
  property_type CHAR(1), -- D=Detached, S=Semi, T=Terraced, F=Flat, O=Other
  new_build BOOLEAN,
  tenure CHAR(1), -- F=Freehold, L=Leasehold
  paon TEXT, -- Primary addressable object name (house number/name)
  saon TEXT, -- Secondary addressable object name (flat number)
  street TEXT,
  locality TEXT,
  town TEXT,
  district TEXT,
  county TEXT
);

CREATE INDEX idx_lr_postcode ON land_registry_prices (postcode, date_of_transfer DESC);
CREATE INDEX idx_lr_postcode_type ON land_registry_prices (postcode, property_type, date_of_transfer DESC);
CREATE INDEX idx_lr_address ON land_registry_prices (postcode, paon, street);
```

**Data pipeline:**
- Initial bulk import: run once via a migration script or Supabase Edge Function
- Monthly updates: cron job downloads the latest monthly CSV and upserts new records
- Storage: ~4GB for full history, well within Supabase Pro plan

**Cost:** $0/mo (public data, stored in existing DB).

**Future upgrade path (post-revenue):**
- Partner with Hometrack or CoreLogic to white-label their AVM estimates. Negotiate licensing based on usage. This gives you a battle-tested model without 6 months of data engineering.
- Display partner estimates alongside Land Registry actuals: "Last sold: X. Estimated current value: Y (provided by Hometrack)."

---

### E06-S10: Smart Reply Suggestions (Static Lookup, No AI)

**User Story:** As a User, I want to see quick reply suggestions when viewing messages, so I can respond faster to common conversations.

**Priority:** Should
**Status:** To Do
**Estimated effort:** 1 day

**What this replaces:** The original E06-S10 fired an AI inference call every time a user opened a message. At 15M message views/month (500K DAU): $9,000/mo for suggestions like "Okay, thanks!"

**This version uses a static lookup table based on message context. Cost: $0.**

**Acceptance Criteria:**

1. When a user views a message, 2-3 contextual quick reply chips appear below the message input.

2. Suggestions are determined by the **conversation type** and **last message keywords**, not AI:

   | Conversation Type | Last Message Contains | Suggestions |
   |------------------|----------------------|-------------|
   | Property inquiry | "viewing", "visit" | "Yes, that works for me", "Can we do another time?", "What other slots are available?" |
   | Property inquiry | "price", "offer" | "I'd like to make an offer", "Is the price negotiable?", "Can you send more details?" |
   | Booking/job | "confirm", "appointment" | "Confirmed, thank you", "I need to reschedule", "Can you call me to discuss?" |
   | Booking/job | "quote", "cost" | "Looks good, please proceed", "Can you itemize this?", "I'd like to compare other quotes" |
   | General | (any) | "Thanks for letting me know", "I'll get back to you", "Can you send more details?" |

3. Suggestions are stored in a config file or small DB table, not generated per-request.

4. Clicking a suggestion populates the message input (does not auto-send). User can edit before sending.

5. Suggestions can be dismissed and don't reappear for that message.

**Implementation:** A simple function that matches conversation metadata + last message text against keyword patterns and returns the appropriate suggestion set. ~50 lines of code, no AI dependency.

**Cost:** $0/mo at any scale.

**Future upgrade path:** If user research shows static suggestions feel generic, add Claude Haiku-powered contextual suggestions as a premium/optional feature. But validate demand first -- most chat apps (even iMessage) use static suggestions successfully.

---

### E06-S12: AI Feedback Mechanism

**User Story:** As a Developer, I want users to provide simple feedback on AI-generated content, so we can track quality and adjust prompts over time.

**Priority:** Must
**Status:** To Do
**Estimated effort:** 1 day

**What this replaces:** The original E06-S12 implied building a feedback pipeline for model retraining. At MVP you won't have enough data to fine-tune anything. This version collects feedback for manual prompt engineering review.

**Acceptance Criteria:**

1. After AI generates a property description (E06-S06), a small "Was this helpful?" prompt appears with thumbs up / thumbs down.

2. If thumbs down, an optional single-line text field appears: "What was wrong?" (max 200 chars).

3. Feedback is stored in a simple table:

```sql
CREATE TABLE ai_feedback (
  id BIGSERIAL PRIMARY KEY,
  feature TEXT NOT NULL, -- 'property_description'
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rating BOOLEAN NOT NULL, -- true = helpful, false = not helpful
  comment TEXT CHECK (LENGTH(comment) <= 200),
  ai_input JSONB, -- the prompt inputs (for debugging)
  ai_output TEXT, -- the generated text (for debugging)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_feedback_feature ON ai_feedback (feature, created_at DESC);
```

4. No automated retraining pipeline. Review feedback manually monthly. Adjust prompts based on patterns in negative feedback.

5. The feedback UI is unobtrusive -- a small row below the generated text, not a modal.

**Cost:** $0/mo.

**Action trigger:** When you accumulate 500+ negative feedback entries for a feature, invest time in prompt engineering improvements. When you reach 10K+ entries, consider whether fine-tuning or a more capable model is warranted.

---

## 5. Deferred Features -- What Ships Post-Revenue

These features are **not cut** -- they are **sequenced correctly**. Each one has a clear trigger condition for when to build it.

### E06-S02: AI Context Management (Deferred to Post-Revenue)

**Original:** Full RAG system fetching provider profile, services, pricing, conversation history, client history, and location context -- 6-10 DB queries + 2 AI calls per interaction.

**Trigger to build:** When the AI Personal Assistant (E06-S03) ships.

**When it ships:** Build a simple prompt template with provider name, services list, and hourly rate (1 DB query). Include only the last 3 messages as context. No summarization step -- if context is too long, truncate. This covers 95% of use cases.

### E06-S03: AI Assistant via SMS/WhatsApp (Deferred to Premium Feature)

**Original:** Every inbound message = Twilio cost + AI inference cost + Twilio outbound cost. Triple cost layer.

**Trigger to build:** When subscription revenue from providers exceeds the projected Twilio costs. At $50/provider/month and $0.05/message exchange, you need ~100 paying providers to break even on the messaging costs alone.

**What to build instead at MVP:** The AI assistant lives in-app (the Britestate inbox from Epic 5). Providers check their Britestate dashboard for AI-suggested responses. Zero per-message cost. If a provider wants SMS notifications when they get a new inquiry, that's a simple notification -- not an AI conversation.

### E06-S04: AI Quote Drafting (Deferred -- Template Builder Instead)

**Original:** AI extracts requirements from messages, cross-references pricing models, drafts itemized quotes. Multiple AI calls per quote.

**What to build instead at MVP:** A template-based quote builder (zero AI cost, simple CRUD):
- Provider defines their service catalog with standard line items and prices
- When creating a quote, provider selects line items from their catalog
- System auto-calculates totals
- Provider adjusts as needed and sends

This covers 90% of quoting needs. The 10% that need AI assistance can wait until provider feedback explicitly requests it.

**Trigger to build AI version:** Provider surveys show >30% request for AI-assisted quoting, AND you have the AI assistant infrastructure (E06-S03) in place.

### E06-S05: Intent/Sentiment Classification (Deferred -- Rule-Based Instead)

**Original:** AI classifies every message by intent and sentiment.

**What to build instead at MVP:** Simple keyword-based routing:
- Messages containing "quote", "price", "cost" -> route to quoting flow
- Messages containing "cancel", "complaint", "issue" -> flag for provider attention
- Everything else -> general inbox

**Trigger to build AI version:** When message volume exceeds 100K/month and providers report being overwhelmed by manual triage.

### E06-S07: NLP Natural Language Search (Deferred)

**Original:** AI call on every search query. Search is the highest-volume action on a property portal.

**What exists at MVP:** Structured search with filters (from Epic 2): postcode, property type, price range, bedrooms, etc. This is what Rightmove and Zoopla use for millions of users.

**Trigger to build:** User research shows significant search abandonment specifically because users can't express what they want via filters. Track search-to-result click-through rates. If <15%, investigate NLP as a solution.

**When it ships:** Add NLP as an optional "Smart Search" feature alongside structured filters. Cache parsed queries (same NL input = same filter output). Use Haiku for parsing. Most queries follow predictable patterns -- cache hits should exceed 60%.

### E06-S11: AI Assistant Configuration Panel (Deferred)

**No AI assistant at MVP = no configuration panel needed.** Ships when E06-S03 ships.

---

## 6. Cost Summary

### MVP (Phase 4) Monthly Costs

| Feature | Monthly Cost | Notes |
|---------|-------------|-------|
| Claude API (property descriptions) | $6-60 | Scales with listing volume |
| AI usage logging table | $0 | Existing DB |
| SQL-based recommendations | $0 | Existing materialized view |
| Land Registry data storage | $0 | Existing DB (~4GB) |
| Static smart reply config | $0 | Config file |
| Feedback collection table | $0 | Existing DB |
| **Total** | **$6-60/mo** | |

### Original Spec Monthly Costs (for comparison)

| Feature | Monthly Cost |
|---------|-------------|
| Self-hosted LLM on AWS | $1,700-8,700 |
| Twilio SMS/WhatsApp | $3,000-4,750 |
| NLP search inference | $300-3,000 |
| Smart replies inference | $900-9,000 |
| Recommendation engine inference | $500-2,000 |
| AWS infra (API GW, NAT, CloudWatch) | $200-400 |
| **Total** | **$6,600-27,850/mo** |

### Savings

| Scale | Original Spec | This Spec | Monthly Savings |
|-------|-------------|-----------|----------------|
| MVP (0-1K users) | ~$6,600/mo | ~$6/mo | **$6,594/mo** |
| Growth (10K users) | ~$12,000/mo | ~$20/mo | **$11,980/mo** |
| Scale (100K users) | ~$28,000/mo | ~$60/mo | **$27,940/mo** |
| Target (1M users) | ~$50,000+/mo | ~$600/mo | **$49,400/mo** |

---

## 7. Success Criteria (Phase 4)

These are the criteria that must be TRUE before Phase 4 AI features are considered complete:

1. **AI property descriptions work end-to-end:** Agent enters property details, clicks "Generate Description", receives a well-written British English description within 5 seconds, can edit and save it. Three tone options available.

2. **Recommendations surface relevant properties:** Homebuyer/renter dashboard shows "Recommended for You" based on saved searches and saved properties. No listings the user has already viewed or dismissed.

3. **Price history is displayed:** Property detail pages show Land Registry price paid data and area averages where available.

4. **Smart reply suggestions appear:** Message view shows contextual quick reply chips based on conversation type.

5. **Cost tracking is operational:** `ai_usage_log` table records every AI call with token counts. Daily cost query returns accurate totals. Kill switch activates if daily spend exceeds threshold.

6. **Feedback is collected:** Thumbs up/down on AI-generated descriptions is functional. Data is queryable for prompt improvement.

7. **Total monthly AI infrastructure cost does not exceed $100 at launch.**

---

## 8. Dependencies

| Dependency | Source | Required For |
|-----------|--------|-------------|
| Anthropic API key | Environment variable | E06-S01 |
| Property listing form | Epic 2 | E06-S06 (description generation UI) |
| Saved searches table | Epic 2 | E06-S08 (recommendations) |
| Saved properties table | Epic 2 | E06-S08 (recommendations) |
| Viewing history table | Epic 2 | E06-S08 (recommendations) |
| Search listings materialized view | Epic 2 | E06-S08 (recommendations) |
| Messaging system | Epic 5 | E06-S10 (smart replies) |
| User dashboards | Epic 3 | E06-S08 (recommendations display) |
| Upstash Redis | Epic 2 (already integrated) | E06-S01 (rate limiting) |

---

## 9. Technical Considerations

### Prompt Engineering over Model Training

All AI behavior is controlled via prompt engineering, not fine-tuning. Prompts are stored in a config directory (`src/config/prompts/`), not hardcoded in components. This allows:
- Rapid iteration without code deploys
- A/B testing of prompts by changing config
- Version control on prompt changes

### Graceful Degradation

Every AI-powered feature has a non-AI fallback:
- Description generation: manual text input (the form already works without AI)
- Recommendations: if query fails, show "newest listings in your area"
- Smart replies: if config fails to load, show no suggestions (chat still works)
- Price history: if Land Registry data is unavailable, show nothing (no broken UI)

### Rate Limiting

AI calls are rate-limited at multiple levels:
- Per-user: max 10 AI calls per hour (prevents abuse)
- Global: max 100 AI calls per minute (prevents runaway costs)
- Per-feature: description generation limited to 3 regenerations per listing
- Daily spend cap: configurable threshold, default $10/day

### Data Privacy

- AI prompts never include user email, phone, or other PII
- Property addresses are sent to Claude for description generation (necessary for quality) but are not stored by Anthropic (per their data policy)
- AI usage logs store user_id for cost attribution but no conversation content
- Feedback table stores AI input/output for debugging -- implement 90-day retention policy

---

## 10. QA & Testing Strategy

### Unit Tests

- AI service layer: mock Anthropic SDK, test error handling, rate limiting, token tracking
- Recommendation queries: test with fixture data, verify exclusion logic (viewed, saved, dismissed)
- Smart reply matching: test keyword patterns against expected suggestion sets
- Land Registry import: test CSV parsing and upsert logic

### Integration Tests

- Property description generation: end-to-end from form input to generated text displayed in UI
- Cost tracking: verify token counts are logged accurately after AI calls
- Feedback collection: verify thumbs up/down stores correctly and is queryable

### Manual Testing / Human Evaluation

- Generate 50 property descriptions across different property types and tones
- Rate each on: accuracy (no fabricated features), quality (would an agent use this?), tone match
- Target: 80% of generated descriptions rated "usable with minor edits or better"

### Performance Testing

- Description generation p95 latency < 5 seconds
- Recommendation query p95 latency < 200ms
- Land Registry lookup p95 latency < 100ms

### Cost Monitoring

- After 1 week of live usage, verify actual Claude API costs match projections
- Set up a weekly cost review for the first month
- Alert if daily spend exceeds $5 (well below the $10 kill switch)

---

## 11. Implementation Order

| Order | Story | Effort | Dependencies |
|-------|-------|--------|-------------|
| 1 | E06-S01: AI service layer | 2-3 days | Anthropic API key |
| 2 | E06-S06: Property descriptions | 3-4 days | E06-S01, Epic 2 listing form |
| 3 | E06-S12: Feedback mechanism | 1 day | E06-S06 |
| 4 | E06-S08: Recommendations (SQL) | 2-3 days | Epic 2 tables, Epic 3 dashboard |
| 5 | E06-S09: Land Registry data | 3-4 days | Epic 2 property detail page |
| 6 | E06-S10: Smart replies | 1 day | Epic 5 messaging |

**Total estimated effort: 12-16 days**

Original spec estimated effort: 6-8 weeks (including AWS infrastructure, Twilio integration, AVM development, NLP pipeline, recommendation ML, and context management system).

---

## 12. The Three Rules for Epic 6

1. **Never self-host an LLM until API costs exceed $2,000/mo consistently.** Use Claude API. Self-hosting is a Phase 7 optimization when you have dedicated DevOps and proven AI feature demand.

2. **Don't build what you can buy, partner for, or skip.** AVM = show Land Registry data, partner with Hometrack later. SMS AI = premium feature post-revenue. Recommendations = simple SQL. NLP search = structured filters work fine.

3. **Every AI call must justify its cost per invocation.** Property descriptions at $0.0006/call replacing 10 minutes of agent work = justified. Smart replies at $0.001/call for "Okay, thanks!" = not justified. If a lookup table can do it, use a lookup table.

---

*Rewritten: 2026-03-07*
*Replaces: epic6.txt (original spec)*
*Based on: epic6costanalysis.md findings, brit estate prd 2026.txt requirements, CLAUDE.md tech stack constraints*
*Cost reduction: $6,600-27,850/mo to $6-60/mo (99.6% reduction at MVP)*
