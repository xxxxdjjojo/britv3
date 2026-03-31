# Britestate Service Provider / Trades Dashboard Research
## User Interview Responses — UK Tradespeople & Trade Business Owners

**Date:** March 2026
**Format:** Simulated qualitative interviews (3 personas)
**Purpose:** Inform the design of Britestate's service provider dashboard, job management, quoting, scheduling, certification workflows, and field-mobile experience

---

## Persona Profiles

### Persona A — "Steve"
**Trade:** Gas engineer & plumber (Gas Safe registered), 2-man team + 1 apprentice
**Experience:** 18 years in the trade, 7 years running his own business
**Current tools:** Commusoft (job management), Xero (accounting), WhatsApp (customer & supplier comms), paper Gas Safe forms (transitioning to digital), Google Calendar (backup diary)
**Work mix:** 60% reactive maintenance / call-outs, 30% boiler installations, 10% landlord contracts
**Tech comfort:** Moderate — uses apps but prefers things that work on-site with one hand and poor signal

### Persona B — "Kirsty"
**Trade:** Electrician (NICEIC registered), sole trader
**Experience:** 9 years qualified, 4 years running her own business
**Current tools:** Tradify (job management & invoicing), QuickBooks (accounting), Instagram (marketing), WhatsApp (everything), Electrical Cert software (separate app for 18th Edition certificates)
**Work mix:** 50% domestic rewires and consumer unit upgrades, 30% testing & inspection, 20% commercial
**Tech comfort:** High — comfortable with apps, frustrated by poor mobile design and having to use multiple systems

### Persona C — "Paul"
**Trade:** Building and roofing contractor, 8-person team (4 roofers, 2 general builders, 1 labourer, 1 office manager)
**Experience:** 24 years in construction, runs a limited company
**Current tools:** Fergus (job management), Xero (accounting), WhatsApp groups (team coordination), Excel (estimating large jobs), paper timesheets (yes, still), a whiteboard in the office (job schedule overview)
**Work mix:** 40% insurance work (storm damage, leaks), 35% extensions and loft conversions, 25% roofing renewals
**Tech comfort:** Low-moderate — relies heavily on his office manager for the system; uses mobile for photos and WhatsApp only

---

## Section 1 — Current Dashboard Usage

### 1.1 "Describe your main dashboard or home screen."

**Steve (Commusoft):**
When I open Commusoft in the morning, I see a schedule view — today's jobs listed by time, with the customer name, address, and a short description of what needs doing. There's a sidebar showing outstanding invoices and a "tasks" section with things like "follow up Mrs. Richards re: quote for new boiler." At the top there's a counter showing: open jobs, jobs today, quotes pending, and overdue invoices. On the whole it's decent — I can see my day at a glance. But it's designed more for office viewing. On my phone, between jobs in the van, it's cramped and fiddly. The bits I need most — the next job address, the customer's phone number, and any notes about access — are buried behind taps.

**Kirsty (Tradify):**
Tradify shows me a daily schedule with job cards — each one has the customer name, address, time slot, and job type. Below the schedule there's a "quotes" section and an "invoices" section showing how much is outstanding. There's also a notifications panel for new enquiries and messages. It's clean and I like it, but it's missing some things I really need: my certificate management is in a completely separate app, there's no materials tracking, and the quoting tool is too basic for the kind of itemised quotes I need to give for larger rewires. I end up switching between Tradify, my cert app, WhatsApp, and QuickBooks at least 20 times a day.

**Paul (Fergus):**
Fergus gives me a Kanban-style board with job stages: Enquiry → Quoted → Won → Scheduled → In Progress → Invoiced → Paid. I can see how many jobs are in each stage and their total values. There's also a team schedule view showing which of my 8 people are booked where and when. The finance section shows revenue this month, outstanding quotes, and aged debtors. For a building business, Fergus is probably the best I've tried, but the estimating is too simplistic for a £40k extension — I still do those quotes in Excel. And the team scheduling doesn't account for the reality that half my lads don't check the app properly, so I still have to WhatsApp them the details every morning.

### 1.2 "Which parts do you look at or tap on most during the day?"

**Steve:**
The schedule — what's next, where am I going. After every job I check the customer record for any notes about the next one. I also check invoices probably 3-4 times a day because cashflow is tight — I need to know who owes me money. If I've sent a quote for a boiler installation, I'll check whether the customer has accepted it, because those are my big-ticket jobs and I want to book them in before my schedule fills up.

**Kirsty:**
My job list for the day and my messages. If a customer has messaged me about access arrangements or a change to the scope of work, I need to see that before I arrive. I also check my quotes-sent section regularly — following up on quotes is where I win or lose work. After completing a job, I tap into the invoicing section straight away because I've learned that if I don't invoice on-site, I forget and the money comes in weeks late.

**Paul:**
The team schedule board — who is where, which jobs are running on time, which ones have overrun. I'm managing 4 active sites on most days, so I need to see at a glance: is the loft conversion in Solihull on track? Have the roofers finished at the insurance job in Edgbaston? My office manager Kelly lives in the finance view — chasing payments, sending invoices, reconciling with Xero. I peek at the money numbers once a day but Kelly handles the detail.

### 1.3 "Desktop or mobile? Does the layout work?"

**Steve:**
90% mobile, in the van between jobs. And honestly, no, it doesn't work well. Commusoft's mobile app is functional but not designed for a bloke with dirty hands in a cold van trying to find an address. The buttons are too small, the navigation requires too many taps, and it doesn't work offline — so if I'm in a basement with no signal, I can't access the job details I just looked at 5 minutes ago. I want: next job, address (one-tap navigation), customer phone (one-tap call), key notes (visible without scrolling), done. That should be the entire mobile experience for an engineer on the road.

**Kirsty:**
Both, but mostly mobile when I'm on-site and desktop in the evening for admin. The mobile app needs to let me: check my next job, see the customer's details, take photos, capture a signature, complete a certificate, and send an invoice — all without going back to the desktop. Currently, Tradify handles jobs and invoices on mobile okay, but certificates are in another app entirely, and doing anything complex (like building a multi-line quote) is painful on a phone screen.

**Paul:**
I use mobile for photos and WhatsApp. Everything else goes through Kelly on the desktop in the office. The Fergus desktop view is actually pretty good — the schedule board is visual and I can drag jobs around. But I've tried using it on my phone and it's hopeless for scheduling — the board doesn't translate to a small screen. What I need on mobile is dead simple: where are my teams today, are there any problems, and what new enquiries have come in. That's it. Kelly handles the rest.

