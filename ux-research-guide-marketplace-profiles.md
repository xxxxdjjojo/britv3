# Brit-Estate UX Research Guide: Marketplace & Service Provider Profiles

**Version:** 1.0
**Date:** 23 March 2026
**Scope:** Public profiles (PRD §13.1–13.14), marketplace discovery & job flows (PRD §14.1–14.11)
**Platform routes:** `/marketplace/*`, `/agents/*`, `/mortgage-brokers/*`, `/conveyancers/*`, `/surveyors/*`, `/services/[category]/[location]`

---

## How to use this document

This guide serves three purposes:

1. **Moderator script** — follow the numbered questions in order during live interviews or focus groups. Probe bullets beneath each question are optional follow-ups; use them when the participant's initial answer is thin.
2. **Self-administered survey** — each numbered question can be converted directly into an open-ended survey item. Probes become hint text or sub-questions.
3. **Internal alignment reference** — the synthesis plan (Section 8) and requirements matrix (Section 9) give your product and design team a shared framework for turning raw insights into actionable specs.

**Recommended session length:** 60–75 minutes (Sections 1–6). If time is short, prioritise Sections 1, 3, and 5 — these cover the highest-impact surfaces.

**Participant profile:** Homebuyers, renters, sellers, landlords, or anyone who has recently searched for or hired a tradesperson, estate agent, broker, conveyancer, or surveyor in the UK.

---

## Warm-up (2–3 minutes)

Before diving in, establish rapport and context:

> "We're working on Brit-Estate, an all-in-one UK property platform that combines property search, a services marketplace, and AI tools. Today I'd like to understand how you evaluate and choose service providers — tradespeople, agents, brokers, and so on — when you're looking at their profiles and browsing listings online. There are no right or wrong answers; we're interested in your honest reactions and habits."

Ask: "Can you briefly describe the last time you looked for a tradesperson or property professional online? What were you looking for, and how did it go?"

---

## Section 1 — Service provider public profiles: what users look at and trust

**Covers:** PRD §13.1–13.5 (tradesperson profiles), §13.6–13.14 (agent, broker, conveyancer, surveyor profiles)
**Goal:** Identify must-have sections and trust signals on public profiles that drive enquiries.

### 1.1 First impressions on a tradesperson profile

**Ask:** "When you land on a tradesperson's public profile — say a plumber, electrician, or builder — what do your eyes go to first, and why?"

**Probe for:**

- Overall star rating, total number of reviews, date of most recent review.
- Verification badges (ID verified, insurance confirmed, qualifications checked) and years in business.
- Services summary and listed specialisms.
- Location / coverage areas and typical responsiveness ("usually replies in X minutes").
- Cover photo or hero image — does it matter? What impression does it give?

### 1.2 Reviews tab — trust and usefulness

**Ask:** "On the Reviews tab, what makes reviews feel trustworthy and useful versus fake or generic?"

**Probe for:**

- Volume and recency — is there a minimum number of reviews before you take the rating seriously?
- Customer-uploaded photos of the completed work.
- "Verified customer" tag — does this change how much you trust the review?
- Provider response to the review — does seeing the provider reply matter?
- Breakdown scores (quality, communication, value for money, timeliness) — do you read these or just look at the overall star rating?
- Negative reviews — do you actively look for them? What's a dealbreaker versus acceptable?

### 1.3 Portfolio / Gallery tab

**Ask:** "On the Portfolio or Gallery tab, what type of photos or media actually help you decide?"

**Probe for:**

- Before/after photos of completed jobs.
- Video walkthroughs of finished work.
- Photos of certificates, awards, or accreditations.
- Context about the job (description, timeline, budget range) alongside the images.
- Volume — how many portfolio items do you need to see before you feel confident?

### 1.4 Services & Pricing tab

**Ask:** "On the Services and Pricing tab, what level of detail is useful without overwhelming you?"

**Probe for:**

- Line-item pricing vs "from" prices — which do you prefer?
- Minimum call-out charge — do you expect to see this?
- Typical job durations or estimated timelines.
- What's included / excluded in each service — how important is this?
- Do you compare pricing across providers, or is pricing secondary to quality/trust?

### 1.5 Request Quote modal

**Ask:** "In the Request Quote modal, what information do you expect to enter, and what reassurance do you need before you click Submit?"

