# Truedeed — Dispute Playbook

**Version:** v1, 11 June 2026. Cross-references Network Agreement clauses 3, 6–11 and the attribution spec. Owner: ops director. Review quarterly against actual dispute log.

## Operating principles

1. **The rebuttal window does the heavy lifting.** Because every introduction is notified in real time with a 5-business-day objection window (clause 3.2–3.3), most source disputes should die months before an invoice exists. A dispute raised *at invoice time* about *source* is, by construction, a dispute the branch had the chance to raise when the evidence was fresh — open every response by saying so, politely.
2. **Concede fast when we're wrong; in writing; once.** A correct concession costs £249 and buys credibility for every future invoice. A wrong refusal costs a branch, a DD chargeback, and a story that travels the industry. The asymmetry favours generosity at the margin — *at launch especially*.
3. **Never claim the ledger is infallible.** Our line: "append-only, hash-chained, externally anchored, and you were notified at the time". Not: "the computer cannot be wrong".
4. **Disputes pause one invoice, never the relationship.** Undisputed invoices keep their own clocks (clause 9.4). Suspension never fires on a properly disputed invoice.
5. **Track concessions per branch.** A branch's second identical dispute gets less benefit of the doubt than its first; say this openly when conceding ("we're settling this one in your favour; the introduction record stands for future cases").

---

## D1 — "That buyer came from Rightmove, not you"

**What's really being said:** effective-cause instinct — "you didn't *cause* this sale, you just logged a click."

**Evidence we rely on:**
- Introduction record: timestamp, contact type (enquiry / viewing request / message), hash-chain position.
- Notification email of that date + delivery log, and the **expired rebuttal window**.
- `introduction_events`: viewings booked/attended via platform, message thread — the more events, the stronger the causation story, not just the contractual one.

**Resolution policy:**
1. Window expired, no rebuttal → fee stands (clause 3.3). Response: restate the regime they signed (clause 3.4 expressly replaces effective cause), attach the notification delivery log, and the event trail.
2. **Exception — concede** if the branch produces evidence *dated before our timestamp* of contact about the *same property* (portal lead email, CRM record with verifiable created-at): credit in full even though the window technically expired — **once per branch per 12 months**. The conclusive clause is leverage for the chancers, not a guillotine for the genuine.
3. Evidence dated *after* our timestamp, or relating to the applicant generally but not this property → fee stands, no exceptions. Quote clause 3.2's final sentence — the property-specific line was drawn deliberately.

**Where we concede:** genuine pre-dated same-property evidence (even late, first time); our notification provably failed to deliver (then the window never fairly ran — re-open it for 5 business days instead of arguing).

**Never concede:** "we'd have got this buyer anyway", "they were on our mailing list", "everyone uses Rightmove". That is precisely what clause 3.4 exists to exclude.

---

## D2 — "The sale fell through"

**What's really being said:** usually true; occasionally a completion being quietly re-described.

**Evidence we rely on:**
- Their own reporting trail (clause 5): SSTC / exchange reports.
- PPD over the following months: a "fell-through" property that registers a transfer at a matching price inside the window is the tell.
- Listing status changes (re-listed? price-changed? withdrawn?).

**Resolution policy:**
1. No invoice should exist pre-completion (clause 7.1) — if one does, it's our error: **cancel within 5 business days, apologise without being asked twice** (clause 7.2).
2. Record `fell_through`, keep the introduction's tail alive (a revived chain inside the tail still bills; say so when confirming).
3. Diarise PPD watch on the address for tail + 9 months. If a transfer to the introduced applicant/connected person later registers → clause 10.4: fee + interest from when it was due + audit costs. This is the one place a "fell through" becomes a serious conversation about clause 5.3 (material breach).

**Where we concede:** always and immediately on the money — a genuine fall-through owes nothing, and there is nothing to claw back because nothing was due. Be visibly gracious here; this dispute is the cheapest goodwill we will ever buy.

**Never concede:** the tail. Fall-through ≠ tail reset.

---

## D3 — "That was a different applicant"

**What's really being said:** the completed buyer's name ≠ the introduced applicant's name. Sometimes true (structural false positive — PPD has no buyer identity). Sometimes a spouse, partner, or SPV.

**Evidence we rely on:**
- Introduction + viewing/message trail (did *our* applicant attend a viewing?).
- Branch's buyer details requested under clause 10.2 (10 business days to answer).
- Escalation: official copy of the title register (£3–£7, manual, LIA documented) — proprietor names.
- Connected Person definition (clause 1.1): spouse/civil partner/cohabitant, household member, co-purchaser, controlled entity, nominee.