### 1.4 "What do you keep checking over and over?"

**Steve:**
Money. Who has paid, who hasn't, and when is the next payment coming in. I check my banking app and Commusoft's invoice list probably 5 times a day. On a good month I'm turning over £12-15k, but cashflow can be lumpy — if two big boiler installs haven't been invoiced or paid, I might not be able to buy materials for next week's jobs. I also obsessively check the schedule — am I going to be double-booked? Did I forget to block time for that landlord contract on Thursday?

**Kirsty:**
Quote status. I send maybe 5-8 quotes a week, and following up on them is the difference between a full diary and quiet weeks. I check daily: has the customer viewed the quote? Have they accepted? Should I follow up? The other thing I check constantly is my diary for gaps — if I have a free afternoon next week, I want to fill it now, not scramble last minute.

**Paul:**
Site progress. Are the jobs on schedule? Have the materials been delivered? Has the scaffolding been put up? I can't get that from any app — I get it from WhatsApp messages from my foremen, phone calls, and driving past sites. The app shows me the schedule, but it doesn't show me reality. Reality lives in WhatsApp group chats and photos from site.

### 1.5 "What widgets/sections do you barely use?"

**Steve:**
Commusoft has a "reports" section with charts showing revenue trends, job completion rates, and customer satisfaction scores. I've looked at it maybe three times in two years. It's interesting but it doesn't change what I do tomorrow morning. There's also a "stock management" module that I bought but never set up because tracking every washer and bend is more work than it saves.

**Kirsty:**
Tradify has a "price book" feature where you can save standard prices for services. Great in theory, but every job is different — a consumer unit change might be £350 in a modern house with easy access and £700 in a Victorian terrace with an asbestos meter cupboard. Standard prices are almost misleading. There's also a "team management" section that's irrelevant to me as a sole trader but takes up navigation space.

**Paul:**
Fergus has a GPS tracking feature that shows me where my team's phones are. I tried it, but the lads didn't like feeling tracked and it caused friction. Turned it off after a week. There's also an "inventory" section for materials tracking that's far too granular for a building business — we buy materials per job from Jewson or Travis Perkins, we don't track individual items. And there's a "maintenance plans" feature designed for recurring work that doesn't fit our project-based model.

---

## Section 2 — Day-to-Day Workflows and Time Sinks

### 2.1 "Walk me through a typical workday."

**Steve's Day:**

| Time | Activity | System(s) Used |
|------|----------|----------------|
| 7:00 | Check today's schedule, review first job details | Commusoft mobile, van |
| 7:30 | Drive to first job — need address, access notes | Google Maps (from Commusoft link), WhatsApp (customer re: parking) |
| 8:00–10:30 | First job (boiler service for landlord) | Paper Gas Safe record, phone photos |
| 10:30 | Upload photos, complete job notes, mark as done | Commusoft mobile (slow, clunky) |
| 10:45 | Drive to second job — check details en route | Commusoft (if signal allows) |
| 11:00–13:00 | Second job (radiator leak repair) — diagnose, fix, test | Phone photos, mental notes |
| 13:00 | Lunch — log second job completion, send invoice | Commusoft, Xero sync |
| 13:30 | Check for new enquiries, return missed calls | Phone, Commusoft inbox, WhatsApp |
| 14:00–16:30 | Third job (boiler installation — day 1 of 2) | Materials already on-site, job notes in Commusoft |
| 16:30 | Pack up, take completion photos, update job status | Phone photos, Commusoft |
| 17:00 | Drive home — mentally review quotes to send | — |
| 19:00–20:30 | Evening admin: write up Gas Safe certificates, send 2 quotes, chase 1 overdue invoice, reply to 4 WhatsApp messages from customers | Laptop: Commusoft, Gas Safe cert software, WhatsApp Web, Xero |

**Time loss:** "The evening admin is the killer. I spend 1.5 hours every night doing paperwork that I should have done on-site but couldn't because the tools aren't fast enough. Writing up gas certificates takes 20 minutes each because the form software is separate from my job system and I'm re-entering the same customer and appliance details. If certificates were built into the job, I'd do them on-site in 5 minutes and get my evenings back."

**Kirsty's Day:**

| Time | Activity | System(s) Used |
|------|----------|----------------|
| 7:30 | Check diary, review today's jobs, load van | Tradify mobile |
| 8:00 | First job (consumer unit upgrade) — arrive, assess, start work | Photos (phone), Tradify job notes |
| 12:00 | Complete job, test, fill in BS 7671 electrical certificate | Separate cert app (iCertifi), phone |
| 12:30 | Take completion photos, get customer signature | Phone, Tradify (signature capture) |
| 12:45 | Send invoice on-site while customer is standing there | Tradify invoicing |
| 13:00 | Lunch — check messages, reply to 2 new enquiries | WhatsApp, Tradify inbox |
| 13:30 | Second job (EICR testing) — full electrical inspection | Test instruments, cert app, paper notes |
| 16:30 | Complete EICR, discuss findings with customer | Cert app, phone |
| 17:00 | Drive home |  |
| 18:00 | Evening: upload EICR to customer portal, write 2 quotes, post job photos on Instagram, reconcile day's expenses | Laptop: cert app export, Tradify, Instagram, QuickBooks |

**Time loss:** "Certificates. Absolutely certificates. I'm filling in basically the same information three times — once in Tradify (customer, property, job details), once in my cert app (same customer, same property, plus technical results), and once in QuickBooks (same customer, invoice for the work). If the cert was built into the job, with the customer details pre-populated, I'd save 30–40 minutes a day. That's 3+ hours a week I'm spending on re-typing."

**Paul's Day:**

| Time | Activity | System(s) Used |
|------|----------|----------------|
| 7:00 | Office: review schedule board, brief Kelly on priorities | Fergus desktop, whiteboard |
| 7:30 | WhatsApp teams: "Lads, here's your day…" with screenshots of schedule | WhatsApp groups |
| 8:00 | Visit Site 1 (loft conversion) — check progress, resolve issues | Phone (photos), WhatsApp (with client) |
| 10:00 | Visit Site 2 (insurance repair) — meet loss adjuster, take photos | Phone, email (loss adjuster), paper scope of works |
| 11:30 | Back to office: update Fergus, create quotes for 3 enquiries | Fergus + Excel for larger quotes |
| 13:00 | Lunch — return calls from potential customers | Phone |
| 14:00 | Visit Site 3 (flat roof renewal) — check materials delivery | Phone, WhatsApp (supplier), Fergus mobile (barely) |
| 15:30 | Office: review Kelly's invoicing, approve supplier payments | Xero, bank app, Fergus |
| 16:30 | Plan tomorrow's schedule — check who's available, assign jobs | Fergus + whiteboard + WhatsApp |
| 17:30 | Final check: any issues from sites, any urgent customer comms | WhatsApp, email, Fergus |

