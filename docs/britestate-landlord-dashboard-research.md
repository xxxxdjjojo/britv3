# Britestate Landlord Dashboard & Portal Research
## User Interview Responses — UK Landlords

**Date:** March 2026
**Format:** Simulated qualitative interviews (3 personas)
**Purpose:** Inform the design of Britestate's landlord dashboard, compliance workflows, rent management, and portfolio tools

---

## Persona Profiles

### Persona A — "David"
**Role:** Portfolio landlord, 7 buy-to-let properties across South East England
**Experience:** 14 years as a landlord, started with one flat and grew organically
**Current tools:** Arthur Online (property management), Xero (accounting), WhatsApp (tenant/agent comms), Excel (yield tracking), banking app (rent reconciliation)
**Management style:** Self-managing 5 properties, 2 managed by a local agent
**Tech comfort:** Moderate — uses software but prefers simple interfaces

### Persona B — "Priya"
**Role:** Accidental landlord turned small portfolio owner, 3 properties in Manchester and Leeds
**Experience:** 5 years — inherited one flat, bought two more as investments
**Current tools:** OpenRent (for finding tenants and basic management), Google Sheets (finances), phone notes (maintenance log), email (everything else)
**Management style:** Fully self-managing, does everything herself
**Tech comfort:** High — comfortable with apps and new tools, frustrated by poor UX

### Persona C — "Graham"
**Role:** Semi-retired professional landlord, 12 properties (mix of HMOs and single-lets) across Birmingham and Coventry
**Experience:** 22 years, started before buy-to-let was mainstream
**Current tools:** Landlord Vision (accounting and compliance), custom Excel workbook (the real source of truth), Fixflo (maintenance via his agent for 4 properties), paper files (older certificates), phone and text (tenant comms)
**Management style:** Self-manages 8 properties, agent-managed 4, has one part-time property manager
**Tech comfort:** Low-moderate — relies on systems that work and resists change unless the benefit is obvious

---

## Section 1 — Current Landlord Dashboard Usage

### 1.1 "Describe your main landlord dashboard or home screen."

**David (Arthur Online):**
When I log into Arthur, I see a summary bar at the top — total properties, current occupancy percentage, total rent expected this month, and total arrears. Below that there's a list of recent activity (messages, maintenance requests, payment confirmations). There's a sidebar with navigation to properties, tenancies, maintenance, finances, compliance, and contacts. The home screen also shows upcoming tasks — things like "review tenancy for Flat 3" or "chase gas certificate for 22 Lime Road" — but the task list is always long and not well prioritised. It's functional but not inspiring. I get the information I need, but I have to hunt for it.

**Priya (OpenRent):**
OpenRent's dashboard is quite basic. It shows my three properties as cards with the tenant name, rent amount, and tenancy status (active/ending soon). There's a messages section showing unread messages from tenants. That's really it. There's no compliance tracking, no financial summary, no rent payment status. OpenRent is brilliant for finding tenants and creating tenancy agreements, but once the tenant is in, the dashboard doesn't really help me manage. I end up doing most of my actual landlord work in Google Sheets and my banking app.

**Graham (Landlord Vision):**
Landlord Vision's main screen is a financial summary — income received this month, expenses, net profit, and a comparison to the same month last year. There's a property list down the left side, and when I click one I get the tenancy details, rent schedule, and documents. The compliance section shows certificate expiry dates, which is useful, but it's buried two clicks deep. For 12 properties, the dashboard feels cramped — it was designed for someone with 2 or 3 properties, not a dozen. I spend more time in my Excel workbook than in Landlord Vision because my spreadsheet gives me the complete picture — yield per property, cumulative cashflow, mortgage balances, equity positions — none of which Landlord Vision shows properly.

### 1.2 "Which parts do you look at or click into most often?"

**David:**
Rent status — who has paid and who hasn't. That's the first thing I check every month, usually around the 3rd or 4th. After that, maintenance requests — I get a notification if a tenant has logged something, and I need to triage it quickly. Then compliance — I have a recurring calendar event on the 1st of each month to check certificate expiry dates. Everything else I look at less frequently.

**Priya:**
Messages from tenants. That's almost the only reason I log in. If a tenant messages me about a dripping tap or a broken lock, I need to respond quickly. Beyond that, I check my rent in my banking app, not in OpenRent, because OpenRent doesn't actually track whether rent has arrived — it just shows what's owed. I also check my Google Sheet once a week for cashflow.

**Graham:**
The financial reports. I'm running a business, and I need to know my numbers. Income, expenses, net operating income, and tax position — those are what I check weekly. I also check compliance every fortnight because with 12 properties, there's always something expiring or needing renewal. Maintenance I check daily because my tenants know to report issues through the system, and I've trained them to expect a response within 24 hours.

### 1.3 "Portfolio overview vs. per-property view — which do you use more?"

**David:**
Portfolio overview for the quick check — "is everything okay across the board?" If I see a red flag (late rent, overdue certificate), I drill into the per-property view. Probably 70% portfolio view, 30% per-property. But the portfolio view in Arthur isn't detailed enough — it shows headline numbers but not the granularity I need. I want to see rent status, compliance status, and maintenance status for every property at a glance without clicking into each one.

**Priya:**
Per-property, because I only have three. The portfolio view isn't very useful when you can see everything by scrolling. But I can imagine that if I had 8 or 10 properties, I'd want a dashboard that summarised everything. Right now, I just mentally hold the state of three properties in my head.

**Graham:**
Portfolio view, absolutely. With 12 properties I can't afford to check each one individually every day. I need a single screen that shows me: which properties have rent in, which are in arrears, which have compliance issues, which have open maintenance, and which tenancies are ending soon. That's my "traffic control" view. I then drill into per-property only when something needs action. My Excel workbook does this better than Landlord Vision, which is embarrassing for a paid software product.

### 1.4 "What do you check repeatedly during the month?"

**David:**
Rent payments — I check on the 1st, 3rd, 5th, and 10th of each month, because my tenants pay on different dates and I'm matching bank credits to expected rents. It's tedious. I also check maintenance request status 2–3 times a week, because if a contractor hasn't responded, I need to chase them. And once a month I review my cashflow to make sure outgoings (mortgages, insurance, service charges) haven't left me short.

