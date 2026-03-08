# Epic 4 Cost Audit: 9 Red Flags That Will Burn Cash at Scale

## Context

Analysis of `epic4tech-pt1.txt`, `epic4techpt2.txt`, and `epic4techpt3.txt` from the perspective of a startup founder scaling to millions of UK users. The goal is to identify cost inefficiencies, unnecessary infrastructure, and premature optimizations that will eat margin as we compete with Zoopla, Rightmove, and similar established platforms.

---

## 1. Claude API for Sentiment Analysis on EVERY Review -- CRITICAL

**Source:** `epic4techpt3.txt` -- Step 5.2, `analyzer.ts`

Every single review calls `claude-opus-4-1-20250805` for sentiment analysis. At scale:

| Users | Reviews/month | Claude API cost/month |
|-------|--------------|----------------------|
| 10K | ~2K | ~£40 |
| 100K | ~20K | ~£400 |
| 1M | ~200K | **~£4,000+** |

**Recommendation:** Use a lightweight local classifier (e.g., a simple keyword/rule-based scorer) for 90% of reviews. Reserve Claude for edge cases flagged by the rule engine. Or batch sentiment analysis nightly instead of real-time per review -- users don't need instant sentiment scores.

---

## 2. BullMQ + ioredis on Upstash -- ARCHITECTURE MISMATCH

**Source:** `epic4tech-pt1.txt` -- Step 3.1, `lib/queue/config.ts`

BullMQ requires **persistent TCP connections** to Redis. Upstash Redis is a **REST-based serverless** Redis. This is fundamentally incompatible:

- BullMQ workers need always-on connections -- won't work on Vercel/serverless
- You'd need a separate long-running process (VPS/Railway) just to run workers
- That's an extra ~£20-50/mo minimum, scaling up with load

**Recommendation:** Replace BullMQ with one of:
- **Supabase Edge Functions + pg_cron** -- free, already in your stack
- **Inngest or Trigger.dev** -- serverless-native job queues, generous free tiers
- **Supabase Database Webhooks** -- trigger on insert, no extra infra

This eliminates an entire infrastructure dependency.

---

## 3. VirusTotal API for Document Scanning -- COST BOMB

**Source:** `epic4tech-pt1.txt` -- Step 2.2, `virus-scan.ts`

VirusTotal free tier: **4 requests/minute, 500/day**. At scale with thousands of providers uploading docs, you'll hit paid tiers fast (~$800+/mo for 10K scans).

Plus the implementation **sleeps 5 seconds** per scan -- blocking a serverless function for 5s is expensive compute time.

**Recommendation:**
- Use **Supabase Storage** (already in stack) with built-in file validation instead of R2
- For virus scanning: validate file type server-side with `file-type` library (free), restrict to PDF/image only, and add admin review queue for manual verification
- Only scan documents from providers who pass initial verification -- not every upload

---

## 4. Cloudflare R2 + Custom CDN -- UNNECESSARY INFRA

**Source:** `epic4tech-pt1.txt` -- Step 2.1, `lib/storage/r2.ts`

You're already paying for **Supabase Storage** which includes:
- S3-compatible storage
- CDN via Supabase's edge network
- Signed URLs for private files
- Image transformations

Adding R2 means paying for and maintaining **two storage systems**.

**Recommendation:** Use Supabase Storage exclusively. It handles provider documents, portfolio images, and attachments. You're already paying for it.

---

## 5. Materialized View Refresh on EVERY Review Approval -- DB KILLER

**Source:** `epic4techpt3.txt` -- trigger `on_review_approved()`
**Source:** `epic4tech-pt1.txt` -- trigger `update_review_stats_trigger`

`REFRESH MATERIALIZED VIEW CONCURRENTLY` is a **full table scan + rebuild**. Triggering this on every single review approval:

| Reviews/day | Refresh cost | DB impact |
|------------|-------------|-----------|
| 10 | Negligible | Fine |
| 100 | ~2s each | Noticeable |
| 1,000+ | ~5-10s each | **DB locks, query timeouts** |

