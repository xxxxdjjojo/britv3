# Epic 6 Cost Audit: The AI Money Pit

## Context

Analysis of `epic6.txt` — AI-Powered Features Implementation. This is the most expensive epic in the entire project by an order of magnitude. The spec proposes self-hosting LLMs on AWS GPU instances, building an AI personal assistant for every service provider, an Automated Valuation Model, NLP search, smart replies, and recommendation engines — all before the platform has a single paying user.

For context: Zoopla spent years and millions building their AVM. Rightmove doesn't even have one. We're a pre-revenue startup competing with them.

---

## The Core Problem: Self-Hosting an LLM on AWS

**Source:** E06-S01

The spec calls for deploying DeepSeek (a 7B parameter LLM) on AWS with Docker, auto-scaling, API Gateway, CloudWatch, and a CI/CD pipeline.

### What This Actually Costs

GPU instances required for LLM inference:

| AWS Instance | GPU | Cost/hour | Cost/month (24/7) |
|-------------|-----|-----------|-------------------|
| g5.xlarge | 1x A10G | $1.006 | **$724/mo** |
| g5.2xlarge | 1x A10G | $1.212 | **$873/mo** |
| g5.4xlarge | 1x A10G | $1.624 | **$1,169/mo** |
| g5.12xlarge | 4x A10G | $5.672 | **$4,084/mo** |

For auto-scaling with a minimum of 1 instance + burst capacity:

| Scale | Min instances | Burst | Monthly cost |
|-------|-------------|-------|-------------|
| MVP (0-1K users) | 1 | 1 | ~$1,500/mo |
| Growth (10K users) | 2 | 3 | ~$3,600/mo |
| Scale (100K users) | 4 | 8 | ~$8,700/mo |
| Target (1M users) | 10+ | 20+ | **~$21,000+/mo** |

Add to this:
- API Gateway: ~$3.50 per million requests
- CloudWatch logging: ~$50-100/mo
- S3 for model artifacts: ~$20/mo
- NAT Gateway for VPC: ~$45/mo
- Data transfer: ~$50-200/mo
- DevOps time to maintain: priceless (and scarce at a startup)

**Total infrastructure cost at MVP with zero users: ~$1,700/mo minimum.**

### What It Should Cost

Use a managed API instead. The project's own CLAUDE.md specifies **Anthropic Claude** as the AI provider:

| Provider | Cost per 1M input tokens | Cost per 1M output tokens |
|----------|------------------------|-------------------------|
| Claude Haiku 4.5 | $0.80 | $4.00 |
| Claude Sonnet 4.6 | $3.00 | $15.00 |
| DeepSeek API (hosted) | $0.27 | $1.10 |

At MVP volume (~5K AI requests/month, avg 500 tokens in + 200 tokens out):

| Approach | Monthly cost |
|----------|-------------|
| Self-hosted DeepSeek on AWS | **~$1,700/mo** |
| Claude Haiku API | **~$6/mo** |
| DeepSeek hosted API | **~$2/mo** |

**The spec proposes spending $1,700/mo to do what $6/mo of API calls would cover.** You need ~280,000 API requests/month before self-hosting breaks even. That's post product-market fit territory.

**Recommendation:** Use Claude API (already in the stack per CLAUDE.md) via Anthropic SDK. Switch to self-hosted only when API costs exceed $2,000/mo consistently (roughly 500K+ requests/month). This is a Phase 7 optimization, not a Phase 4 foundation.

---

## 1. AI Personal Assistant for Every Provider via Twilio SMS/WhatsApp -- TRIPLE COST LAYER

**Source:** E06-S03, E06-S04, E06-S05

The spec wants an AI assistant that:
1. Receives SMS/WhatsApp messages via **Twilio** (cost per message)
2. Processes them through the **self-hosted LLM** (GPU cost)
3. Sends responses back via **Twilio** (cost per message again)

### Twilio Cost Per Message

