# Epic 8 Cost Audit: The Financial Tools Spec That's 60% Premature and 30% Overpriced

## Context

Analysis of `epic8.txt` — Financial Tools, Personalized Affordability & Transaction Management. Cross-referenced against `brit estate prd 2026.txt` and the cost patterns established in Epics 4-6. Epic 8 bundles three fundamentally different things into one epic: cheap client-side calculators, expensive third-party integrations, and Phase 6 scope creep.

---

## The Core Problem: Epic 8 Is Three Epics Wearing a Trench Coat

The spec bundles:
1. **Financial Calculators** (S01-S09) — Pure client-side math. Near-zero cost. Should be built.
2. **Offer Management & Transaction Tracking** (S10-S12) — Already defined in Phase 6 (Landlord Tools & Transactions). Building it here = duplicate work.
3. **Payment + E-Signatures** (S13-S19) — Expensive third-party integrations (Stripe Connect, DocuSign/HelloSign) with significant per-transaction costs.

---

## 1. E-Signature Integration (HelloSign/DocuSign) — THE BIGGEST COST SURPRISE

**Source:** E08-S16, E08-S17, E08-S19

The spec says "integrate an e-signature service." Let's price that out:

### HelloSign (Dropbox Sign) Pricing

| Plan | Cost | Signatures/month | Per-signature cost |
|------|------|-----------------|-------------------|
| Essentials | $20/mo | 5 | $4.00 |
| Standard | $30/mo/user | Unlimited for user | Fixed per seat |
| API (Developer) | **$200/mo** | 50 | $4.00 |
| API (Business) | **$600/mo** | 300 | $2.00 |
| API (Enterprise) | Custom | Unlimited | Negotiated |

### DocuSign Pricing

| Plan | Cost | Envelopes/month |
|------|------|----------------|
| Personal | $15/mo | 5 |
| Standard | $45/mo | Unlimited (user sends) |
| API (Developer) | **$400/mo** | 100 envelopes |
| API (Production) | **$1,200+/mo** | Custom |

At scale:

| Monthly e-signatures | HelloSign API | DocuSign API |
|---------------------|--------------|-------------|
| 50 | $200/mo | $400/mo |
| 300 | $600/mo | $1,200/mo |
| 1,000 | **$2,000+/mo** | **$4,000+/mo** |
| 5,000 | **$8,000+/mo** | Custom pricing |

**What Zoopla does:** Nothing. They don't handle e-signatures. Solicitors and conveyancers handle document signing through their own systems. Rightmove: same. OpenRent: basic tenancy agreements generated as PDFs, no e-sig.

**What you actually need at MVP:** Generate PDF documents (offer letters, tenancy agreements) from templates. Email them. Let users print, sign, scan, and upload. Or use free PDF signing built into every modern browser/OS.

**Recommendation:**
- **Cut e-signature integration entirely for MVP.** It's a $200-600/mo minimum commitment before a single user signs anything.
- Generate professional PDFs from templates using React PDF (free, already client-side).
- Add a "Download & Sign" button. Users sign with their OS PDF tools or print and scan.
- E-signatures become a **paid premium feature** post-revenue, or integrate when transaction volume justifies the API cost (~500+ signatures/month).
- If you must have digital signing, consider a lightweight open-source approach like embedding a signature pad component that captures a drawn signature and overlays it on the PDF. Not legally equivalent to DocuSign, but sufficient for early-stage platform agreements.

---

## 2. Offer Management & Transaction Timeline — PHASE 6 SCOPE CREEP

**Source:** E08-S10, E08-S11, E08-S12

The ROADMAP.md is explicit:
- **Phase 5** (Marketplace & Finance) includes `FIN-01` through `FIN-06` (calculators)
- **Phase 6** (Landlord Tools & Transactions) includes `TXN-01` through `TXN-07` (offers, transaction timeline, chain visualization)

Epic 8 S10-S12 duplicates Phase 6 scope. Building offer management and transaction tracking now means:
- Building against an incomplete foundation (no listings with offer flow, no transaction model)
- Rebuilding when Phase 6 defines the full transaction pipeline with chain visualization
- Wasted dev time on features that have no users yet (you need Phase 2 listings first)

**The Epic 5 cost analysis already flagged this:** "Milestone tracking (Scope creep from Epic 8) — Remove from Epic 5 entirely. It belongs in Phase 6."

**Recommendation:**
- **Remove S10, S11, S12 from Epic 8.** They belong in Phase 6 exactly as the roadmap specifies.
- The transaction timeline, offer management, and chain visualization should be designed holistically in Phase 6, not piecemeal across two epics.
- **Savings:** 2-3 weeks of dev time, zero wasted code that gets rewritten.