**Probe for:**

- Clear indication of who will see the request (just this provider, or multiple?).
- Expected response time ("providers typically reply within 2 hours").
- How many quotes they'll get (if the platform sends to multiple).
- Data privacy and no-spam reassurance — "we won't share your details with anyone else."
- Fields that feel essential vs fields that feel like too much work.
- Would you prefer to describe the job in free text, use a structured form, or upload photos?

### 1.6 Estate agent profiles — what's different

**Ask:** "For estate agent profiles, what do you look for first that's different from a tradesperson?"

**Probe by tab/section:**

- **Active Listings vs Sold/Let tab:** Which do you look at first? Why?
- **Local area stats:** Average sale price, days on market, number of sales — do these build trust?
- **Fee structure:** Do you expect to see this upfront? Commission percentage, fixed fee, or "contact for details"?
- **Typical time-to-sell or time-to-let:** Does this metric matter to you?
- **Reviews & Team tabs:** Do you care about reviews of specific negotiators, or just the agency overall?
- **Branding and presentation:** Does the quality of an agent's profile affect your perception of them?

### 1.7 Specialist professional profiles (brokers, conveyancers, surveyors)

**Ask:** "For mortgage brokers, conveyancers, and surveyors, what do you look for first on their profile?"

**Probe for each type:**

- **Mortgage broker:** FCA registration number, whole-of-market vs tied, lender panel list, indicative fees (fee-free vs charged), response times.
- **Conveyancer:** Professional registration (CLC/SRA), average completion time, fixed-fee quoting, communication style indicators.
- **Surveyor:** RICS credentials, types of surveys offered (HomeBuyer, Building Survey, Valuation), turnaround times, sample report availability.
- **Across all:** Qualifications and accreditations — do you verify these, or do badges suffice? How much do indicative fees influence your shortlist?

### 1.8 The confidence threshold

**Ask:** "What makes you confident enough to click 'Request Valuation', 'Contact', or 'Get a Quote' on any provider's profile?"

**Probe for:**

- Social proof (reviews, ratings, number of jobs completed).
- Transparent fees — does hiding pricing reduce trust?
- Clear value proposition — "what makes this provider different."
- Comparison context — do you need to have looked at other profiles first?
- Trust marks — Gas Safe, TrustMark, RICS, FCA — which ones do you recognise and trust?

---

## Section 2 — Time spent and behaviour on profiles

**Goal:** Determine high-attention vs low-attention zones and pruning opportunities in profile UX.

### 2.1 Tab order and click sequence

**Ask:** "Think about the last time you chose a tradesperson or agent online. Which tabs or sections did you actually click into, and in what order?"

**Probe:** Did you follow a consistent pattern, or did it depend on the provider type?

### 2.2 Where time is spent

**Ask:** "Where did you spend the most time on the profile: reading reviews, scanning the portfolio, checking pricing, or something else?"

**Probe:** Was the time spent because the content was engaging, or because you were struggling to find what you needed?

### 2.3 What gets skimmed or ignored

**Ask:** "What did you mostly skim over or ignore entirely?"

**Probe for:**

- Long bios or "About me" sections.
- Generic marketing copy ("We pride ourselves on quality…").
- Badges or accreditations they don't understand.
- Overly technical qualifications or jargon.
- Sections that felt like filler rather than substance.

### 2.4 Profile comparison behaviour

**Ask:** "How many profiles do you usually open before shortlisting or contacting a provider?"

**Follow-up:** "What makes you close a profile immediately — what's an instant turn-off?"

**Probe for:**

- No reviews or very few reviews.
- No photos or portfolio.
- Profile looks incomplete or outdated.
- Pricing that seems too high or suspiciously low.
- Poor grammar, low-quality images, generic stock photos.

---

## Section 3 — Marketplace & discovery: search, filters, category pages

**Covers:** PRD §14.1–14.8
**Goal:** Identify list-level card content, filter and sort controls, and information density that drive efficient discovery and comparison.

### 3.1 Above-the-fold expectations

**Ask:** "On a 'Find a Tradesperson' or 'Find an Estate Agent' search page, what do you need to see above the fold to feel in control?"

**Probe for:**