**Time loss:** "Estimating. Building a proper quote for a £40k extension takes me 3-4 hours in Excel — measuring, pricing materials, costing labour, allowing for plant hire, scaffolding, skip hire, building control fees. Fergus's quoting tool can handle 'replace tap — £180' but it can't handle a 47-line estimate with materials, sub-contractors, contingencies, and staged payments. So I quote in Excel, then re-enter the headline figures into Fergus. Also: getting information from site to office. My lads send photos on WhatsApp, not through the app. So we have critical job photos scattered across 4 different WhatsApp group chats, completely disconnected from the job record."

### 2.2 "Where do you lose time?" (Summary across all three)

| Time Sink | Who It Affects | Estimated Time Lost |
|-----------|---------------|---------------------|
| Re-entering data between job system and cert software | Steve, Kirsty | 30–45 mins/day |
| Writing up certificates separately from job record | Steve, Kirsty | 20–30 mins/day |
| Manually syncing job system and accounting software | All three | 15–30 mins/day |
| Building complex quotes in Excel alongside job system | Paul | 3–4 hours/week |
| Chasing customers for quote decisions (no automation) | All three | 1–2 hours/week |
| Chasing overdue invoices manually | All three | 1–2 hours/week |
| Communicating schedule to team via WhatsApp screenshots | Paul | 30 mins/day |
| Uploading photos from phone to job record | All three | 15–20 mins/day |
| Searching WhatsApp history for customer conversations | All three | 15–30 mins/day |
| Evening admin that couldn't be done on-site | Steve, Kirsty | 1–1.5 hours/day |

### 2.3 "What do you still run in WhatsApp, paper, or spreadsheets?"

