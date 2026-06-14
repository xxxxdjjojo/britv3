# BRIT-ESTATE / TRUEDEED — PRE-LAUNCH COMPLIANCE & LEGAL DUE-DILIGENCE AUDIT

**Subject platform:** Brit-Estate Ltd (trading as TrueDeed) — AI-powered UK property + service marketplace
**Codebase reviewed:** `/Users/jojominime/Documents/britv3main/britv3`
**Audit date:** 7 June 2026
**Launch target:** T-30 days
**Stage:** Pre-launch (private beta) — public domain not yet live
**Audited by:** Compliance Task Force — UK GDPR Solicitor · EU GDPR Solicitor · ICO Auditor · PECR Specialist · PropTech Lawyer · SaaS Lawyer · Consumer Protection Lawyer · Marketplace Lawyer · AI Governance Specialist · Cybersecurity Auditor · DPO · FCA Regulatory Consultant · M&A DD Team · Big Four Risk Advisory · Fortune 500 General Counsel

> **Methodology note.** Findings are tied to verified code paths inside the repository. Where evidence was not found the file is marked **MISSING**. Where a control exists but is incomplete it is marked **PARTIAL**. Where a placeholder string still appears in shipped legal content it is marked **PLACEHOLDER — BLOCKER**.

---

## 0. EXECUTIVE SUMMARY

Brit-Estate has built materially more compliance plumbing than the typical pre-revenue PropTech: consent records, immutable audit log, soft-delete + cascade-restricted GDPR purge, AI usage logging, signed Stripe webhooks, RLS-enforced multi-tenant data, MFA endpoints, nonce-based CSP. The 17 legal pages already drafted (privacy, cookies, terms, AI transparency, AML policy, data processing, modern slavery, complaints, accessibility, fee transparency, acceptable use, review policy, GDPR rights, disclaimer) place the platform in the top quartile of UK PropTech entrants for paperwork breadth.

However, the company **cannot launch in 30 days as currently configured**. The blocking issues are not architectural — they are operational, contractual, and regulatory:

1. **Company is not yet incorporated / ICO-registered in the published documents.** Every legal page still contains the literal strings `[COMPANY NUMBER]`, `[REGISTERED ADDRESS]`, `[ICO REGISTRATION NUMBER]`, and `[HMRC REFERENCE]` (verified at `src/app/(main)/legal/privacy/page.tsx`, `terms/page.tsx`, `aml-policy/page.tsx`, `gdpr-rights/page.tsx`). Shipping with placeholders is itself an ICO enforcement trigger and Consumer Protection from Unfair Trading Regulations 2008 misleading-action breach.

