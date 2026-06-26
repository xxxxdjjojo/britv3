# TrueDeed Role-Based Lifecycle / Onboarding Email Spec

Build spec for role-based welcome/onboarding drip sequences (renter, buyer, landlord, seller,
estate agent). Stack: Resend (React Email) + Inngest for orchestration. Profiles carry
`active_role`. This document = implementation contract, not strategy essay.

---

## 1. Research-backed best practices (the rules we follow)

**Cadence & length.** Most consumer/SaaS onboarding flows run **4–8 emails over ~14 days**;
simple, fast-time-to-value products need only 3–4. Move faster early (day 0 → +2 → +5), then
space out (+9, +14). Goal is momentum, not volume. We use **4–6 steps per role**.
[mailsoftly](https://mailsoftly.com/blog/user-onboarding-email-best-practices/),
[digitalapplied](https://www.digitalapplied.com/blog/saas-customer-onboarding-email-sequence-2026-crm-playbook),
[smashsend](https://smashsend.com/blog/onboarding-email-sequence-examples)

**Structure that drives activation:** welcome (handshake, not a pitch) → value/orientation →
activation nudge (one key first action) → social proof / proof point → re-engagement for the
inactive. Each email serves activation, confidence, or conversion.
[userpilot](https://userpilot.com/blog/saas-onboarding-emails/),
[howdygo](https://www.howdygo.com/blog/saas-onboarding-email-examples)

**One email = one job = one CTA.** Welcome email is the highest-open touchpoint; keep it
scannable in ~10s with exactly one primary CTA. Every email = clear subject + one-sentence value
restatement + one useful thing + single CTA.
[mailsoftly](https://mailsoftly.com/blog/user-onboarding-email-best-practices/)

**Behaviour-triggered beats time-based.** Behaviour triggers (saved a search, listed a property,
posted a job) report ~30% higher conversion / ~4.5x engagement vs pure calendar drips. We run a
**hybrid**: time-based backbone (day 0/+2/+5/…) with **behaviour-based stop conditions** so we
never nag someone who already activated.
[digitalapplied](https://www.digitalapplied.com/blog/saas-customer-onboarding-email-sequence-2026-crm-playbook)

**Subject lines.** 6–10 words / ~40–60 chars. A number lifts opens (~+57%). Don't optimise on
open rate — Apple Mail Privacy Protection inflates opens to ~100% (40–55% of consumer opens). A/B
test on **click-through**, not opens.
[truelist](https://truelist.io/blog/email-subject-line-best-practices),
[natchezdemocrat](https://www.natchezdemocrat.com/sponsored-content/email-subject-line-best-practices-in-2026-what-the-data-says-and-how-to-test-yours-for-free-27b8b2d4)

**Send time.** Send in recipient-local business hours (~9am–3pm). Inngest steps clamp to
07:00–20:00 Europe/London; never send overnight.
[mailsoftly](https://mailsoftly.com/blog/user-onboarding-email-best-practices/)

**List hygiene.** Suppress hard bounces/complaints immediately; sunset contacts with no
engagement in 6 months. Protect sender reputation — a spam-foldered email is worthless.
[truelist](https://truelist.io/blog/email-subject-line-best-practices)

**Property-portal precedent.** Rightmove/Zoopla anchor engagement on **saved searches +
instant/email alerts**, and Zoopla's "My Home" hub frames the homeowner across the whole property
lifecycle. Our activation milestones mirror this: renter/buyer → saved search; seller/landlord →
property listed / valuation; agent → first listing or job posted.
[Zoopla help](https://help.zoopla.co.uk/hc/en-gb/articles/360005969458-How-do-I-create-email-alerts-and-saved-searches),
[Property Industry Eye](https://propertyindustryeye.com/zoopla-unveils-sweeping-changes-to-its-functionality-and-branding/)

---

## 2. Enrolment trigger & orchestration model

**Trigger.** On signup completion / role assignment (auth callback `assign_role_atomic` writing
`profiles.active_role`), emit Inngest event `lifecycle/role.assigned` with
`{ userId, role, assignedAt }`. The Inngest function keyed on `role` runs the matching sequence.
Role change re-emits the event → enrol into the new role's sequence (see double-send guard).

**Sequence as a single Inngest function per role.** Each step = `step.sleepUntil(...)` (delay
relative to enrolment) → `step.run` precondition check → `step.run` send. `sleepUntil` makes
delays durable across deploys; clamp wake time into the 07:00–20:00 Europe/London window.

**Idempotency / no double-sends.**
- One enrolment row per `(user_id, sequence_key)` in `lifecycle_enrolments`
  (`status`: active | completed | stopped; `current_step`; `enrolled_at`). Insert is
  `ON CONFLICT (user_id, sequence_key) DO NOTHING` → re-firing the trigger can't double-enrol.
- Per-send idempotency key `${userId}:${sequenceKey}:${stepId}`; a `lifecycle_sends` unique row
  blocks re-sends if Inngest replays. Inngest `idempotency` on the function caps one run per
  `event.data.userId + role`.
- Role switch: mark the old sequence `stopped`, enrol the new one. A user only ever has one
  *active* lifecycle sequence at a time.

**Preference-gating (checked at SEND time, not enrol time).** Before every send, re-read prefs:
1. Global unsubscribe / `marketing_opt_out` → skip all **marketing** steps (still allow
   always-send onboarding; see §3).
2. `notification_preferences.lifecycle_email = false` → skip the step.
3. Hard-bounce / complaint suppression list → skip + mark enrolment `stopped`.
4. Account deleted / role no longer matches → `stopped`.
If a send is skipped, the sequence continues to the next step (skip ≠ stop) unless the reason is
a hard stop (unsub-all, suppression, deletion).

**Stop conditions (behaviour events end the sequence early).** Subscribe the Inngest function to
a `lifecycle/activity` event; on a matching stop event set enrolment `stopped` and cancel
remaining steps (`step.waitForEvent` race, or check a `stopped` flag before each send).

| Role | Stop the sequence when the user… |
|------|----------------------------------|
| Renter | saves a search **or** books/enquires a viewing **or** submits a tenancy enquiry |
| Buyer | saves a search **or** saves ≥1 property **or** books a viewing/enquiry |
| Landlord | lists a rental property **or** adds a tenancy **or** starts referencing |
| Seller | requests/completes a valuation **or** creates a sale listing |
| Estate agent | publishes first listing **or** posts a job **or** completes agency profile |

All sequences also stop on: global unsubscribe-all, account deletion, role change.

---

## 3. Always-send (onboarding) vs marketing (preference-gated)

- **Always-send onboarding (service/transactional-adjacent):** Step 1 welcome of every sequence,
  plus genuinely orientational "how to get started" steps. These are operational onboarding for a
  service the user actively signed up for and are **not** gated by the marketing flag — but they
  still honour a global unsubscribe-all and suppression list, and still carry an unsubscribe link.
- **Marketing (preference-gated):** social-proof, guides/content, cross-sell, and re-engagement
  steps. Skipped if `marketing_opt_out` or `lifecycle_email = false`.
- Per-step `kind` field (`onboarding` | `marketing`) drives the gate. Marked in each table below.

---

## 4. UK GDPR / PECR compliance (non-negotiable)

- **Lawful basis.** Marketing email relies on **consent** *or* the **PECR reg 22(3) soft opt-in**
  (existing/negotiating customer, similar products, clear opt-out at collection AND in every
  message). Capture consent state + timestamp at signup; **no pre-ticked boxes** — a pre-ticked
  box is not valid consent under UK GDPR (ICO enforcement precedent). Marketing-consent checkbox
  ships **unticked** with explanatory text.
  [ICO electronic mail marketing](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/electronic-and-telephone-marketing/electronic-mail-marketing/),
  [ICO soft opt-in](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-direct-marketing-using-electronic-mail/how-do-we-comply-with-the-pecr-electronic-mail-marketing-rules/)
- **Unsubscribe in every marketing email**, as easy to use as the original opt-in; honour
  promptly; also support one-click `List-Unsubscribe` / `List-Unsubscribe-Post` headers.
  [ICO](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-direct-marketing-using-electronic-mail/how-do-we-comply-with-the-pecr-electronic-mail-marketing-rules/)
- **Identity + contact address** in every message; never disguise the sender.
- **Double opt-in** recommended for newsletter (cleaner consent evidence + list hygiene); lifecycle
  onboarding enrols off the verified signup so a separate confirm isn't required for always-send
  steps, but marketing steps require the consent flag above.
- **DUAA 2025/2026.** The Data (Use and Access) Act provisions affecting PECR are in force — keep
  consent records auditable; treat the soft opt-in scope narrowly (similar products only).
  [measuredcollective](https://measuredcollective.com/when-can-uk-marketers-use-the-soft-opt-in/)
- US note: CAN-SPAM (truthful headers, physical postal address, visible unsubscribe honoured ≤10
  days) is satisfied by the same controls if any recipients are US-based.

---

## 5. Role sequences

CTA URLs are on `https://truedeed.co.uk`. `kind` = O (always-send onboarding) / M (marketing,
preference-gated).

### 5.1 Renter — 5 steps

| # | Delay | Kind | Purpose | Subject | Primary CTA → URL | Body points |
|---|-------|------|---------|---------|-------------------|-------------|
| 1 | Day 0 | O | Welcome + orient | Welcome to TrueDeed — find your next rental | Start your search → `/search?listingType=rent` | • What TrueDeed does for renters • Set a saved search to get instant alerts • One tap to start |
| 2 | +2d | O | Activation: save a search | Get matched the moment a place lists | Save a search → `/search?listingType=rent` | • Saved searches = instant new-listing alerts (like Rightmove/Zoopla) • Set area, beds, budget • Be first to enquire |
| 3 | +5d | M | Value: budget tool | What rent can you actually afford? | Move-in cost calculator → `/tools/rental-yield-calculator` | • True move-in cost: rent, deposit, fees • Deposit-scheme protection explained • Avoid surprise costs |
| 4 | +9d | M | Social proof + trust | How renters secure homes faster on TrueDeed | Browse rentals → `/search?listingType=rent` | • Verified listings & agents • Renters who set alerts enquire first • Tenancy deposit protection built in |
| 5 | +14d | M | Re-engagement | New rentals are waiting in your area | See what's new → `/dashboard` | • Fresh listings since you joined • Resume in one tap • Saved search reminder |

### 5.2 Homebuyer (buyer) — 5 steps

| # | Delay | Kind | Purpose | Subject | Primary CTA → URL | Body points |
|---|-------|------|---------|---------|-------------------|-------------|
| 1 | Day 0 | O | Welcome + orient | Welcome to TrueDeed — let's find the one | Start your search → `/search?listingType=sale` | • What TrueDeed offers buyers • Saved searches + price alerts • One tap to begin |
| 2 | +2d | O | Activation: save search/property | Never miss the right home again | Save a search → `/search?listingType=sale` | • Instant alerts on new listings & price cuts • Save properties to compare • Set area, beds, budget |
| 3 | +5d | M | Value: area & price insight | What's really happening with prices near you | Explore area prices → `/area-prices` | • Median sold prices by postcode • Price history on every listing • Buy with data, not guesswork |
| 4 | +9d | M | Value: planning/feasibility | See what you could build on a home | Browse with potential → `/search?listingType=sale` | • Permitted-development potential per property • ROI/renovation signals • Spot underpriced upside |
| 5 | +14d | M | Re-engagement | New homes matching you just listed | View new matches → `/dashboard` | • Listings since you joined • Resume in one tap • Saved-search nudge |

### 5.3 Landlord — 6 steps

| # | Delay | Kind | Purpose | Subject | Primary CTA → URL | Body points |
|---|-------|------|---------|---------|-------------------|-------------|
| 1 | Day 0 | O | Welcome + orient | Welcome to TrueDeed for landlords | Go to your dashboard → `/dashboard` | • Manage listings, tenancies, compliance in one place • What to set up first • Single hub |
| 2 | +2d | O | Activation: list a property | List your property in minutes | Add a property → `/dashboard` | • Reach verified renters fast • Photos, rent, availability • Live the same day |
| 3 | +5d | M | Value: yield tool | What yield is your property really making? | Rental yield calculator → `/tools/rental-yield-calculator` | • Gross/net yield in seconds • Benchmark vs local area • Price the rent right |
| 4 | +8d | M | Value: guide / compliance | The landlord guide: stay compliant, get paid | Read the landlord guide → `/guides/landlord-guide` | • Deposit protection deadlines • Referencing & right-to-rent • Rent reminders built in |
| 5 | +11d | M | Social proof | Why landlords switch their lettings to TrueDeed | See how it works → `/dashboard` | • Verified tenant enquiries • Compliance tracking • Faster void fill |
| 6 | +16d | M | Re-engagement | Your property dashboard is ready when you are | Finish your listing → `/dashboard` | • Pick up where you left off • New renter demand in your area • One tap to publish |

### 5.4 Seller — 5 steps

| # | Delay | Kind | Purpose | Subject | Primary CTA → URL | Body points |
|---|-------|------|---------|---------|-------------------|-------------|
| 1 | Day 0 | O | Welcome + orient | Welcome to TrueDeed — let's sell your home | Value my property → `/value-my-property` | • What TrueDeed does for sellers • Start with a free valuation • One tap |
| 2 | +2d | O | Activation: valuation | What's your home worth today? | Get my free valuation → `/value-my-property` | • Instant data-led estimate • Local sold-price comparables • No obligation |
| 3 | +5d | M | Value: local market data | See what homes like yours sold for | View area prices → `/area-prices` | • Sold prices by postcode • Price trends near you • Set the right asking price |
| 4 | +9d | M | Social proof / trust | How sellers list with confidence on TrueDeed | Create your listing → `/dashboard` | • Verified buyer enquiries • Data-backed pricing • Transparent process |
| 5 | +14d | M | Re-engagement | Your valuation is one tap away | Finish your valuation → `/value-my-property` | • Pick up where you left off • Buyer demand in your area • Quick to complete |

### 5.5 Estate agent — 6 steps

| # | Delay | Kind | Purpose | Subject | Primary CTA → URL | Body points |
|---|-------|------|---------|---------|-------------------|-------------|
| 1 | Day 0 | O | Welcome + orient | Welcome to TrueDeed — set up your agency | Go to your dashboard → `/dashboard` | • Listings, leads, jobs in one hub • Complete your agency profile • Single workspace |
| 2 | +2d | O | Activation: first listing | Publish your first listing today | Add a listing → `/dashboard` | • Reach verified buyers & renters • Quick listing flow • Live same day |
| 3 | +5d | O | Activation: complete profile | Win more enquiries with a complete profile | Complete profile → `/dashboard` | • Verified agencies get more leads • Logo, coverage, contact • Builds trust |
| 4 | +8d | M | Value: marketplace / jobs | Find trades & services in the marketplace | Explore the marketplace → `/marketplace` | • Connect with vetted providers • Post a job to get quotes • Speed up transactions |
| 5 | +11d | M | Value: post a job | Need a survey, EPC or photos? Post a job | Post a job → `/post-a-job` | • Get competitive quotes fast • Vetted providers • Track responses |
| 6 | +16d | M | Re-engagement | Your agency dashboard is waiting | Pick up setup → `/dashboard` | • Finish onboarding • New buyer/renter demand • One tap to list |

---

## 6. Step counts

renter 5 · buyer 5 · landlord 6 · seller 5 · estate agent 6.

## 7. Build checklist

- [ ] Tables: `lifecycle_enrolments` (unique `(user_id, sequence_key)`), `lifecycle_sends`
      (unique idempotency key). RLS service-role only.
- [ ] Inngest fn per role, `sleepUntil` backbone + send-time pref re-check, 07:00–20:00 clamp.
- [ ] Emit `lifecycle/role.assigned` from auth callback; emit `lifecycle/activity` from
      save-search / listing / valuation / job / viewing events for stop conditions.
- [ ] Per-step `kind` gate (onboarding vs marketing) against `marketing_opt_out` +
      `notification_preferences.lifecycle_email`.
- [ ] Resend React Email templates per step; `List-Unsubscribe` headers; identity + postal
      address footer; suppression-list sync from Resend bounce/complaint webhooks.
- [ ] A/B subject lines measured on **click-through**, not opens (Apple MPP).
- [ ] Signup marketing-consent checkbox unticked, with explanatory copy.