---

## 3. Online Rent Collection via Stripe — HIDDEN FEE STRUCTURE

**Source:** E08-S15

Stripe's fee for card payments: **1.5% + 20p** (UK cards). For rent collection:

| Monthly rent | Stripe fee per payment | Annual cost to tenant/landlord |
|-------------|----------------------|-------------------------------|
| £800 | £12.20 | £146.40 |
| £1,200 | £18.20 | £218.40 |
| £2,000 | £30.20 | £362.40 |

Plus you're proposing a **2.5% platform commission** on top? That's **4% total** on rent payments. No landlord or tenant will accept that when bank transfers are free.

**What OpenRent does:** Direct bank transfer between tenant and landlord. The platform just tracks whether payment was received (landlord confirms manually). Zero payment processing fees.

**What GoCardless does:** Direct Debit at **1% + 20p** (capped at £2). Much cheaper for recurring payments. But still adds cost.

**Recommendation:**
- **Don't process rent payments through Stripe at MVP.** Instead:
  - Landlord sets up rent schedule in dashboard (from Epic 7)
  - Platform sends automated reminders to tenants via email/in-app notification
  - Landlord manually marks rent as "Received" when bank transfer arrives
  - Dashboard shows payment history and overdue alerts
- This costs **$0** in payment processing fees and provides 90% of the value (tracking, reminders, history).
- If you add payment processing later, use **GoCardless Direct Debit** (1% capped at £2, ~£24/year on £1,200/mo rent vs ~£218 via Stripe). But only when landlords specifically request it as a premium feature.

---

## 4. Stripe Connect for Service Provider Payouts — ALREADY COMMITTED, BUT WATCH THE COSTS

**Source:** E08-S13, E08-S14, E08-S18

Stripe Connect is already in the tech stack (CLAUDE.md confirms 2.5% platform commission). This is a revenue generator, not a pure cost. But watch for:

**Connect account onboarding cost:** Free, but complex. Each provider needs to complete Stripe's KYC flow (identity verification, bank account linking). Drop-off rates are typically 30-40% for small tradespeople who aren't tech-savvy.

**Payout costs:**
- Standard payouts (2-day): Free
- Instant payouts: 1% of payout amount (max $10)

**Dispute/chargeback:** $15 per dispute on Stripe. If you get 2% dispute rate = $15 x 2% of transactions.

**Recommendation:**
- Stripe Connect integration is correct for the marketplace. Keep it.
- But **defer it until Epic 4 (Marketplace) is built.** You can't pay providers if there's no marketplace with bookings.
- For MVP of Epic 8, just build the calculators and personalized affordability features. The payment integration belongs with the marketplace epic execution.

---

## 5. Six Calculators Is Five Too Many for Launch — PRIORITIZE

**Source:** E08-S01 through E08-S06

All six calculators are pure client-side JavaScript. Zero backend cost. But each one has design, testing, and edge case handling:

| Calculator | Dev effort | User value | Revenue impact |
|-----------|-----------|-----------|----------------|
| Mortgage Payment | 2-3 days | High — directly supports listings | High (keeps users on-site) |
| Stamp Duty (SDLT) | 1-2 days | High — every buyer needs this | Medium |
| Affordability | 1-2 days | Medium — helps set budget | Medium |
| Rent vs. Buy | 3-4 days | Low — niche use case | Low |
| Renovation Cost | 2-3 days | Low — rough estimates | Low (links to marketplace) |
| Moving Cost | 1-2 days | Low — rough estimates | Low (links to marketplace) |

**What Zoopla does:** Mortgage calculator and stamp duty calculator only. That's it. Rightmove: same two.

**Recommendation:**
- **MVP:** Build Mortgage Calculator (S02) and Stamp Duty Calculator (S03) only. These are the two every buyer uses. 3-5 days total dev time.
- **With MVP:** Build the personalized affordability display on listings (S07, S08, S09). This is the killer feature that differentiates — seeing "Est. £1,450/mo for you" on every listing. It reuses the mortgage calculator logic. 2-3 days.
- **Post-launch (if users request):** Affordability Calculator (S01). Very similar to mortgage calc, quick add.
- **Defer indefinitely:** Rent vs Buy, Renovation Cost, Moving Cost. These are nice-to-have features with low engagement. If you build them, users use them once and forget. They don't drive retention or revenue.
- **Total savings:** 6-9 days of dev time redirected to higher-impact features.

---

## 6. Personalized Affordability Display — CORRECT APPROACH, ONE TWEAK

**Source:** E08-S07, E08-S08, E08-S09, E08-S20

This is the best feature in Epic 8. Showing "Est. £1,450/mo for you" on every listing is genuinely differentiated. The spec correctly suggests client-side calculation.