**Priya:**
My bank account — is the rent in? That's multiple times on rent day. Then WhatsApp — has the tenant replied about that repair? Then my Google Sheet — am I on track for the quarter? I probably check three different apps 4–5 times each around rent day. It's exhausting for three properties — I can't imagine doing this with ten.

**Graham:**
Arrears. Every single day I check who owes me money. With 12 properties and average rents of £850/month, I'm expecting about £10,200/month in rent. If even two tenants are late, that's nearly £2,000 missing from my cashflow, which affects my ability to pay mortgages. I also check my compliance calendar weekly — I've been burned before by an expired gas certificate that I missed. The council served me an improvement notice, which was humiliating and costly.

### 1.5 "What's shown that you rarely use or don't trust?"

**David:**
Arthur has a "property valuation" widget that shows an estimated value for each property. I've never found it accurate — it seems to pull Zoopla estimates, which can be wildly off for flats in converted houses. I also don't trust the "yield" calculation because it doesn't account for my actual mortgage costs, service charges, and management fees. It just does gross yield (rent / purchase price), which isn't how any serious landlord thinks.

**Priya:**
OpenRent shows me "how your listing performed" data from when I advertised the property — views, enquiries, applications. That was useful when I was marketing, but once the tenant is in, it's just taking up space. There's also a "recommended services" section that feels like advertising — insurance companies, broadband switching, that sort of thing. I ignore it completely.

**Graham:**
Landlord Vision's "tax summary" — in theory it's great, but it doesn't understand the full complexity of my situation. I have properties in a limited company and some in personal name, each with different tax treatment. The software treats them all the same. My accountant does my tax returns properly; the software's attempt at a tax summary is more misleading than helpful. I also don't trust the "maintenance cost per property" metric because it includes one-off capital expenditure (new boiler, new kitchen) alongside routine repairs, making the numbers look terrifying.

---

## Section 2 — Key Workflows and Time Sinks

### 2.1 "Walk me through a typical month as a landlord."

**David's Monthly Rhythm:**

| Timing | Activity | System(s) Used |
|--------|----------|----------------|
| 1st–3rd | Check rent arrivals against expected schedule | Banking app, Arthur, manual comparison |
| 3rd–5th | Chase any late payers — text first, then call, then formal letter | Phone, WhatsApp, Arthur messaging, Word template |
| Throughout month | Respond to maintenance requests | Arthur notifications, WhatsApp with contractors, phone |
| 1st of month | Check compliance calendar — any certs expiring in next 60 days | Arthur compliance page, my own spreadsheet |
| Mid-month | Review cashflow — income vs. mortgage payments, insurance, service charges | Xero + Excel |
| End of month | Record expenses, file receipts, reconcile accounts | Xero, bank statements, receipt photos |
| Quarterly | Review yields, consider rent adjustments, plan any works | Excel yield tracker, Rightmove for local comps |
| Annually | Tenancy renewals, rent reviews, insurance renewals, tax prep | Arthur, Xero, accountant |

**Priya's Monthly Rhythm:**

My "system" is much less structured. Rent day is the 1st. I check my bank on the 1st and 2nd. If rent is missing, I WhatsApp the tenant. Maintenance happens ad hoc — a tenant messages me, I find a contractor (usually by asking friends or checking Checkatrade), arrange a time, and sort it out. Compliance... I have calendar reminders for gas and electrical certificates but honestly I've nearly missed one before. I do a quarterly "finances check" in Google Sheets where I total up rent received, subtract mortgage payments and expenses, and see where I stand. It takes about 2 hours and it shouldn't.

**Graham's Monthly Rhythm:**

| Timing | Activity | System(s) Used |
|--------|----------|----------------|
| Daily | Check arrears report, review maintenance queue | Landlord Vision, Fixflo, Excel |
| 1st | Run rent schedule — compare expected vs. received | Landlord Vision + bank statements (manual matching) |
| 3rd | Issue arrears letters (first reminder) | Word templates, email |
| 7th | Escalated arrears chase — phone calls, formal letters | Phone, Word, Royal Mail (recorded delivery for s.8/s.21) |
| Weekly | Compliance review — upcoming expiries | Landlord Vision compliance, my master Excel |
| Fortnightly | Contractor management — chase outstanding repairs, approve invoices | Fixflo (for agent-managed), phone/WhatsApp (for self-managed) |
| Monthly | Full financial reconciliation — income, expenses, profit, cashflow by property | Landlord Vision + Excel + Xero |
| Quarterly | Portfolio review — yields, voids, rent vs. market, capital position | Excel (my master workbook) |
| Annually | Tax returns, insurance renewals, mortgage reviews, Section 13 notices | Accountant, Excel, comparison sites |

### 2.2 "For each workflow, which screens are essential?"

| Workflow | Essential Views | Current Pain |
|----------|-----------------|--------------|
| **New tenancy & referencing** | Tenant application form, referencing status, tenancy agreement builder, deposit registration | No single system does it all — OpenRent for finding tenants, separate referencing provider, manual deposit registration, Word template for AST |
| **Rent collection & arrears** | Rent schedule (expected vs. received), payment history per tenant, arrears dashboard, letter templates | Bank reconciliation is manual and time-consuming — matching bank credits to expected rents is the #1 admin burden |
| **Maintenance & repairs** | Request log, priority triage, contractor database, job status tracker, cost tracker, landlord approvals | Fragmented across systems (Fixflo, WhatsApp, phone). No single place shows: what's reported, who's assigned, what's the status, what did it cost |
| **Compliance** | Certificate tracker (gas, EICR, EPC, legionella, smoke/CO alarms, deposit, right-to-rent, HMO licence), expiry calendar, document storage | Critical but poorly integrated — most systems show expiry dates but don't help you book the work, store the certificate, or confirm the new expiry |
| **Renewals & rent reviews** | Tenancy end dates, current rent vs. market rent, Section 13 notice builder, renewal agreement generator | Manual process — checking Rightmove for comparables, calculating a reasonable increase, drafting a letter, negotiating with tenant, creating new agreement |

### 2.3 "Where do you lose time?"

