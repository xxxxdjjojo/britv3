# Truedeed — Attribution & Completion-Tracking Spec

**Stack:** Next.js / TypeScript / Supabase (Postgres + RLS + Storage) / Vercel / BullMQ (Redis worker, runs off-Vercel on a small VM or Railway/Render — Vercel functions are unsuitable for long-running ingest).
**Version:** v1, 11 June 2026. Decisions baked in: reporting covenant is the **primary** billing trigger; PPD is the **audit backstop**; 6-month tail; 5-business-day rebuttal window; let fee folded into upfront referencing pack (so lettings need **no** completion tracking — only `tenancy_commenced / abandoned` outcomes for the £99 credit logic).

---

## 1. Design principles

1. **The ledger is evidence, not just data.** Every attribution-relevant event is append-only, timestamped, and tamper-evident. We will one day put this in front of an angry branch director, a mediator, or a judge.
2. **PPD never bills anyone.** A PPD match proves *the property sold*, not *our applicant bought it* (PPD has no buyer identity). Audit-mode matches generate **queries to the branch**, then human-reviewed invoice candidates. No auto-billing from matches, ever.
3. **Humans approve money.** Every invoice candidate passes a human review queue before an invoice exists (per brief).
4. **Honest about blind spots.** Lettings: invisible to public data (solved commercially — fee moved upfront). Cross-property steering: invisible to PPD (solved contractually — fee is property-specific; clause 6.3 makes other-property sales legitimately fee-free).

---

## 2. Schema (Postgres / Supabase)