- Simple search box plus location input.
- Clear, visible filters (rating, price band, response time, verification level, distance).
- Map view vs list view — which do you prefer, and when?
- Results count — "showing 47 plumbers near SW7."
- Sort options visible immediately vs hidden in a dropdown.

### 3.2 Narrowing down a long list

**Ask:** "How do you typically narrow down from a long list of providers?"

**Prompt with examples:**

- Sort by rating / number of reviews / distance / price.
- Filter by specialism (e.g., boiler repair vs full bathroom refit; residential sales vs lettings; new build vs period property).
- Filter by verification status or specific accreditations.
- Filter by response time or availability.

### 3.3 Category page card content

**Ask:** "On a category page like 'Plumbers in Isleworth', what information in each provider card is critical to you?"

**Probe for:**

- Provider name and profile photo.
- Overall rating and review count.
- Key specialism or tagline.
- Verification badges.
- Starting price or pricing indicator.
- Response time ("usually replies in 15 mins").
- Coverage area or distance from you.
- A snippet from their most recent review.

### 3.4 What triggers a click-through

**Ask:** "What makes you click into one provider's card versus scrolling past it?"

**Follow-up:** "What about the card layout or visual design helps you compare providers at a glance?"

**Probe for:**

- Photo quality and professionalism.
- High rating with a meaningful number of reviews.
- A specific badge or accreditation that's relevant.
- A price that's within the expected range.
- Something in the review snippet that resonates.

### 3.5 Service directory structure

**Ask:** "For a generic Service Directory showing all categories — tradespeople, agents, brokers, surveyors, and so on — what's the best way to structure and visually group categories so you quickly find what you need?"

**Probe for:**

- Grouped by domain (property sale, property rental, home improvement, legal/financial).
- Alphabetical vs grouped by popularity.
- Icons or images for each category.
- Search-as-you-type within the directory.
- "Most popular near you" section.

---

## Section 4 — Post a Job and Job Board flows

**Covers:** PRD §14.9 (Post a Job), §14.10 (Job Board)
**Goal:** Optimise RFQ creation and job board UX for minimal friction and high perceived lead quality on both sides.

### 4.1 Homeowner perspective — posting a job

**Ask:** "When posting a job request, what information are you comfortable entering, and what feels like too much work?"

**Probe for:**

- Job title and description (free text vs structured dropdowns).
- Uploading photos — helpful or a barrier?
- Budget range — optional or expected?
- Preferred timeframe or urgency level.
- Property address or approximate location — full address or just postcode?

### 4.2 Reassurance before posting

**Ask:** "What reassurances do you need before clicking 'Post Job'?"

**Probe for:**

- Who sees the job (all providers in the area, or only matched ones?).
- How many responses to expect, and how quickly.
- No obligation to accept any quote.
- Data use and privacy — will your phone number be shared?
- Can you edit or remove the job after posting?

### 4.3 The ideal Post a Job form

**Ask:** "What would a perfect 'Post a Job' form look like — either a single page or a short wizard?"

**Prompt with possible fields:**

- Job category (dropdown or search).
- Brief description (free text).
- Photos (optional upload).
- Budget range (optional slider or text).
- Preferred start date or urgency.
- Property postcode or approximate area.
- Contact preference (in-app message, phone, email).

### 4.4 Provider perspective — browsing the Job Board

**Ask:** "If you were a tradesperson browsing a Job Board for leads, what fields do you need in each job card to decide if it's worth clicking?"

**Probe for:**

- Location and distance from the provider.
- Job type and category.
- Estimated value or budget range.
- Timing and urgency.
- Lead quality indicator (verified homeowner, photos attached, detailed description).
- How many providers have already responded — does this affect interest?
- Date posted — do older jobs feel stale?

### 4.5 Job Board filters and sorting

**Ask:** "What filters and sort options would you actually use on a job board?"

**Probe for:**

- Filter by distance/location radius.
- Filter by job category or specialism.
- Filter by budget range.
- Filter by urgency.
- Sort by newest, closest, highest value.
- "New jobs matching your skills" — would push alerts be welcome?

---

## Section 5 — Compare Providers page

**Covers:** PRD §14.11
**Goal:** Define essential comparison columns, layout, and actions that turn shortlists into confident decisions.

### 5.1 Comparison table columns

**Ask:** "Imagine you've shortlisted 3 or 4 providers to compare side by side. What columns matter most to you in that comparison table?"