**David:**
Bank reconciliation, without a doubt. Every month I spend 45 minutes to an hour matching bank credits to expected rents. Tenants pay from different accounts, sometimes in different amounts (partial payments, or they round up/down), and the references are inconsistent. One tenant pays as "J SMITH RENT," another as "FLAT 3 MARCH." I'm manually matching these to my rent schedule and it's mind-numbing. If the software could connect to my bank and auto-match, that alone would save me 12 hours a year.

**Priya:**
Finding and coordinating contractors. Every time something breaks, I'm starting from scratch — Googling plumbers, checking reviews, getting quotes, arranging access with the tenant, following up. I don't have a "black book" of trusted contractors, and even if I did, I have no system to manage the job from report to completion. I also lose time on compliance because I don't have a clear checklist of what I need and when — I'm piecing it together from Google searches and landlord forums.

**Graham:**
Duplicating data between systems. When I record a rent payment in Landlord Vision, I also record it in my Excel workbook and reconcile it against my bank statement. That's three entries for one transaction. When a gas certificate is renewed, I update Landlord Vision, update my compliance spreadsheet, scan the certificate, save it to Dropbox, and email a copy to my agent. Five steps for one document. The lack of a single source of truth means I'm always double-checking, which erodes any time the software is supposed to save.

### 2.4 "What do you track outside the portal, and why?"

**David:**
Excel: yield calculations per property (gross, net, after-tax), mortgage amortisation schedules, portfolio-level cashflow, capital growth estimates. Arthur doesn't do any of these properly. Banking app: real-time rent confirmation. WhatsApp: contractor coordination (plumbers, electricians, handymen). Xero: all accounting, VAT returns (for commercial elements), tax reporting.

*Why doesn't Arthur replace it?* "Arthur is a property management tool, not a property investment tool. It manages tenancies but doesn't help me understand my portfolio as a business. The financial reporting is too shallow."

**Priya:**
Google Sheets: everything financial — rent tracker, expense log, cashflow, yield per property. Phone notes: maintenance requests and what was agreed. Calendar: compliance reminders. WhatsApp: all communication with tenants and contractors. Email: formal correspondence, insurance documents, mortgage statements.

*Why doesn't OpenRent replace it?* "OpenRent is really a tenant-finding platform. Once the tenancy starts, it barely helps. There's no rent tracking, no compliance management, no financial reporting. I've outgrown it but I haven't found anything better that isn't either too expensive or too complicated."

**Graham:**
Excel (master workbook): this is my bible — 12 tabs, one per property, plus summary sheets for portfolio yield, cashflow, compliance status, mortgage balances, insurance renewals, and tax positions. It took me 3 years to build and I trust it more than any software.

*Why doesn't Landlord Vision replace it?* "It's close on the financial tracking, but it doesn't handle the investment analysis I need. It can't tell me my equity position, my loan-to-value ratios, my return on equity, or my cash-on-cash return. Those are the numbers that tell me whether to hold, sell, or refinance a property. No landlord software I've found thinks like an investor."

---

## Section 3 — What Makes a Landlord Tool Powerful (UK Context)

### 3.1 "What separates a basic portal from a genuinely powerful one?"

**Central property and tenant database:**

**David:** A powerful tool has a complete record for every property — purchase price, current value, mortgage details, insurance, EPC rating, council tax band, service charges, ground rent, tenant history going back years, every document ever uploaded, every conversation, every maintenance job. And it links properties to tenants to contractors to agents to financial records. The basic tools just show "Property X, Tenant Y, Rent £Z" and that's it.

**Priya:** For me, "powerful" means I can get any answer about any property in under 10 seconds. When did I last replace the boiler at Flat 2? What's my total spend on repairs at the Leeds house this year? When does the EPC expire on the Manchester flat? If I have to dig through emails or folders to find that, the tool has failed.

**Graham:** The database needs to be intelligent, not just a filing cabinet. It should know that Property A is an HMO in Birmingham and therefore subject to mandatory licensing, additional fire safety requirements, and specific room size regulations. It should know that Property B is in a selective licensing area. It should know that Property C's lease has 78 years remaining, which will affect its value and mortgageability. Context-aware data, not just flat records.

**Rent collection and tracking:**

**David:** This is the killer feature most tools get wrong. I don't just want to see "rent expected: £950." I want to see: rent due date, whether it's arrived, from which bank account, whether the amount matches, the running balance if there's a shortfall, and a one-click way to send a reminder if it's late. Ideally with open banking integration so it auto-matches payments. No landlord tool I've used does this well.

**Priya:** Built-in rent collection would be transformative. Right now I tell tenants "set up a standing order to my account." Half the time the reference is wrong, the amount drifts, or they switch banks and forget to update the standing order. If the platform offered a Stripe-style payment link where tenants pay directly and I see it instantly, I'd switch tomorrow.

**Graham:** For a larger portfolio, I need a rent roll — a single view showing every property, expected rent, received rent, arrears, and trend (is this tenant getting worse or better?). I also need automated rent demand generation — a formal document sent to the tenant each month confirming what's owed, what's been paid, and the balance. This matters for legal proceedings if arrears escalate.

**Compliance management:**

**David:** The UK compliance burden is enormous and growing. Gas safety, EICR, EPC, smoke alarms, CO alarms, legionella risk assessment, deposit protection, right-to-rent checks, selective licensing, HMO licensing, the incoming Renters' Reform Bill requirements, Awaab's Law for damp and mould response times... A powerful tool tracks all of these per property, alerts me well in advance, stores the certificates, and ideally helps me book the work with a vetted contractor. Most tools just show expiry dates and hope for the best.

**Priya:** I need the system to tell me what I need. I'm not an expert in property law — I'm an accidental landlord who wants to do the right thing. The system should say: "For your 3-bed HMO in Manchester, you need: HMO licence (expires X), gas safety certificate (expires Y), EICR (expires Z), EPC (valid), deposit protected (yes, scheme X, certificate stored). You are missing: legionella risk assessment. Action required." That's what I need. Not a generic checklist, but a personalised, location-aware compliance status.