| Channel | Inbound | Outbound | Total per exchange |
|---------|---------|----------|-------------------|
| SMS (UK) | $0.0075 | $0.04 | **$0.0475** |
| WhatsApp | $0.005 | $0.0042 + Meta fee | **~$0.03** |

At scale:

| Monthly provider-client exchanges | SMS cost | WhatsApp cost |
|----------------------------------|----------|---------------|
| 10K | $475 | $300 |
| 100K | $4,750 | $3,000 |
| 1M | **$47,500** | **$30,000** |

**Plus** the LLM inference cost on top. Every inbound message = 1 AI inference call.

**What Zoopla does:** Email relay. Free to receive, ~$0.001 to send via Resend/SES. No AI processing.

**Recommendation:**
- **Cut Twilio SMS/WhatsApp entirely for MVP.** Use in-platform messaging (from Epic 5) as the AI assistant channel. Zero per-message cost.
- The AI assistant should be an in-app feature, not an external messaging bot. Providers check their Britestate inbox, not WhatsApp.
- If providers want SMS/WhatsApp integration, make it a **paid premium feature** post-revenue that covers Twilio costs.

---

## 2. AI Quote Drafting -- OVERKILL FOR THE VALUE

**Source:** E06-S04

The AI extracts requirements from messages, cross-references provider pricing models, and drafts itemized quotes. This requires:
- Message parsing (AI call #1)
- Context retrieval from DB (multiple queries)
- Quote generation with pricing logic (AI call #2)
- Provider review UI

For a feature that saves a provider maybe 5 minutes of typing.

**What providers actually need:** A quote template system with pre-filled line items from their service catalog. No AI required. The provider clicks "Plumbing - Boiler Service", adjusts the price, hits send.

**Recommendation:**
- Build a **template-based quote builder** (zero AI cost, simple CRUD)
- Add AI quote drafting as a "beta" feature later, triggered only when the provider clicks "Help me draft this"
- Use Claude Haiku (cheapest model) for the rare cases where AI is invoked

---

## 3. Automated Valuation Model (AVM) -- YEARS OF WORK DISGUISED AS A USER STORY

**Source:** E06-S09

"AI-generated Automated Valuation Model estimate... takes into account property characteristics and recent comparable sales data"

This single user story hides massive complexity:

### Data You Need (And What It Costs)

| Data Source | What It Provides | Cost |
|------------|-----------------|------|
| HM Land Registry Price Paid | Historical sales | Free (but bulk download) |
| EPC Register | Energy ratings, floor area | Free |
| Ordnance Survey | Location data | Free (open data) |
| Zoopla/Rightmove listings | Current market prices | **Not available** (proprietary) |
| Council Tax bands | Property banding | Varies by council |
| Census/ONS | Area demographics | Free |

You can get basic data for free, but:
- **Cleaning and normalizing** UK property data across 300+ councils is 3-6 months of data engineering
- **Training a model** that's even remotely accurate requires millions of comparable transactions
- **Liability**: If your AVM says a house is worth $500K and it sells for $350K, you face legal risk. Zoopla disclaims heavily and still gets complaints.

**What Zoopla spent:** Their AVM (Zed-Index) took a dedicated data science team years to build with proprietary data from millions of listings.

**What you should do:**
- **MVP:** Show Land Registry price paid data (free, public) with "Last sold for X in YYYY." No AI, no model, no estimate. Just facts.
- **Post-revenue:** Partner with an existing AVM provider (Hometrack, CoreLogic) who already has the model and data. White-label their estimates. Cost: negotiable, but removes 6+ months of build.
- **Never:** Build your own AVM from scratch as a startup feature.

---

## 4. NLP Search -- AI CALL ON EVERY SEARCH QUERY

**Source:** E06-S07

"Parse natural language queries to identify key entities and augment structured search filters"

Every search = 1 AI API call. Search is the highest-volume action on any property portal.

| Monthly searches | AI calls | Cost (Claude Haiku) | Cost (Self-hosted) |
|-----------------|----------|--------------------|--------------------|
| 50K | 50K | ~$30 | Included in GPU cost |
| 500K | 500K | ~$300 | Need more GPUs |
| 5M | 5M | **~$3,000** | **Need a lot more GPUs** |

**What Zoopla does:** Structured filters + autocomplete. No NLP. Users click dropdowns and type postcodes. It works for millions of users.

**Recommendation:**
- **MVP:** Structured search with autocomplete (postcode, area name). Zero AI cost. This is what every user expects.
- **Enhancement:** Add NLP as an optional "smart search" beta feature. Process the NL query client-side with simple regex/keyword extraction first. Only call AI for queries the regex can't handle.
- Use a **cache layer**: "3 bed house near London Bridge" should be parsed once and cached. Most NL queries are similar patterns.

---

## 5. Smart Reply Suggestions -- AI CALL ON EVERY RECEIVED MESSAGE

**Source:** E06-S10

"When viewing an incoming message, the AI suggests 2-3 contextually relevant short replies"

Every time a user opens a message = 1 AI inference. In a chat-heavy platform:

| Daily messages viewed | Monthly AI calls | Cost (Haiku) |
|----------------------|-----------------|-------------|
| 5K | 150K | ~$90 |
| 50K | 1.5M | ~$900 |
| 500K | 15M | **~$9,000** |

For suggestions like "Okay, thanks!" and "When are you available?" — which are the same 10 phrases regardless of context.

**Recommendation:**
- Use a **static suggestion list** based on message category, not AI inference
- If the message is about a viewing: suggest "Yes, that works", "Can we reschedule?", "What other times are available?"
- If the message is about a quote: suggest "Looks good, please proceed", "Can you itemize this?", "I'd like to compare other quotes"
- This is a lookup table, not an AI problem. Cost: $0.

---

## 6. Recommendation Engine -- TRACK EVERYTHING, COMPUTE CONSTANTLY

**Source:** E06-S08

"Track user interactions (properties viewed, favorited, search criteria, time spent on listings)... AI recommendation engine uses this interaction data"

The hidden costs:
- **Event tracking storage:** Every page view, every scroll, every click = rows in a tracking table. At 1M users averaging 20 events/session, 3 sessions/week = **240M events/month**. On Supabase Postgres, this will crush your database.
- **AI inference for recommendations:** Each user's recommendations need periodic recalculation. If you recalculate daily for 100K active users = 100K AI calls/day = 3M/month.
- **pgvector embeddings:** The CLAUDE.md mentions pgvector. Storing embeddings for 100K properties = fine. Computing similarity for 1M users = expensive queries.

**What Zoopla does:** "Similar properties" based on simple attribute matching (same area, same beds, similar price). No AI, no embeddings, no behavior tracking. Uses Elasticsearch.

**Recommendation:**
- **MVP:** "Similar properties" via SQL query: same postcode district, same property type, price within 20%. Cost: $0.
- **Phase 2:** Track saved searches and saved properties (you already have this data). Recommend properties matching saved search criteria the user hasn't seen yet. Simple query, no AI.
- **Post-revenue:** Add collaborative filtering ("users who saved this also saved...") using simple SQL aggregation, not LLM inference.
- **Never at startup stage:** Behavior tracking with time-on-page, scroll depth, etc. The analytics infra alone costs more than the value it provides.

---

## 7. Context Management System -- OVER-ENGINEERED RAG

**Source:** E06-S02

The spec wants a full RAG (Retrieval-Augmented Generation) system:
- Fetch provider profile
- Fetch service definitions
- Fetch pricing models
- Fetch conversation history
- Fetch client history
- Fetch location context
- Handle context window limitations with summarization

This is 4-8 database queries + a summarization AI call BEFORE the actual AI call. Every AI assistant interaction = 6-10 database queries + 2 AI calls.

**Recommendation:**
- Build a simple prompt template with provider name, services list, and hourly rate. That's 1 DB query.
- Don't fetch conversation history into AI context — just the last 3 messages. Users don't need the AI to remember conversations from 6 months ago.
- No summarization step. If context is too long, truncate. Users won't notice.

---

## 8. Feedback Mechanism -- GOOD IDEA, WRONG TIMING

**Source:** E06-S12

Building a structured feedback collection system for AI outputs implies you plan to fine-tune models. Fine-tuning requires:
- Thousands of feedback data points
- A data pipeline to process them
- Model retraining infrastructure
- A/B testing framework

At MVP, you won't have enough data to fine-tune anything. Prompt engineering adjustments based on qualitative user feedback (support tickets, user interviews) are more valuable than thumbs up/down buttons.

**Recommendation:**
- Add a simple "Was this helpful? Yes/No" button. Store it in a single table.
- Review feedback manually monthly. Adjust prompts based on patterns.
- No automated retraining pipeline until you have 10K+ feedback data points.

---

## Cost Summary: Spec vs. Recommended

| Item | Spec Cost (at 100K users/mo) | Recommended | Savings |
|------|----------------------------|-------------|---------|
| Self-hosted LLM on AWS | $3,600-8,700/mo | Claude API calls | $3,500-8,600/mo |
| Twilio SMS/WhatsApp | $3,000-4,750/mo | In-app only | $3,000-4,750/mo |
| AVM development | 6+ months eng time | Land Registry data + future partnership | 6 months |
| NLP search inference | $300-3,000/mo | Structured search + cache | $250-2,900/mo |
| Smart replies inference | $900-9,000/mo | Static suggestion lookup | $900-9,000/mo |
| Recommendation engine | $500-2,000/mo + tracking infra | SQL attribute matching | $500-2,000/mo |
| AWS infra (API GW, NAT, CW) | $200-400/mo | Eliminated | $200-400/mo |
| **Total monthly** | **$8,500-28,000/mo** | **$50-200/mo** | **$8,300-27,800/mo** |

At 1M users the self-hosted approach could exceed **$50,000/mo** in AI infrastructure alone.

---

## The Startup Reality Check

### What AI Features Actually Drive Revenue for a Property Portal

| Feature | Revenue Impact | Build Cost | Verdict |
|---------|---------------|-----------|---------|
| AI property descriptions | Saves agents 10 min/listing, drives adoption | 1 API call/listing | **Build (cheap, high value)** |
| NLP search | Nice-to-have, structured search works fine | AI call per search | **Defer** |
| AVM | Users love it but liability is high | 6+ months + data | **Partner, don't build** |
| AI assistant (SMS/WhatsApp) | Providers might pay for it | Twilio + AI per message | **Premium feature post-revenue** |
| Smart replies | Marginal time savings | AI call per message view | **Static suggestions instead** |
| Recommendations | Drives engagement | Tracking + inference | **Simple SQL matching for MVP** |
| AI quote drafting | Saves providers 5 min | Multiple AI calls | **Template builder instead** |

### The Only AI Feature Worth Building at MVP

**AI property descriptions** (E06-S06). One Claude Haiku call per listing. Agent inputs property details, gets a polished description. Cost at 10K listings/month: ~$6. Value: high agent adoption, competitive differentiator, saves real time.

Everything else is Phase 2+ after you've proven product-market fit and have revenue to fund it.

---

## The 3 Rules for Epic 6

1. **Never self-host an LLM until API costs exceed $2,000/mo consistently.** Use Claude API (already in your stack). Self-hosting is a Phase 7 optimization when you have dedicated DevOps.
2. **Don't build what you can buy or partner for.** AVM = partner with Hometrack. SMS AI = premium feature post-revenue. Recommendations = simple SQL.
3. **Every AI call must justify its cost per invocation.** Smart replies at $0.001/call for "Okay, thanks!" is not justified. Property descriptions at $0.001/call replacing 10 minutes of agent work is justified.

---

*Analysis date: 2026-03-07*
*Applies to: Epic 6 -- AI-Powered Features Implementation*