**Seed ideas and probe:**

- Overall rating and review count.
- Price (typical fees, call-out charge, commission rate).
- Key services and specialisms.
- Verification and insurance status.
- Response time and communication rating.
- Location and coverage area.
- Years in business or jobs completed.
- Any awards or notable accreditations.

### 5.2 Progressive disclosure — what to hide

**Ask:** "What information should be hidden behind a tooltip or 'More info' link instead of always being visible in the table?"

**Probe for:**

- Full bio or "About" text.
- Detailed breakdown of individual review scores.
- Full list of qualifications and accreditations.
- Portfolio thumbnails.
- Payment terms or T&Cs.

### 5.3 Actions from the comparison view

**Ask:** "What one-click actions would you want directly from the Compare Providers page?"

**Probe for:**

- Send the same brief or quote request to all shortlisted providers at once.
- Save or bookmark the shortlist for later.
- Schedule a call with a specific provider.
- Start a chat with one provider.
- Remove a provider from the comparison and swap in another.
- View a provider's full profile without losing the comparison.

### 5.4 AI-assisted recommendations

**Ask:** "Would AI-generated 'summary cards' or 'Best Fit' tags help you decide, or would you rather see raw data only?"

**Probe for:**

- "Best match for your job" — based on specialism, location, rating, price.
- "Price fairness" indicator — is this provider's pricing typical for the area?
- Risk flags — e.g., "Insurance expires next month", "No recent reviews."
- Explainability — do you need to see why the AI made a recommendation?
- Trust in AI suggestions vs desire for full manual control.
- Would you be comfortable if AI ranked providers, or should it only highlight, not rank?

---

## Section 6 — Cross-page UX & UI principles

**Goal:** Extract design patterns and AI-assisted elements that can be reused across all profile and marketplace pages while respecting transparency and user control.

### 6.1 Clutter and overwhelm on other platforms

**Ask:** "Across all these pages — profiles, search results, job posting, comparison — where does information feel overwhelming or cluttered on other platforms you've used?"

**Probe for specific platforms:** Checkatrade, MyBuilder, Rated People, Bark, Rightmove, Zoopla, Trustpilot. What did they get wrong? What did they get right?

### 6.2 Consistent visual language

**Ask:** "What consistent visual elements — like badges, match scores, verification indicators, or AI recommendations — would help you read pages quickly without learning a new layout every time?"

**Probe for:**

- Colour-coded verification levels (e.g., green = fully verified, amber = partial).
- Consistent badge placement across all profile types.
- A universal "trust score" or "match score" that appears on cards and profiles.
- Consistent use of icons for response time, location, price range.

### 6.3 The single biggest improvement

**Ask:** "What is the single biggest thing that would save you time, increase your confidence in providers, or reduce your stress about making the wrong choice?"

Let the participant answer freely, then probe which of the three it addresses: time, confidence, or stress.

### 6.4 AI recommendations vs manual control

**Ask:** "How much do you want AI recommendations — like best-match suggestions, risk flags, or price-fairness indicators — versus doing your own manual comparison and making your own call?"

**Probe for:**

- "AI should suggest, but I decide" vs "AI should filter for me."
- Transparency — do you need to see the reasoning behind AI suggestions?
- Comfort level with AI ranking providers vs simply highlighting relevant information.
- Any concerns about bias, paid placements, or manipulation of rankings.

---

## Section 7 — Wrap-up (3–5 minutes)

**Ask:** "Before we finish, is there anything about finding, evaluating, or hiring service providers online that we haven't covered and that really matters to you?"

**Ask:** "If you could change one thing about how property platforms handle their marketplace or provider profiles, what would it be?"

Thank the participant and explain next steps.

---

## Section 8 — Synthesis plan

After completing research sessions, use the following framework to organise and analyse findings.

### 8.1 Tagging framework

Tag every insight with the following dimensions:

**Page type** (where the insight applies):

