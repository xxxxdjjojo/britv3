# Truedeed — Billing Flow (GoCardless / Dunning / Statutory Interest)

**Version:** v1, 11 June 2026. Anchored to Network Agreement clauses 8–11. Decisions baked in: invoice on confirmed completion only; 14-day terms; dunning day 0/7/14 from overdue; automatic suspension day 21; statutory interest regime incorporated unmodified.

---

## 1. Mandate lifecycle

**Onboarding (condition of membership, clause 2.1(b)):**
1. After the director signs the Network Agreement, redirect to a GoCardless **Billing Request flow** (hosted page) to set up the Bacs mandate against the member org's account. Store `gocardless_customer_id` + `mandate_id` on `member_orgs`.
2. Membership is not activated (no listings live, no introductions) until the webhook confirms the mandate is `active` — *pending_submission* is not enough for go-live gating? It is: Bacs mandates take ~2–3 working days to activate; gate go-live on **submitted**, gate first collection on **active**. Pragmatic middle: activate the branch on signature + mandate *created*, but hold any collection until `active`.

**Keepalive (the 13-month dormancy problem):**
- Bacs mandates lapse after ~13 months without a collection ([GoCardless, dormant DD rules](https://gocardless.com/guides/posts/what-are-dormant-direct-debit-rules)). A pay-on-completion member can easily go 13 months quiet.
- Daily job `mandate:health`: for each active mandate with no collection in **12 months**, email the branch a heads-up and trigger a re-authorisation flow before Bacs kills it. Cheaper than fighting dormancy after the fact.
- Webhooks `mandates.cancelled / expired / failed / transferred` → set org flag `mandate_broken`, start the **clause 8.3 clock**: 10 business days to re-establish, then suspension per clause 11.1(b). All automated; ops notified.

**Chargebacks:** webhook `payments.charged_back` → mark invoice `charged_back`, debt survives as contractual debt (clause 8.6), freeze auto-collection on that org, route to ops with the playbook (D-CB below is handled inside dispute playbook). Never silently re-collect a charged-back amount by DD — that inflames, and repeat submissions look bad under scheme rules. Recover it through the dispute/legal path.

---

## 2. Invoice creation

Trigger: `invoice_candidates.status → approved` (human gate — see tracking spec §5). Worker `billing:create-invoice`:

1. Create sequential **VAT invoice** (legal requirements: sequential number, our VAT number, tax point, net £249.00 / VAT £49.80 / gross £298.80 per Success Fee; referencing packs net £148.00 / VAT £29.60 / gross £177.60 collected on order).
2. Terms: **payable 14 days from invoice date** (clause 8.1). Due date printed.
3. Create GoCardless payment with `charge_date = due_date`. GoCardless handles the Bacs advance-notice email automatically (min ~3 working days before collection).
4. Email 0 (below) goes out same day — it is a service message, not a chase.

Timeline (calendar days from invoice date **I**):

| Day | Event | State |
|---|---|---|
| I+0 | Invoice issued, Email 0 | `open` |
| I+14 | Due date; DD collection attempt | `collecting` |
| I+17ish | Webhook `payments.confirmed` → paid, done | `paid` |
| — | Webhook `payments.failed` (or no mandate) | → **dunning day 0** |
| D+0 | Email 1 — payment failed / overdue | `overdue` |
| D+7 | Email 2 — reminder + retry scheduled | `overdue` |
| D+14 | Email 3 — formal notice: statutory interest now itemised, suspension date named | `final_notice` |
| D+21 | Automatic suspension (clause 11.1(a)) + Email 4 | `suspended` |
| payment received any time | Webhook → reinstate within 2 business days (automated, immediate in practice) + Email 5 | `paid`, branch `active` |

**Dispute pause:** if a Properly Raised Dispute (clause 9.5: within 10 business days of invoice, via platform, with grounds + evidence) is logged, the dunning state machine freezes **for that invoice only**. Other invoices keep their own clocks. Resolution restarts the clock where it stopped.

**Retry policy:** one automatic retry at D+7 (announced in Email 2). No retries after D+14 — by then it's a relationship/dispute problem, not a cash-timing problem. (GoCardless Success+ intelligent retries are fine to enable; keep the *announced* retry at D+7 regardless so emails never surprise.)

---

## 3. Statutory interest — exact calculation

Authority: Late Payment of Commercial Debts (Interest) Act 1998 (as amended). Drafted into clause 9 **unmodified** — deliberately, because (a) a weaker contractual remedy risks being void as not a "substantial remedy" (ss.8–9), and (b) the Small Business Protections Bill (first reading, House of Lords, 19 May 2026) is expected to make statutory interest mandatory and non-excludable. This section is then just arithmetic, not drafting.

- **Rate:** 8% + the Bank of England reference rate. The reference rate is base rate frozen twice yearly: the 31 December rate applies to debts becoming overdue 1 Jan–30 Jun; the 30 June rate applies 1 Jul–31 Dec.
- **Now (H1 2026):** base has been 3.75% since December 2025 → **11.75% per annum**. (MPC meets 18 June 2026; whatever base is on 30 June fixes the H2 2026 rate — update the constant.)
- **Principal:** the gross invoice amount including VAT (£298.80). Interest itself is not VATable.
- **Daily interest** = gross × rate ÷ 365. For £298.80 at 11.75%: £0.0962/day.
- **Fixed sum** (s.5A): debt < £1,000 → **£40 per invoice**, once, on the day it becomes overdue. (£70 for £1,000–£9,999.99; £100 ≥ £10,000 — relevant if you ever consolidate arrears into one claim.)
- **Plus** reasonable recovery costs exceeding the fixed sum (s.5A(2A)) — this is where clause 10.4 audit costs and any solicitor letter sit.

**Worked example** (quote this format in Email 3):
> Invoice TD-2026-0147, £298.80 inc VAT, due 12 May 2026, unpaid 30 days.
> Interest: £298.80 × 11.75% × 30/365 = **£2.89**
> Fixed sum: **£40.00**
> Total now due: £298.80 + £2.89 + £40.00 = **£341.69**, interest accruing at £0.10/day.

Be honest internally: on a £249 fee the interest is signalling; the £40 fixed sum stings mildly; **suspension is the actual lever**. The statutory machinery exists so that when you do escalate (aggregated arrears via Money Claim Online), the numbers are pre-agreed and unarguable.

Implementation: `lib/late-payment.ts` holds `{ referenceRate: 0.0375, validFrom: '2026-01-01', validTo: '2026-06-30' }` as data, refreshed each January/July from the BoE published rate; never hardcode in templates.

---

## 4. Agent-facing email copy

Merge fields in `{braces}`. Tone targets: firm, specific, never apologetic, never hostile; every email names the exact next event and date. Sender: accounts@truedeed.co.uk, reply-to monitored.

### Email 0 — invoice issued (I+0) — service tone
> **Subject: Invoice {invoice_no} — completion at {property_address}**
>
> Hi {first_name},
>
> Congratulations on completing {property_address} — recorded as introduced to {applicant_name} via Truedeed on {introduction_date}.
>
> Invoice {invoice_no} for £298.80 (£249 + VAT) is attached. It's due on {due_date}, and your Direct Debit will collect it automatically on that date — nothing for you to do.
>
> If anything about this invoice looks wrong, raise it in your dashboard within 10 working days: {dispute_link}. The introduction record, including the original notification of {notification_date} and viewing history, is here: {evidence_link}.
>
> Thanks — and good selling.
> Truedeed Accounts

### Email 1 — payment failed / overdue (D+0)
> **Subject: Invoice {invoice_no} — payment didn't go through**
>
> Hi {first_name},
>
> The Direct Debit for invoice {invoice_no} (£298.80, due {due_date}) didn't complete — usually a cancelled mandate or a bank-side rejection.
>
> Two ways to fix it today: pay by bank transfer to {account_details} quoting {invoice_no}, or re-authorise your Direct Debit here: {mandate_link} — we'll re-collect automatically.
>
> If you believe the invoice is wrong, the dispute process is here: {dispute_link}. A disputed invoice is paused while we resolve it; an ignored one isn't.
>
> Truedeed Accounts

### Email 2 — reminder (D+7)
> **Subject: Invoice {invoice_no} — 7 days overdue, retry scheduled**
>
> Hi {first_name},
>
> Invoice {invoice_no} (£298.80 for the completion at {property_address}) is now 7 days overdue. We'll retry your Direct Debit on {retry_date}.
>
> If the retry fails, late-payment interest and the statutory £40 fixed sum under the Late Payment of Commercial Debts (Interest) Act 1998 will be added from {interest_start_date}, and continued non-payment leads to suspension from the network on {suspension_date}.
>
> If there's a problem with this invoice — or with cash flow this month — reply to this email. Talking to us pauses nothing automatically, but we'd rather solve it than escalate it.
>
> Truedeed Accounts

### Email 3 — formal notice (D+14)
> **Subject: Formal notice — invoice {invoice_no}, suspension on {suspension_date}**
>
> {first_name},
>
> Invoice {invoice_no} is 14 days overdue. As of today the amount owing is:
>
> Invoice: £298.80 · Statutory interest to date: £{interest_to_date} · Fixed sum (s.5A): £40.00 · **Total: £{total_due}**, accruing £{daily_rate}/day.
>
> Under clause 11.1(a) of your Network Agreement, {branch_name} will be **suspended from the Truedeed network on {suspension_date}** unless payment is received or a dispute has been properly raised. Suspension means your listings are hidden, no new applicants are introduced, and referencing ordering is disabled — it lifts within 2 working days of payment.
>
> Pay now: {payment_link}. Dispute: {dispute_link}. Speak to us: {phone}.
>
> {ops_director_name}, Truedeed

### Email 4 — suspension (D+21)
> **Subject: {branch_name} suspended from the Truedeed network**
>
> {first_name},
>
> As notified on {email3_date}, {branch_name} was suspended today under clause 11.1(a): invoice {invoice_no}, now £{total_due} including statutory interest and the fixed sum.
>
> What suspension means: your listings are hidden from applicants, no new introductions are made to your branch, and referencing ordering is disabled. Fees already accrued remain payable, and introductions made before today keep their 6-month tail.
>
> Reinstatement is automatic within 2 working days of payment: {payment_link}. If the debt remains unpaid at 60 days we may terminate membership and refer the debt, with interest and costs, for recovery.
>
> We'd genuinely rather have you selling than suspended — payment today puts this behind us.
>
> {ops_director_name}, Truedeed

### Email 5 — reinstatement (on payment)
> **Subject: {branch_name} — you're back live**
>
> Hi {first_name},
>
> Payment received with thanks — invoice {invoice_no} is settled and {branch_name} is live again on Truedeed: listings visible, introductions flowing, referencing enabled.
>
> One ask: keep the Direct Debit mandate active ({mandate_link} shows its status). It's what keeps this process boring, which is how we both like it.
>
> Truedeed Accounts

---

## 5. State machine & jobs (implementation sketch)

```
invoice:  open → collecting → paid
                     ↘ failed → overdue(D0) → overdue(D7) → final_notice(D14) → suspended(D21)
any state —(properly_raised_dispute)→ disputed [clock frozen, this invoice only] → resolved → resume
charged_back: → frozen, debt survives (clause 8.6), ops-only path
```

- `dunning:tick` (BullMQ, daily 08:00): advance states by date, render emails from templates, write `invoice_events`, idempotent by `(invoice_id, state)`.
- `billing:suspend` / `billing:reinstate`: flip `branches.status`, hide/show listings (single flag the listing query respects), notify. Reinstate is triggered by the GoCardless `payments.confirmed` webhook — minutes, not the contractual 2 business days.
- All emails BCC-archived and delivery-logged into `audit_log` (they are evidence; Email 3 in particular is your letter-before-action substrate).
- Edge: invoice paid by bank transfer while DD retry pending → cancel the GC payment on reconciliation to avoid double-collection (webhook race: reconcile by reference).

**Escalation beyond day 60:** aggregate all unpaid invoices for the org, add interest + fixed sums per invoice, one letter before action (Pre-Action Protocol for Debt Claims does not apply to companies — but send a 14-day LBA anyway), then Money Claim Online. Sue on aggregates, not single £249 fees. Expected volume: low — the model's economics (fee ≪ commission) are the real collection mechanism.