```sql
-- ============ reference ============
create table member_orgs (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  company_number text not null,          -- Companies House; bind the right entity
  signed_agreement_version text not null,
  signed_by_name text not null,          -- director / authorised signatory
  signed_at timestamptz not null,
  gocardless_customer_id text,
  status text not null default 'active'
    check (status in ('active','suspended','terminated')),
  created_at timestamptz not null default now()
);

create table branches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references member_orgs(id),
  name text not null,
  postcode text not null,
  contact_email text not null,
  status text not null default 'active'
    check (status in ('active','suspended','terminated')),
  created_at timestamptz not null default now()
);

create table branch_members (              -- agent users <-> branches
  user_id uuid not null references auth.users(id),
  branch_id uuid not null references branches(id),
  role text not null default 'agent' check (role in ('agent','manager')),
  primary key (user_id, branch_id)
);

create table applicants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),  -- platform login
  full_name text not null,
  email text not null,
  phone text,
  intent text not null check (intent in ('buy','rent','both')),
  created_at timestamptz not null default now()
);

create table listings (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id),
  kind text not null check (kind in ('sale','let')),
  -- address fields mirrored to PPD's shape for matching
  postcode text not null,
  paon text not null,        -- house number/name (Primary Addressable Object Name)
  saon text,                 -- flat/unit (Secondary AON) — critical for flats
  street text, town text,
  uprn text,                 -- store if you have it; PPD does NOT carry UPRN
  asking_price_pence bigint,
  status text not null default 'live'
    check (status in ('draft','live','under_offer','exchanged','completed','withdrawn','let_agreed','let')),
  created_at timestamptz not null default now()
);
create index on listings (postcode);

-- ============ the introductions ledger (append-only) ============
create table introductions (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references applicants(id),
  listing_id uuid not null references listings(id),
  branch_id uuid not null references branches(id),
  first_contact_type text not null
    check (first_contact_type in ('enquiry','viewing_request','message')),
  occurred_at timestamptz not null default now(),   -- THE timestamp
  notified_at timestamptz,                          -- when branch was notified (clause 3.1)
  rebuttal_deadline timestamptz,                    -- notified_at + 5 business days (server-computed)
  tail_expires_at timestamptz not null,             -- occurred_at + 6 months
  prev_hash text,                                   -- tamper-evidence chain
  row_hash text not null,                           -- sha256(prev_hash || canonical fields)
  unique (applicant_id, listing_id)                 -- "FIRST registered contact" semantics
);
-- Later contacts by the same applicant on the same listing are events, not new introductions.

create table introduction_status_history (          -- status lives here, ledger stays immutable
  id bigint generated always as identity primary key,
  introduction_id uuid not null references introductions(id),
  status text not null check (status in
    ('active','rebutted','cancelled_manifest_error','converted_sstc',
     'converted_exchanged','converted_completed','expired')),
  reason text,
  actor uuid,                                       -- null = system
  created_at timestamptz not null default now()
);

create table introduction_events (                  -- full evidence trail
  id bigint generated always as identity primary key,
  introduction_id uuid not null references introductions(id),
  event_type text not null check (event_type in
    ('enquiry','viewing_requested','viewing_booked','viewing_attended',
     'viewing_cancelled','message_sent','offer_relayed','note')),
  payload jsonb not null default '{}',              -- message ids, viewing slot, etc.
  created_at timestamptz not null default now()
);

create table rebuttals (
  id uuid primary key default gen_random_uuid(),
  introduction_id uuid not null references introductions(id),
  submitted_by uuid not null,
  submitted_at timestamptz not null default now(),
  evidence_storage_paths text[] not null,           -- Supabase Storage: CRM screenshot, portal lead email
  evidence_dated_at date not null,                  -- claimed date of prior contact (must pre-date occurred_at)
  decision text check (decision in ('upheld','rejected')),
  decided_by uuid, decided_at timestamptz, decision_reason text
);

-- ============ outcomes (the PRIMARY billing trigger) ============
create table reported_outcomes (
  id uuid primary key default gen_random_uuid(),
  introduction_id uuid not null references introductions(id),
  reported_by uuid not null,
  outcome text not null check (outcome in
    ('offer_accepted','exchanged','completed','fell_through',
     'tenancy_commenced','tenancy_abandoned')),
  completion_date date,                              -- required when outcome='completed'
  agreed_price_pence bigint,                         -- required when outcome='completed'
  reported_at timestamptz not null default now()
);

-- ============ PPD audit backstop ============
create table ppd_ingest_runs (
  id uuid primary key default gen_random_uuid(),
  file_label text not null,            -- e.g. 'monthly-update-2026-06'
  file_sha256 text not null,
  rows_added int, rows_changed int, rows_deleted int,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running'
    check (status in ('running','succeeded','failed'))
);

create table ppd_transactions (
  ppd_tuid text primary key,           -- HMLR transaction unique identifier
  price_pence bigint not null,
  transfer_date date not null,
  postcode text,
  property_type text,                  -- D/S/T/F/O
  new_build boolean,
  tenure text,                         -- F/L
  paon text, saon text, street text, locality text, town text, district text, county text,
  ppd_category text not null,          -- A = standard, B = additional (repossessions, corporate buyers etc.)
  last_record_status text,             -- A/C/D from monthly update file
  ingest_run_id uuid references ppd_ingest_runs(id),
  updated_at timestamptz not null default now()
);
create index on ppd_transactions (postcode);
create extension if not exists pg_trgm;
create index ppd_paon_trgm on ppd_transactions using gin (paon gin_trgm_ops);

create table ppd_match_candidates (
  id uuid primary key default gen_random_uuid(),
  ppd_tuid text not null references ppd_transactions(ppd_tuid),
  listing_id uuid not null references listings(id),
  introduction_id uuid references introductions(id),
  mode text not null check (mode in ('verification','audit')),  -- see §4
  score numeric(4,3) not null,
  score_components jsonb not null,
  status text not null default 'pending_review'
    check (status in ('pending_review','branch_queried','confirmed','dismissed')),
  reviewed_by uuid, reviewed_at timestamptz, review_note text,
  created_at timestamptz not null default now(),
  unique (ppd_tuid, listing_id)
);

-- ============ money handoff ============
create table invoice_candidates (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('agent_report','audit_match')),
  introduction_id uuid not null references introductions(id),
  reported_outcome_id uuid references reported_outcomes(id),
  ppd_match_id uuid references ppd_match_candidates(id),
  amount_pence bigint not null default 24900,
  vat_pence bigint not null default 4980,
  status text not null default 'pending_review'
    check (status in ('pending_review','on_hold_branch_query','approved',
                      'invoiced','rejected')),
  hold_expires_at timestamptz,        -- branch query: 10 business days (clause 10.2)
  reviewed_by uuid, reviewed_at timestamptz, review_note text,
  created_at timestamptz not null default now()
);

create table audit_log (
  id bigint generated always as identity primary key,
  actor uuid, action text not null, entity text not null, entity_id text,
  detail jsonb, created_at timestamptz not null default now()
);
```