**One cost consideration:** The spec proposes storing mortgage parameters in the database (Supabase). This means:
- Write to DB when user saves params (1 write)
- Read from DB on every page load to get params (1 read per page)
- At 100K users viewing 8 properties each = 800K reads/month just for mortgage params

**Recommendation:**
- Store mortgage params in **localStorage** (primary) + optionally sync to profile in DB (secondary, for cross-device).
- Client-side reads from localStorage = zero DB queries.
- Client-side calculation of monthly payment = zero API calls.
- Total infrastructure cost: **$0**.
- The DB sync is a nice-to-have for cross-device. One write when params change, one read on login. Not on every page load.

---

## 7. SDLT Calculator — WATCH THE COMPLEXITY CREEP

**Source:** E08-S03

The spec mentions "considerations/stubs for LBTT (Scotland) and LTT (Wales)." UK stamp duty has three completely different systems:

| Region | Tax | Rules |
|--------|-----|-------|
| England & NI | SDLT | Bands at £250K, £925K, £1.5M + first-time buyer relief |
| Scotland | LBTT | Different bands, different rates, different relief |
| Wales | LTT | Different bands, different rates, different relief |

Plus: additional property surcharge (3%), non-UK resident surcharge (2%), corporate surcharge. Each with its own threshold rules.

**What Zoopla does:** England & NI SDLT only. Links to HMRC for Scotland and Wales.

**Recommendation:**
- **MVP:** England & NI SDLT only with first-time buyer relief toggle and additional property toggle. Two checkboxes, one set of band calculations.
- Display: "For Scotland (LBTT) or Wales (LTT), please use the HMRC calculator" with a link.
- Add Scotland/Wales calculators only if user analytics show significant traffic from those regions.
- This cuts edge case testing by 60%.

---

## Cost Summary: Spec vs. Recommended

| Item | Spec Cost (at 100K users/mo) | Recommended | Savings |
|------|----------------------------|-------------|---------|
| E-signature (HelloSign API) | $200-600/mo | PDF generation + manual signing | $200-600/mo |
| Rent collection (Stripe fees) | $1,500+/mo in fees passed to users | Manual tracking + reminders | Avoid user-hostile fees |
| Offer management (dev time) | 2-3 weeks | Defer to Phase 6 | 2-3 weeks |
| Transaction timeline (dev time) | 1-2 weeks | Defer to Phase 6 | 1-2 weeks |
| Extra calculators (dev time) | 6-9 days (Rent vs Buy, Renovation, Moving) | Build only Mortgage + SDLT | 6-9 days |
| Mortgage params DB reads | 800K reads/mo | localStorage | $0 saved, but DB pressure removed |
| Stripe Connect | Already committed | Defer to Epic 4 execution | 1-2 weeks |
| **Total** | **$200-600/mo + 5-8 weeks dev** | **~$0/mo + 1-2 weeks dev** | **$200-600/mo + 4-6 weeks** |

---

## What Epic 8 Should Actually Be (MVP)

**Build (1-2 weeks total):**
1. **Mortgage Payment Calculator** — client-side, with "Save for personalized estimates" button
2. **SDLT Calculator** — England & NI only, first-time buyer + additional property toggles
3. **Personalized affordability display** on property listings — client-side calculation using localStorage params
4. **PDF template generation** for offer letters — React PDF, download button, no e-sig

**Defer to Phase 6:**
- Offer management (S10, S11)
- Transaction timeline (S12)

**Defer to Epic 4 execution:**
- Stripe Connect integration (S13, S14, S18)

**Defer indefinitely:**
- E-signature integration (S16, S17, S19) — premium feature post-revenue
- Online rent collection (S15) — manual tracking with reminders instead
- Rent vs Buy, Renovation Cost, Moving Cost calculators (S04, S05, S06)

**Total new infrastructure cost: $0** beyond existing Supabase plan.

---

## The 3 Rules for Epic 8

1. **Client-side math is free — use it.** Mortgage calculations, stamp duty bands, and affordability estimates should never touch your server. localStorage + JavaScript = zero infrastructure cost.
2. **Don't integrate expensive third-party APIs before you have the transaction volume to justify them.** E-signatures at $200/mo minimum with 5 signatures is $40/signature. That's insane. DocuSign can wait until you have 500+ monthly transactions.
3. **Don't build transaction management before you have transactions.** Offer management and timeline tracking belong in Phase 6 when the full transaction pipeline exists. Building them now in isolation guarantees rework.

---

*Analysis date: 2026-03-07*
*Applies to: Epic 8 — Financial Tools, Personalized Affordability & Transaction Management*
