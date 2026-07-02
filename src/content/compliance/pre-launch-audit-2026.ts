/**
 * Typed conversion of docs/compliance/PRE-LAUNCH-COMPLIANCE-AUDIT-2026-06-07.md
 * for the public Compliance Library (Campaign 42). Faithful to the source
 * document's headings and substance; long tables are column-trimmed for the
 * web but no finding is dropped or softened.
 */

export type AuditBlock =
  | { kind: "p"; text: string }
  | { kind: "list"; ordered?: boolean; items: ReadonlyArray<string> }
  | {
      kind: "table";
      headers: ReadonlyArray<string>;
      rows: ReadonlyArray<ReadonlyArray<string>>;
    };

export type AuditSection = {
  id: string;
  title: string;
  blocks: ReadonlyArray<AuditBlock>;
};

export const AUDIT_META = {
  title: "Pre-Launch Compliance & Legal Due-Diligence Audit",
  auditDate: "2026-06-07",
  auditDateLabel: "7 June 2026",
  subject:
    "Brit-Estate Ltd (trading as TrueDeed) — AI-powered UK property + service marketplace",
  plainEnglishIntro:
    "Before launch, we commissioned a full compliance and legal due-diligence audit of our own platform — the kind of review an acquirer or regulator would run — and we are publishing the results, including every blocker it found. The short version: our engineering controls scored well; our regulatory and governance paperwork did not. The audit told us not to launch publicly until specific blockers are fixed, and we agreed. Everything below is the audit as delivered, condensed for the web but with nothing softened.",
  whyWePublish:
    "Why we publish this: most companies bury their compliance homework. We think a property platform asking for your trust should show its working — including the failing grades. Publishing this audit binds us to fixing what it found, on the record. Future documents in this library (DPIA-style analyses, follow-up audits) will be published the same way.",
} as const;