2. **No FCA appointed-representative or introducer structure exists in code** despite mortgage broker and insurance referral revenue tiers being live in `src/lib/commission-rates.ts`. Receiving fees for any introduction of a *regulated* credit/insurance product without an FSMA s.19 permission or s.39 AR principal is a criminal offence (FSMA 2000 s.23, up to 2 years' imprisonment).

3. **No Material Information / National Trading Standards Estate & Letting Agency Team (NTSELAT) Part A/B/C compliance layer is wired into listing creation** — the May 2023/Nov 2023/Nov 2024 NTSELAT material-information rules now treat omission as a CPR 2008 breach. Currently estate-agent listings can be published without council-tax band, tenure, length of lease, ground rent, service charge, building safety information, etc.

4. **No HMRC AML supervision number, no registered Money Laundering Reporting Officer (MLRO) named anywhere in code or docs.** The AML policy at `src/app/(main)/legal/aml-policy/page.tsx` promises supervision that has not been obtained. Pre-launch is exactly when HMRC supervision application must be filed (15-week typical lead time). This is a launch blocker.

5. **No deposit-scheme integration for landlord/tenant flows.** Phase 06 (landlord tools) and Phase 14 (landlord dashboard) introduce tenancy deposit handling without TDS/DPS/MyDeposits API integration. Statutory penalty: up to 3× deposit plus inability to serve s.21 notice (Housing Act 2004 ss.213–215).

6. **AI guardrails are coded for the platform but no DPIA exists for the AI processing.** UK GDPR Art. 35 + ICO AI/Data Protection Toolkit requires a documented DPIA for high-risk AI processing. Codebase shows AI is used for recommendations, valuations, lead matching, description generation, quote drafting — all squarely within Art. 22-adjacent territory. DPIA = launch blocker.

7. **No incident-response runbook, no breach-notification playbook, no 72-hour ICO clock procedure.** Even though Sentry is wired up, there is no documented runbook in `docs/runbooks/` for the regulatory side of an incident.

8. **PECR soft opt-in is not technically enforced.** Marketing-email send paths under `src/emails/` do not gate on `consent_records.type='marketing'` before Resend dispatch (no code evidence of consent check inside transactional sender). Fines up to £500,000 under PECR + UK GDPR Art. 6 stack.

9. **No formal Record of Processing Activities (ROPA — Art. 30) and no Data Protection Officer appointed in writing.** Mandatory for large-scale processing of property/financial data which this platform performs.

10. **No clear consumer Online Dispute Resolution (ODR) link, no Property Ombudsman / Property Redress Scheme membership for the platform itself**, no Modern Slavery Act statement is required *by law* below £36m turnover but the page exists empty — must be removed or completed correctly.

### Scorecard (0–100)

| Dimension | Score | One-line justification |
|---|---|---|
| **Launch Readiness** | **42 / 100** | Engineering ready, regulatory not |
| **Compliance Score** | **55 / 100** | Excellent skeleton, missing identity + HMRC + FCA + DPIA |
| **Security Score** | **74 / 100** | Strong CSP / RLS / webhook signing; gaps in CSRF, secrets rotation, dependency SBOM, pen test |
| **Governance Score** | **38 / 100** | No DPO, no ROPA, no risk register, no board minutes, no policies signed |
| **Investor Readiness** | **48 / 100** | Cap table likely fine; data room shallow, KPIs unaudited, IP assignment unverified |
| **Acquisition Readiness** | **31 / 100** | Would not survive Big-Four IP/Tech/Legal vendor diligence today |

**Verdict:** Push public launch to T+90 (early September 2026). Use the 90 days to close every BLOCKER in §13 below. Soft-launch invite-only beta at T+30 is acceptable *only* after the 10 launch blockers in §0 are cleared.

---

## PHASE 1 — REGULATORY MAPPING

Every law, regulation, code, and guidance document touching the platform.

| # | Instrument | Jurisdiction | Relevance | Risk | Consequence of breach |
|---|---|---|---|---|---|
| 1 | **UK GDPR** (retained Regulation (EU) 2016/679) | UK | All personal data of UK data subjects | CRITICAL | Up to £17.5m or 4% global turnover |
| 2 | **Data Protection Act 2018** | UK | Domestic implementing law + ICO powers | CRITICAL | Criminal offences (s.170, s.196); enforcement notices |
| 3 | **Data (Use & Access) Act 2025 (DUAA)** | UK | Recent reform — soft opt-in expansion, "recognised legitimate interests", automated decisions | HIGH | Same as UK GDPR; specific cookie/tracking changes |
| 4 | **EU GDPR** (Regulation (EU) 2016/679) | EU | EU expansion — applies once you target EU subjects | CRITICAL | €20m or 4% global turnover |
| 5 | **PECR 2003** (as amended) | UK | Cookies, e-marketing, soft opt-in | CRITICAL | £500,000 monetary penalty (max), ICO enforcement |
| 6 | **ePrivacy Directive 2002/58/EC** | EU | Pre-condition for EU rollout | HIGH | National regulator fines |
| 7 | **Consumer Rights Act 2015** | UK | T&Cs fairness, digital content, services | HIGH | Unfair terms void; CMA enforcement |
| 8 | **Consumer Contracts (Information, Cancellation & Additional Charges) Regs 2013** | UK | 14-day cooling-off for distance contracts | HIGH | Loss of right to charge; statutory cancellation rights extended to 12 months |
| 9 | **Consumer Protection from Unfair Trading Regs 2008 (CPRs)** | UK | Misleading actions, omissions in property marketing | CRITICAL | Criminal offence; up to 2 years; unlimited fine |
| 10 | **Digital Markets, Competition & Consumers Act 2024 (DMCC)** | UK | Drip pricing, fake reviews, subscription traps — from 6 Apr 2025 | CRITICAL | CMA direct fines up to 10% global turnover |
| 11 | **Electronic Commerce (EC Directive) Regulations 2002** | UK | Identification, transactional info | HIGH | Civil liability; trader status disputes |
| 12 | **Online Safety Act 2023** | UK | UGC, illegal content duties, child safety | CRITICAL | Up to £18m or 10% global turnover; senior manager criminal liability |
| 13 | **Equality Act 2010** | UK | Discrimination in housing, lettings, services | HIGH | Compensation; injunctions |
| 14 | **Estate Agents Act 1979** | UK | Estate agency definition, redress, disclosure | CRITICAL | Banning orders; criminal offences |
| 15 | **Property Misdescriptions Act 1991** (replaced by CPRs) | UK | Material information disclosure | HIGH | See #9 |
| 16 | **NTSELAT Material Information Guidance Parts A/B/C** | UK | What every listing must disclose | CRITICAL | CPR breach; portal removal |
| 17 | **Letting Agents (Redress Scheme) Order 2014** | UK | TPO or PRS membership for lettings | CRITICAL | £5,000 fixed penalty per branch |
| 18 | **Tenant Fees Act 2019** | England | Permitted fees only; deposit caps | CRITICAL | Fixed penalty £5k first / £30k second; banning |
| 19 | **Housing Act 2004 Part 6** | England & Wales | Tenancy deposit protection | CRITICAL | 3× deposit; loss of s.21 |
| 20 | **Homes (Fitness for Human Habitation) Act 2018** | England | Listing claims about habitability | HIGH | Damages; rent rebates |
| 21 | **Building Safety Act 2022** | UK | High-rise residential disclosure | HIGH | Civil + criminal sanctions on PAP |
| 22 | **Money Laundering, Terrorist Financing & Transfer of Funds Regs 2017 (MLR 2017)** | UK | Estate agents are obliged entities; HMRC supervision | CRITICAL | Up to 2 years; unlimited fine |
| 23 | **Proceeds of Crime Act 2002** | UK | SAR duties; tipping-off offence | CRITICAL | 14 years (s.327–329) |
| 24 | **Sanctions & Anti-Money Laundering Act 2018 + OFSI regime** | UK | Sanctions screening | CRITICAL | Strict liability; criminal |
| 25 | **Companies Act 2006** | UK | Trader identity on all comms / website | MEDIUM | Civil penalty; opens directors to liability |
| 26 | **Financial Services & Markets Act 2000 (FSMA)** | UK | Any regulated activity (mortgage intro = art. 25A; insurance intro = art. 25(1)(2)) | CRITICAL | Criminal offence s.23; agreements unenforceable s.26 |
| 27 | **FCA Handbook — MCOB / ICOBS / SYSC / CONC** | UK | If credit/insurance/mortgage features go live | CRITICAL | FCA censure; criminal |
| 28 | **FCA Consumer Duty (PRIN 12)** | UK | Acts-by-foreseeable-harm test for retail products | HIGH | FCA enforcement |
| 29 | **Payment Services Regs 2017 (PSRs)** | UK | If platform holds client money/payments — Stripe Connect mitigates | MEDIUM | Authorisation requirement |
| 30 | **Anti-Money Laundering Directive (AMLD) 5/6** | EU | EU rollout AML | CRITICAL | National fines |
| 31 | **Markets in Financial Instruments Directive II (MiFID II)** | EU | If property tokenisation introduced | MEDIUM | Authorisation requirement |
| 32 | **Digital Services Act (Regulation (EU) 2022/2065)** | EU | Marketplace + UGC obligations (notice & action; trader traceability art. 30/31) | CRITICAL | Up to 6% global turnover |
| 33 | **Digital Markets Act (Regulation (EU) 2022/1925)** | EU | Only if designated gatekeeper (not yet) | LOW | Up to 10% turnover |
| 34 | **EU AI Act (Regulation (EU) 2024/1689)** | EU | Risk-based; transparency for chatbots art. 50; possibly high-risk if credit/recruitment | CRITICAL | Up to €35m or 7% turnover |
| 35 | **EU Platform-to-Business Regulation (P2B 2019/1150)** | EU | Ranking transparency to agents/tradespeople | HIGH | National fines; CMA equivalent UK rule on horizon |
| 36 | **ICO AI & Data Protection Toolkit** | UK | DPIA template + 9 risk areas | HIGH | Evidence of compliance |
| 37 | **CMA Online Choice Architecture Guidance (CMA 162)** | UK | Dark patterns prohibition | HIGH | DMCC enforcement |
| 38 | **CMA Online Reviews Guidance (CMA 184)** | UK | Reviews — DMCC primary offences | CRITICAL | Up to 10% turnover |
| 39 | **CAP / BCAP Codes** | UK | Property + service advertising | MEDIUM | ASA adjudication; CMA referral |
| 40 | **Trade Marks Act 1994 / CDPA 1988** | UK | "TrueDeed" mark + content licensing | MEDIUM | Injunctions; account of profits |
| 41 | **Equality Act 2010 (web accessibility) + EAA 2025** | UK/EU | EU Accessibility Act 2025 applies June 2025 | HIGH | EU national penalties; UK reputational |
| 42 | **WCAG 2.2 AA** | International | Public sector law in UK; private sector exposure under EA 2010 | MEDIUM | Claims under EA 2010 |
| 43 | **Modern Slavery Act 2015 s.54** | UK | Only required >£36m turnover, but page published | LOW | Misleading-statement risk only |
| 44 | **Online Safety Act 2023 — Children's Codes** | UK | If under-18s in scope | HIGH | Senior-manager criminal liability |
| 45 | **NIS2 Directive (EU 2022/2555)** | EU | Cybersecurity for important entities — assess if in scope | MEDIUM | National fines |
| 46 | **Computer Misuse Act 1990** | UK | Defensive — scraping/abuse | LOW | Criminal |
| 47 | **Defamation Act 2013 + Defamation (Operators of Websites) Regs 2013** | UK | s.5 defence for reviews | MEDIUM | Damages; need notice procedure |
| 48 | **Trade & Co-operation Agreement (UK-EU) + Adequacy Decision (28 Jun 2021)** | UK/EU | EU→UK transfers; up for review 2025 | CRITICAL | If adequacy lapses, SCC re-papering of every EU controller relationship |
| 49 | **ICO International Data Transfer Agreement (IDTA) / Addendum** | UK | UK→US transfers (Anthropic, Stripe US, Sentry US) | HIGH | Transfer-impact assessments required |
| 50 | **Property Ombudsman / Property Redress Scheme rules** | UK | Estate-agent and letting redress | CRITICAL | Membership mandatory for participating agents — platform must verify |

---

## PHASE 2 — DATA MAPPING AUDIT

Schema source: `supabase/migrations/*` (~70 migration files, summarised by table family).

| Data category | Where collected | Where stored | Shared with | Purpose | Lawful basis | Retention | Risk |
|---|---|---|---|---|---|---|---|
| Account identifiers (email, phone, name) | Sign-up form `src/app/(auth)/sign-up` | `auth.users` + `profiles` | Stripe (billing), Resend (txn email) | Service provision | Art. 6(1)(b) Contract | 6 yrs post-closure (limitation) | MEDIUM |
| Multi-role assignments | Onboarding | `user_roles` | Internal | Authorisation | Art. 6(1)(b) | Same as account | LOW |
| Consent records (marketing/analytics/3p) | Cookie banner; settings | `consent_records`, `consent_audit_log` | Internal | Consent evidence | Art. 6(1)(a); Art. 7(1) | 6 yrs after withdrawal (ICO recommendation) | LOW |
| KYC / ID verification (passport, driving licence, address proof) | Provider verification flow | `provider_verifications` + Supabase Storage | (intended) ID provider | MLR 2017 obligation | Art. 6(1)(c) Legal obligation; Art. 9(2)(g) | 5 yrs after end of business relationship (MLR reg 40) | HIGH |
| Property listings + photos | Agent / seller flows | `properties`, `listings`, `media` | All site visitors; portals if pushed | Service provision | Art. 6(1)(b)/(f) | Until withdrawn + 1 yr archive | MEDIUM |
| Messaging / chat | Inbox | `messages` table | Counterparties | Service provision | Art. 6(1)(b) | Active + 2 yrs | MEDIUM |
| Payment data | Stripe Elements | **Stripe vault** (not stored locally) | Stripe | Service provision | Art. 6(1)(b) | Stripe retention; transaction metadata 7 yrs (tax) | LOW (PCI scope minimised) |
| Commission / payout records | Stripe webhooks → DB | `payments`, `payouts`, `billing_events` | HMRC; Stripe | Tax + accounting | Art. 6(1)(c) | 7 yrs | LOW |
| Lead data (intent, contact) | Lead forms | `agency_leads`, `provider_leads` | Counterparty professional | Service provision | Art. 6(1)(f) Legitimate interests | 12 months | HIGH (PECR overlap) |
| Search history / saved properties | Browsing | `saved_properties`, browse history | None | Personalisation | Art. 6(1)(f) | 24 months | MEDIUM |
| Behavioural analytics | Page navigation | PostHog EU cloud | PostHog (processor) | Analytics | Art. 6(1)(a) Consent (opt-in) | 7 yrs PostHog default | MEDIUM |
| Telemetry / error data | Sentry | Sentry | Sentry (processor) | Legitimate interests — security | Art. 6(1)(f) | 90 days | MEDIUM |
| Email engagement | Resend | Resend | Resend | Service provision | Art. 6(1)(f)/(b) | 12 months | MEDIUM |
| AI prompts + outputs | `ai_usage_log` | Anthropic (processor) | Anthropic | Service provision | Art. 6(1)(b) | 24 months internal; not retained by Anthropic for training (per supplier) | HIGH (special-category if user pastes ID) |
| Admin audit log | All admin actions | `admin_audit_log` | Internal | Accountability | Art. 6(1)(c) / (f) | 6 yrs | LOW |
| Deletion lifecycle | DSAR/RTBE | `kernel_deleted_users` | Internal | Art. 17 evidence | Art. 6(1)(c) | 6 yrs | LOW |
| Location / IP | Server logs + Cloudflare | Cloudflare logs; server logs | Cloudflare (processor) | Security + fraud | Art. 6(1)(f) | 30 days | MEDIUM |
| Real-estate transaction data (HM Land Registry pull) | Property page | Internal cache | None | Legitimate interests | Art. 6(1)(f) | Cache 30 days | LOW (public data) |

### International transfers

| Recipient | Country | Mechanism | Status |
|---|---|---|---|
| Supabase | Ireland / EU | Adequacy | OK |
| Stripe | US + EU | UK IDTA + US DPF; SCCs to non-DPF subprocessors | OK once papered |
| Anthropic | US | UK IDTA + DPF | OK; TIA required |
| Resend | US | UK IDTA + DPF | OK; TIA required |
| Sentry | US | UK IDTA + DPF (Functional Software) | OK; TIA required |
| PostHog | EU/US (region pinned EU?) | Adequacy if EU region | **VERIFY**: ensure `NEXT_PUBLIC_POSTHOG_HOST` points to `https://eu.posthog.com` (US host triggers IDTA path) |
| Cloudflare | Global | UK IDTA addendum executed by Cloudflare | OK |
| Inngest | US | UK IDTA + DPF | OK; TIA required |
| Upstash | EU | Adequacy | OK |
| Vercel | US (with Frankfurt/London edge) | UK IDTA + DPF | OK; TIA required |
| MapTiler | EU (Switzerland — adequacy) | Adequacy | OK |
| HelloSign / Companies House | UK | None needed | OK |

**Gaps:**
- No documented **Transfer Impact Assessments (TIAs)** for any US transfer.
- No **sub-processor list page** (Art. 28(2) obligation toward agents who themselves are controllers).
- `data-processing/page.tsx` is a summary — actual signed DPAs with each processor not in repo.

---

## PHASE 3 — COOKIE & TRACKING AUDIT

### What runs today

| Tracker | File | Consent gate? | Status |
|---|---|---|---|
| **PostHog** | `src/components/providers/PostHogProvider.tsx` | YES — `posthog.opt_out_capturing()` if `consent.analytics === false`; SDK init gated on consent | **COMPLIANT** |
| **Cloudflare Web Analytics** | Cloudflare proxy | Cookie-less, "Privacy First" — exempt under PECR Reg 6(4) | OK if pure CWA; verify zero-cookie response |
| **Google Analytics 4 (if used)** | Mentioned in CSP allowlist `middleware.ts` | Not gated on consent in code; CSP allows it | **NON-COMPLIANT** if GA tag fires before opt-in. Either remove allowlist or wire to Consent Mode v2 with `denied` defaults |
| **Stripe** | Stripe.js loaded at checkout | Necessary cookie — exempt | OK |
| **Sentry** | Bundled | First-party error telemetry — legitimate interest | OK; document in privacy |
| **Facebook Pixel** | Referenced in `cookies/page.tsx` | No code found firing it | If launched, must gate on opt-in + Consent Mode v2 |
| **Cookie banner** | `src/components/legal/CookieConsentBanner.tsx` | Accept-All / Reject-All / Manage Preferences present | **COMPLIANT** (matches ICO 2023 guidance — equal weight to reject) |

### Findings

- **G1 (CRITICAL).** GA4 allowance in CSP without observable gating code. Either delete from CSP or wire Google Tag Manager + Consent Mode v2 with `denied` defaults.
- **G2 (HIGH).** No "Sale of personal data" toggle — irrelevant in UK but required if CCPA users in scope post-EU rollout.
- **G3 (HIGH).** Withdraw-consent must be "as easy as giving" (Art. 7(3)). Verify the preferences modal is reachable from every page (footer link confirmed in `src/app/(main)/legal/layout.tsx`; check global footer).
- **G4 (MEDIUM).** Cookie audit table in `cookies/page.tsx` must be machine-checked monthly vs actual cookies set — no script in `scripts/audit/` runs this.
- **G5 (MEDIUM).** No record-keeping for the *category* of consent at user level for cross-device users; current banner consent is per-device. Move to a per-user consent ledger keyed off `auth.uid()` on sign-in (rows exist in `consent_records`; UI needs hydration).

### Required additions

- Add `scripts/audit/cookie-audit.ts` running Puppeteer + tracking-cookie sniffer; fail PR build if new cookie introduced without entry in `cookies/page.tsx`.
- Add **DNT** + **GPC** signal honouring (DUAA 2025 explicitly preserves).

---

## PHASE 4 — MARKETPLACE LIABILITY AUDIT

### Property listings
- **Trader identity** — Estate Agents Act 1979 s.21 requires the seller's agent to disclose any personal interest in the property. No field in `properties` table for declared agent interest. **GAP-M1**.
- **Material information** — NTSELAT Parts A/B/C are not modelled. **GAP-M2 (BLOCKER)**. Required fields: council-tax band, tenure, lease length, ground rent, service charge, EPC, building safety, planning permission status, rights/restrictions, flood risk, parking, restrictions, accessibility features.
  - **2026-06-11 — PARTIAL CLOSURE (planning permission status):** `planning_permission_status` is now modelled (`planning_status_type` enum on `properties` + `seller_listings`, migration `20260611000000`), **required** on listing create/edit across all three flows (canonical `ListingForm` Description step, seller wizard Step 2, agent `CreateListingWizard`), enforced server-side on publish (`listing-service.ts` / seller `listing-service.ts`), and displayed on the property detail page ("Not declared" fallback for legacy listings). Nearby planning applications additionally surface via the PlanIt integration (`planit-service.ts`) with a data-provenance disclaimer. **Still open under GAP-M2:** building safety, rights/restrictions, flood risk declaration, parking, accessibility features; the agent `CreateListingWizard` also still captures no EPC/council-tax band (tracked as follow-up).
- **Tenant Fees Act fees breakdown** for lettings — must show "permitted payments only" upfront. Add field on listing.
- **Asking price vs guide price** distinction (CPRs) — add field for price type.

### Agent accounts
- **Redress scheme** — must capture TPO or PRS membership number on onboarding and **verify against scheme API or display certificate**. Not present. **GAP-M3 (BLOCKER)**.
- **Client money protection** (CMP) scheme — required for lettings agents holding client money: must capture scheme + certificate.
- **AML supervision** — must capture HMRC supervision number per branch.
- **PI insurance** — captured in `provider_verifications` but no scheduled re-check cron.
- **Ranking transparency** (P2B Art. 5; CMA) — disclose how listings rank. Not present.

### Tradesperson accounts
- **Gas Safe / NICEIC / NAPIT** numbers must be captured, verified, and re-verified every 12 months.
- **Public liability insurance** minimum £2m commonly required — captured but no expiry alerting.
- **DBS for any work in regulated activity with vulnerable adults / children** — not modelled.

### User-generated content
- **Online Safety Act 2023 illegal-content risk assessment** — first deadline 16 March 2025 (already passed for active services). **GAP-M4 (BLOCKER)**.
- **Children's access assessment** — required if under-18s could access user-to-user functionality. **GAP-M5**.
- **Notice-and-action procedure** (DSA Art. 16; OSA s.20) — no `/report-content` flow tied to `property_reports` for non-property UGC.

### Reviews
- **DMCC fake review offence** (from 6 April 2025) — must (i) prohibit fake/incentivised reviews in T&Cs, (ii) take reasonable steps to detect and remove, (iii) avoid concealing material information.
- **Defamation s.5 defence** — to keep it, must have a working notice procedure to identify and notify posters of allegedly defamatory reviews within 48 hours. **GAP-M6**.
- `review-policy/page.tsx` exists — verify it gives ≥48h notice procedure detail.

### Messaging
- **PECR Reg 22** — direct marketing via in-platform DM still counts; agents/providers using DM for promo content need separate consent.
- **Lawful intercept / RIPA / IPA** — server-side logging of messages requires clear T&C disclosure.

### Referral systems
- **Referral / kickback disclosure** — Estate Agents (Provision of Information) Regs 1991 + CPRs require disclosure of any referral fee received for recommending a conveyancer, surveyor, mortgage broker. Currently `commission-rates.ts` references mortgage broker tier without code path for **mandatory written referral disclosure to consumer at point of recommendation**. **GAP-M7 (BLOCKER)**.

---

## PHASE 5 — AI COMPLIANCE AUDIT

### What AI does today (from code)
- **Description generation** — `src/services/ai/description-generator.ts`
- **ROI / valuation estimation** — `src/services/ai/roi-estimation-service.ts`
- **Match / recommendation** — `src/services/ai/ai-match-service.ts` (pgvector)
- **Quote draft suggestions** — `src/services/ai/quote-draft-service.ts`
- All routed through `src/services/ai/claude-service.ts` with rate limit + spend cap + input sanitisation + Zod output validation + `ai_usage_log` writeback

### Strengths
- Centralised provider boundary (good for switching models, audit, kill-switch)
- Rate limit (100/min global, 10/hr per user) + daily spend cap
- Input sanitisation (`src/lib/ai/sanitize.ts`)
- Output schema validation (Zod)
- Usage logging
- Transparency page at `src/app/(main)/legal/ai-transparency/page.tsx`

### Gaps
- **AI-1 (BLOCKER).** No DPIA covering AI processing. UK GDPR Art. 35; ICO AI/Data Protection Toolkit explicitly required for "innovative use" + "large-scale".
- **AI-2 (BLOCKER).** EU AI Act Art. 50 transparency obligations apply from 2 Aug 2026 (chatbots, generated content). Even though there is a transparency page, individual AI-generated outputs must carry **machine-readable provenance** for synthetic content and an inline label for user-facing chatbots. The description-generator does not embed a `data-ai-generated="true"` attribute or visible badge in the rendered listing.
- **AI-3 (HIGH).** No human-in-the-loop checkpoint for valuations. Property valuations can affect mortgage / sale decisions → meaningful effect (Art. 22). Either (i) ensure outputs are advisory with friction (user must click "I understand this is an estimate") or (ii) build a human review queue.
- **AI-4 (HIGH).** Match / recommendation engine — record per-user explanations available on request (Art. 22(3) right to explanation + EU AI Act Art. 86 explainability for high-risk).
- **AI-5 (MEDIUM).** Bias testing — no protected-characteristic fairness audit on recommendations. Could trigger Equality Act 2010 indirect discrimination in housing.
- **AI-6 (MEDIUM).** Prompt-injection defence — sanitiser strips control chars but does not handle markdown / HTML-shaped attacks in user-supplied listing copy fed back into AI summarisation. Add allow-list parser.
- **AI-7 (MEDIUM).** Model card / system card — publish for each AI feature: provider, model, version pinned (`claude-haiku-4-5-20251001` is good), training-data note, refusal behaviour, known limitations.
- **AI-8 (LOW).** Hallucination mitigation — RAG against HM Land Registry / Companies House for any fact-claim about a property; flagged outputs require source citation.
- **AI-9 (LOW).** Watermarking on AI-generated property photos (if AI staging used) per EU AI Act Art. 50(2).
- **AI-10 (MEDIUM).** Anthropic processor agreement — confirm UK-aligned DPA signed; confirm zero-data-retention setting if available.

---

## PHASE 6 — SECURITY AUDIT

### Controls confirmed in code

| Control | Evidence | Verdict |
|---|---|---|
| TLS termination | Vercel + Cloudflare | OK |
| HTTPS-only cookies | `middleware.ts` referral cookie `secure: true` | OK |
| HttpOnly cookies | Set on referral cookie + Supabase session cookies | OK |
| SameSite cookies | Verify `Lax` or `Strict` on session | VERIFY |
| CSP nonce-based | `src/middleware.ts` | STRONG |
| X-Frame-Options DENY | `middleware.ts` | OK |
| X-Content-Type-Options nosniff | `middleware.ts` | OK |
| Permissions-Policy | `middleware.ts` (camera/mic/geo blocked) | OK |
| HSTS preload | **VERIFY** — should be in `next.config.ts` headers | GAP |
| Auth | Supabase Auth (JWT, refresh-token rotation) | OK |
| MFA | `src/app/api/settings/mfa/{enroll,verify,unenroll,backup-codes}` | OK |
| Password reset re-auth HMAC | `src/lib/auth/reauth-token.ts` (REAUTH_HMAC_SECRET) | STRONG |
| Stripe webhook signature | `src/app/api/webhooks/stripe/route.ts` uses `constructEvent` on raw body | STRONG |
| Inngest signature | `src/app/api/inngest/route.ts` | OK |
| Replay signing | `crypto.timingSafeEqual` for REPLAY_SIGNING_SECRET | STRONG |
| RLS | `supabase/migrations/20260429_rls_policies.sql` + per-table policies | STRONG |
| Soft-delete + RESTRICT FK GDPR purge | `supabase/migrations/20260520000200_gdpr_deletion_safety.sql` | STRONG |
| Admin audit log RPC-gated | `supabase/migrations/20260324_audit_log_hardening.sql` | STRONG |
| Rate limiting | Upstash global + per-user | OK |
| Error tracking | Sentry | OK |

### Gaps

| # | Severity | Finding |
|---|---|---|
| S1 | CRITICAL | **No external penetration test on record.** Required by SOC 2, ISO 27001, due-diligence standard. Commission an OWASP ASVS L2 test pre-launch. |
| S2 | HIGH | **No CSRF token** for state-changing form endpoints. Next.js App Router with cookie auth needs explicit double-submit or origin check; no library found. Add `lib/security/csrf.ts`. |
| S3 | HIGH | **No HSTS preload header** in `next.config.ts`. Add `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` and submit to hstspreload.org. |
| S4 | HIGH | **No secrets rotation runbook**, no documented use of Vercel + Supabase secret rotation cadence. Confirm REAUTH_HMAC_SECRET / REPLAY_SIGNING_SECRET / QUOTE_SIGNING_SECRET rotation procedure. |
| S5 | HIGH | **No SBOM / dependency-vuln gate.** Add `pnpm audit --prod` and `osv-scanner` to CI; gate merge. Sentry SCM doesn't replace this. |
| S6 | HIGH | **Backups** — Supabase PITR on? Verify retention ≥ 7 days; document restore drill cadence. |
| S7 | HIGH | **No DDoS rate limit on AI endpoints from anonymous users** — verify all `/api/ai/*` routes require auth + per-IP additional ratelimit. |
| S8 | MEDIUM | **No bug-bounty / responsible disclosure page** (`/security.txt`). Add per RFC 9116 to `public/.well-known/security.txt`. |
| S9 | MEDIUM | **Sentry session replay PII masking** — verify `maskAllText: true`, no DOM scraping of forms. |
| S10 | MEDIUM | **PostHog session replay** — same; mask all inputs by default. |
| S11 | MEDIUM | **Supabase service-role key** — confirm it is **only** read on server (no `process.env.SUPABASE_SERVICE_ROLE_KEY` in any client bundle). Add ESLint rule. |
| S12 | MEDIUM | **Storage bucket policies** — verify private buckets for ID docs / verification uploads, signed URLs only, expire ≤ 15 min. |
| S13 | MEDIUM | **Logs retention** — server logs should retain 90 days minimum (ICO breach investigation) but be purged of body / PII payloads. |
| S14 | MEDIUM | **Webhook idempotency** — `billing_events` table should enforce uniqueness on `stripe_event_id` so retried webhooks cannot double-count commission. |
| S15 | MEDIUM | **CSP `unsafe-inline`** for styles? Verify nonce-based not pinned `'unsafe-inline'`. |
| S16 | LOW | **Subresource Integrity** on third-party scripts in CSP allowlist. |
| S17 | LOW | **Cookies on `__Host-` prefix** for session — defence-in-depth. |
| S18 | LOW | **Dependency pinning** — package.json uses `^` ranges; with Renovate + lockfile this is OK; document. |
| S19 | LOW | **Stripe Connect express dashboard** access — disable embedded onboarding fields that aren't needed (data minimisation). |
| S20 | LOW | **Service-role JWT in webhook handler** is fine but ensure handler runs in **edge or node** environment that doesn't log full request bodies in plain text. |

---

## PHASE 7 — CONTRACT AUDIT

| # | Contract | Priority | Purpose | Risk if missing | Status |
|---|---|---|---|---|---|
| 1 | **Master Terms of Service (B2C)** | P0 | Consumer contract | UTCCR void; CPR | DRAFTED at `src/app/(main)/legal/terms` — needs identity fields filled |
| 2 | **Privacy Notice** | P0 | UK/EU GDPR Art. 13/14 | ICO fine | DRAFTED; placeholders |
| 3 | **Cookie Notice** | P0 | PECR Reg 6 | £500k | DRAFTED |
| 4 | **AI Transparency Notice** | P0 | UK GDPR + EU AI Act Art. 50 | Art. 35 + AI Act fines | DRAFTED |
| 5 | **Acceptable Use Policy** | P0 | OSA + DSA + defence | OSA exposure | DRAFTED — verify enforcement language |
| 6 | **Agent Terms (T&Cs for estate/letting agents)** | P0 | B2B contract; commission; representations | Commercial disputes; CMA | MISSING from code review — verify path |
| 7 | **Tradesperson Terms** | P0 | B2B contract; lead pricing; liability | Disputes; insurance gap | MISSING — verify |
| 8 | **Mortgage Broker Terms** | P0 (if going live) | Introduction agreement; FCA s.39 AR posture | FSMA criminal | **MISSING — BLOCKER** |
| 9 | **Insurance Introducer Terms** | P0 (if going live) | Art. 25 IDD | FSMA criminal | **MISSING — BLOCKER** |
| 10 | **Conveyancer / Solicitor Referral Agreement** | P0 | SRA referral fees; CPRs disclosure | SRA enforcement | MISSING |
| 11 | **Surveyor Referral Agreement** | P0 | RICS rules; CPRs | RICS complaint | MISSING |
| 12 | **Buyer/Seller Search Subscription T&Cs** | P0 | DMCC subscription auto-renew | DMCC primary offence | MISSING |
| 13 | **Premium Listing T&Cs** | P0 | Listing carriage terms | Disputes | MISSING |
| 14 | **Lead-Generation Product T&Cs** | P0 | Lead quality / refund | Disputes | MISSING |
| 15 | **Subprocessor List (public)** | P0 | DPA Art. 28(2) notice | Agent dispute | MISSING |
| 16 | **DPA template for B2B controllers** (agents) | P0 | Art. 28 | Personal liability of controller | **MISSING — BLOCKER** |
| 17 | **DPA with each subprocessor** (Stripe, Anthropic, Supabase, Resend, PostHog, Sentry, Vercel, Cloudflare, Upstash, Inngest, MapTiler) | P0 | Art. 28(3) | Joint liability | Verify executed |
| 18 | **Stripe Connect platform agreement** | P0 | Service terms | Account loss | Standard |
| 19 | **Vendor SaaS agreements** (each above) | P0 | MSA / DPA / SCC / IDTA / SLA | Vendor lock-in | Audit |
| 20 | **NDAs (employee, contractor, advisor)** | P0 | IP + confidentiality | IP leakage | MISSING — verify |
| 21 | **IP assignment from founders + every dev** | P0 | Sec 11(2) CDPA 1988; investor DD | Title cloud | **MISSING — BLOCKER** |
| 22 | **Open-source compliance / SBOM** | P1 | Licence compliance | Injunction | MISSING |
| 23 | **AI provider DPA (Anthropic)** | P0 | Art. 28 | Joint liability | Verify executed |
| 24 | **Modern Slavery statement (if needed)** | P3 | Only if >£36m | None now | Empty page exists — **REMOVE** until threshold |
| 25 | **Cookie Consent Records Retention Policy** | P1 | Art. 7(1) evidence | Fine | MISSING (document) |
| 26 | **Data Retention Schedule** | P1 | Art. 5(1)(e) | Fine | Inside privacy policy — formalise as separate doc |
| 27 | **Data Subject Rights SOP** | P1 | Art. 12–22 ops manual | Operational fines | MISSING |
| 28 | **Information Security Policy** | P1 | ISO 27001 A.5.1; SOC 2 CC1 | DD fail | MISSING |
| 29 | **Incident Response Policy + Runbook** | P0 | ICO 72h | £17.5m | **MISSING — BLOCKER** |
| 30 | **Business Continuity / DR plan** | P1 | NIS2 / DD | Outage liability | MISSING |
| 31 | **Acceptable Vendor Use / Third-party risk policy** | P1 | DPA Art. 28(4) | Cascade liability | MISSING |
| 32 | **Anti-Bribery & Corruption policy** | P1 | Bribery Act 2010 s.7 defence | Strict liability | MISSING |
| 33 | **Whistleblowing policy + channel** | P1 | PIDA 1998 | Employment claims | MISSING |
| 34 | **HR data privacy notice** | P1 | Art. 13 to staff | ICO | MISSING |
| 35 | **Equal Opportunities policy** | P2 | EA 2010 | Claims | MISSING |
| 36 | **Marketing list opt-in / soft opt-in policy** | P0 | PECR Reg 22(3) | £500k | MISSING (technical control too) |
| 37 | **Complaints policy + procedure** | P0 | TPO/PRS expectations | Membership loss | Page exists — verify substantive |
| 38 | **Refund / Cancellation policy** | P0 | CCRs 2013 | Loss of price | Inside terms — extract for clarity |
| 39 | **Fee Transparency document** | P0 | EAA 1979 + CPRs | Banning order | Page exists at `/legal/fee-transparency` — verify content |
| 40 | **Estate-agent letter of engagement template** | P0 | EAA 1979 s.18 | Loss of fee | MISSING |
| 41 | **NDA for property viewers (if discretion-sale)** | P3 | Confidentiality | Reputational | Optional |

---

## PHASE 8 — REVENUE COMPLIANCE AUDIT

| Revenue stream | Description | Lawful basis | Disclosures required | Licensing/regulator | Status |
|---|---|---|---|---|---|
| **SaaS subscriptions (agent/landlord/provider plans)** | Recurring | Contract | DMCC pre-contract info; renewal reminders; cooling-off | None (not financial product) | **GAP**: DMCC reminder + easy cancellation flow needed by Spring 2026 |
| **Commission on sales** | 0.25%–0.5% on completion | Contract | EAA 1979 s.18 disclosure | None | Letter of engagement template missing |
| **Commission on lettings** | per-tenancy | Contract | Tenant Fees Act compliance check | Redress scheme | Verification missing |
| **Service-job commission** | 6%–12% per completed job | Contract | Pre-job estimate + breakdown to consumer | None | OK |
| **Lead generation (agency leads)** | Pay per lead | Contract | Quality SLA; refund for fake leads | None | T&Cs needed |
| **Lead generation (mortgage brokers)** | Pay per qualified lead | Contract | **Regulated activity Art. 25A (mortgage intro) + 25B (consumer credit)** | **FCA permission required OR Appointed Representative** | **BLOCKER** |
| **Lead generation (insurance brokers)** | Pay per quote | Contract | **Regulated activity Art. 21/25 (insurance intermediation)** | **FCA IDD authorisation OR AR** | **BLOCKER** |
| **Lead generation (conveyancers)** | Pay per lead | Contract | EAA 1979 referral disclosure | None (but SRA rules on solicitor side) | T&Cs + on-page consumer disclosure missing |
| **Premium listings** | Featured placement | Contract | Ranking-bias disclosure (P2B / CMA) | None | T&Cs missing |
| **Advertising** | Display ads | Contract | CAP code | ASA | Plan |
| **AI-powered services (premium descriptions / valuations)** | Subscription tier | Contract | AI Act Art. 50 + Art. 35 DPIA | EU AI Act | DPIA missing |

### Consumer-Duty / Consumer-Law layer

- **Drip pricing** (CMA + DMCC): all mandatory fees must be in the first quoted price. Verify subscription pages.
- **Auto-renewal reminders**: Spring 2026 DMCC rule — reminders before each renewal, easy exit. Implement now.
- **Subscription cooling-off**: 14-day right; ensure express acceptance of immediate provision.
- **Negative-option marketing**: prohibited.

### FCA risk — detailed view

Even *introducing* a customer to a regulated firm in return for a fee is a **regulated activity** unless an exclusion applies. The two viable routes:

1. **Become an Appointed Representative (AR) of an FCA-authorised principal** — must have an AR Agreement, principal's oversight, professional indemnity, and the principal must notify FCA.
2. **Rely on Article 33B (introducing) exclusion** for mortgages — *very* narrow: introduction only, no advice, the introducer's only role is to give the firm's contact details. Even hosting a calculator can void the exclusion.

The current plan tier reference to mortgage brokers without either structure is a **launch blocker**.

---

## PHASE 9 — INVESTOR DUE-DILIGENCE AUDIT

Imagining Sequoia / Accel / Index VCs + a FTSE-listed acquirer running diligence.

### Red-flag report

| # | Area | Red flag | Severity |
|---|---|---|---|
| 1 | **Corporate** | Company appears not incorporated in published docs (placeholders) | CRITICAL |
| 2 | **Cap table** | Not in repo (expected) — verify Companies House filings consistent with SAFE/EMI/share-options | CRITICAL |
| 3 | **IP** | No assignment from contractors / founders surfaced; any contributor without assignment owns their code (CDPA 1988 s.11) | CRITICAL |
| 4 | **Open source** | No SBOM, no licence audit (e.g., AGPL contamination check) | HIGH |
| 5 | **Data** | No ROPA, no DPIA, no DPO, no ICO registration number filled | CRITICAL |
| 6 | **AI** | No DPIA on AI; no model cards; no bias testing evidence | CRITICAL |
| 7 | **Security** | No external pen test, no SOC 2 / ISO 27001 path | HIGH |
| 8 | **Compliance** | No HMRC AML supervision number; FCA exposure unaddressed | CRITICAL |
| 9 | **Marketplace ops** | Estate-agent redress scheme verification not enforced | CRITICAL |
| 10 | **Online Safety Act** | No illegal-content risk assessment | CRITICAL |
| 11 | **Subscription compliance** | DMCC auto-renew reminders not implemented | HIGH |
| 12 | **Trade marks** | "TrueDeed" + "Brit-Estate" registration status unknown — DD will ask | HIGH |
| 13 | **Domain ownership** | Verify domains in company name, not founder personal | HIGH |
| 14 | **Employment** | Employee handbook, contracts, IR35 status of contractors | HIGH |
| 15 | **Tax** | VAT registration, MTD compliance, IR35 | HIGH |
| 16 | **Insurance** | Cyber, PI, D&O, EL — current? | HIGH |
| 17 | **Vendor contracts** | Not consolidated in data room | MEDIUM |
| 18 | **Records management** | Board minutes, written resolutions, statutory registers | MEDIUM |
| 19 | **Customer KPIs** | LTV/CAC/ARR not auditable (no warehouse, only PostHog) | MEDIUM |
| 20 | **Code quality** | Pre-launch monorepo with .planning/, britv3.0/ legacy folder, gstack tooling — clean up before DD |

---

## PHASE 10 — LAUNCH READINESS SCORES

| Dimension | Score | Notes |
|---|---|---|
| **Launch Readiness** | **42 / 100** | Engineering tier ~85, regulatory tier ~25 |
| **Compliance Score** | **55 / 100** | Strong skeleton + glaring blockers |
| **Security Score** | **74 / 100** | Top quartile for pre-revenue; needs pen test + CSRF + HSTS |
| **Governance Score** | **38 / 100** | No DPO, no ROPA, no risk register |
| **Investor Readiness** | **48 / 100** | Code maturity helps; legal infrastructure thin |
| **Acquisition Readiness** | **31 / 100** | Big-Four DD would surface 15+ remediations before close |

---

## 11. TOP 50 COMPLIANCE RISKS (ranked)

1. **Placeholders in published legal pages** — ICO + CPR breach on day one.
2. **No DPIA for AI processing** — Art. 35 mandatory.
3. **No ROPA** — Art. 30 mandatory.
4. **No DPO appointment in writing** — Art. 37 if monitoring is large-scale + systematic (recommendation engine likely qualifies).
5. **No HMRC MLR supervision** — criminal under MLR Reg 56.
6. **No FCA permission / AR structure for mortgage / insurance lead-gen** — FSMA s.23 criminal.
7. **No NTSELAT Material Information fields** in listings — CPR + portal blacklist.
8. **No redress-scheme verification** at agent onboarding — EAA 1979 + Letting Agents Order 2014.
9. **No OSA illegal-content risk assessment** — Ofcom enforcement; senior-manager liability.
10. **No OSA children's access assessment** — risk of being deemed in scope of children's codes.
11. **PECR soft opt-in not technically enforced** — £500k.
12. **No DMCC auto-renewal reminders** — Spring 2026 primary offence.
13. **No DMCC fake-review systems** — primary offence.
14. **No EU AI Act Art. 50 inline labelling** of AI-generated content.
15. **No tenancy deposit scheme integration** — 3× deposit + no s.21.
16. **No client-money-protection scheme verification** for lettings agents.
17. **No referral-fee disclosure flow** in conveyancer/surveyor/mortgage referrals.
18. **No PostHog EU region pin verified** — possible undocumented US transfer.
19. **No TIAs for any US transfer**.
20. **No public sub-processor list**.
21. **No CSRF protection** for state-changing form endpoints.
22. **No HSTS preload**.
23. **No external pen test on record**.
24. **No SBOM / dependency vuln gate** in CI.
25. **No documented secrets rotation**.
26. **No incident-response runbook with 72-hour ICO clock**.
27. **No accessibility audit** vs WCAG 2.2 AA.
28. **No EU Accessibility Act 2025 conformance** (if EU launch).
29. **No Modern Slavery threshold check** — empty page is misleading.
30. **No DSAR SOP** (only the form exists).
31. **No data-retention enforcement cron** (privacy policy promises retention but no scheduled deletion job).
32. **No consent revocation propagation** to Resend / PostHog / Anthropic on user request.
33. **No marketing-list separation** of transactional vs marketing.
34. **No `__Host-` cookie prefix**.
35. **No Stripe webhook idempotency uniqueness** on `stripe_event_id`.
36. **No storage-bucket policy verification** for ID documents.
37. **No watermarking** of AI-generated property staging photos.
38. **No bias / fairness testing** of recommendation engine.
39. **No estate-agent letter-of-engagement template** complying with EAA 1979 s.18.
40. **No personal-interest disclosure** field on listings.
41. **No `data-ai-generated="true"`** machine-readable provenance on AI descriptions.
42. **No supplier DPA register**.
43. **No appointment of UK + EU representative** under UK GDPR Art. 27 (only needed for non-UK / non-EU controllers, but verify any controllers operating from outside).
44. **No record of DPIA pre-launch sign-off** by DPO.
45. **No periodic re-verification cron** for Gas Safe / PI insurance / EPC certs.
46. **No board-level approval** of risk register, retention schedule, DPIA.
47. **No process for "right to explanation"** requests on AI outputs.
48. **No audit-log immutability proof** (no write-only / append-only / WORM storage of `admin_audit_log`).
49. **No published `security.txt`** / vulnerability disclosure channel.
50. **No statutory company information** on every page footer (Companies Act 2006 s.82).

---

## 12. TOP 20 LEGAL RISKS

1. **FSMA s.23 criminal exposure** from mortgage / insurance lead-gen without permission/AR.
2. **Estate Agents Act 1979 banning order** if redress-scheme rule breached at scale.
3. **CPRs criminal liability** for misleading omissions in listings.
4. **DMCC 10% global-turnover fines** for drip pricing, fake reviews, subscription traps.
5. **UK GDPR Art. 83 fines** up to 4% global turnover.
6. **PECR £500k** for marketing without consent.
7. **OSA enforcement + senior-manager criminal** for illegal-content duty failure.
8. **Tenant Fees Act fixed penalties** £5k/£30k for landlord/agent fee breaches.
9. **Defamation Act s.5 defence loss** if no working review-notice procedure.
10. **MLR 2017 criminal** for trading without HMRC supervision.
11. **POCA 2002 s.327–329** if SAR procedure not in place.
12. **OFSI sanctions strict-liability fine** if no sanctions screening on KYC.
13. **EU AI Act fines** up to €35m / 7% global turnover.
14. **DSA fines** up to 6% global (EU expansion).
15. **Consumer Rights Act unfair-term invalidity** of T&Cs clauses.
16. **Bribery Act s.7 strict-liability** for failure to prevent commercial bribery.
17. **IP ownership claim** by former contractor with no assignment.
18. **Trade mark conflict** "TrueDeed" / "Brit-Estate" (verify clearance + registration).
19. **Equality Act 2010** indirect discrimination via algorithmic recommendations.
20. **Tort of defamation / malicious falsehood** in user reviews without takedown SOP.

---

## 13. TOP 20 SECURITY RISKS

1. No external penetration test.
2. No CSRF tokens on state-changing endpoints.
3. No HSTS preload header.
4. No SBOM / dependency-vuln scanning in CI.
5. No secrets rotation runbook.
6. No documented backup restore drill.
7. PostHog/Sentry session-replay PII masking unverified.
8. Storage bucket policies for ID docs unverified.
9. No `security.txt` / VDP.
10. No webhook idempotency uniqueness on Stripe event IDs.
11. No `__Host-` cookie prefix on session.
12. No SRI on third-party scripts.
13. No anomaly detection on admin endpoints.
14. No real-time alerting on `admin_audit_log` rate spikes.
15. No threat model on AI prompt-injection.
16. No DDoS test against AI endpoints under burst.
17. No documented `failover` for Supabase region outage.
18. No "break glass" admin procedure with dual control.
19. No log redaction policy for PII in server logs.
20. No SOC 2 / ISO 27001 evidence collection started.

---

## 14. TOP 20 INVESTOR DD RISKS

1. Placeholders in legal docs.
2. IP assignment chain incomplete.
3. No company registration number visible.
4. No trade mark register entries.
5. No external pen test.
6. No DPIA.
7. No ROPA.
8. No DPO.
9. No FCA structure for regulated revenue streams.
10. No HMRC AML supervision number.
11. No OSA risk assessment.
12. No SOC 2 path / dates.
13. No insurance schedule.
14. No board minutes / written resolutions.
15. No founder service / shareholders' agreements visible.
16. No data warehouse — KPI numbers unauditable.
17. No customer / churn cohort report.
18. Open `.planning/`, `britv3.0/`, `.gstack/` clutter — DD perceives discipline gap.
19. No documented dependency on Anthropic — single-supplier AI risk.
20. No regulatory horizon scan log (DUAA, DMCC, EU AI Act).

---

## 15. REQUIRED POLICIES (deliverables)

1. Privacy Policy (fix placeholders)
2. Cookie Policy
3. Terms of Service (B2C)
4. Agent T&Cs (B2B)
5. Tradesperson T&Cs (B2B)
6. Acceptable Use Policy
7. AI Transparency + AI Use Policy (internal)
8. Data Retention Schedule (standalone)
9. Data Subject Rights SOP
10. Incident Response Policy + Runbook
11. Information Security Policy
12. Access Control Policy
13. Vendor / Third-Party Risk Policy
14. Business Continuity / DR
15. Backup & Restore Policy
16. Logging & Monitoring Policy
17. Change Management Policy
18. Acceptable Use Policy (internal staff)
19. Bring Your Own Device Policy
20. Whistleblowing Policy
21. Anti-Bribery & Corruption Policy
22. Equal Opportunities Policy
23. HR Privacy Notice
24. Marketing Consent Policy
25. Review Moderation Policy
26. Notice & Action / Takedown SOP
27. Sanctions Screening Policy
28. AML/CTF Policy (operational, distinct from public AML page)
29. KYC Operations Manual
30. Complaints Handling Procedure
31. Refund / Cancellation Policy
32. Conflicts of Interest Policy
33. Record of Processing Activities (ROPA)
34. DPIA — AI Recommendation Engine
35. DPIA — KYC / AML Processing
36. DPIA — Landlord/Tenant Referencing
37. Trader Identification Standard (Companies Act s.82)
38. Accessibility Statement
39. Children's Risk Assessment (OSA)
40. Illegal Content Risk Assessment (OSA)

---

## 16. REQUIRED CONTRACTS

(See §7 above — 41 items)

---

## 17. REQUIRED CONSENT FLOWS

1. Cookies — Accept / Reject / Manage (DONE; verify GA gating)
2. Marketing-email opt-in (separate from account creation)
3. PECR soft opt-in evidencing
4. Telemarketing (TPS check + consent if used)
5. SMS (PECR Reg 22)
6. Push notifications (PECR Reg 22; specific permissioning)
7. AI-feature opt-in / opt-out per feature
8. Profile-based recommendation opt-out
9. Withdrawal of consent (as easy as giving)
10. Children's consent + parental approval (only if 13–18 ever in scope)
11. Special-category processing (any KYC photo with biometric → Art. 9 explicit consent)
12. International transfer notice on account creation
13. Sub-processor change notice (B2B controllers)
14. Right-to-erasure flow (DONE; verify propagation)
15. Right-to-portability flow
16. Right-to-object to legitimate-interest processing
17. Right-to-restrict
18. Right-to-explanation for AI decisions
19. Marketing list re-confirmation every 24 months
20. Consent ledger immutability proof

---

## 18. REQUIRED TECHNICAL CONTROLS

1. Fill identity placeholders site-wide via env: `LEGAL_COMPANY_NUMBER`, `LEGAL_REGISTERED_ADDRESS`, `LEGAL_ICO_NUMBER`, `LEGAL_HMRC_NUMBER`. Single source of truth in `src/lib/legal-entity.ts`.
2. Wire cookie audit script into CI.
3. Add CSP nonce check; remove any `unsafe-inline`.
4. Add HSTS preload.
5. Add `__Host-` prefix to session cookie.
6. Add CSRF double-submit token middleware.
7. Add dependency vuln gate (`osv-scanner` + `pnpm audit`) in CI.
8. Add `security.txt` at `public/.well-known/security.txt`.
9. Add Stripe webhook idempotency unique index on `stripe_event_id`.
10. Add scheduled cron to enforce data retention (purge expired rows per category).
11. Add scheduled cron to revalidate provider verification (Gas Safe, EPC, PI).
12. Add scheduled cron to re-confirm marketing-consent every 24 months.
13. Wire NTSELAT material-information fields into `properties` table + listing form + validation.
14. Wire redress-scheme membership field + verification call.
15. Wire HMRC AML supervision number field for agents.
16. Wire client-money-protection scheme membership field.
17. Wire referral-fee disclosure modal at point of conveyancer / surveyor / mortgage broker recommendation.
18. Add `data-ai-generated="true"` attribute + visible badge on every AI-generated description.
19. Add human-in-the-loop "I understand this is an AI estimate" friction on valuations.
20. Add per-feature AI opt-out in user settings; propagate to inference layer.
21. Add automated DSAR export pipeline (JSON+CSV bundle).
22. Add automated RTBE pipeline (already partially built — propagate to Anthropic, Resend, PostHog, Sentry).
23. Add PII redaction in server logs.
24. Add session-replay PII masking on PostHog + Sentry.
25. Add storage-bucket policy tests in CI.
26. Add tenancy deposit scheme API integration (TDS/DPS/MyDeposits).
27. Add OFSI sanctions screening on agent + landlord onboarding (and counterparties on transactions).
28. Add Companies House lookup on agent onboarding.
29. Add per-listing "personal interest" disclosure toggle.
30. Add per-listing material-information completeness gate (cannot publish until required fields filled).
31. Add admin notification rate-limit anomaly detection.
32. Add ban-evade detection (email/IP/device).
33. Add review moderation queue with notice-procedure timestamps.
34. Add immutable audit-log archive to S3 Object Lock or equivalent.
35. Add Vercel + Supabase rotated-secret runbook + audit job.

---

## 19. REQUIRED GOVERNANCE CONTROLS

1. Board / founders approve risk register (quarterly).
2. Appoint DPO (in writing) and publish contact in privacy notice.
3. Appoint MLRO + nominated officer; document on AML page.
4. Register with ICO; capture number.
5. Apply for HMRC MLR supervision.
6. Apply for FCA AR principal relationship for mortgage/insurance lead-gen.
7. Sign vendor DPAs (each subprocessor).
8. Sign IP assignment from every contributor (founders, contractors, designers, advisors).
9. Sign employment / contractor agreements with confidentiality + IP + post-termination obligations.
10. Sign D&O, cyber, professional indemnity, EL insurance.
11. Adopt formal change-management process (PR gate on legal-impact changes).
12. Adopt quarterly access review.
13. Adopt monthly cookie audit.
14. Adopt monthly subprocessor change review.
15. Adopt regulatory horizon scan (DUAA, DMCC, AI Act, OSA, NTSELAT updates).
16. Adopt incident-response tabletop every 6 months.
17. Adopt pen-test cadence (annual + on major release).
18. Adopt code-review gate (security reviewer for /api/* changes).
19. Adopt SBOM + open-source licence gate.
20. Adopt training: GDPR, PECR, AML, FCA basics for all staff.
21. Adopt KPI auditability — periodic reconciliation of PostHog → finance numbers.
22. Adopt board minutes for every policy adoption.
23. Adopt customer-feedback loop into governance (DMCC duty).
24. Adopt "Consumer Duty"-inspired good-outcomes review even outside FCA perimeter.
25. Maintain a data-room.

---

## 20. 30-DAY REMEDIATION PLAN (T-30 → T-0, soft beta launch only)

**Theme: stop bleeding; do not launch publicly with any BLOCKER unresolved.**

### Week 1 (T-30 → T-23) — Incorporate & paper
- Confirm Brit-Estate Ltd incorporation; capture number, address; register share allotment.
- Register with ICO; capture registration number.
- File HMRC MLR supervision application (parallel-process while continuing).
- Engage FCA-authorised principal for AR relationship (mortgage + insurance); or remove mortgage/insurance lead-gen tier from product.
- Procure trade mark search + applications for "TrueDeed" + "Brit-Estate".
- Procure D&O, cyber, PI insurance quotes.
- Replace placeholders in legal pages using new `src/lib/legal-entity.ts` constants; CI lint blocks any literal `[ICO ` etc.
- Sign IP assignment from every contributor.

### Week 2 (T-22 → T-15) — Compliance artefacts
- Draft and adopt ROPA, DPIA-AI, DPIA-AML, DPIA-tenant-referencing.
- Appoint DPO in writing; publish.
- Appoint MLRO; publish on AML page.
- Adopt incident-response policy + runbook; tabletop test.
- Adopt 25 priority internal policies (Information Security, Access Control, BCP, etc.).
- Subprocessor list page published.
- Cookie audit cron live.
- HSTS preload + CSRF + `security.txt`.
- External pen test commissioned (results required before public launch).

### Week 3 (T-14 → T-8) — Marketplace controls
- NTSELAT material-information fields enforced.
- Redress-scheme verification on agent onboarding.
- Client-money-protection scheme field for letting agents.
- Tenant-fee-act compliance check.
- OFSI sanctions screening live.
- Tenancy deposit scheme integration (TDS/DPS/MyDeposits).
- Notice-and-action procedure live.
- OSA illegal-content + children's access assessments documented.
- Referral-fee disclosure modal live.
- DMCC auto-renew reminders + easy-cancel flow.

### Week 4 (T-7 → T-0) — AI + DMCC + accessibility
- AI provenance attribute + badge on every AI output.
- Valuation friction screen.
- AI opt-out propagation.
- Fake-review detection + moderation queue.
- DMCC pricing disclosure pre-checkout.
- WCAG 2.2 AA audit + remediations.
- DSAR pipeline tested with red-team request.
- Closed-beta launch limited to invite list under written T&Cs only.

---

## 21. 90-DAY REMEDIATION PLAN (T+0 → T+90, public launch)

### Days 0–30 (private beta running)
- Pen-test report + remediations.
- HMRC MLR registration confirmed (or hold launch).
- ICO registration confirmed.
- FCA AR principal relationship signed (or feature stays off).
- Data-warehouse stood up for auditable KPIs.
- Bias / fairness audit of recommendation engine.
- Bug-bounty programme opened (HackerOne / Intigriti).
- Backup restore drill executed.

### Days 31–60
- SOC 2 Type I readiness assessment.
- ISO 27001 gap assessment.
- Full vendor DPA register signed.
- Each subprocessor TIA written.
- Disaster-recovery tabletop.
- Quarterly board meeting adopts risk register.

### Days 61–90 (public launch)
- DSA-readiness for EU expansion (notice-and-action, illegal-content, trader traceability, ranking transparency).
- EU GDPR rep appointment (Art. 27) if no EU establishment.
- EU AI Act compliance pre-mortem.
- Consumer Duty-style outcomes review.
- 12-month internal audit calendar published.
- Public-launch dry run with full incident-response tabletop.

---

## 22. PRE-LAUNCH CHECKLIST (T-30 sign-off)

- [ ] Company incorporated; statutory information on every page footer (Companies Act s.82).
- [ ] ICO registration number live; placeholders eradicated.
- [ ] HMRC AML supervision number live; MLRO named.
- [ ] FCA AR principal signed OR mortgage/insurance lead-gen disabled.
- [ ] All 17 legal pages reviewed by external counsel.
- [ ] DPO appointed in writing; contact published.
- [ ] ROPA + DPIAs adopted by board.
- [ ] Incident response runbook tested.
- [ ] External pen test passed (no Critical / High open).
- [ ] CSRF, HSTS preload, `__Host-`, SRI, security.txt live.
- [ ] CI vuln-gate live (osv-scanner + pnpm audit).
- [ ] NTSELAT material information enforced on listings.
- [ ] Redress-scheme verification enforced on agent onboarding.
- [ ] Tenancy deposit scheme integration live.
- [ ] OFSI sanctions screening live.
- [ ] AI provenance attribute + badge on every output.
- [ ] Cookie consent gating verified by automated test on every PR.
- [ ] PECR soft opt-in enforced in marketing-email send path.
- [ ] DSAR pipeline tested.
- [ ] Right-to-erasure propagates to Anthropic, Resend, PostHog, Sentry.
- [ ] DMCC subscription compliance live (reminders + easy cancel + no drip pricing).
- [ ] OSA illegal-content + children's risk assessments signed and on file.
- [ ] WCAG 2.2 AA audit passed for top 20 user journeys.
- [ ] D&O, cyber, PI insurance bound.
- [ ] IP assignment from every contributor on file.
- [ ] Modern Slavery page removed or completed (threshold check).
- [ ] Public sub-processor list live.
- [ ] Vendor DPAs executed.
- [ ] PostHog region pin verified (EU).
- [ ] Data retention cron live.
- [ ] Backup restore drill executed in staging.
- [ ] Anthropic processor agreement signed; zero-data-retention confirmed.
- [ ] Real-name & address verification of all onboarding agents complete.
- [ ] Companies House lookup integrated on agent onboarding.
- [ ] Defamation s.5 notice procedure live.
- [ ] Trade mark applications filed.
- [ ] Board minutes adopting all policies on file.

---

## 23. POST-LAUNCH CHECKLIST (T+30 onwards, recurring)

- [ ] Monthly cookie audit.
- [ ] Monthly subprocessor change review.
- [ ] Monthly DSAR throughput review.
- [ ] Monthly admin-audit-log immutability check.
- [ ] Monthly incident review.
- [ ] Quarterly board risk-register review.
- [ ] Quarterly access review.
- [ ] Quarterly DPIA refresh on AI features.
- [ ] Quarterly tabletop incident exercise.
- [ ] Quarterly regulator horizon scan (DUAA, DMCC, AI Act, OSA, NTSELAT).
- [ ] Semi-annual penetration test.
- [ ] Semi-annual disaster-recovery drill.
- [ ] Annual SOC 2 (Type II) audit.
- [ ] Annual ISO 27001 surveillance audit.
- [ ] Annual policy refresh.
- [ ] Annual staff training (GDPR/PECR/AML/FCA basics/OSA).
- [ ] Annual bias/fairness audit of recommendation engine.
- [ ] Annual reaffirmation of marketing consent for 24-month-old records.

---

## 24. APPENDIX A — CODE PATHS REFERENCED

| Area | Path |
|---|---|
| Privacy policy | `src/app/(main)/legal/privacy/page.tsx` |
| Cookie policy | `src/app/(main)/legal/cookies/page.tsx` |
| Terms | `src/app/(main)/legal/terms/page.tsx` |
| AI Transparency | `src/app/(main)/legal/ai-transparency/page.tsx` |
| AML policy | `src/app/(main)/legal/aml-policy/page.tsx` |
| Data processing | `src/app/(main)/legal/data-processing/page.tsx` |
| GDPR rights | `src/app/(main)/legal/gdpr-rights/page.tsx` |
| Disclaimer / Accessibility / Complaints / Acceptable Use / Fee Transparency / Modern Slavery / Review Policy | `src/app/(main)/legal/{disclaimer,accessibility,complaints,acceptable-use,fee-transparency,modern-slavery,review-policy}/page.tsx` |
| Cookie banner | `src/components/legal/CookieConsentBanner.tsx` |
| PostHog provider (consent-gated) | `src/components/providers/PostHogProvider.tsx` |
| GDPR request form | `src/components/legal/GdprRequestForm.tsx` |
| AI router | `src/services/ai/claude-service.ts` |
| AI input sanitiser | `src/lib/ai/sanitize.ts` |
| AI description gen | `src/services/ai/description-generator.ts` |
| AI ROI estimator | `src/services/ai/roi-estimation-service.ts` |
| AI matcher | `src/services/ai/ai-match-service.ts` |
| AI quote drafter | `src/services/ai/quote-draft-service.ts` |
| Stripe webhook | `src/app/api/webhooks/stripe/route.ts` |
| Inngest webhook | `src/app/api/inngest/route.ts` |
| Admin replay HMAC | `src/app/api/admin/billing/replay/[event_id]/route.ts` |
| Re-auth HMAC | `src/lib/auth/reauth-token.ts` |
| MFA endpoints | `src/app/api/settings/mfa/{enroll,verify,unenroll,backup-codes}/route.ts` |
| Middleware (CSP, headers) | `src/middleware.ts` |
| Commission rates | `src/lib/commission-rates.ts` |
| Property report | `src/app/api/properties/[id]/report/route.ts` |
| Consent service | `src/services/gdpr/consent-service.ts` |
| RLS migration | `supabase/migrations/20260429_rls_policies.sql` |
| GDPR deletion safety | `supabase/migrations/20260520000200_gdpr_deletion_safety.sql` |
| Audit-log hardening | `supabase/migrations/20260324_audit_log_hardening.sql` |
| Admin foundation | `supabase/migrations/20260316000000_admin_wave1_foundation.sql` |
| Review verification | `supabase/migrations/20260326_review_verification.sql` |

---

## 25. APPENDIX B — LANGUAGE FOR PR DESCRIPTION

> "Pre-launch compliance audit complete. 10 launch blockers identified across regulatory identity (ICO/HMRC/FCA), marketplace controls (NTSELAT, redress scheme, deposit scheme), and platform duties (DPIA, ROPA, OSA risk assessments). Engineering controls are strong; the path to launch is operational and contractual. Recommend deferring public launch to T+90 with private beta from T+0."

---

**End of audit.**