**Graham:** The compliance system needs to be legally accurate and constantly updated. When the Renters' Reform Bill changes the notice periods, the system should update its templates. When selective licensing is introduced in my area, the system should alert me. When the Decent Homes Standard is extended to the PRS, the system should tell me which of my properties might not comply and why. This is where software can genuinely protect me from prosecution.

**Document storage and e-sign:**

**David:** Every property generates dozens of documents — tenancy agreements, inventories, certificates, insurance policies, mortgage offers, guarantor agreements, correspondence. I need these stored against the property, version-controlled, and searchable. E-sign for tenancy agreements and renewals would save me posting documents and chasing signatures. Some of my tenants are overseas professionals who can't easily get to a printer.

**Priya:** I just need somewhere to put everything. Currently, my certificates are in email attachments, my tenancy agreements are PDFs on my desktop, and my inventories are photos on my phone. It's a mess. One place to store everything, organised by property, accessible on my phone, with the ability to share specific documents with my tenant if they need them.

**Graham:** At my scale, document management is a compliance function, not just filing. I need to prove that I served the right notices, provided the right certificates, and complied with every obligation. If it ever goes to court — an eviction, a disrepair claim, a deposit dispute — I need to produce a complete, timestamped document trail. The tool should make that effortless.

**Maintenance management:**

**David:** Maintenance is the most hands-on part of being a landlord and the most fragmented. A powerful system lets the tenant report an issue (with photos), I triage it (emergency, urgent, routine), assign it to a contractor from my approved list, the contractor accepts and schedules, the tenant confirms access, the work is done, the tenant confirms satisfaction, and the invoice is logged against the property. All in one place. Currently, this workflow involves WhatsApp, phone calls, texts, emails, and paper invoices.

**Priya:** I need a simple way for tenants to report issues and for me to manage them without it feeling like a full-time job. Something like: tenant submits request → I see it with photos → I can forward it to a contractor with one tap → contractor gives a quote → I approve or decline → work gets done → I see the cost against that property. Three of those steps should be automated.

**Graham:** For 12 properties, I process 15–20 maintenance requests a month. I need a proper job management system — not just a list of issues, but a pipeline: reported → assessed → quoted → approved → scheduled → in progress → completed → invoiced → paid. With filters by property, priority, contractor, and status. And reports showing: maintenance spend by property, by category, by contractor. That data helps me decide whether a property is worth keeping or selling.

**Reporting and portfolio analytics:**

**David:** This is where every tool falls short. I need: gross yield, net yield (after all costs), cash-on-cash return, portfolio-level cashflow forecast, property-level P&L, arrears trend, void rate, and a tax-year summary for my accountant. If the tool can show me "Property 4 is yielding 3.1% net — below your portfolio average of 4.8% — consider: (a) raising rent, (b) reducing costs, (c) selling," then it's genuinely adding value.

**Priya:** I don't need complex analytics — I need simple, accurate financials. How much have I made this year? What are my biggest expenses? Am I cash-positive each month? What's my yield on each property? Show me that in a clear, honest way without me having to build it in a spreadsheet.

**Graham:** I need investor-grade analytics. Equity positions, LTV ratios, return on equity, cash-on-cash return, capital growth assumptions, refinance modelling, and portfolio diversification by location and property type. No landlord software does this. They all think landlords are just tracking rent and expenses. Those of us with larger portfolios are making investment decisions — hold, sell, refinance, buy — and we need the data to support those decisions.

### 3.2 "How important is built-in online rent collection?"

**David:** Extremely important, but only if it's genuinely integrated. I don't want another payment platform bolted on — I want the system to know that Tenant A's £950 arrived on the 2nd, auto-matched to the expected rent, and the status is "paid." If Tenant B paid £900 instead of £950, flag it as "underpaid by £50" and let me send a polite note with one click.

**Priya:** It would genuinely change my life. Standing orders are unreliable. Tenants forget to update them, change banks, or just stop paying. If they could pay through a link (like paying a bill online) and I could see it instantly, that removes my biggest monthly headache.

**Graham:** Important for smaller landlords, but I'm realistic — some of my tenants are on housing benefit (Universal Credit housing element), which goes directly to them, not me. The system needs to handle: standing orders, bank transfers, direct debits, UC payments, and partial payments. Not all rent arrives in the same way or amount.

### 3.3 "How important is automated compliance guidance?"

**All three — unanimously critical.**

**David:** "This is where I'd pay premium for good software. The compliance landscape changes every year and I can't keep up with every council's licensing scheme, every new regulation, every update to fire safety rules. If the software could say 'Based on your property type and location, here's exactly what you need, here's what you have, and here's what's missing' — I'd consider that essential, not optional."

**Priya:** "I live in fear of getting something wrong. I'm not a professional landlord, I don't have a lettings agent, and I don't have a property lawyer on retainer. If the software could be my compliance safety net — telling me in plain English what I need to do and when — that alone justifies the subscription."

**Graham:** "I've been doing this 22 years and I still get surprised by new rules. The Renters' Reform Bill, Awaab's Law, the extension of Decent Homes to private renting, selective licensing popping up in new areas — it's a minefield. Software that tracks this proactively and alerts me before I'm non-compliant would be worth its weight in gold. But it has to be accurate. Wrong compliance advice is worse than no advice."

### 3.4 "Which integrations matter most?"

**Non-negotiable (all three agreed):**
1. **Open Banking / bank feeds** — automatic rent reconciliation is the single most requested feature
2. **Accounting (Xero/QuickBooks/FreeAgent)** — every landlord needs to do tax returns; seamless data flow to accounting software is essential
3. **Deposit protection schemes (DPS, TDS, mydeposits)** — auto-registration and certificate retrieval
4. **Referencing providers (OpenRent, Goodlord, HomeLet)** — tenant vetting without leaving the platform

**Highly important:**
5. **E-signature (DocuSign, HelloSign)** — for tenancy agreements, renewals, notices
6. **Contractor marketplace** — vetted tradespeople bookable from within the platform
7. **Insurance comparison** — landlord buildings/contents/rent guarantee insurance
8. **Utility switching** — for void periods or when the landlord pays utilities (HMOs)