### 2.1 Immutability enforcement — and its honest limits

```sql
-- 1) No update/delete grants at all on ledger tables
revoke update, delete on introductions, introduction_events,
  introduction_status_history, reported_outcomes, rebuttals, audit_log
  from anon, authenticated;

-- 2) Belt-and-braces trigger (fires even for service_role, which bypasses RLS but not triggers)
create or replace function forbid_mutation() returns trigger
language plpgsql as $$
begin
  raise exception 'append-only table: % blocked on %', tg_op, tg_table_name;
end $$;

create trigger introductions_immutable
  before update or delete on introductions
  for each row execute function forbid_mutation();
-- repeat for introduction_events, introduction_status_history, reported_outcomes, audit_log
-- (rebuttals: allow UPDATE of decision fields only, via a SECURITY DEFINER function)

-- 3) Hash chain set on insert
create or replace function set_intro_hash() returns trigger
language plpgsql as $$
declare prev text;
begin
  select row_hash into prev from introductions
    order by occurred_at desc, id desc limit 1;
  new.prev_hash := prev;
  new.row_hash  := encode(sha256(convert_to(
    coalesce(prev,'genesis') || new.id || new.applicant_id || new.listing_id ||
    new.first_contact_type || to_char(new.occurred_at,'YYYY-MM-DD"T"HH24:MI:SS.US'),
  'utf8')), 'hex');
  return new;
end $$;
create trigger introductions_hash before insert on introductions
  for each row execute function set_intro_hash();
```

**Honest limit:** a Postgres superuser (i.e. us, or anyone with the Supabase service credentials) can drop the trigger and rewrite history. The hash chain makes that *detectable*, not impossible — anchor the latest `row_hash` daily somewhere outside Supabase (append to a private GitHub repo via Action, or email it to a sealed mailbox). Cheap, and it converts "trust our database" into "verify our chain" in a dispute. State exactly this much in disputes — never claim the ledger is unfalsifiable.

### 2.2 RLS

```sql
alter table introductions enable row level security;  -- and all others

-- Branch agents see only their branch's introductions
create policy intro_select_branch on introductions for select
  using (branch_id in (select branch_id from branch_members
                       where user_id = auth.uid()));

-- Applicants see their own
create policy intro_select_applicant on introductions for select
  using (applicant_id in (select id from applicants where user_id = auth.uid()));

-- NO insert policy for authenticated: introductions are created server-side only
-- (service role from the Next.js backend), so timestamps can't be client-forged.

-- Rebuttals: branch can insert only within the window, only for its own introductions
create policy rebuttal_insert on rebuttals for insert
  with check (
    exists (select 1 from introductions i
            join branch_members bm on bm.branch_id = i.branch_id
            where i.id = introduction_id
              and bm.user_id = auth.uid()
              and now() <= i.rebuttal_deadline)
  );

-- messages: participants only (separate policies on the messaging tables)
-- ppd_*, invoice_candidates, audit_log: no policies for anon/authenticated at all
--   → internal ops only, accessed with service role from an admin app gated by
--   an ops allowlist (check auth.jwt()->>'email' against an ops table if you
--   want ops users on supabase auth instead of service role).
```

`rebuttal_deadline` is computed **server-side** at notification time: `notified_at` + 5 *business* days (England & Wales bank holidays via `gov.uk/bank-holidays.json`, cached). Don't compute business days in Postgres; do it in the API layer and store the resulting timestamp — it becomes a fixed, displayable fact ("you have until Tue 23 Jun, 17:30").

---

## 3. Evidence trail mechanics