| Tag | Description |
|-----|-------------|
| `PROFILE-TRADE` | Tradesperson public profile |
| `PROFILE-AGENT` | Estate agent public profile |
| `PROFILE-BROKER` | Mortgage broker profile |
| `PROFILE-CONVEY` | Conveyancer/solicitor profile |
| `PROFILE-SURVEY` | Surveyor profile |
| `TAB-REVIEWS` | Reviews tab (any profile type) |
| `TAB-PORTFOLIO` | Portfolio / Gallery tab |
| `TAB-SERVICES` | Services & Pricing tab |
| `TAB-LISTINGS` | Active / Sold / Let listings tab |
| `TAB-TEAM` | Team members tab |
| `MODAL-RFQ` | Request Quote / Request Valuation modal |
| `SEARCH-LIST` | Search results / provider list page |
| `SEARCH-MAP` | Map view of search results |
| `CATEGORY` | Category landing page (e.g., "Plumbers in Isleworth") |
| `DIRECTORY` | Service directory / all categories page |
| `POST-JOB` | Post a Job form / wizard |
| `JOB-BOARD` | Job Board (provider view) |
| `COMPARE` | Compare Providers page |
| `CROSS-PAGE` | Applies to multiple or all page types |

**Finding type** (what kind of insight it is):

| Tag | Description |
|-----|-------------|
| `MUST-HAVE` | Content or section that participants consistently expect or demand |
| `UI-PATTERN` | A layout, component, or interaction pattern that resonated |
| `AI-FEATURE` | An AI-assisted capability that participants found valuable |
| `ANTI-PATTERN` | Something to avoid — causes confusion, distrust, or frustration |
| `TRUST-SIGNAL` | A specific element that builds confidence in a provider |
| `FRICTION` | A point where users feel slowed down or frustrated |
| `DELIGHT` | Something that exceeded expectations or created positive emotion |
| `PRIORITY-HIGH` | Mentioned by 70%+ of participants or described with strong language |
| `PRIORITY-MED` | Mentioned by 40–69% of participants |
| `PRIORITY-LOW` | Mentioned by fewer than 40% of participants |

### 8.2 Analysis steps

1. **Transcribe and tag** — Apply page-type and finding-type tags to every discrete insight from each session.
2. **Affinity map** — Group tagged insights by page type. Within each group, cluster by theme (e.g., "trust signals on profiles", "filter expectations on search").
3. **Frequency count** — For each cluster, count how many participants raised it and assign a priority tag.
4. **Cross-reference with PRD** — Map each high-priority cluster to its corresponding PRD section (§13.x or §14.x) and to the relevant build phase plan (Phase 17 plans 17-01 through 17-08).
5. **Identify gaps** — Note any participant expectations not currently covered in the PRD or roadmap.
6. **Generate recommendations** — For each cluster, write a brief recommendation with the format: *"On [PAGE TYPE], users expect [FINDING]. Recommend [ACTION]. Priority: [HIGH/MED/LOW]."*

### 8.3 Deliverables from synthesis

- **Insight summary** — 1–2 page executive summary of top findings across all sections.
- **Tagged insight database** — Spreadsheet or Notion database with all individual insights, tagged and searchable.
- **Requirements matrix** — See Section 9 below.
- **Design implications document** — Specific UI/UX recommendations for each page type, suitable for handoff to designers.

---

## Section 9 — Requirements matrix template

Use this matrix to map research findings into actionable requirements. One row per page/feature. Fill in after synthesis is complete.

### 9.1 Profile pages

| Page | User goal | Key decisions | Data needed on page | UI pattern | Supporting AI / verification | Priority |
|------|-----------|---------------|---------------------|------------|------------------------------|----------|
| Tradesperson profile | Assess trust and competence; decide whether to request a quote | "Is this provider reliable? Can they do my job? Is the price fair?" | Rating, review count, recent reviews, verification badges, services list, portfolio, pricing, response time, coverage area | Hero with badges + tabbed content (Reviews, Portfolio, Services, Quote) | Verified badges, trust score, AI-generated summary of reviews | |
| Estate agent profile | Evaluate track record and fees; decide whether to instruct | "Will this agent sell/let my property quickly and for a good price?" | Active listings, sold/let history, local market stats, fees, team, reviews | Hero with stats bar + tabbed content (Listings, Sold, Reviews, Team) | Local market comparison, time-to-sell benchmarks, fee fairness indicator | |
| Mortgage broker profile | Check qualifications and coverage; get an indicative quote | "Is this broker whole-of-market? Do they cover my lender? What will it cost?" | FCA reg, whole-of-market status, lender panel, fees, reviews, response time | Compact profile with credentials sidebar + contact CTA | FCA verification badge, lender panel match against user's needs | |
| Conveyancer profile | Verify credentials and get a fee quote | "Is this conveyancer properly registered? What's the fixed fee? How long will it take?" | CLC/SRA reg, fixed fee, avg completion time, reviews, communication rating | Similar to broker with emphasis on timeline and fee transparency | Professional registration verification, completion time benchmarks | |
| Surveyor profile | Check RICS credentials and survey types offered | "Does this surveyor do the type of survey I need? How quickly?" | RICS credentials, survey types, turnaround time, sample report, fees, reviews | Compact profile with survey type selector | RICS verification, turnaround time benchmarks | |