**Nice to have:**
9. Land Registry data feeds (for property value tracking)
10. Mortgage comparison / refinance tools
11. Council licensing databases
12. Energy supplier APIs (for billing in HMOs)

---

## Section 4 — Ideal Landlord Dashboard: Most Useful Functions

### 4.1 "What do you want to see in the first 5 seconds?"

**David's ideal above-the-fold:**
1. **Portfolio snapshot bar:** 7 properties | 6 occupied | 1 void | Occupancy: 86% | This month's rent expected: £6,200 | Received: £5,250 | Arrears: £950
2. **Rent status grid:** One row per property — tenant name, rent due, status (paid / partial / late / void), days overdue, one-click "send reminder"
3. **Compliance traffic lights:** Green (compliant) / Amber (expiring within 60 days) / Red (expired or missing) — at a glance across all properties
4. **Open maintenance:** 2 open issues (one urgent — boiler failure at Flat 3, one routine — dripping tap at 14 Elm Road)

**Priya's ideal above-the-fold:**
1. **"Is everything okay?" summary:** Three big indicators — Rent (all paid / issues), Compliance (all clear / action needed), Maintenance (nothing open / X requests)
2. **Action items:** "You have 2 things to do: (1) Gas certificate for Leeds house expires in 28 days — book inspection. (2) Tenant at Manchester flat hasn't paid March rent — send reminder."
3. **Monthly cashflow:** Simple bar — income in, expenses out, net position
4. **Property cards:** Three cards, each showing: photo, address, tenant, rent status, next key date

**Graham's ideal above-the-fold:**
1. **Financial dashboard:** Total portfolio value, monthly income, monthly expenses, net operating income, cashflow position, arrears total, void cost this month
2. **Arrears table:** Every tenant, sorted by days overdue, with total outstanding, payment history trend (improving/worsening), and quick-action buttons (reminder, formal notice, escalate)
3. **Compliance matrix:** 12 properties × 8 compliance items = a grid showing green/amber/red at a glance. One expired item should scream at me.
4. **Key dates ticker:** Next 30 days — tenancy endings, break clauses, rent reviews, certificate renewals, insurance renewals — in chronological order

### 4.2 "What alerts should surface vs. be hidden?"

**Should appear immediately (push notification + dashboard alert):**
- Rent not received 3+ days after due date
- Compliance certificate expired or expiring within 14 days
- Emergency maintenance request (boiler failure, leak, no heating in winter)
- Tenancy ending within 60 days with no renewal agreed
- Deposit protection deadline approaching (30-day window)
- Legal notice deadline (e.g., Section 21 validity window)
- Housing Benefit / UC payment stopped or reduced

**Should appear on dashboard (but not push):**
- Rent received confirmation
- Maintenance job status change (quoted, scheduled, completed)
- Non-urgent compliance warning (60+ days to expiry)
- Insurance renewal reminder (30+ days)
- Market rent data suggesting a review opportunity
- Tenant communication received (non-urgent)

**Should be hidden (log only, accessible if needed):**
- System updates and sync confirmations
- Portal listing performance stats (after tenancy starts)
- Marketing suggestions and upsell prompts
- Minor account activity (login from new device, etc.)
- Generic market reports or news articles

### 4.3 "What one-click actions would you want from the dashboard?"

| One-Click Action | Description |
|-----------------|-------------|
| Send rent reminder | Pre-written polite message, customisable, sent via email/SMS/in-app |
| Send formal arrears letter | Legally correct letter, auto-populated with tenant details and arrears amount |
| Book gas/electrical inspection | Route to preferred contractor or marketplace with property details pre-filled |
| Approve maintenance quote | Contractor submitted £180 for tap repair → one click to approve |
| Generate landlord statement | PDF/CSV of income and expenses for a property or portfolio, date-range selectable |
| Download tax pack | All income, expenses, and capital allowances for the tax year, formatted for accountant |
| Renew tenancy | Pre-filled renewal agreement with proposed new rent, ready for e-signature |
| Serve Section 13 notice | Rent increase notice, auto-calculated minimum notice period, formatted correctly |
| Log an expense | Quick entry: property, category (repair/insurance/mortgage interest/etc.), amount, receipt photo |
| Share document with tenant | Send a specific certificate or agreement to the tenant via the platform |

### 4.4 "How would you like performance summarised?"

**David:**
"Show me four numbers per property: gross yield, net yield (after all costs including mortgage interest), monthly cashflow, and annual return on equity. Then at portfolio level: total NAV, total monthly cashflow, average yield, and total arrears as % of rent roll. A simple line chart showing monthly cashflow over the last 12 months would be incredibly useful — it shows seasonality and trends."

**Priya:**
"Keep it simple. Total rent received this year, total expenses this year, net profit. Per property: is it making money or losing money? Show me a green number (profit) or a red number (loss). I don't need complex investment metrics — I need to know: am I better off than if I'd put this money in a savings account?"

**Graham:**
"I want investor-level reporting. Per property: gross yield, net yield, ROI, return on equity, cash-on-cash return, capital appreciation (linked to AVM or manual input), total return. At portfolio level: weighted average yield, total equity, LTV ratio, debt service coverage ratio, and diversification breakdown (by area, property type, tenant type). Quarterly, I want a one-page portfolio report I can share with my accountant and mortgage broker."

### 4.5 "If the dashboard could highlight 3 'do these now' items, what would they be?"

**David:**
1. "Tenant at 22 Lime Road is 5 days late on rent (£950). Payment history shows he's been late 3 of the last 6 months. Suggested action: send reminder now, schedule follow-up call for Friday."
2. "EICR at Flat 3 expires in 21 days. Your preferred electrician (Sparks Ltd) has availability on the 14th and 16th. One-click to book and notify tenant."
3. "The tenancy at 8 Birch Close ends on 15th May. Market rent for similar properties is £1,100 (your current rent: £950). Suggested: propose renewal at £1,050 — send Section 13 notice by 15th March."

**Priya:**
1. "You haven't registered the deposit for your new tenant at the Leeds property. You have 12 days left to comply. One-click to register with mydeposits."
2. "Your gas certificate at the Manchester flat expires next month. Here are 3 Gas Safe engineers near M4 with availability next week. Book now."
3. "All rent is received for March. Your total cashflow this month is +£420. Nice work."