**Recommendation:**
- Refresh on a **schedule** (every 15-30 minutes via pg_cron) -- not per-event
- Or replace the materialized view with **incremental counters** updated via triggers (UPDATE a stats row, don't rebuild the whole view)
- The spec actually has TWO materialized views (`provider_marketplace` AND `provider_rating_stats`) both refreshing on review events -- double the pain

---

## 6. Mapbox Geocoding for Every RFQ -- WRONG SERVICE

**Source:** `epic4tech-pt1.txt` -- Step 3.2, RFQ creation

The spec uses Mapbox geocoding, but the project stack specifies **MapTiler + MapLibre**. You'd be paying for two mapping services. Mapbox geocoding: free for 100K requests/month, then $0.75/1K.

**Recommendation:** Use MapTiler's geocoding API (already in your stack) or better yet -- since you already have the UK postcode, use a **free UK postcode lookup** (postcodes.io -- completely free, open-source, no API key needed) to get coordinates. UK postcodes map to precise locations.

---

## 7. Resend Email Volume at Scale -- WATCH THE MULTIPLIER

**Source:** `epic4tech-pt1.txt` -- Workers notify up to **20 providers per RFQ**

Every RFQ triggers up to 20 emails. Then quote received = 1 email. Booking confirmed = 1 email. Status changes = emails. Review submitted = email.

| Monthly RFQs | Emails (RFQ alone) | Resend cost |
|-------------|-------------------|------------|
| 1K | 20K | Free tier |
| 10K | 200K | ~£160/mo |
| 100K | 2M | **~£1,600/mo** |

**Recommendation:**
- Cap provider notifications to **5-10 best matches** instead of 20
- Use **in-app notifications first**, email as fallback for users who haven't seen the in-app notification within 1 hour
- Batch digest emails (daily summary of new RFQs) instead of individual emails for non-urgent matches
- This alone could cut email costs by 60-80%

---

## 8. Sharp Image Processing on Serverless -- COLD START + TIMEOUT RISK

**Source:** `epic4tech-pt1.txt` -- Step 2.1

`sharp` is a native C++ module. On Vercel/serverless:
- **50MB+ cold start** (native binary)
- Processing a 10MB image can take 2-5s -- burning serverless compute
- Frequent cold starts at low traffic = slow UX

**Recommendation:**
- Use **Supabase Storage image transformations** (built-in, free with your plan)
- Or accept client-side resized images (modern browsers can resize before upload)
- Process images via a background job if quality matters, not in the API request path

---

## 9. Over-Engineered Database Schema -- PREMATURE COMPLEXITY

The spec creates:
- 2 materialized views
- 15+ triggers
- 8+ custom functions
- 6 enum types
- Partitioning extensions (`pg_partman`)

For a startup with **zero users**, this adds:
- Migration complexity
- Debugging difficulty
- Supabase plan pressure (free tier has limited DB size/connections)

**Recommendation:** Start with:
- Simple tables, no materialized views -- use indexed queries
- 2-3 essential triggers (auto-timestamps, reference generation)
- No partitioning until you have 10M+ rows
- Add complexity **when metrics show you need it**, not before

---

## Cost Summary: Spec vs. Recommended

| Item | Spec Cost (at 100K users/mo) | Recommended | Savings |
|------|----------------------------|-------------|---------|
| Claude sentiment | £400/mo | Rule-based + batch | £350/mo |
| BullMQ infra (VPS) | £50/mo | Inngest/Supabase | £50/mo |
| VirusTotal | £200/mo | File-type validation | £200/mo |
| R2 Storage | £30/mo | Supabase Storage | £30/mo |
| Mapbox geocoding | £75/mo | postcodes.io (free) | £75/mo |
| Resend emails | £160/mo | Batching + in-app | £100/mo |
| **Total monthly** | **~£915/mo** | **~£110/mo** | **~£805/mo** |

At 1M users, the gap widens to **£8,000+/mo vs ~£800/mo**.

---

## The 3 Rules for This Phase

1. **Don't add infrastructure you're already paying for** -- Supabase Storage replaces R2, Supabase functions replace BullMQ, postcodes.io replaces Mapbox geocoding
2. **Don't use AI where rules work** -- sentiment analysis, spam detection, and moderation scoring can be 90% rule-based at a fraction of the cost
3. **Don't optimize for 1M users at 0 users** -- materialized views, partitioning, and concurrent refreshes are premature. Add them when you have the data to justify them

---

*Analysis date: 2026-03-07*
*Applies to: Epic 4 -- Service Provider Marketplace & Integration*