### 9.2 Discovery and marketplace pages

| Page | User goal | Key decisions | Data needed on page | UI pattern | Supporting AI / verification | Priority |
|------|-----------|---------------|---------------------|------------|------------------------------|----------|
| Search results / provider list | Find and shortlist relevant providers quickly | "Which providers serve my area, match my needs, and have good reputations?" | Provider cards with: name, photo, rating, review count, specialism, badges, price indicator, response time, distance | Filterable/sortable list with optional map view; sticky filter bar | AI "Best Match" badge, smart default sort | |
| Category page (e.g., "Plumbers in Isleworth") | Browse providers in a specific trade and location | "Who are the best plumbers near me?" | Same as search results, pre-filtered by category and location | SEO-optimised landing page with provider cards + local stats | Localised trust scores, "popular in your area" | |
| Service directory (all categories) | Navigate to the right provider category | "What type of professional do I need?" | Category list with icons, grouped by domain | Grouped grid/list with search-as-you-type | "Suggested for your situation" based on user context | |
| Post a Job | Describe a job and receive quotes from suitable providers | "Will I get good responses? Is my data safe?" | Job form fields: category, description, photos, budget, timeline, postcode | Step-by-step wizard or single-page form with clear reassurance copy | Smart category suggestion from description, no-spam guarantee | |
| Job Board (provider view) | Find relevant leads worth responding to | "Is this job in my area, within my skills, and worth my time?" | Job cards: location, type, budget, timing, lead quality, response count | Filterable feed with push notification opt-in | Lead quality scoring, "good match for your skills" | |
| Compare Providers | Make a final decision between shortlisted providers | "Which provider is the best fit for my specific needs?" | Side-by-side table: rating, price, services, verification, response time, coverage | Comparison table with pinned header + action buttons per provider | "Best Fit" tag with explanation, price fairness indicator, risk flags | |

### 9.3 Blank template for additional pages

| Page | User goal | Key decisions | Data needed on page | UI pattern | Supporting AI / verification | Priority |
|------|-----------|---------------|---------------------|------------|------------------------------|----------|
| | | | | | | |
| | | | | | | |
| | | | | | | |

---

## Appendix A — Session logistics template

| Field | Detail |
|-------|--------|
| **Session format** | 1:1 moderated interview (remote or in-person) |
| **Duration** | 60–75 minutes |
| **Recording** | Audio + screen share (with consent) |
| **Participants per round** | 6–8 (aim for mix of homebuyers, renters, sellers, landlords) |
| **Incentive** | £[amount] gift card or equivalent |
| **Consent** | Signed informed consent form covering recording, data use, anonymisation |
| **Notetaker** | Dedicated notetaker or AI transcription + human review |

## Appendix B — Screener questions

Use these to recruit appropriate participants:

1. Have you searched for or hired a tradesperson, estate agent, mortgage broker, conveyancer, or surveyor in the last 12 months? (Must answer Yes)
2. Which of the following have you used? (Select all that apply: Checkatrade, MyBuilder, Rated People, Bark, Rightmove, Zoopla, Trustpilot, Google reviews, word of mouth, other)
3. Which role best describes you? (Homebuyer, renter, seller, landlord, property investor, other)
4. Are you comfortable sharing your screen and talking through your thought process for about 60 minutes? (Must answer Yes)

## Appendix C — Consent and privacy note for participants

> Your participation is voluntary and you can stop at any time. We will record this session for internal research purposes only. Your responses will be anonymised — your name will not appear in any reports. We will not share your personal details with third parties. If you have questions about how your data is used, please contact [research team email].