**Graham:**
1. "Portfolio arrears alert: 3 tenants overdue, total £2,180. Highest risk: Tenant D (£780, 14 days overdue, worsening trend). Recommended: escalate to formal letter. Draft attached."
2. "HMO licence for 44 Station Road expires on 1st June. Renewal applications take 8–12 weeks in Birmingham. Submit now to avoid operating without a licence."
3. "Property 7 (26 Queens Road) has yielded 2.4% net over the last 12 months — lowest in your portfolio. Major expenses: £3,200 boiler replacement, £890 roof repair. Consider: refinancing (current LTV: 52%, equity: £148k) to improve cashflow, or marketing for sale."

---

## Section 5 — Pain Points with Current Landlord Portals

### 5.1 "What is most frustrating?"

**David:**
"The total disconnect between the management software and reality. Arthur tells me rent is 'expected' but it has no idea whether it's actually arrived in my bank account. I'm the one doing the detective work — logging into my bank, scanning transactions, manually matching them to tenants. That single gap — no bank integration — undermines the entire system's usefulness. It's like having a map that doesn't show where you actually are."

**Priya:**
"The assumption that I know what I'm doing. Every tool I've tried assumes I'm already an expert landlord who knows what an EICR is, when a Section 21 is valid, what 'prescribed information' means for deposits, and how to calculate a fair rent increase. I'm not. I need a tool that educates me as it goes — not in a patronising way, but just: 'Here's what this means. Here's what you need to do. Here's the deadline.' Plain English compliance is my #1 unmet need."

**Graham:**
"Scale blindness. Every landlord tool I've used was designed for someone with 1–3 properties. At 12 properties, the interfaces break down — too much scrolling, too many clicks, no batch operations. I can't send rent reminders to 4 tenants at once, I can't update compliance records in bulk, I can't generate a portfolio-level report without exporting to Excel first. The tools don't grow with the landlord."

### 5.2 "Where does the system duplicate effort?"

**David:** I record rent payments in Arthur (manually), in Xero (for accounting), and verify them against my bank (for accuracy). Three systems, one payment. Similarly, when a certificate is renewed, I update the expiry date in Arthur, upload the PDF, email it to my agent (for the managed properties), and save a copy in Dropbox as a backup. If any system were the single source of truth, I could eliminate 60% of my admin.

**Priya:** I'm essentially running a parallel system in Google Sheets because OpenRent doesn't track ongoing financials. Every rent payment, every expense, every contractor invoice — I enter it twice: once in reality (bank app, receipt) and once in my spreadsheet. The dashboard should be the spreadsheet, not a separate thing I have to maintain alongside one.

**Graham:** My Excel workbook exists because no software does what it does. But maintaining it alongside Landlord Vision means I'm entering data twice. I've thought about abandoning one, but I don't trust the software enough to go all-in, and I can't abandon my spreadsheet because it has 22 years of historical data and custom analyses that no off-the-shelf tool replicates.

### 5.3 "Have you tried other tools? What made you abandon them?"

**David:** I tried Landlord Studio — nice mobile app, good for logging expenses, but no compliance tracking and no tenant management. I tried Hammock — great for rent collection, but too basic for portfolio management. I tried Property Hawk — comprehensive but the interface felt like it was built in 2008. I've tried at least 5 tools in the last 3 years and settled on Arthur not because it's great, but because it's the least bad.

**Priya:** I've tried Landlord Studio, Arthur (trial), and Rentman. Landlord Studio was too focused on accounting and didn't help with tenant management. Arthur was overwhelming — clearly designed for agents, not individual landlords. Rentman didn't exist long enough for me to trust it. OpenRent persists because it's simple and I already use it for tenant-finding, so it's one less login.

**Graham:** I've tried most of them over the years. The pattern is always the same: impressive demo, reasonable first month, then I hit a wall where it can't do something I need — portfolio-level yield analysis, HMO-specific compliance, batch operations, complex reporting — and I end up supplementing it with Excel anyway. At that point, what's the software even for?

### 5.4 "If you could remove 50% of your dashboard to make the rest better?"

**David would remove:** Property valuation estimates (inaccurate), marketing/listing performance (irrelevant after tenant is in), tenant-finding tools (use them once per tenancy), news articles, "recommended services" ads, generic market reports.
**Keep:** Rent status, compliance tracker, maintenance pipeline, financial reports, document storage, tenant communication.

**Priya would remove:** Old listing performance data, referral/affiliate links, insurance upsells, complex analytics I don't understand, settings pages that clutter the navigation, any feature designed for agents rather than landlords.
**Keep:** Rent tracker, compliance checklist, maintenance log, simple financial summary, document storage, tenant messaging.

**Graham would remove:** Marketing tools, social features, property search, generic news, basic tutorials, simplified reports (give me the full data or nothing), any feature that assumes I have 1–3 properties.
**Keep:** Arrears dashboard, compliance matrix, maintenance pipeline, detailed financial reporting, document management, batch operations, portfolio analytics.

---

## Section 6 — Next-Gen / 10x Features for UK Landlords

### 6.1 "What feels 'sci-fi' but would genuinely transform your experience?"

**David:**
"Automatic bank reconciliation with AI matching. The system connects to my bank, sees a credit of £952.00 from 'J SMITH' on the 3rd, and auto-matches it to John Smith's rent at Flat 3 (expected: £950, paid: £952, overpayment: £2). No manual matching, no spreadsheets, no 45-minute reconciliation sessions. Just a clean dashboard showing: all rent received, here are the two that are short, here's the one that hasn't arrived. If that existed and worked reliably, I would pay £50/month for it without blinking."

**Priya:**
"A compliance AI that knows everything about my properties and tells me exactly what I need to do, in plain English, with deadlines. Not just 'your gas cert expires in 30 days' but: 'Your gas safety certificate at 14 Oak Street, Manchester, expires on 22nd April. Under the Gas Safety (Installation and Use) Regulations 1998, you must have this renewed before expiry or you commit a criminal offence. Here are 3 Gas Safe registered engineers near M4 with availability before 22nd April. The average cost for a 2-bed flat is £65–£85. Book now.' That level of hand-holding would make me feel safe as a landlord."