export const AUDIT_SECTIONS: ReadonlyArray<AuditSection> = [
  {
    id: "executive-summary",
    title: "0. Executive summary",
    blocks: [
      {
        kind: "p",
        text: "The audit found materially more compliance plumbing than the typical pre-revenue PropTech: consent records, an immutable audit log, soft-delete + cascade-restricted GDPR purge, AI usage logging, signed Stripe webhooks, RLS-enforced multi-tenant data, MFA endpoints, and a nonce-based CSP. Seventeen legal pages were already drafted, placing the platform in the top quartile of UK PropTech entrants for paperwork breadth.",
      },
      {
        kind: "p",
        text: "However, the auditors concluded the company could not launch in 30 days as configured. The blocking issues were not architectural — they were operational, contractual, and regulatory. The ten launch blockers:",
      },
      {
        kind: "list",
        ordered: true,
        items: [
          "Company identity placeholders ([COMPANY NUMBER], [REGISTERED ADDRESS], [ICO REGISTRATION NUMBER], [HMRC REFERENCE]) still present in published legal pages — itself an ICO enforcement trigger and a CPRs 2008 misleading-action breach.",
          "No FCA appointed-representative or introducer structure despite mortgage broker and insurance referral revenue tiers existing in code — receiving fees for introducing regulated credit/insurance products without FSMA permission is a criminal offence (FSMA 2000 s.23).",
          "No NTSELAT Material Information (Parts A/B/C) compliance layer wired into listing creation — omission is now a CPR 2008 breach. (Partially closed 2026-06-11: planning permission status is now modelled, required, and enforced; building safety, rights/restrictions, flood declaration, parking, and accessibility fields remain open.)",
          "No HMRC AML supervision number and no named Money Laundering Reporting Officer — the AML policy promises supervision that has not been obtained. Launch blocker.",
          "No deposit-scheme integration (TDS/DPS/MyDeposits) for landlord/tenant flows — statutory penalty up to 3× deposit plus loss of s.21 (Housing Act 2004 ss.213–215).",
          "AI guardrails are coded, but no DPIA exists for the AI processing (UK GDPR Art. 35 + ICO AI Toolkit). Launch blocker.",
          "No incident-response runbook, breach-notification playbook, or 72-hour ICO clock procedure.",
          "PECR soft opt-in not technically enforced — marketing-email send paths do not gate on marketing consent records before dispatch.",
          "No formal Record of Processing Activities (Art. 30) and no Data Protection Officer appointed in writing.",
          "No consumer ODR link or platform-level Property Ombudsman / Property Redress Scheme membership; the empty Modern Slavery page must be removed or completed correctly.",
        ],
      },
      {
        kind: "table",
        headers: ["Dimension", "Score", "One-line justification"],
        rows: [
          ["Launch Readiness", "42 / 100", "Engineering ready, regulatory not"],
          [
            "Compliance Score",
            "55 / 100",
            "Excellent skeleton, missing identity + HMRC + FCA + DPIA",
          ],
          [
            "Security Score",
            "74 / 100",
            "Strong CSP / RLS / webhook signing; gaps in CSRF, secrets rotation, SBOM, pen test",
          ],
          [
            "Governance Score",
            "38 / 100",
            "No DPO, no ROPA, no risk register, no board minutes, no policies signed",
          ],
          [
            "Investor Readiness",
            "48 / 100",
            "Cap table likely fine; data room shallow, KPIs unaudited, IP assignment unverified",
          ],
          [
            "Acquisition Readiness",
            "31 / 100",
            "Would not survive Big-Four vendor diligence today",
          ],
        ],
      },
      {
        kind: "p",
        text: "Verdict: push public launch to T+90. Use the 90 days to close every blocker. A soft, invite-only beta at T+30 is acceptable only after the ten launch blockers above are cleared.",
      },
    ],
  },
  {
    id: "regulatory-mapping",
    title: "Phase 1 — Regulatory mapping",
    blocks: [
      {
        kind: "p",
        text: "The audit mapped fifty instruments touching the platform. Instrument — jurisdiction — assessed risk:",
      },
      {
        kind: "list",
        items: [
          "UK GDPR — UK — CRITICAL (up to £17.5m or 4% global turnover)",
          "Data Protection Act 2018 — UK — CRITICAL",
          "Data (Use & Access) Act 2025 (DUAA) — UK — HIGH",
          "EU GDPR — EU — CRITICAL (applies on EU expansion)",
          "PECR 2003 — UK — CRITICAL (up to £500,000)",
          "ePrivacy Directive 2002/58/EC — EU — HIGH",
          "Consumer Rights Act 2015 — UK — HIGH",
          "Consumer Contracts Regs 2013 (cooling-off) — UK — HIGH",
          "Consumer Protection from Unfair Trading Regs 2008 (CPRs) — UK — CRITICAL (criminal)",
          "Digital Markets, Competition & Consumers Act 2024 (DMCC) — UK — CRITICAL (up to 10% global turnover)",
          "E-Commerce Regulations 2002 — UK — HIGH",
          "Online Safety Act 2023 — UK — CRITICAL (senior-manager criminal liability)",
          "Equality Act 2010 — UK — HIGH",
          "Estate Agents Act 1979 — UK — CRITICAL (banning orders)",
          "Property Misdescriptions Act 1991 (via CPRs) — UK — HIGH",
          "NTSELAT Material Information Guidance Parts A/B/C — UK — CRITICAL",
          "Letting Agents (Redress Scheme) Order 2014 — UK — CRITICAL",
          "Tenant Fees Act 2019 — England — CRITICAL",
          "Housing Act 2004 Part 6 (deposit protection) — E&W — CRITICAL",
          "Homes (Fitness for Human Habitation) Act 2018 — England — HIGH",
          "Building Safety Act 2022 — UK — HIGH",
          "Money Laundering Regs 2017 (MLR) — UK — CRITICAL (criminal)",
          "Proceeds of Crime Act 2002 — UK — CRITICAL",
          "Sanctions & AML Act 2018 + OFSI regime — UK — CRITICAL (strict liability)",
          "Companies Act 2006 (trader identity) — UK — MEDIUM",
          "FSMA 2000 (regulated introductions) — UK — CRITICAL (criminal, s.23)",
          "FCA Handbook — MCOB / ICOBS / SYSC / CONC — UK — CRITICAL",
          "FCA Consumer Duty (PRIN 12) — UK — HIGH",
          "Payment Services Regs 2017 — UK — MEDIUM (Stripe Connect mitigates)",
          "AMLD 5/6 — EU — CRITICAL (on EU rollout)",
          "MiFID II — EU — MEDIUM (only if tokenisation)",
          "EU Digital Services Act — EU — CRITICAL (up to 6% global turnover)",
          "EU Digital Markets Act — EU — LOW (not a gatekeeper)",
          "EU AI Act — EU — CRITICAL (up to €35m or 7% turnover)",
          "EU Platform-to-Business Regulation (ranking transparency) — EU — HIGH",
          "ICO AI & Data Protection Toolkit — UK — HIGH",
          "CMA Online Choice Architecture Guidance (dark patterns) — UK — HIGH",
          "CMA Online Reviews Guidance — UK — CRITICAL (DMCC offences)",
          "CAP / BCAP Codes — UK — MEDIUM",
          "Trade Marks Act 1994 / CDPA 1988 — UK — MEDIUM",
          "Equality Act 2010 (web accessibility) + EAA 2025 — UK/EU — HIGH",
          "WCAG 2.2 AA — International — MEDIUM",
          "Modern Slavery Act 2015 s.54 — UK — LOW (below threshold; page risk only)",
          "OSA Children's Codes — UK — HIGH",
          "NIS2 Directive — EU — MEDIUM",
          "Computer Misuse Act 1990 — UK — LOW",
          "Defamation Act 2013 + Website Operators Regs — UK — MEDIUM",
          "UK-EU adequacy decision (transfers) — UK/EU — CRITICAL if it lapses",
          "ICO IDTA / Addendum (UK→US transfers) — UK — HIGH",
          "Property Ombudsman / Property Redress Scheme rules — UK — CRITICAL",
        ],
      },
    ],
  },
  {
    id: "data-mapping",
    title: "Phase 2 — Data mapping audit",
    blocks: [
      {
        kind: "p",
        text: "Every category of personal data was mapped from the database schema to its lawful basis and retention period. Highlights (category — lawful basis — retention — risk):",
      },
      {
        kind: "table",
        headers: ["Data category", "Lawful basis", "Retention", "Risk"],
        rows: [
          ["Account identifiers (email, phone, name)", "Contract (Art. 6(1)(b))", "6 yrs post-closure", "MEDIUM"],
          ["Consent records", "Consent (Art. 6(1)(a), 7(1))", "6 yrs after withdrawal", "LOW"],
          ["KYC / ID verification documents", "Legal obligation (MLR 2017)", "5 yrs after relationship ends", "HIGH"],
          ["Property listings + photos", "Contract / legitimate interests", "Until withdrawn + 1 yr", "MEDIUM"],
          ["Messaging / chat", "Contract", "Active + 2 yrs", "MEDIUM"],
          ["Payment data", "Contract (held in Stripe vault, not locally)", "7 yrs (tax) for metadata", "LOW"],
          ["Lead data (intent, contact)", "Legitimate interests", "12 months", "HIGH (PECR overlap)"],
          ["Search history / saved properties", "Legitimate interests", "24 months", "MEDIUM"],
          ["Behavioural analytics (PostHog)", "Consent (opt-in)", "PostHog default", "MEDIUM"],
          ["AI prompts + outputs", "Contract", "24 months internal", "HIGH if users paste IDs"],
          ["Location / IP", "Legitimate interests (security)", "30 days", "MEDIUM"],
        ],
      },
      {
        kind: "p",
        text: "International transfers: Supabase (EU, adequacy), Stripe / Anthropic / Resend / Sentry / Inngest / Vercel (US — UK IDTA + DPF, transfer impact assessments required), PostHog (verify EU region pin), Cloudflare (IDTA addendum), Upstash (EU), MapTiler (Switzerland, adequacy).",
      },
      {
        kind: "list",
        items: [
          "GAP: no documented Transfer Impact Assessments for any US transfer.",
          "GAP: no public sub-processor list (Art. 28(2) obligation toward agents who are themselves controllers).",
          "GAP: signed DPAs with each processor not evidenced in the repository.",
        ],
      },
    ],
  },
  {
    id: "cookie-tracking",
    title: "Phase 3 — Cookie & tracking audit",
    blocks: [
      {
        kind: "table",
        headers: ["Tracker", "Consent gate?", "Status"],
        rows: [
          ["PostHog", "Yes — SDK init gated on consent; opt-out honoured", "COMPLIANT"],
          ["Cloudflare Web Analytics", "Cookie-less", "OK (exempt under PECR Reg 6(4))"],
          ["Google Analytics 4", "Allowed in CSP but no gating code found", "NON-COMPLIANT if fired before opt-in — remove or wire Consent Mode v2"],
          ["Stripe", "Necessary cookie", "OK (exempt)"],
          ["Sentry", "First-party error telemetry", "OK — document in privacy notice"],
          ["Facebook Pixel", "Referenced in cookie policy; no firing code found", "Must gate on opt-in if ever launched"],
          ["Cookie banner", "Accept-All / Reject-All / Manage present", "COMPLIANT (equal weight to reject)"],
        ],
      },
      {
        kind: "list",
        items: [
          "G1 (CRITICAL): GA4 allowed in CSP without observable gating code — delete from CSP or wire Consent Mode v2 with denied defaults.",
          "G2 (HIGH): no 'sale of personal data' toggle (needed only if CCPA users come into scope).",
          "G3 (HIGH): withdrawing consent must be as easy as giving it — verify the preferences modal is reachable from every page.",
          "G4 (MEDIUM): the cookie policy's audit table must be machine-checked monthly against cookies actually set — no such script exists.",
          "G5 (MEDIUM): consent is per-device; move to a per-user consent ledger hydrated on sign-in.",
          "Required additions: an automated cookie-audit script in CI, and honouring of DNT + Global Privacy Control signals.",
        ],
      },
    ],
  },
  {
    id: "marketplace-liability",
    title: "Phase 4 — Marketplace liability audit",
    blocks: [
      {
        kind: "list",
        items: [
          "Property listings: no field for an agent's declared personal interest in a property (Estate Agents Act 1979 s.21) — GAP-M1.",
          "Material information: NTSELAT Parts A/B/C not fully modelled — GAP-M2 (BLOCKER). Planning permission status was closed on 2026-06-11 (modelled, required on create/edit, enforced server-side, displayed on the property page); building safety, rights/restrictions, flood declaration, parking and accessibility fields remain open.",
          "Lettings: Tenant Fees Act 'permitted payments only' breakdown missing from listings; asking-vs-guide price distinction missing.",
          "Agent accounts: redress-scheme (TPO/PRS) membership capture and verification missing — GAP-M3 (BLOCKER); client money protection scheme capture missing; per-branch HMRC AML supervision number missing; no re-check cron for PI insurance; no ranking-transparency disclosure (P2B Art. 5).",
          "Tradesperson accounts: Gas Safe / NICEIC / NAPIT numbers need capture and annual re-verification; public liability insurance expiry alerting missing; DBS status not modelled.",
          "User-generated content: Online Safety Act illegal-content risk assessment missing — GAP-M4 (BLOCKER); children's access assessment missing — GAP-M5; no notice-and-action flow for non-property UGC.",
          "Reviews: DMCC fake-review controls (prohibit, detect, remove) needed; the Defamation Act s.5 defence requires a working 48-hour notice procedure — GAP-M6.",
          "Messaging: in-platform DMs used for promotion still count as direct marketing (PECR Reg 22); server-side message logging must be clearly disclosed in terms.",
          "Referrals: mandatory written referral-fee disclosure to the consumer at the point of recommendation (conveyancer/surveyor/broker) has no code path — GAP-M7 (BLOCKER).",
        ],
      },
    ],
  },
  {
    id: "ai-compliance",
    title: "Phase 5 — AI compliance audit",
    blocks: [
      {
        kind: "p",
        text: "AI on the platform today: listing description generation, ROI/valuation estimation, match/recommendation (pgvector), and quote-draft suggestions — all routed through a single provider boundary with rate limits, a daily spend cap, input sanitisation, Zod output validation, and usage logging. Strengths noted: centralised kill-switch-able boundary, per-user rate limits, a public AI transparency page.",
      },
      {
        kind: "list",
        items: [
          "AI-1 (BLOCKER): no DPIA covering AI processing (UK GDPR Art. 35; ICO AI Toolkit).",
          "AI-2 (BLOCKER): EU AI Act Art. 50 transparency — AI-generated outputs need machine-readable provenance and an inline label; generated descriptions carry neither.",
          "AI-3 (HIGH): no human-in-the-loop checkpoint or friction screen for valuations, which can meaningfully affect decisions (Art. 22-adjacent).",
          "AI-4 (HIGH): recommendation engine needs per-user explanations available on request.",
          "AI-5 (MEDIUM): no protected-characteristic fairness audit on recommendations (Equality Act indirect-discrimination exposure).",
          "AI-6 (MEDIUM): sanitiser does not handle markdown/HTML-shaped prompt-injection in user-supplied listing copy.",
          "AI-7 (MEDIUM): no published model card per AI feature (provider, pinned model version, limitations).",
          "AI-8 (LOW): fact-claims about properties should be grounded against Land Registry / Companies House with citations.",
          "AI-9 (LOW): watermark AI-staged property photos if AI staging is used.",
          "AI-10 (MEDIUM): confirm the Anthropic processor agreement and zero-data-retention configuration.",
        ],
      },
    ],
  },
  {
    id: "security",
    title: "Phase 6 — Security audit",
    blocks: [
      {
        kind: "p",
        text: "Controls confirmed in code: TLS termination, secure/HttpOnly cookies, nonce-based CSP, X-Frame-Options DENY, nosniff, Permissions-Policy, Supabase Auth with MFA endpoints, HMAC-signed re-auth and replay tokens, signature-verified Stripe and Inngest webhooks, row-level security across tables, soft-delete GDPR purge with restricted cascades, RPC-gated admin audit log, and Upstash rate limiting.",
      },
      {
        kind: "list",
        items: [
          "S1 (CRITICAL): no external penetration test on record — commission an OWASP ASVS L2 test pre-launch.",
          "S2 (HIGH): no CSRF tokens on state-changing form endpoints.",
          "S3 (HIGH): no HSTS preload header.",
          "S4 (HIGH): no secrets-rotation runbook for signing secrets.",
          "S5 (HIGH): no SBOM / dependency-vulnerability gate in CI.",
          "S6 (HIGH): backup retention and restore-drill cadence unverified.",
          "S7 (HIGH): verify anonymous-user rate limits on all AI endpoints.",
          "S8 (MEDIUM): no security.txt / responsible-disclosure channel.",
          "S9–S10 (MEDIUM): verify session-replay PII masking in Sentry and PostHog.",
          "S11 (MEDIUM): lint-guard the service-role key against client bundles.",
          "S12 (MEDIUM): verify private buckets + short-lived signed URLs for ID documents.",
          "S13 (MEDIUM): server-log retention and PII purging policy missing.",
          "S14 (MEDIUM): enforce Stripe webhook idempotency via a unique event-ID index.",
          "S15 (MEDIUM): verify styles CSP is nonce-based, not unsafe-inline.",
          "S16–S20 (LOW): SRI for third-party scripts, __Host- cookie prefix, dependency-pinning documentation, Stripe onboarding data minimisation, webhook body-logging hygiene.",
        ],
      },
    ],
  },
  {
    id: "contracts",
    title: "Phase 7 — Contract audit",
    blocks: [
      {
        kind: "p",
        text: "Forty-one contracts and policies were audited. Drafted: consumer terms, privacy notice, cookie notice, AI transparency notice, acceptable use policy (all pending identity fields). Marked missing or blocker:",
      },
      {
        kind: "list",
        items: [
          "BLOCKER: Mortgage Broker Terms and Insurance Introducer Terms (FSMA criminal exposure without them).",
          "BLOCKER: DPA template for B2B controllers (agents).",
          "BLOCKER: IP assignment from founders and every developer (title cloud without it).",
          "BLOCKER: Incident Response Policy + Runbook (72-hour ICO clock).",
          "Missing: agent and tradesperson B2B terms, conveyancer/surveyor referral agreements, subscription and premium-listing T&Cs, lead-generation product T&Cs, public sub-processor list, NDAs, open-source/SBOM compliance, marketing soft opt-in policy, estate-agent letter-of-engagement template, data-retention schedule, DSAR SOP, information-security and vendor-risk policies, anti-bribery, whistleblowing, HR privacy notice.",
          "Remove or complete: the empty Modern Slavery statement page (below the statutory threshold, so an empty page is itself misleading).",
        ],
      },
    ],
  },
  {
    id: "revenue-compliance",
    title: "Phase 8 — Revenue compliance audit",
    blocks: [
      {
        kind: "table",
        headers: ["Revenue stream", "Key requirement", "Status"],
        rows: [
          ["SaaS subscriptions", "DMCC pre-contract info, renewal reminders, easy cancellation", "GAP — reminders + easy-cancel needed"],
          ["Commission on sales", "EAA 1979 s.18 disclosure via letter of engagement", "Template missing"],
          ["Commission on lettings", "Tenant Fees Act check + redress scheme", "Verification missing"],
          ["Service-job commission", "Pre-job estimate + breakdown", "OK"],
          ["Lead generation (agents)", "Quality SLA, refund terms", "T&Cs needed"],
          ["Lead generation (mortgage brokers)", "FCA permission or Appointed Representative structure", "BLOCKER"],
          ["Lead generation (insurance)", "FCA IDD authorisation or AR", "BLOCKER"],
          ["Lead generation (conveyancers)", "Referral disclosure to consumer", "Missing"],
          ["Premium listings", "Ranking-bias disclosure (P2B / CMA)", "T&Cs missing"],
          ["AI-powered services", "AI Act Art. 50 + DPIA", "DPIA missing"],
        ],
      },
      {
        kind: "p",
        text: "FCA detail: even introducing a customer to a regulated firm for a fee is a regulated activity unless an exclusion applies. The two viable routes are becoming an Appointed Representative of an FCA-authorised principal, or the very narrow Article 33B introducing exclusion (contact details only — even hosting a calculator can void it). The mortgage-broker tier without either structure was assessed as a launch blocker.",
      },
    ],
  },
  {
    id: "investor-dd",
    title: "Phase 9 — Investor due-diligence red flags",
    blocks: [
      {
        kind: "list",
        ordered: true,
        items: [
          "Company not incorporated in published documents (placeholders) — CRITICAL",
          "Cap table / Companies House consistency unverified — CRITICAL",
          "No IP assignment chain from contributors — CRITICAL",
          "No SBOM or open-source licence audit — HIGH",
          "No ROPA, DPIA, DPO, or ICO registration — CRITICAL",
          "No AI DPIA, model cards, or bias-testing evidence — CRITICAL",
          "No external pen test; no SOC 2 / ISO 27001 path — HIGH",
          "No HMRC AML supervision; FCA exposure unaddressed — CRITICAL",
          "Redress-scheme verification not enforced for agents — CRITICAL",
          "No Online Safety Act risk assessment — CRITICAL",
          "DMCC auto-renewal reminders not implemented — HIGH",
          "Trade mark registration status unknown — HIGH",
          "Domain ownership (company vs founder) unverified — HIGH",
          "Employment contracts / IR35 status unverified — HIGH",
          "VAT / MTD / tax compliance unverified — HIGH",
          "Insurance (cyber, PI, D&O, EL) status unverified — HIGH",
          "Vendor contracts not consolidated in a data room — MEDIUM",
          "Statutory registers and board minutes unverified — MEDIUM",
          "KPIs not independently auditable (analytics only, no warehouse) — MEDIUM",
          "Repository clutter signalling discipline gaps to diligence teams — noted",
        ],
      },
    ],
  },
  {
    id: "top-risks",
    title: "Top compliance, legal and security risks (§11–§14)",
    blocks: [
      {
        kind: "p",
        text: "The audit ranked fifty compliance risks. The top fifteen:",
      },
      {
        kind: "list",
        ordered: true,
        items: [
          "Placeholders in published legal pages — ICO + CPR breach on day one.",
          "No DPIA for AI processing (Art. 35 mandatory).",
          "No ROPA (Art. 30 mandatory).",
          "No DPO appointed in writing.",
          "No HMRC MLR supervision — criminal under MLR Reg 56.",
          "No FCA permission / AR structure for mortgage and insurance lead-gen — FSMA s.23 criminal.",
          "No NTSELAT material-information fields in listings.",
          "No redress-scheme verification at agent onboarding.",
          "No OSA illegal-content risk assessment.",
          "No OSA children's access assessment.",
          "PECR soft opt-in not technically enforced.",
          "No DMCC auto-renewal reminders.",
          "No DMCC fake-review systems.",
          "No EU AI Act Art. 50 inline labelling of AI-generated content.",
          "No tenancy deposit scheme integration.",
        ],
      },
      {
        kind: "p",
        text: "The remaining thirty-five cover transfer impact assessments, the public sub-processor list, CSRF/HSTS/pen-test/SBOM gaps, secrets rotation, the incident runbook, accessibility audits, the DSAR SOP, retention-enforcement crons, consent-revocation propagation to processors, webhook idempotency, storage-bucket verification for ID documents, AI watermarking and bias testing, the estate-agent letter of engagement, personal-interest disclosure on listings, machine-readable AI provenance, the supplier DPA register, DPIA sign-off records, professional re-verification crons, board-level policy approvals, right-to-explanation processes, audit-log immutability proof, a published security.txt, and statutory company information in every page footer.",
      },
      {
        kind: "p",
        text: "Top legal risks (§12) are led by FSMA s.23 criminal exposure, Estate Agents Act banning orders, CPRs criminal liability for misleading omissions, DMCC turnover-based fines, UK GDPR Art. 83 fines, and PECR penalties. Top security risks (§13) mirror the Phase 6 gaps, led by the missing external penetration test, CSRF, HSTS preload, and dependency scanning. Investor-DD risks (§14) mirror Phase 9.",
      },
    ],
  },
  {
    id: "required-controls",
    title: "Required policies, consent flows, and technical controls (§15–§19)",
    blocks: [
      {
        kind: "p",
        text: "The audit specified forty required policies (from the privacy policy fix through incident response, sanctions screening, KYC operations, review moderation, ROPA and three DPIAs, to the OSA risk assessments), twenty consent flows (marketing opt-in, PECR soft opt-in evidencing, per-feature AI opt-out, rights flows for erasure, portability, objection, restriction, and explanation, and a consent ledger with immutability proof), and thirty-five technical controls. Key technical controls:",
      },
      {
        kind: "list",
        items: [
          "Fill identity placeholders site-wide from a single legal-entity source of truth; CI lint blocks any remaining literal placeholder.",
          "Wire the cookie audit script into CI; add DNT/GPC honouring.",
          "Add HSTS preload, CSRF double-submit middleware, __Host- session cookies, security.txt, and a dependency-vulnerability gate in CI.",
          "Add a Stripe webhook idempotency unique index; scheduled crons for data retention, professional re-verification, and marketing-consent re-confirmation.",
          "Wire NTSELAT material-information fields, redress-scheme verification, AML supervision and client-money-protection capture, and a referral-fee disclosure modal at the point of recommendation.",
          "Add a visible badge plus machine-readable provenance attribute to every AI-generated output, a valuation friction screen, and per-feature AI opt-outs propagated to the inference layer.",
          "Add automated DSAR export and right-to-erasure pipelines that propagate to processors; PII redaction in server logs; session-replay masking; storage-bucket policy tests; deposit-scheme integration; sanctions screening and Companies House lookup at onboarding; a material-information completeness gate before publishing; review-moderation queue with notice timestamps; immutable audit-log archive; and a rotated-secrets runbook.",
        ],
      },
      {
        kind: "p",
        text: "Twenty-five governance controls (§19) follow: quarterly board-approved risk register, written DPO and MLRO appointments, ICO registration, HMRC MLR supervision, an FCA AR principal relationship (or removing the regulated tiers), signed vendor DPAs and contributor IP assignments, insurance, change-management and access-review cadences, monthly cookie and sub-processor reviews, regulatory horizon scanning, incident tabletops, annual pen tests, security review gates on API changes, staff training, KPI reconciliation, board minutes for every policy adoption, and a maintained data room.",
      },
    ],
  },
  {
    id: "remediation-plan",
    title: "Remediation plan and checklists (§20–§23)",
    blocks: [
      {
        kind: "p",
        text: "30-day plan (soft, invite-only beta only): Week 1 — incorporate and paper (ICO registration, HMRC MLR application, FCA principal engagement or feature removal, trade mark filings, insurance, placeholder eradication, IP assignments). Week 2 — compliance artefacts (ROPA, three DPIAs, DPO and MLRO appointments, incident runbook + tabletop, priority internal policies, sub-processor list, cookie-audit cron, HSTS/CSRF/security.txt, pen test commissioned). Week 3 — marketplace controls (NTSELAT enforcement, redress and CMP verification, tenant-fee checks, sanctions screening, deposit-scheme integration, notice-and-action, OSA assessments, referral disclosure, DMCC renewal flows). Week 4 — AI provenance badges, valuation friction, AI opt-out propagation, fake-review detection, pricing disclosure, WCAG remediation, DSAR red-team test.",
      },
      {
        kind: "p",
        text: "90-day plan (public launch): pen-test remediations, confirmed HMRC and ICO registrations, signed FCA AR relationship (or the feature stays off), auditable KPI warehouse, bias audit, bug bounty, backup restore drill, SOC 2 Type I readiness, ISO 27001 gap assessment, full vendor DPA register and TIAs, DR tabletop, DSA-readiness for EU expansion, and a public-launch dry run with a full incident-response tabletop.",
      },
      {
        kind: "p",
        text: "The audit closes with a 37-item pre-launch sign-off checklist and a recurring post-launch calendar (monthly cookie and sub-processor audits, quarterly board risk reviews and DPIA refreshes, semi-annual pen tests and DR drills, annual SOC 2 / ISO surveillance, policy refresh, staff training, and recommendation-engine fairness audits).",
      },
    ],
  },
  {
    id: "appendix",
    title: "Appendix — evidence base",
    blocks: [
      {
        kind: "p",
        text: "Every finding was tied to verified code paths in the repository — legal pages, the consent-gated analytics provider, the GDPR request form, the AI service boundary and sanitiser, signed webhook handlers, HMAC re-auth tokens, MFA endpoints, the CSP middleware, commission-rate configuration, the consent service, and the RLS, GDPR-deletion and audit-log-hardening migrations. Where evidence was not found, the item was marked MISSING; where a control existed but was incomplete, PARTIAL; where placeholder strings appeared in shipped legal content, PLACEHOLDER — BLOCKER.",
      },
    ],
  },
];