**Resolution policy:**
1. Audit-mode matches **never invoice before this dispute can happen** — the clause 10.2 query goes first by design. So this dispute should arrive with our question, not our invoice.
2. Branch names an unrelated buyer + register confirms (or branch provides credible solicitor-level corroboration) → **concede, dismiss the match, log as matcher false positive** (it's tuning data).
3. Register shows the applicant, a name-match within Connected Person, or joint proprietorship including them → fee stands; cite clause 6.2(d) if the structure looks deliberate.
4. Branch refuses to answer the 10.2 query → silence noted, candidate proceeds to review with the silence as a factor; clause 5.3/10.2 breach conversation runs in parallel. Don't bill on silence alone where the score rests only on address/price/date — get the register first.

**Where we concede:** demonstrably unrelated buyer — fully, quickly, with thanks for the correction. **Watch for:** the same branch repeatedly selling introduced properties to "different applicants" at high match scores — that pattern, not any single case, is what the quarterly audit review and clause 6.2(b) are for.

---

## D4 — "We never agreed to the tail"

**What's really being said:** the negotiator who clicked through onboarding didn't read it, or staff have changed, or the franchisee disputes head-office's signature.

**Evidence we rely on:**
- Executed agreement: director-level signature, name and title captured at execution (clause 2.1(a)); version stamp; the tail is in the definitions, clause 4.1, clause 6, *and* the plain-English boxes beside each.
- Onboarding audit trail: who signed, when, from where; the countersigned copy emailed to the registered office.

**Resolution policy:**
1. Signature is director/authorised → fee stands, full stop. Attach the executed copy with the relevant clauses highlighted, including the plain-English box that says "the fee follows the introduced buyer onto the introduced property for 6 months". This dispute is why those boxes exist.
2. Signature authority genuinely defective (e.g. a negotiator signed without authority and the company disavows) → we have a real formation problem [SOLICITOR before asserting anything]. Pragmatically: offer to regularise (fresh director signature) and waive *this* fee as the price of a clean contract going forward. A £249 write-off beats litigating ostensible authority.
3. Franchise confusion (head office vs franchisee entity) → check which company number signed. If we contracted the wrong entity, fix the paper first, bill second.

**Where we concede:** defective execution we should have caught at onboarding — concede the instance, fix the process the same week.

**Never concede:** "didn't read it" from a valid signatory. The 6-month tail (cut from 12 precisely to be defensible) is the line to hold — agree it once, hold it everywhere, because every concession here is discoverable precedent with every other branch.

---

## D5 — "£249 on a £62,000 flat? The fee's too high for a cheap property"

**What's really being said:** a fairness argument, often from low-value-stock branches; sometimes an opening bid for a bespoke rate.

**Evidence we rely on:** none needed — this is a commercial-terms conversation, not an evidence dispute. The maths: £249 on a £62k sale at 1.5% commission (£930 + VAT) is ~27% of the commission — *that* is the only version of this complaint with real force.

**Resolution policy:**
1. Default: the fee is flat and modest by design; it doesn't scale up on a £900k house either — the branch keeps that upside. Most complaints end here.
2. **No ad-hoc discounts, ever.** Per-branch side-deals leak, breed resentment, and convert a clean flat-fee model into a negotiation with every member.
3. If the data shows a real segment problem (branches whose median sale < ~£90k, where £249 regularly exceeds ~20% of commission), fix it **structurally and publicly**: a published floor rule, e.g. "completions under £75,000: Success Fee £149", introduced by the clause 4.7 / 13.3 variation mechanism (30 days' notice). One rule for everyone or no rule.
4. Never move to percentage fees. PPD shows us sale prices, which makes %-fees *feasible* — and dispute-maximising. The flat fee priced below the cost of arguing is the enforcement model.

**Where we concede:** structurally (published low-value floor) if the segment data justifies it; a one-time goodwill credit at launch only where a founding branch's *first* invoice lands on a genuinely marginal sale and the relationship is worth more than £249 — flagged internally as goodwill, never as precedent.

**Never concede:** quietly, individually, or repeatably.

---

## Annex — Direct Debit chargeback (cuts across all five)

A branch that claws back a collected payment via the DD Guarantee instead of disputing has converted a billing question into a breach (clause 8.6). Policy: (1) freeze auto-collection for the org; (2) same-day letter from the ops director: the Guarantee right is theirs, but the debt survives, the agreement treats unjustified claims as material breach, and the dispute channel remains open for 10 business days from the letter; (3) if they then raise a substantive dispute, run D1–D5 on the merits as if the chargeback were the dispute — decide on the merits, not the affront; (4) no engagement → dunning resumes at Email 3 stage, suspension follows, debt joins the aggregate-recovery pile. A *fraudulent* claim ("I never authorised this" against a signed mandate and a director's signature) may engage the Fraud Act 2006 — that sentence appears in the letter exactly once, as fact, not threat [SOLICITOR on wording].

## Metrics that tell us the playbook is working

Disputes per 100 invoices (< 8 healthy); % resolved inside the rebuttal window vs at invoice (rising % at-window = system working); concession rate (10–25% — 0% means we're bullying, >40% means the matcher or the clause is wrong); repeat-disputer concentration; chargebacks (should be ≈ 0 — each one is a relationship post-mortem, not just a debt).