**Graham:**
"Predictive portfolio management. The system analyses my 12 properties and tells me: 'Property 7 has had 4 boiler callouts in 2 years, the boiler is 14 years old, and the average lifespan is 12–15 years. Estimated replacement cost: £2,800–£3,500. Recommendation: budget for replacement this year and consider whether this changes the property's net yield below your threshold.' Or: 'Property 3's tenant has been late 5 of the last 8 months, each time by 7–10 days. Risk of escalation: moderate. Recommended: offer a rent payment plan or consider whether to renew.' AI that thinks like an experienced property investor and gives me proactive, data-backed recommendations — not just reports on what already happened."

### 6.2 "If your current tool vanished, what 3 features are non-negotiable?"

**David:**
1. Rent tracking with automated bank reconciliation
2. UK compliance management with certificate storage and expiry alerts
3. Property-level financial reporting (income, expenses, yield, cashflow)

**Priya:**
1. Simple, accurate rent tracker that tells me who has paid and who hasn't
2. Plain-English compliance checklist, personalised to my properties and locations
3. Maintenance request system that works from my phone

**Graham:**
1. Portfolio-level arrears management with automated chase workflows
2. Comprehensive compliance tracking with document storage and proactive alerts
3. Investor-grade financial analytics (yield, ROI, return on equity, cashflow forecasting)

### 6.3 "What would make you say: 'This dashboard has genuinely reduced my risk, admin, and stress'?"

**David:**
"If I could log in on the 1st of the month and within 60 seconds see: all rent is in (or exactly what's missing), all compliance is green (or exactly what needs attention), no maintenance emergencies, and my portfolio is cash-positive. Then close the laptop and get on with my day. Right now, getting to that level of confidence takes 2–3 hours of checking multiple systems. If one tool gave me that assurance — and I trusted the data — it would genuinely reduce my stress. Landlording shouldn't feel like a second full-time job."

**Priya:**
"If I stopped worrying about missing something. The fear of non-compliance keeps me up at night — what if I've missed a regulation? What if a certificate has lapsed and I don't know? What if I serve a notice incorrectly and it's invalid? If the system was my safety net — catching everything I might miss, reminding me before deadlines, and giving me confidence that I'm doing things right — that would change how I feel about being a landlord. Right now, it's stressful. It shouldn't be."

**Graham:**
"If it replaced my Excel workbook. That's the acid test. My spreadsheet exists because no software has ever been comprehensive, accurate, and flexible enough to replace it. If a tool could match my spreadsheet's analytical depth while adding automation, compliance tracking, bank integration, and a proper maintenance system on top — I'd retire the spreadsheet the same day. That tool would save me 10+ hours a month and genuinely make me a better investor by surfacing insights I currently have to calculate manually."

---

## Synthesis & Feature Matrix

### Frequency of Mentions (Across All 3 Personas)

| Dashboard Element | Mentions | Priority |
|-------------------|----------|----------|
| Rent status / payment tracking | 14 | Critical |
| Compliance tracker (RAG status, per property) | 12 | Critical |
| Bank reconciliation / auto-matching | 10 | Critical |
| Arrears management & automated chase | 9 | Critical |
| Maintenance request pipeline | 8 | Critical |
| Financial reporting (income, expenses, yield) | 8 | Critical |
| Document storage (certificates, ASTs, inventories) | 7 | High |
| Tenancy key dates (endings, renewals, break clauses) | 7 | High |
| Portfolio overview (occupancy, cashflow, voids) | 6 | High |
| AI compliance guidance (plain English, location-aware) | 6 | High |
| One-click actions (send reminder, approve quote, etc.) | 6 | High |
| Contractor coordination / marketplace | 5 | High |
| Yield / ROI / investment analytics | 5 | High |
| Cashflow forecasting | 4 | Medium |
| Tax pack / accountant export | 4 | Medium |
| E-signature for agreements and notices | 4 | Medium |
| Rent review with market comparison | 3 | Medium |
| Predictive insights (arrears risk, void risk) | 3 | Medium |
| Deposit protection integration | 3 | Medium |
| Capital appreciation / equity tracking | 2 | Lower |
| Marketing / listing tools | 1 | Low |

### Feature Matrix

#### Must-Have for UK Landlords

| Feature | Rationale |
|---------|-----------|
| **Rent tracker with bank reconciliation** | Universally the #1 requested feature; current manual matching is the single biggest time sink |
| **Compliance management (RAG per property)** | Legal obligation; non-compliance = prosecution, fines, invalid notices; must be UK-specific and location-aware |
| **Arrears dashboard with automated reminders** | Core to cashflow management; needs to handle partial payments, UC, varying due dates |
| **Maintenance request pipeline** | Currently the most fragmented workflow; needs tenant submission, triage, contractor assignment, status tracking, cost logging |
| **Financial reporting per property and portfolio** | Every landlord tracks this; current tools either don't do it or do it too shallowly |
| **Document storage with search** | Certificates, agreements, inventories, correspondence — all need to be findable, organised by property, and shareable |
| **Tenancy lifecycle management** | Key dates, renewals, rent reviews, notice periods — with automated reminders and template generation |
| **Mobile-first design** | Landlords manage on the go; maintenance requests, rent checks, and tenant messages all happen on phones |
| **Multi-property portfolio view** | Single screen showing rent/compliance/maintenance/financial status across all properties |
| **Deposit protection integration** | Auto-registration, certificate generation, prescribed information management — deadline-critical |

#### High-Value Differentiators