**Steve:** WhatsApp (70% of customer communication — appointment confirmations, photos of issues, "I'm running 20 minutes late"), paper Gas Safe records (legal requirement until digital submission is fully accepted, though the transition is happening), banking app (checking payments multiple times daily because Commusoft doesn't show real-time payment status).

**Kirsty:** WhatsApp (customer comms, contractor referrals), Instagram (marketing — before/after photos, reviews), separate cert software (iCertifi/Electrical Cert — cannot be replaced because it must produce industry-standard BS 7671 compliant documents), QuickBooks (because Tradify's finance features aren't deep enough for tax reporting).

**Paul:** WhatsApp groups (main communication channel with team — schedule, site photos, issues, delivery updates), Excel (complex estimating, cost tracking for larger projects), paper timesheets (foremen fill them in at end of week, Kelly enters into system), whiteboard (visual schedule — quicker to glance at than loading an app), email (insurance companies, loss adjusters, architects, building control — all use email, not job apps).

**Why don't the apps replace these?**
Unanimous: *"Because the apps try to be everything and end up doing the specific things we need — on-site, one-handed, with poor signal — worse than the simple tools we already use."*

### 2.4 "Where would halving the admin need to happen?"

**Steve:** "Certificates. If I could fill in a gas certificate as part of completing the job — using the customer and appliance details already in the system — and have it auto-submit to Gas Safe, that single change would save me an hour a day and let me do an extra job or get home for tea."

**Kirsty:** "Quote-to-invoice. When I quote a consumer unit change at £480 and the customer says yes, the system should auto-generate a job, schedule it, and prepare the invoice — all pre-populated. Right now I'm manually creating the job from the accepted quote, then manually creating the invoice from the completed job. Three manual steps for what should be zero."

**Paul:** "Getting information from site to system. If my lads could take photos, log time, report issues, and note materials used directly in the job — from their phones, even offline — and it all appeared in the job record back in the office, Kelly and I would save 2 hours a day in data chasing and WhatsApp archaeology."

---

## Section 3 — What Makes a Trade Job-Management Tool Powerful

### 3.1 "What separates a basic trade app from a powerful one?"

**Job and schedule board:**

**Steve:** A powerful tool shows me today's jobs in a simple list with one-tap navigation to the address. But it also shows my apprentice's schedule alongside mine, so when a call-out comes in, I can see who's free. Basic apps just show my own diary. A proper system lets me drag a new job into a gap, see travel time between jobs, and flag clashes before they happen.

**Kirsty:** The schedule board needs to understand that not all jobs are the same length. An EICR on a 3-bed house takes 3-4 hours, but a smoke alarm install is 45 minutes. The system should know my standard job durations and warn me if I've overbooked a day. Most basic tools just let you put a block in a time slot — they don't know or care if it's realistic.

**Paul:** For a team of 8, I need a visual board showing people as rows and days as columns, with jobs as coloured blocks. I need to see: who's on which site, how many days left on each job, and where the gaps are. Drag-and-drop to reassign people when someone calls in sick. And critically — the lads need to see their own schedule on their phones without seeing everyone else's business.

**Mobile job app for engineers:**

**Steve:** This is where most tools fail. On-site, I need: job address with navigation, customer phone number, job notes and history (has this boiler been serviced before? Any access issues?), photo capture that saves directly to the job, a quick completion form (work done, time spent, materials used), and ideally the certificate form built in. All of this needs to work offline and sync when I get signal back. If any of those things require more than 3 taps, I won't use it — I'll go back to WhatsApp and paper.

**Kirsty:** Same as Steve, plus: digital signature capture (so the customer signs off on the work), the ability to start an invoice on-site and send it before I leave, and ideally the ability to take a card payment there and then. Getting paid on the day is transformative — it eliminates 80% of payment chasing.

**Paul:** My lads need the simplest possible app. Job address, scope of work, a button to take photos, a button to log hours, and a button to flag an issue. Nothing else. If you show a roofer a complex interface, he'll close the app and WhatsApp me a photo instead. The field app for operatives and the management app for the office must be fundamentally different interfaces.

**Quotes and estimating:**

**Steve:** For simple jobs (fix a leak: £120 call-out + parts), a quick quote from the phone is fine. But for boiler installations (£2,500–£4,500), I need: itemised breakdown (boiler unit, flue kit, magnetic filter, controls, labour — day 1, day 2), a professional-looking PDF that builds customer confidence, and the ability to save templates so I'm not starting from scratch every time. Most tools handle simple quotes but choke on anything over 10 lines.

**Kirsty:** I need a quote builder that understands electrical work. A rewire quote has: first fix labour, second fix labour, materials (cable, clips, back boxes, accessories, consumer unit, RCDs), testing time, and building control notification fee. If the system had a price book with standard electrical materials that I could customise with my own prices, quote building would take 10 minutes instead of 45.

**Paul:** This is where I live or die. A building quote might have 50+ lines across demolition, structural steel, brickwork, joinery, roofing, plumbing, electrical, plastering, decoration, and externals. I need: section headers, sub-totals, contingency allowances, payment schedules (30% deposit, stage payments), and profit margin visibility. No trade app I've used can do this properly. Fergus handles small jobs; Excel handles the real work. If someone built a quote tool that could handle both a £200 gutter repair and a £80,000 extension, I'd be impressed.

**Invoicing and payments:**

**Steve:** On-site invoicing with a payment link. The customer gets a text or email with a "Pay now" button, they pay by card, and the money is in my account by the next day. That's the dream. Currently I invoice from Commusoft, it syncs to Xero, but the customer has to do a bank transfer, which means I wait 3-7 days and often have to chase. Getting paid at point of completion would improve my cashflow enormously.

**Kirsty:** Exactly what Steve said. I started using a Stripe card reader on-site and it's transformed my business. If the invoicing tool had that built in — complete job → generate invoice → customer taps their card → done — I'd never have an aged debtor again. The current setup requires me to generate the invoice, then separately send a payment link, then separately record the payment in QuickBooks. Three systems, one transaction.

**Paul:** For building work, invoicing is more complex. Stage payments at milestones (slab, wall plate, roof on, first fix, second fix, completion), retention percentages on commercial jobs, and applications for payment on insurance work. I also need proper VAT invoices because we're VAT registered. The invoicing tool needs to handle: one-off invoices, staged invoices, retention invoices, and credit notes. Most trade apps only handle the first one.

**Certificates and forms:**

**Steve:** Gas Safe certificates are my bread and butter. CP12 (landlord gas safety records), commissioning checklists for new boilers, unvented hot water certificates. Currently, I fill these in on separate software (or paper) and then manually associate them with the job. If the certificate form was part of the job — pre-populated with customer, property, and appliance details — I'd save 20 minutes per certificate and I do 4-5 a day. That's over an hour and a half.

**Kirsty:** For electricians, it's: Electrical Installation Certificates (EICs), Minor Works certificates, Electrical Installation Condition Reports (EICRs), and Part P Building Control notifications. These are legally required, technically complex documents. The cert software must produce compliant output that my registration body (NICEIC) will accept. No generic trade app has got this right yet — the forms require specific technical fields (Zs values, RCD trip times, circuit details) that a general-purpose tool doesn't understand.

**Paul:** We produce fewer formal certificates, but we need: site inspection forms, health & safety checklists (CDM compliance), snagging lists, handover documents, and photo logs with timestamps. For insurance work, we need before/after photo packs with descriptions, scope-of-works documents, and completion reports. These are usually done in Word or just as collections of photos — having them built into the job record would be much better.

**Team and location visibility:**

**Steve:** For my small team (me + 1 engineer + apprentice), I just need to see everyone's diary side by side. Basic but critical — when a call-out comes in, I need to know: who's nearest and who has a gap? If the system showed travel time between the call-out location and each team member's current job, that would be incredibly useful.

**Kirsty:** N/A — sole trader. But I do want the system to understand my location and optimise my route for the day. If I have jobs in M4, M14, and M20, it should schedule them in a logical driving order, not send me back and forth across Manchester.

**Paul:** Essential. I need to know: is the team at Site A actually on-site (or stuck in traffic)? Have they started? Are they on track to finish today? I'm not interested in Big Brother GPS tracking — my lads pushed back on that and I respect it. But a simple "check-in" feature (arrived at site, left site) would help me manage without micromanaging.

### 3.2 "Which automations actually help vs. create noise?"

**Helpful automations (keep and improve):**

- Appointment reminders to customers (24h and 1h before) — reduces no-access visits
- Quote follow-up reminders (to me: "You quoted Mrs. Jones 7 days ago and she hasn't responded. Follow up?")
- Invoice payment reminders to customers (7 days overdue, 14 days overdue — auto-escalating tone)
- Recurring job scheduling (annual gas checks for landlord contracts — auto-schedule, auto-notify tenant)
- Certificate expiry reminders to landlords/property owners
- Job completion triggers invoice creation (pre-populated, ready to review and send)
- New enquiry auto-acknowledgment ("Thanks for your enquiry, I'll be in touch within 24 hours")
- Day-before schedule summary sent to team members (email/SMS with next day's jobs)

**Noise (kill or make optional):**

- Push notifications for every system event (job status changed, invoice viewed, quote opened) — overwhelming
- Auto-generated marketing emails to past customers ("Haven't seen you in a while!") — feels spammy
- Over-enthusiastic reminder chains to customers (3 reminders in 48 hours about an overdue invoice alienates people)
- Internal system notifications that duplicate WhatsApp messages (if I've already read the WhatsApp, don't notify me in the app too)
- "Business insights" notifications ("You completed 15% more jobs this month!") — interesting once, annoying daily

### 3.3 "Which integrations are essential?"

**Non-negotiable (all three agreed):**
1. **Accounting (Xero / QuickBooks / FreeAgent)** — invoices must flow seamlessly into accounting without re-entry
2. **Payment processing (Stripe / GoCardless / card readers)** — on-site payment collection
3. **SMS/email for customer communication** — appointment confirmations, quote sends, invoice delivery
4. **Google/Apple Maps** — one-tap navigation to job addresses

**Highly important:**
5. **Certification bodies (Gas Safe, NICEIC, NAPIT, OFTEC)** — digital certificate submission
6. **Supplier pricing (Screwfix, Jewson, Plumbase, CEF)** — live material prices for accurate quoting
7. **Calendar sync (Google Calendar, Outlook)** — engineers who don't use the app can still see their schedule
8. **Cloud storage (Google Drive, Dropbox)** — for photos and documents that need sharing outside the system

**Nice to have:**
9. Route optimisation (Google Routes / similar)
10. CIS (Construction Industry Scheme) tax handling for sub-contractors
11. Building control notification submission (Part P for electricians, Building Regs for builders)
12. Insurance company portals (for claim updates — Aviva, AXA, Zurich)

---

## Section 4 — Ideal Trades Dashboard: Most Useful Functions

### 4.1 "What do you want to see immediately when you open it?"

**Steve's ideal above-the-fold:**
1. **Today's jobs** — chronological list: time, address (tap to navigate), customer name (tap to call), job type, any notes/warnings ("no parking — use side street", "dog in house, ring doorbell twice")
2. **Money widget** — invoices sent this week: £X, payments received: £Y, overdue: £Z (with the oldest debtor named)
3. **Quotes pending** — 3 quotes awaiting response, oldest is 12 days (amber warning), suggested action: follow up
4. **Tomorrow preview** — 3 jobs booked, one gap in the afternoon (fillable)

**Kirsty's ideal above-the-fold:**
1. **Today's schedule** — visual timeline showing jobs, travel gaps, and free slots, with job addresses mapped
2. **New enquiries** — 2 new enquiries since yesterday, one is urgent (emergency rewire — smoke from socket). One-tap to respond
3. **Outstanding money** — total owed to me: £2,340. Top 3 debtors with "Send reminder" button
4. **Quote pipeline** — 6 quotes out: 2 accepted (need scheduling), 3 awaiting response (follow up?), 1 rejected

**Paul's ideal above-the-fold:**
1. **Team schedule board** — 8 people, 5 active sites, today's assignments at a glance, colour-coded by job status (on track / delayed / issue flagged)
2. **Revenue dashboard** — this month: quoted £62k, won £41k, invoiced £28k, collected £19k. Pipeline value.
3. **Jobs at risk** — Site 2 is 3 days behind schedule (materials delayed), Site 4 has a flagged issue (damp discovered behind plasterboard)
4. **Cash due this week** — 3 invoices totalling £14,200 due before Friday. One is a known slow payer (14 days overdue on previous invoice)

### 4.2 "What quick actions from the dashboard?"

| Quick Action | Description |
|-------------|-------------|
| Start navigation | Tap job address → opens maps with route |
| Call customer | Tap customer name → dials number |
| Log quick job note | Voice-to-text or quick text entry, saved to job |
| Take job photo | Camera opens, photo auto-saves to current job |
| Complete job | One-tap → completion form (work done, time, materials, photos, signature) |
| Send invoice | From completion form → review → send (email/SMS with payment link) |
| Take payment on-site | Card reader / payment link / bank transfer confirmation |
| Accept/decline enquiry | New enquiry card → tap accept (creates job) or decline (with template reason) |
| Convert quote to job | Accepted quote → one-tap → creates job, schedules, notifies customer |
| Send quote follow-up | Template message: "Hi [name], just checking if you had any questions about the quote I sent on [date]?" |
| Schedule team member | Drag job to person on schedule board (desktop) |
| Log expense | Quick photo of receipt → amount → category → linked to job |

### 4.3 "What KPIs actually matter to you?"

**Weekly:**
- Jobs completed this week vs. previous week
- Revenue invoiced and revenue collected
- Quotes sent and quotes accepted (win rate)
- Average response time to new enquiries
- Overdue invoices total and count

**Monthly:**
- Total revenue vs. target
- Quote-to-win conversion rate (%)
- Average job value
- Average days from quote to acceptance
- Average days from invoice to payment
- Gross margin (revenue minus direct costs: materials + sub-contractor labour)
- Utilisation rate (billable hours as % of available hours) — for team businesses
- Repeat customer rate

**Paul (additional for team businesses):**
- Revenue per team member
- Job overrun rate (% of jobs that exceeded estimated time/cost)
- First-time fix rate (for reactive maintenance)
- Material cost as % of job value (margin indicator)
- Aged debtors (30/60/90 day breakdown)

### 4.4 "If the system could highlight 3 'do these now' items?"

**Steve:**
1. "You have a boiler installation quote sent to Mr. Okafor 9 days ago (£3,200). He viewed the PDF twice. Suggest: call now to discuss. His number: 07xxx. Tap to call."
2. "Mrs. Patel's invoice for £285 is 21 days overdue. This is her second job — she paid promptly last time. Suggest: polite reminder. Tap to send."
3. "You have a 2-hour gap tomorrow between 14:00–16:00 near SE15. You have 2 outstanding small job requests in SE15/SE16. Suggest: book one in. Tap to schedule."

**Kirsty:**
1. "Emergency enquiry: Mrs. Khan reports smoke from a socket at 14 Cedar Avenue, M14 (submitted 23 minutes ago). Your next job finishes at 11:30 and you're 12 minutes away. Suggest: call immediately and attend after current job."
2. "3 quotes expiring in the next 7 days (your average acceptance happens at day 6). Send follow-up messages now? Tap to send all."
3. "You completed a full rewire at 22 High Street yesterday but haven't submitted the Electrical Installation Certificate. Deadline for Part P notification: 30 days. Create cert now? (Customer and circuit details pre-populated from job.)"

**Paul:**
1. "Site 3 (flat roof, Edgbaston) — Dave logged 'materials not delivered' at 8:15am. Supplier: Jewson Selly Oak. Suggest: call supplier (tap to call) or reassign Dave to Site 1 where an extra pair of hands would help today."
2. "Insurance job at 8 Birch Lane — loss adjuster report due by Friday. Kelly hasn't uploaded the completion photos yet. Assign task to Kelly? Tap to assign."
3. "Cash alert: you have £7,400 in invoices overdue by 30+ days. Two are insurance companies (notoriously slow). One is a domestic customer who has been chased twice. Suggest: escalate domestic to final notice. Tap to send."

---

## Section 5 — Pain Points with Current Trade Apps

### 5.1 "What frustrates you most?"

**Steve:**
"Offline. Full stop. I work in basements, loft spaces, plant rooms, and rural properties. Half my working day has patchy or no signal. If the app doesn't work offline — syncing when I'm back in signal — it's useless to me on-site. Commusoft goes blank when I lose connection. I've lost job notes, photos, and completion forms because the app couldn't sync. I've gone back to paper for critical things because paper never has a signal problem."

**Kirsty:**
"Two apps for one job. I shouldn't need a separate app to create legally compliant electrical certificates. The cert and the job are the same thing — I did the work, here's the certificate. If the trade management platform understood my trade well enough to produce the right certificates from within the job record, I'd save 30 minutes a day and have a complete, linked record. Instead, I have a job in Tradify and a certificate in iCertifi, and the only link between them is that I remember which one goes with which."

**Paul:**
"Adoption. The best trade app in the world is useless if my team won't use it. I've bought three different systems over the years, and each time the same thing happens: I set it up, I train the lads, they use it for two weeks, then they go back to WhatsApp because it's faster and they already know how to use it. The field app for operatives needs to be so simple and so fast that it's easier than WhatsApp. That's a high bar."

### 5.2 "Where don't you trust the system?"

**Steve:** "Payments. The app says the invoice was 'sent' but I don't know if the customer opened it, if the email went to spam, or if they're just ignoring it. I still check my bank to confirm actual payment. Until the system shows me 'payment confirmed in your bank account,' I don't trust the invoicing feature."

**Kirsty:** "Scheduling. Tradify lets me book 6 hours of work into an 8-hour day, which looks fine on the screen but doesn't account for travel, van loading, unexpected complications, or the fact that I need to eat lunch. The schedule shows a tidy diary; reality is chaos. I keep a mental buffer that the app doesn't know about."

**Paul:** "Costings. Fergus shows me job costs, but it only knows what we've entered. It doesn't know about the £400 of materials Dave bought from Screwfix on the company card that he hasn't logged. It doesn't know about the skip hire Kelly arranged by phone. So the 'profit' figure for a job is always incomplete, and I have to reconcile manually in Xero to get the real number. I trust Xero. I don't trust the job app's financial data."

### 5.3 "Have you tried other apps and left them?"

**Steve:** "I tried Jobber — too American, didn't understand UK gas regulations or certification. ServiceM8 — nice app, but no UK-specific forms and the quoting was too basic. SimPRO — powerful but insanely complex and expensive; designed for companies with 50+ engineers, not a 3-man team. I settled on Commusoft because it's UK-based and understands gas, but it's not perfect."

**Kirsty:** "I started with Powered Now — it had basic electrical cert support, but the certs weren't accepted by NICEIC because the formatting was wrong. That was a disaster — I had to redo 15 certificates. I tried ServiceM8 briefly — clean interface but no cert support at all. Tradify won because it's fast and the invoicing works, but I've had to bolt on cert software separately, which defeats the purpose."

**Paul:** "I've been through Tradify (too simple for team management), Commusoft (good for service, not for project-based work), SimPRO (too complex, too expensive — £200/month per user), and WorkflowMax (actually decent but now being shut down by Xero). Fergus is the best compromise I've found, but 'best compromise' means I'm still supplementing it with Excel and WhatsApp."

### 5.4 "If you could strip out half your dashboard?"

**Steve would remove:** Stock management (never set it up), reports section (looked at it 3 times), CRM marketing tools (I'm a plumber, not a marketing agency), team GPS tracking (creepy), the "insights" dashboard (tells me what I already know). **Keep:** Today's jobs, customer details, quoting, invoicing, certificates, payment tracking.

**Kirsty would remove:** Team management features (sole trader), price book (every job is bespoke), inventory tracking (irrelevant for electrical work), marketing tools, supplier integration (I just go to Screwfix). **Keep:** Job schedule, quoting, invoicing with on-site payment, certificate creation, customer messaging, photos.

**Paul would remove:** Individual item stock tracking, GPS tracking, marketing/CRM outreach, basic reports (I use Xero for real reporting), recurring job features (our work is project-based), and the mobile scheduling board (it simply doesn't work on a phone screen). **Keep:** Team schedule board (desktop), job pipeline Kanban, proper estimating, invoicing, photo management, team field app, cash position.

---

## Section 6 — Next-Gen / 10x Features for Trades

### 6.1 "What feels 'sci-fi' but would genuinely transform your business?"

**Steve:**
"AI-powered scheduling that actually works. Here's what I mean: a call-out comes in — boiler breakdown in SE22, customer available from 2pm. The system knows I'm finishing a job in SE21 at 1:30pm, my other engineer is in SE5 until 3pm, and my apprentice is doing a service in SE15 until 2pm. It should auto-suggest: 'Steve, you can get there by 2pm with a 10-minute drive. Book it?' One tap, confirmed, customer notified. Right now, that calculation happens in my head, looking at two diaries and a map, and takes 5 minutes. If AI could do it in seconds and account for traffic, job overruns, and priority levels — that would save me 30-45 minutes a day on scheduling alone.

"Second sci-fi feature: a photo-to-report tool. I take 10 photos during a boiler installation — existing system, new boiler, flue route, gas meter, pipework, controls. The AI looks at the photos, identifies what's in them, and auto-generates the completion report and populates the relevant fields on the Gas Safe certificate. I'm not saying it should submit the cert without me checking — but if it filled in 80% of the form from my photos and GPS location, I'd just review and sign. That would be revolutionary."

**Kirsty:**
"Automatic quoting from a site survey. I visit a property, take photos of the consumer board, the wiring, the rooms — and the AI analyses the photos and says: 'This looks like a full rewire. Based on a 3-bed semi, estimated cable quantities are X, the consumer unit needs upgrading, and Part P notification is required. Draft quote: £4,200–£4,800 based on your pricing. Review and send?' Even if it got me 70% of the way there, I'd save an hour per quote on domestic rewires.

"Also: smart material ordering. The system knows I'm doing a consumer unit change tomorrow. It checks my standard materials list for that job type, cross-references with what I've got in the van (based on previous purchase history), and says: 'You might need 2x 32A MCBs and a Type 2 SPD — do you want to add them to your CEF order?' That's the kind of AI that saves real time and money."

**Paul:**
"Project costing in real time. Right now, I find out a job went over budget 3 weeks after it's finished, when Kelly reconciles the invoices. What I want is: at any point during a project, I can see — budgeted cost vs. actual spend so far, predicted final cost based on progress and spending rate, and margin alert if we're heading for a loss. Live, not retrospective. If the system tracked materials purchased (via supplier API or receipt scanning), labour hours logged by the team, and sub-contractor invoices received, and compared that to the original estimate — I'd know immediately when a job was going sideways.

"The other 'sci-fi' thing: automated insurance claim management. Insurance work is 40% of my business and the admin is brutal — scope of works, estimates in their format, loss adjuster meetings, staged approvals, completion reports, retention releases. If the system understood the insurance workflow and auto-generated the documents in the format each insurer expects, it would save Kelly 10+ hours a week."

### 6.2 "If your current tool vanished, what 3 features are non-negotiable?"

**Steve:**
1. Job scheduling with mobile access (offline-capable)
2. On-site invoicing with instant payment collection
3. Built-in Gas Safe certificate creation linked to the job

**Kirsty:**
1. Mobile-first job management (schedule, details, photos, signature)
2. Quoting and invoicing with on-site card payment
3. Integrated electrical certificate creation (EIC, Minor Works, EICR) — compliant and accepted by NICEIC/NAPIT

**Paul:**
1. Team schedule board with visual drag-and-drop
2. Proper estimating tool that handles both small jobs and large projects (50+ lines, staged payments)
3. Real-time job costing — budget vs. actual, live, per project

### 6.3 "What would make you say: 'This dashboard gets me home earlier and makes me more money'?"

**Steve:**
"If it eliminated my evening admin. If I could complete a job at 4:30pm — log the work, take photos, fill in the gas certificate, send the invoice, and take a card payment — all before I walk out the customer's door, I'd be home by 5:15 instead of doing paperwork until 8pm. That's not just a time saving, it's a quality-of-life change. And getting paid on the day instead of chasing for weeks? That's cash in the bank that makes everything else easier."

**Kirsty:**
"If it made quoting faster and following up automatic. Quoting is where I win work, and following up is where I convert it. If the system helped me build accurate quotes in 10 minutes instead of 45, automatically followed up after 5 days, and converted accepted quotes into scheduled jobs without me touching it — I'd fit in one more job per week and convert 20% more quotes. That's easily £15,000-£20,000 more revenue a year. For a sole trader, that's transformative."

**Paul:**
"If it got my team off WhatsApp and onto the system. Not by forcing them, but by making the system genuinely faster and easier than WhatsApp for sharing job details, photos, and status updates. If the field app was so simple that my lads actually used it, I'd have real-time visibility of every site without driving around or making phone calls. That would save me 2 hours a day in travel and chasing, and prevent the job overruns that cost me 5-10% of my margin every year."

---

## Synthesis & Feature Matrix

### Frequency of Mentions (Across All 3 Personas)

| Dashboard Element | Mentions | Priority |
|-------------------|----------|----------|
| Today's job schedule (mobile-first) | 14 | Critical |
| Invoicing with on-site payment | 11 | Critical |
| Built-in trade certificates (gas, electrical, etc.) | 10 | Critical |
| Quoting / estimating tool | 10 | Critical |
| Money owed / cash position widget | 9 | Critical |
| Offline capability (field-first) | 8 | Critical |
| Photo capture linked to job record | 8 | Critical |
| Team schedule board (visual) | 7 | High |
| Quote follow-up automation | 7 | High |
| One-tap navigation to job address | 6 | High |
| Customer communication history | 6 | High |
| Job completion form (work, time, materials, signature) | 6 | High |
| Invoice payment reminders (auto) | 5 | High |
| Real-time job costing (budget vs actual) | 5 | High |
| AI-optimised scheduling / routing | 4 | Medium |
| Quick actions (call, navigate, complete, invoice) | 4 | Medium |
| New enquiry alerts | 4 | Medium |
| Recurring job management | 3 | Medium |
| Material / supplier integration | 3 | Medium |
| Team field app (simplified) | 3 | Medium |
| Expense / receipt capture | 3 | Medium |
| GPS / team location | 2 | Lower |
| Marketing / CRM outreach | 1 | Low |
| Stock / inventory management | 1 | Low |

### Feature Matrix

#### Must-Have for UK Trades

| Feature | Rationale |
|---------|-----------|
| **Mobile-first job schedule with offline sync** | Engineers live on phones, often with poor signal; offline is non-negotiable for site work. Every trade interviewed named this as #1 requirement |
| **On-site invoicing with instant payment** | Collecting payment at point of completion eliminates aged debtors and cashflow gaps; Stripe/card reader integration essential |
| **Trade-specific certificate creation** | Gas Safe, NICEIC/NAPIT electrical certs, building safety forms — must be compliant, accepted by registration bodies, and linked to the job record. Currently the biggest data re-entry time sink |
| **Quoting / estimating (simple to complex)** | Must handle both "Fix tap — £120" and a 50-line building estimate with staged payments. Templating, price books, and professional PDF output |
| **Cash position dashboard** | Money owed, invoices overdue, payments due this week, cashflow trend — the first thing trades check after their job list |
| **Photo capture linked to job** | Before/after photos, progress shots, issue documentation — must save directly to the job without manual upload |
| **One-tap customer contact and navigation** | Call customer, navigate to address — directly from the job card. Zero extra taps |
| **Accounting integration (Xero/QuickBooks)** | Every trade uses separate accounting software; invoices must sync without re-entry |
| **Appointment and payment reminders** | Auto-reminders to customers (24h before appointment, 7/14 day payment chase) — proven to reduce no-shows and improve cashflow |
| **Job completion workflow** | Structured form: work done, time spent, materials used, photos, customer signature, invoice — all in one flow |

#### High-Value Differentiators

| Feature | Why It Differentiates |
|---------|----------------------|
| **AI-powered scheduling and route optimisation** | Auto-suggests job assignments based on team location, availability, travel time, and job priority. Currently done manually/mentally — saving 30-45 mins/day per decision-maker |
| **Integrated trade certificates (pre-populated from job)** | Eliminates the #1 admin pain: re-entering customer/property/appliance data into separate cert software. If the cert is part of the job, it pre-populates fields and saves 20-30 mins/day |
| **Real-time project costing** | Budget vs. actual spend, live, per job — alerts when margin is eroding. Currently only discovered weeks after completion. Prevents 5-10% margin loss on projects |
| **Quote-to-job-to-invoice automation** | Accepted quote → auto-creates job → auto-populates invoice on completion. Eliminates 3 manual steps per job |
| **Photo-to-report AI** | AI analyses job photos and auto-populates report fields, completion notes, and certificate data. Engineer reviews and approves. Saves 15-20 mins per job |
| **Smart quote follow-up** | AI analyses customer behaviour (quote viewed? multiple times? engagement pattern?) and suggests when to follow up, improving conversion from typical 35% to potentially 50%+ |
| **Simplified field app for operatives** | A separate, stripped-back mobile interface for team members: today's jobs, address, scope, photo button, time log, issue flag. Nothing else. Designed for adoption, not feature completeness |
| **Supplier pricing integration** | Live material prices from major UK suppliers (Screwfix, Jewson, CEF, Plumbase) auto-populating quotes. Ensures accurate margin on every job |
| **Voice-to-note on-site** | Tap and speak job notes that auto-transcribe and save to the job record. Hands-free, on-site, no typing needed |

#### Features to Minimise or Avoid

| Feature | Why to Avoid |
|---------|--------------|
| **GPS team tracking** | Causes friction and trust issues with field teams; universally disliked by operatives. Offer opt-in "arrived/left" check-in instead |
| **Granular stock / inventory management** | Trades don't track individual washers and cable clips. Material cost tracking should be per-job, not per-item |
| **Marketing / CRM campaigns** | Tradespeople don't do email marketing; this feels like bloatware. Word-of-mouth and reviews drive trade work |
| **Complex reporting dashboards** | Most trades look at 3-4 numbers: money in, money owed, jobs this week, quote win rate. Deep analytics are for the accountant |
| **Social media integration** | Trades who market on Instagram do it from Instagram, not from their job app. Built-in social tools go unused |
| **Desktop-first design** | Engineers and trades spend 80%+ on mobile. A desktop-first interface that's "also available on mobile" will fail in the field |
| **Feature-heavy onboarding** | Trades will abandon a tool that takes more than 15 minutes to set up. Show value from job one, add complexity gradually |
| **Generic customer portal** | Most residential customers don't want to log into a portal. They want a text, an invoice link, and a phone call |
| **Rigid scheduling blocks** | Jobs don't fit neat 1-hour slots. The schedule must handle "half-day", "full day", "2 days", and "ongoing" job durations |
| **Gamification ("Achievement unlocked!")** | Tradespeople find this patronising. They want tools that respect their time, not reward them like children for using the app |

---

### Key Themes for Britestate Service Provider Dashboard Design

1. **Certificates are the critical gap.** No general trade platform has successfully integrated legally compliant, trade-specific certification. Gas Safe, NICEIC, NAPIT, and OFTEC certificates are the #1 source of data re-entry and evening admin. Building cert creation into the job record — pre-populated with customer, property, and appliance data — is the single highest-impact feature Britestate could deliver. It's also the strongest moat: once a tradesperson's cert workflow is embedded in your platform, they won't leave.

2. **Offline-first or dead on arrival.** Tradespeople work in basements, loft spaces, plant rooms, and rural areas. If the app doesn't function offline and sync when connectivity returns, it will be abandoned in favour of paper and WhatsApp within a week. This isn't a nice-to-have — it's a prerequisite for field adoption.

3. **The invoice is the finish line.** Completing a job, sending an invoice, and collecting payment should be one continuous flow that happens before the tradesperson leaves the customer's property. On-site card payment is the single biggest cashflow improvement for small trade businesses. Make this frictionless and it becomes the reason they stay.

4. **Two apps, one platform.** The business owner/manager needs a schedule board, pipeline, and financial dashboard. The field operative needs: today's jobs, address, scope, photo button, time log. These are fundamentally different interfaces serving different users. Forcing one interface on both drives the adoption failure that every persona described.

5. **WhatsApp is the real competitor.** Every trade interviewed uses WhatsApp as their primary communication and coordination tool. The job app doesn't need to replace WhatsApp — but it needs to capture the critical information that currently only exists in WhatsApp (customer conversations, site photos, contractor messages) into the job record. WhatsApp-to-job-record integration (even if it's manual "forward to system" functionality) would be more valuable than building a separate messaging system.

6. **Quoting scales across trades.** The quoting tool must handle a £120 tap repair (3 lines) and an £80,000 extension (50+ lines with sections, sub-totals, staged payments, and contingencies). Most trade apps fail at one end or the other. A flexible, template-based quoting engine with a professional PDF output is a core differentiator.

7. **Speed beats features.** Tradespeople measure a tool's value in seconds, not features. If completing a job takes 15 taps, they'll use paper. If it takes 3 taps plus a photo, they'll use the app. Every on-site workflow should be designed for minimum interaction — big buttons, auto-populated fields, smart defaults, voice input options. This is the "4-click rule" from Britestate's design principles applied to field conditions.

8. **Money visibility drives retention.** Trades care about cashflow above all else. A dashboard that clearly shows: what you've earned, what you're owed, who's late paying, and what's in the pipeline — updated in real time — becomes the financial command centre for the business. Once the business owner checks this daily, they're locked in.

---

### Mapping to Britestate PRD (Cross-Reference)

| Trade Need | Britestate PRD Feature | PRD Section | Gap? |
|------------|----------------------|-------------|------|
| Job schedule & management | Jobs pipeline (New Leads, Active, Completed), status transitions | §3.4.6 Provider Dashboard | Partially — needs offline-first mobile redesign |
| Quoting | Quote Builder (itemised, materials/labour/tax), AI Quote Assist | §3.4.6 Provider Dashboard | Partially — needs scaling for complex multi-section estimates |
| Invoicing | Invoice Generator (PDF), payment tracking | §3.4.6 Provider Dashboard | Partially — needs on-site card payment integration |
| Payments | Stripe Connect balance, payout history | §3.5.6 Payments | Good foundation — add on-site card reader / tap-to-pay |
| Trade certificates | Not in current PRD | — | **Major gap** — Gas Safe, NICEIC/NAPIT cert creation is the #1 requested feature |
| Photo management | Portfolio/Gallery (before/after photos) | §3.4.6 Provider Dashboard | Needs field-capture during job, not just portfolio display |
| Team scheduling | Not in current PRD (single-provider focused) | — | **Gap** — team/dispatch scheduling needed for multi-person businesses |
| Offline capability | PWA via Serwist (service worker, offline support) | §4.1 Tech Stack | Foundation exists — needs specific offline-first job workflows |
| Customer communication | Messaging system, conversation threads | §3.6 Communication | Good — add SMS/WhatsApp channel logging |
| Accounting integration | Not explicit in current PRD | — | **Gap** — Xero/QuickBooks sync essential for trades |
| Route optimisation | Not in current PRD | — | **Gap** — high-value differentiator for field businesses |
| Automated reminders | Automated reminders for bookings (24h, 1h) | §3.5.4 Booking & Scheduling | Good — extend to invoice payment reminders |
| Supplier pricing | Not in current PRD | — | Desirable — live material pricing for quote accuracy |
| Review management | Star breakdown, public response capability | §3.4.6 Provider Dashboard | Good fit |
| Analytics | Profile views, enquiry rate, conversion funnel, earnings trend | §3.4.6 Provider Dashboard | Adequate for provider marketing; needs adding job-level P&L for trade businesses |
| Verification/Trust | 5-step verification pipeline, badges | §3.4.6 Provider Dashboard | Excellent — key differentiator for trust |

**Critical gaps identified:**
1. **Trade certificate creation** — Not in PRD; highest-impact feature for trades adoption
2. **Team/dispatch scheduling** — PRD assumes single-provider; most trade businesses are 2-8 people
3. **Accounting integration (Xero/QuickBooks)** — Essential for trades; not explicitly addressed
4. **On-site card payment** — Stripe Connect exists but needs field-friendly tap-to-pay / card reader
5. **Offline-first field workflows** — PWA foundation exists but needs trade-specific offline job completion

---

*Document prepared for the Britestate Product Team — March 2026*