- **Notification (clause 3.1):** on insert of an introduction, the API (a) emails the branch contact and pushes an in-app notification, (b) writes `notified_at` + `rebuttal_deadline`, (c) logs to `audit_log`. The email contains the applicant name, listing, timestamp and deadline — this email *is* the dispute-killer, so send it via a provider with delivery logs you can export (Postmark/SES with event webhooks stored back into `audit_log`).
- **Viewings and messages** append to `introduction_events`. Store message *content* in the messaging tables; the event row carries IDs only — keeps the evidence trail joinable without duplicating PII.
- **Status transitions** only via a `SECURITY DEFINER` Postgres function `transition_introduction(intro_id, new_status, reason)` that validates the allowed state machine and writes `introduction_status_history` + `audit_log`. No direct writes.

---

## 4. PPD ingestion & matching (BullMQ)

### 4.1 Source facts (verified 11 June 2026)

- PPD is refreshed **monthly on the 20th working day** ([HMLR guidance](https://www.gov.uk/guidance/about-the-price-paid-data)); files are linked from the [PPD downloads page](https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads).
- Sale-to-registration lag is **typically 2 weeks–2 months, sometimes longer**; HMLR states the two most recent months are always incomplete, and prior months are revised as late registrations land.
- The **monthly update file** carries a record status per row: **A**=addition, **C**=change, **D**=delete. Ingest must apply all three — PPD is a *revisable* dataset, not a log.
- Columns: transaction unique ID, price, transfer date, postcode, property type (D/S/T/F/O), new-build flag, tenure (F/L), PAON, SAON, street, locality, town, district, county, PPD category (**A** standard / **B** additional — repossessions, corporate buyers etc.).
- **No buyer name, no UPRN.** Buyer identity requires an official copy of the title register (~£3, manual, see §4.5).
- Licence: Open Government Licence v3.0 with HMLR's required attribution statement ("Contains HM Land Registry data © Crown copyright and database right…"). The PPD page caveats reuse of the *address* data beyond OGL (Royal Mail/OS rights) — internal matching is fine; do not republish address-level data. Verify wording on the guidance page when building [SOLICITOR-lite].

### 4.2 Jobs

| Job | Schedule | Work |
|---|---|---|
| `ppd:ingest` | monthly, 25th (after the 20th-working-day refresh) + manual trigger | Download monthly update CSV → sha256 → store raw file in Supabase Storage → stream-parse → upsert `ppd_transactions` by TUID honouring A/C/D → close out `ppd_ingest_runs` |
| `ppd:match` | chained after ingest | Run matcher (§4.3) over (a) new/changed PPD rows, (b) a **3-month lookback** to catch late registrations and revisions |
| `ppd:reconcile-reported` | chained | Verification mode: confirm agent-reported completions against PPD; mismatches (reported but never registered after 4 months) → ops queue |
| `audit:hash-anchor` | daily | Export latest `row_hash` to the external anchor |
| `dunning:*` | daily | See billing doc |

Worker: BullMQ on Redis; one queue per job family; ingest is a streaming parse (the monthly file is tens of MB; the full historical file is multi-GB — only needed once at bootstrap).

### 4.3 Matcher

**Gate:** normalised postcode equality (uppercase, single space). No postcode, no match — PPD rows with null postcodes go to a manual residue list.

**Candidates:** PPD row × listings sharing the postcode where the listing has (or had) an `active`/`converted_*` introduction whose window fits: `transfer_date` ∈ [introduction.occurred_at, tail_expires_at + 9 months registration drift] *(9 months ≈ tail-end exchange + completion gap + registration lag; tune empirically)*.

**Score (0–1):**

| Component | Weight | Notes |
|---|---|---|
| PAON exact (normalised) | 0.35 | strip punctuation, expand ranges ("12-14") |
| PAON trigram ≥ 0.7 (if not exact) | 0.20 | catches "Rose Cottage"/"Rose Cottage Farm" |
| SAON match (flats) | 0.10 | **absence of SAON on either side when property_type='F' caps total score at 0.6** — flat addressing in PPD is unreliable |
| Street trigram ≥ 0.5 | 0.10 | |
| Date plausibility | 0.15 | scaled: 1.0 if within [intro+6wk, tail+3mo], decaying outside |
| Price vs asking ±12.5% | 0.10 | weak signal — negotiation and asking-price changes; never decisive |
| PPD category A | +0.0 / category B | category B → cap at 0.7 and flag (repossession/corporate buyer rarely = our applicant) |

**Thresholds:**
- **Verification mode** (a matching `reported_outcomes.completed` exists): ≥0.80 → auto-confirm the report corroborated; <0.80 → ops review (possible mis-keyed price/date).
- **Audit mode** (no completion reported): ≥0.65 → create `ppd_match_candidates(mode='audit')` and an `invoice_candidates(source='audit_match', status='on_hold_branch_query')` **query — not an invoice**. The branch gets clause-10.2 notice: "PPD shows a completion at [address] on [date] at [price]; our ledger shows introduced applicant [name], viewing on [date]. Please confirm the buyer within 10 business days." 0.50–0.65 → ops-only watchlist, no branch contact.

### 4.4 False-positive / false-negative trade-offs — stated honestly

**Structural FP (the big one):** a PPD match proves the *property* sold in the window. It cannot prove the buyer was our applicant. A listing with a Truedeed introduction can complete to a Rightmove buyer — same address, same price band, same period. **This is why audit mode produces a query, never an invoice.** Expect a meaningful share of audit-mode hits to resolve as "different buyer" — that is the system working, not failing.

**Other FPs:** flats (SAON gaps in PPD), new builds (plot vs postal address, postcode assigned late), house name variants, same-postcode relistings by another branch (we only match own-branch listings, which contains this), price coincidence on terraces where several near-identical houses transact.

**FNs:** registration lag (mitigated by 3-month lookback, never eliminated — a completion can surface 6+ months late); PPD exclusions (not-for-value transfers, court orders, etc. per HMLR's exclusion list); cross-property steering (out of scope by design — clause 6.3 makes it fee-free); tenancies (out of scope by design — fee collected upfront); typo'd addresses on our own listings (mitigation: postcode+PAON validation at listing creation against `postcodes.io`, and store UPRN where obtainable).

**Tuning stance:** bias toward FN in audit mode (high threshold + human review + branch query). A missed completion costs £249; a false accusation costs a branch. The reporting covenant — not the matcher — is the primary revenue path; the matcher's job is to make silent under-reporting *risky*, and for that a 70–80% detection rate on houses is already sufficient deterrence. Expect materially worse on flats; say so internally and don't over-claim in agent-facing comms.

### 4.5 Buyer-identity escalation (manual, out-of-pipeline)

When a branch denies the buyer was the introduced applicant and the score is high: ops may order an official copy of the register for the title (£3–£7, HMLR portal/API) and compare proprietor names against the applicant **manually**. Fuzzy, GDPR-relevant (legitimate-interests assessment must be documented; do not bulk-order registers) [SOLICITOR]. Joint proprietors and SPVs are common — the Connected Person definition in the agreement (clause 1.1) exists precisely for the spouse/SPV case. If the register shows an unrelated stranger: concede per playbook D3, log, close.

---

## 5. Invoice-candidate review queue (human gate)

States: `pending_review` → (`approved` → `invoiced`) | `rejected` | `on_hold_branch_query` (audit path; auto-escalates to `pending_review` with the branch's answer, or with silence noted, after `hold_expires_at`).

Reviewer UI must show, on one screen: the introduction (timestamp, type, notification + rebuttal status), the event trail (viewings, messages count), the reported outcome or PPD match with score components, tail arithmetic, and prior disputes with this branch. Approval writes `audit_log` and emits `invoice.create` to the billing worker (see billing doc). **Rejections require a reason** — they are the training data for matcher tuning.

SLA: candidates reviewed within 3 business days; audit-mode candidates only actioned after the 10-business-day branch query window closes.

---

## 6. Retention & data hygiene

Attribution records: tail + 12 months (aligns with agreement clause 10.2 / Schedule 2), then minimise (keep hashes + aggregate stats, strip PII). Referencing files: ≤12 months from report. PPD: open data, keep indefinitely. Message content: 24 months, then strip to metadata. All consistent with Schedule 2 of the Network Agreement — if a solicitor changes the schedule, change these constants (`/lib/retention.ts`).