| Feature | Why It Differentiates |
|---------|----------------------|
| **Open Banking auto-reconciliation** | No UK landlord tool does this well; it eliminates the #1 admin burden and becomes the reason landlords choose the platform |
| **AI compliance assistant (location-aware, plain English)** | Personalised to property type, local authority, and current law; updates automatically when regulations change; provides actionable guidance, not just alerts |
| **Predictive arrears and void risk scoring** | AI analyses payment patterns and flags tenants likely to fall into arrears; recommends early intervention; forecasts void periods based on tenancy end dates and local demand |
| **Investor-grade portfolio analytics** | Net yield, cash-on-cash return, return on equity, LTV ratios, cashflow forecasting, refinance modelling — turns the platform from a management tool into an investment tool |
| **One-click vendor/tax reports** | Auto-generated PDF reports for accountants, mortgage brokers, or HMRC — saves hours of manual preparation |
| **Integrated contractor marketplace** | Vetted tradespeople bookable from within the maintenance workflow; quote comparison; job tracking; invoice auto-logged against property |
| **Automated Section 13 / Section 21 / Section 8 notice builder** | Legally correct notices, auto-populated, with deadline calculation and validity checks — reduces legal risk |
| **Rent review with market data** | Auto-suggest new rent based on comparable local rentals; generate supporting evidence for the tenant conversation |

#### Features to Minimise or Avoid

| Feature | Why to Avoid |
|---------|--------------|
| **Property valuation estimates (unless high accuracy)** | AVM estimates for individual flats in converted houses are notoriously inaccurate; showing wrong numbers erodes trust |
| **Listing/marketing performance after tenancy starts** | Useful during void marketing, irrelevant for 95% of tenancy lifecycle; clutters the dashboard |
| **Generic market news and articles** | Landlords don't log in to read the news; this wastes prime dashboard space |
| **Simplified/dumbed-down analytics** | Shallow metrics (gross yield only, no cost breakdown) are worse than useless — they mislead. Either do it properly or don't do it |
| **Upsell and advertising widgets** | "Recommended insurance" and "switch your broadband" widgets feel like ads and erode trust in the platform |
| **Tax calculations (unless professionally validated)** | Incorrect tax estimates are dangerous — landlords rely on accountants for a reason. Either partner with an accounting integration or clearly disclaim |
| **Social/community features** | Landlord forums and chat rooms are not what landlords want in a management tool; they use separate communities for peer advice |
| **Gamification or achievement badges** | This isn't a game — it's a business. Compliance badges are fine; "You've logged 10 expenses — achievement unlocked!" is not |
| **Complex onboarding wizards** | Long setup processes cause abandonment. Let landlords add one property in under 5 minutes and show value immediately |
| **Agent-centric features in landlord view** | If the tool serves both agents and landlords (like Britestate), the landlord dashboard must feel purpose-built, not a filtered version of the agent view |

---

### Key Themes for Britestate Landlord Dashboard Design

1. **Rent reconciliation is the killer app.** Every landlord interviewed identified manual bank matching as their biggest admin burden. Open Banking integration that auto-matches payments to tenants is the single feature most likely to drive adoption and retention. Build this first and build it well.

2. **Compliance is a fear reducer, not just a feature.** Landlords — especially smaller ones — are genuinely anxious about getting compliance wrong. A location-aware, plain-English compliance system that tells them exactly what they need, when, and helps them act on it is a massive differentiator. This is where Britestate can build deep trust.

3. **The spreadsheet is the competitor.** The real rival isn't another landlord app — it's Excel. Landlords have built their own systems over years and trust them completely. To replace the spreadsheet, the platform must match its analytical depth while adding automation, integration, and compliance intelligence that a spreadsheet can't provide.

4. **Scale matters.** Tools designed for 1–3 properties break at 10+. Portfolio views, batch operations, and aggregate analytics are essential for growing landlords. Design for the landlord with 12 properties and the one with 2 will be happy too — but not vice versa.

5. **Maintenance is the most fragmented workflow.** Currently spread across 3–5 systems (portal, WhatsApp, phone, email, contractor invoices). A single maintenance pipeline — from tenant report to invoice — within the platform eliminates the need for Fixflo, reduces WhatsApp dependency, and creates a complete cost record per property.

6. **Plain English wins.** Landlords aren't lawyers. Legal jargon (Section 13, prescribed information, fit and proper person test) needs to be translated into clear, actionable language. The platform that explains the law as well as it tracks compliance will earn loyalty.

7. **Financial depth, not just financial tracking.** Basic income/expense tracking is table stakes. The opportunity is investor-grade analytics — yield, ROI, return on equity, cashflow forecasting, refinance modelling. This elevates the platform from a management tool to a decision-support tool, which justifies premium pricing and attracts serious portfolio landlords.

8. **Mobile is where landlording happens.** Checking rent, responding to maintenance requests, and reviewing compliance alerts all happen on phones, often between other commitments. The mobile experience must be first-class — fast, focused, and functional — not a stripped-down version of desktop.

---

### Mapping to Britestate PRD (Cross-Reference)

The following Britestate PRD features directly address the needs identified in this research:

| Landlord Need | Britestate PRD Feature | PRD Section |
|---------------|----------------------|-------------|
| Rent tracking & arrears | Rent Collection with automated reminders, per-property history | §3.4.4 Landlord Dashboard |
| Compliance management | Certificate tracker with RAG expiry alerts (30-day, 7-day) | §3.4.4 Landlord Dashboard |
| Financial reporting | Income & expense reports with export, tax summary | §3.4.4 Landlord Dashboard |
| Maintenance pipeline | Request pipeline (new/in-progress/complete), contractor assignment | §3.4.4 Landlord Dashboard |
| Tenancy lifecycle | Tenant screening, AST generation, renewals, deposit management | §3.4.4 Landlord Dashboard |
| Document storage | TUS resumable upload, signed URL previews, status tracking | §3.9.3 Document Repository |
| AI compliance guidance | Claude-powered features, personalised recommendations | §3.7 AI-Powered Features |
| Yield / ROI analytics | Yield calculator, portfolio analytics | §3.4.4 + §3.8 Financial Tools |
| Contractor marketplace | Integrated service provider marketplace | §3.5 Marketplace |
| Legal notices | Section 21 and Section 8 notice builder (PDF) | §3.4.4 Landlord Dashboard |
| Deposit protection | Deposit scheme registration, protection certificates | §3.4.4 Landlord Dashboard |
| Market rent comparison | Market trends, area-level pricing data | §3.2.5 Area Guides |

**Gap identified:** Open Banking auto-reconciliation is not explicitly in the current PRD but was the #1 requested feature by all landlord personas. This represents a significant product opportunity.

---

*Document prepared for the Britestate Product Team — March 2026*
