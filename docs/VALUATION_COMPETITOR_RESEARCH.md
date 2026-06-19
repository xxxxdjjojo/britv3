# Valuation Competitor Research — UK automated estimate journeys

> **Date:** 2026-06-18
> **Purpose:** Inform an honest "indicative automated estimate" journey for the
> Britestate "Value my property" feature (see `VALUATION_SCAFFOLDING.md`).
> **Scope:** Publicly documented behaviour only. Researched via public marketing
> pages, help centres, methodology PDFs and third-party reviews. **No private
> endpoints were accessed; no branding, copy, layout or proprietary code was
> copied; no proprietary model weights or algorithms are claimed.** Quotes are
> short excerpts used to record factual product behaviour.
>
> **How to read this doc:** Each finding is bucketed —
> **(A) Confirmed public information**, **(B) Reasonable product inference**,
> **(C) Unknown / proprietary methodology.** Treat (B) as hypothesis, not fact.

---

## 1. Summary comparison table

| Provider | Address flow | Property inputs | Public data sources (stated) | Result format | Account gate | Agent CTA | Confirmed limitations | Unknown / proprietary elements |
|---|---|---|---|---|---|---|---|---|
| **Rightmove** (Instant Valuation) | Postcode → "Find Address" → select address | Mostly none from user; uses the address's own listing history | HM Land Registry (E&W from 1995), Registers of Scotland (from 1996), Rightmove search-demand + listing prices, individual property listing history, local sold prices | Estimate with a **confidence band** ("the wider the band… the less confident we are") | **Sign-in to view** the estimate; refreshes every ~30 days | "Contact one of our expert agents" / Agent Valuation page | Not a survey/agent valuation; can't see condition, renovations, layout; ~13M eligible addresses only | ML model design, weighting, demand signals, band derivation |
| **Zoopla** (My Home / Zoopla Estimate) | Postcode → "Look up postcode" → address | "some basic details about your home" | HM Land Registry, Registers of Scotland, Ordnance Survey, Royal Mail PAF, Google Maps, live for-sale/to-rent listings, local area data (schools, crime) | **Single figure** shown immediately (illustrated as "£270k"); claim/track via My Home | Estimate shown immediately; **account to claim/track** the home | "Get a free agent valuation" → local expert | Estimate not a formal valuation; excludes recent extensions/renovations/condition; monthly data refresh | AVM model, feature weighting, confidence internals |
| **Purplebricks** | Postcode/address → "Select your home address" | Reason for selling, location; appointment scheduling | "based on public data" (instant tool); human valuation uses agent inspection | Instant tool gives a quick estimate; **core product is a booked human valuation** (in-person or video) | Booking requires contact + appointment details | Primary CTA **is** the agent valuation (in-person/video) | Instant figure availability limited by sparse history, unusual property, valuer availability | AVM behind instant tool; agent pricing judgement |
| **Yopa** | "Book a Valuation" → enter postcode | Instant estimate uses recent nearby sales, size, location | "recent neighbourhood sales, size of property, geographical location" | Instant online estimate **and** option to book free in-person valuation | Contact details (name, email, phone) collected to book | Lists local agents + scheduling tool; books free in-person valuation | Instant estimate is indicative; in-person valuation recommended | AVM model details, agent-matching logic |
| **GetAgent** (Online Valuation / HouseWorth) | Enter postcode | "additional information you provide" | HM Land Registry sold prices, area + market-demand data, major portals (Rightmove, Zoopla, OnTheMarket) | Instant estimate + **HouseWorth tracking dashboard** ("how much it's changed and why") | Track/dashboard implies **account/sign-up** ("sign up for free") | Comparison of agents by Land-Registry-derived performance; book in-person valuation | Estimate ≠ in-person valuation; recommends agent visit | Estimate model, performance-ranking methodology |
| **OnTheMarket** | Postcode → "answer a few simple questions" | "a few simple questions" about the home | Sale estimate AVM (not itemised on page); **rental** valuations stated as calculated by propertypriceadvice.co.uk | **Indicative** single estimate "in under three minutes" | Not stated as required to see estimate | Lists best-fit local agents after estimate; arrange free appraisal | Expressly "indicative"; "a local estate agent will need to visit to confirm" | Sale-estimate model + data sources not itemised |
| **Mouseprice** | Enter any UK address | beds, bathrooms, extensions, local risk, construction materials | 20M sold records, 18M historic listings, 2M surveyor records, 2M EPCs, 3M floor plans, 90M images | Instant **PDF report** with an explicit **confidence level** | Free lookup; pro/assisted tiers gated | "Assisted"/pro tools target agents producing branded reports | Confidence level disclosed as accuracy proxy | AVM internals, proprietary + non-proprietary blend |
| **Nationwide HPI** (index calculator) | Region or postcode (region-level only) | Last known valuation + its date; target month/year | Nationwide House Price Index (its own mortgage-approvals-based index) | Indexed **re-estimate** of a prior value (region-level) | None | None (it is a bank tool, not a lead funnel) | Region-level not town/street; ignores fittings/decoration; advises agent/surveyor | Index construction (documented in methodology PDF) |

---

## 2. Per-provider findings

### 2.1 Rightmove — Instant Valuation
- **(A) Entry CTA & address flow:** "Enter a postcode to get a free house
  valuation" with a "Find Address" button; postcode first, then address
  selection.
- **(A) Account gate:** Tracking/estimate viewing is tied to signing in
  ("when you log in and view Tracked properties"); search results describe the
  flow as "select an address and click 'sign in' for your instant online
  estimate."
- **(A) Result format & confidence:** A figure with a confidence **band** —
  "The wider the band we provide, the less confident we are" and "Our estimates
  are more accurate for properties which are typical of their area."
- **(A) Data sources:** "industry-trusted machine learning models" using a
  mixture of public information, Rightmove's own data (search demand + listing
  prices), the property's own Rightmove listing history, and local sold prices;
  HM Land Registry (E&W, from 1995) and Registers of Scotland (from 1996),
  covering ~13M addresses.
- **(A) Refresh:** "Every 30 days… we attempt to get a new valuation."
- **(A) Limitations:** "Our estimate isn't the same as an estate agent's
  valuation. It can't provide an in-depth, accurate appraisal"; can't see
  condition, renovations, layout, unique features.
- **(A) Agent handoff:** Routes to "expert agents" / Agent Valuation when an
  online estimate isn't available.
- **(C) Unknown:** the ML model, how the demand signal is weighted, how the
  confidence band width is computed.
- Sources: <https://www.rightmove.co.uk/house-value.html>,
  <https://faq.rightmove.co.uk/support/solutions/articles/7000048762-valuation-tool>,
  <https://www.rightmove.co.uk/agent-valuation>

### 2.2 Zoopla — My Home / Zoopla Estimate
- **(A) Entry CTA & address flow:** "Enter a full UK postcode" → "Look up
  postcode" → address; "Simply input your address and some basic details about
  your home."
- **(A) Result:** Immediate — "Instant results: No need to wait." Presented as a
  single figure (illustrated "£270k"); claim/track through My Home.
- **(A) Data sources:** "data from public records, such as property sales and
  HM Land Registry"; help content lists HM Land Registry (E&W), Registers of
  Scotland, Ordnance Survey, Royal Mail postcode database (PAF) and Google Maps,
  plus live for-sale/to-rent listings and local data (crime, schools). Data
  "updated every month."
- **(A) Limitations:** "We can't see your amazing new kitchen ourselves… so we
  can't tell how much value it adds"; excludes condition, unique features,
  renovations; "estimates, not the same as a formal house price valuation."
- **(A) Agent handoff:** "we can connect you with a local expert" / "Get a free
  agent valuation."
- **(B) Inference:** an account is needed to *claim and track* a home (My Home),
  but the headline estimate appears without forcing sign-up first.
- **(C) Unknown:** the AVM itself (statistical model, feature weights, any
  confidence internals — no confidence figure is shown publicly).
- Sources: <https://www.zoopla.co.uk/home-values/>,
  <https://help.zoopla.co.uk/hc/en-gb/articles/360005677897-Where-does-the-Zoopla-Estimate-data-come-from>,
  <https://help.zoopla.co.uk/hc/en-gb/articles/360006701777-What-is-a-Zoopla-house-price-estimate>

### 2.3 Purplebricks
- **(A) Model:** Primary product is a **booked human valuation** — in-person or
  video — not an automated number. "Book a free house valuation"; choose a day
  and time to speak to a local agent.
- **(A) Instant tool exists** as a secondary "quick and easy-to-use home
  valuation tool" based on "public data."
- **(A) Initial info:** "a few details about why you're selling and where you're
  based," then pick an appointment slot.
- **(A) Limitations (instant availability):** may be unavailable due to "lack of
  historical information, current market conditions, having an unusual property
  or a shortage of valuers in your area."
- **(B) Inference:** contact details are captured at the appointment-booking
  step (necessary to schedule an agent), not before showing the instant figure.
- **(C) Unknown:** the AVM behind the instant tool; the agent's pricing
  judgement.
- Sources: <https://www.purplebricks.co.uk/services/book-a-free-house-valuation-online>,
  <https://www.purplebricks.co.uk/book-your-free-valuation/find-your-address>,
  <https://www.purplebricks.co.uk/how-does-purplebricks-work>

### 2.4 Yopa
- **(A) Entry & flow:** "Book a Valuation" → enter postcode → list of available
  agents + scheduling tool → enter name, email and phone to book.
- **(A) Two paths:** an instant online estimate ("analyzing data like recent
  neighbourhood sales, the size of the property, and its geographical location")
  and a free, no-obligation in-person valuation.
- **(A) Contact gate:** name, email, phone collected to book the appointment.
- **(B) Inference:** the contact-detail capture is positioned around booking the
  human valuation (lead generation), which is the commercial goal.
- **(C) Unknown:** the instant-estimate model; agent-matching logic.
- Sources: <https://www.getagent.co.uk/blog/online-agents/yopa-review>,
  <https://www.sellingup.com/valuations>

### 2.5 GetAgent — Online Valuation / HouseWorth
- **(A) Entry & flow:** enter postcode; "analyses recent sold prices from HM Land
  Registry, along with area and market demand data," then applies user-supplied
  info to estimate value.
- **(A) Tracking:** "HouseWorth" dashboard "constantly monitors changes… and
  provides live updates… explaining how much it's changed and why."
- **(A) Account gate:** tracking implies sign-up ("sign up for free today").
- **(A) Agent angle:** GetAgent is fundamentally an **agent-comparison** site —
  ranks agents on objective Land-Registry + portal performance data (Rightmove,
  Zoopla, OnTheMarket), then offers to book in-person valuations.
- **(A) Limitations:** estimate is distinct from an in-person valuation; advises
  an agent visit for "true market value."
- **(C) Unknown:** the estimate model; the agent performance-ranking methodology.
- Sources: <https://www.getagent.co.uk/online-valuation>,
  <https://www.getagent.co.uk/>,
  <https://www.getagent.co.uk/book-estate-agent-valuation>

### 2.6 OnTheMarket — Instant Valuation (additional service)
- **(A) Entry & flow:** "Enter your postcode and answer a few simple questions to
  instantly get an estimate of your home's value"; "valuation in under three
  minutes."
- **(A) Result:** an **indicative** single estimate shown first, at the top of
  the page, then a list of best-fit local agents.
- **(A) Data sources:** sale estimate's AVM not itemised on-page; rental
  valuations stated as "calculated independently by propertypriceadvice.co.uk."
- **(A) Limitations:** "indicative based on the information you provide"; "a
  local estate agent will need to visit to confirm its current market value."
- **(A) Agent handoff:** find/book local OnTheMarket agents for a personal
  market appraisal.
- **(C) Unknown:** sale-estimate model and its source mix.
- Sources: <https://www.onthemarket.com/instant-valuation/>,
  <https://www.onthemarket.com/property-valuation/>

### 2.7 Mouseprice (additional service)
- **(A) Entry & flow:** look up any UK address; free instant report.
- **(A) Inputs/factors:** beds, bathrooms, extensions, local risk factors,
  construction materials.
- **(A) Result:** instant **PDF report** that includes an explicit **confidence
  level** ("a measure of how accurate we think the valuation estimate is").
- **(A) Method (stated):** matches recently sold prices for the road, compares
  low/high to derive an average, and checks current listings + completed
  transactions for comparables; AVM operating since 2004.
- **(A) Data sources:** 20M sold records, 18M historic listings, 2M surveyor
  records, 2M EPCs, 3M floor plans, 90M images; "proprietary and non-proprietary"
  blend.
- **(A) Agent angle:** "Assisted"/Pro tiers let agents pick comparables and
  produce branded reports.
- **(C) Unknown:** the AVM internals and the exact proprietary/non-proprietary
  data split.
- Sources: <https://data.mouseprice.com/valuations>,
  <https://www.mouseprice.com/resources/property-valuation-for-home-buyers>,
  <https://www.mouseprice.com/resources/faq>

### 2.8 Nationwide HPI calculator (methodology reference, not a lead funnel)
- **(A) Inputs:** a prior known valuation + its date, region (or postcode for
  region lookup), and the target month/year.
- **(A) Output:** re-indexes the prior value using the Nationwide House Price
  Index; results are **region-level**, "rather than specific towns and cities."
- **(A) Limitations:** "does not take into account differences like quality of
  fittings or decoration"; recommends a local estate agent or surveyor for an
  accurate valuation.
- **(A) Method is public:** index construction is documented in Nationwide's HPI
  methodology PDF (mortgage-approval based; 13 regional series; property-type and
  buyer-type breakdowns).
- This is the cleanest public example of an **honest, narrow, no-lead-capture**
  tool, useful as a tone reference for time-adjustment messaging.
- Sources: <https://www.nationwide.co.uk/house-price-index>,
  <https://www.nationwide.co.uk/-/assets/nationwidecouk/documents/about/house-price-index/nationwide-hpi-methodology.pdf>

---

## 3. Cross-cutting observations (bucketed)

### (A) Confirmed public information
- **Postcode-first is universal.** Every consumer tool starts with a postcode,
  then resolves to a specific address from a gazetteer. None asks for a full
  typed address up front.
- **Sold-price registries are the common spine.** HM Land Registry (E&W) +
  Registers of Scotland are explicitly named by Rightmove, Zoopla, GetAgent and
  Mouseprice; Zoopla adds Ordnance Survey, Royal Mail PAF and Google Maps.
- **Honest-limitation copy is standard and consistent.** Every credible tool
  states the estimate is not a survey/formal valuation and cannot see internal
  condition, renovations or unique features. This is the norm, not a
  differentiator — omitting it would stand out negatively.
- **Two tools surface confidence explicitly:** Rightmove (band width) and
  Mouseprice (stated confidence level). Zoopla and OnTheMarket show a single
  figure with no published confidence number.
- **Agent handoff is the business model** for the lead-gen players (Purplebricks,
  Yopa, GetAgent, OnTheMarket) and a secondary CTA for the portals (Rightmove,
  Zoopla). Nationwide HPI has no handoff.

### (B) Reasonable product inference
- **Account/contact gating splits into two patterns:** (1) *estimate is free,
  account only to claim/track over time* (Zoopla My Home, GetAgent HouseWorth,
  Rightmove tracked properties); (2) *contact details captured to book a human
  valuation* (Yopa, Purplebricks). The figure itself is generally not paywalled
  behind an email in the portal pattern.
- The "answer a few simple questions" steps (OnTheMarket, Zoopla "basic details")
  are almost certainly bed/bath/type/tenure-style confirmations used to refine an
  address-matched comparable estimate — but the exact fields are not published.
- Lead-gen tools likely position the estimate as the *hook* and the booked
  valuation as the *conversion*, which is why contact capture clusters around the
  booking step rather than the estimate step.

### (C) Unknown / proprietary methodology
- No provider publishes its model form, feature weights, comparable-selection
  rules, time-adjustment method, or how a confidence band/level is derived.
- Where a "confidence level" or "band" is shown, the underlying calculation is
  opaque. **Do not reverse-engineer or imitate a specific competitor's band; if
  we show uncertainty it must be derived from and honestly labelled against our
  own back-tested error** (consistent with `VALUATION_SCAFFOLDING.md` §10: no
  accuracy claimed before measured on held-out sales).
- Mouseprice's "proprietary and non-proprietary data sources" and OnTheMarket's
  unitemised sale model are explicitly closed.

---

## 4. Patterns worth adopting (not cloning)
1. **Postcode-first, then address-pick from a gazetteer.** Matches user mental
   model and reduces typos. (We rely on PPD/listings + manual fallback until OS
   UPRN lands — `VALUATION_SCAFFOLDING.md` §8.)
2. **Name the public data sources plainly.** Stating "HM Land Registry sold
   prices" builds trust and is honest about what an AVM can and cannot see.
3. **State limitations up front, in plain language.** The shared "we can't see
   your new kitchen / this is not a survey" framing is the credible baseline.
4. **Show uncertainty honestly when we have it.** Rightmove's band and
   Mouseprice's confidence level are good precedents — but only publish a band
   derived from our own measured error, never a cosmetic one.
5. **Let the estimate be free; reserve the account for save/track, not for the
   number.** Lower friction, more honest, fewer dark-pattern risks. Fits our
   passwordless claim-on-verify model.
6. **Make agent handoff explicit and opt-in.** Offer a local valuation as a clear
   next step, gated behind an affirmative request + scoped consent (matches
   `VALUATION_SCAFFOLDING.md` §7).
7. **Keep a narrow, no-lead "index re-estimate" tone available** (Nationwide
   style) for time-adjusting a prior known value — honest and low-liability.

## 5. Patterns to avoid
1. **Single over-precise figure with no uncertainty.** A bare "£270k" implies
   false accuracy; we round (nearest £5k) and label range as uncalibrated until
   back-tested (`VALUATION_SCAFFOLDING.md` §10 risk).
2. **Email/contact wall before the estimate.** Forcing details to see the number
   is a friction/dark-pattern risk; capture contact only at explicit handoff.
3. **Pre-ticked marketing consent or bundling auth with marketing consent.**
   Auth ≠ marketing consent; no pre-checked boxes (`VALUATION_SCAFFOLDING.md` §7).
4. **Publishing an accuracy/confidence claim we haven't measured.** Don't borrow
   a competitor's confidence framing; derive ours from held-out sales or omit it.
5. **Implying the automated estimate is a valuation/survey.** Always label it an
   indicative automated estimate, distinct from a formal valuation or survey.
6. **Cloning a competitor's wording, layout, branding or band logic.** Research
   informs our own honest design; it does not license imitation.

---

## 6. Sources
- Rightmove: <https://www.rightmove.co.uk/house-value.html> ·
  <https://faq.rightmove.co.uk/support/solutions/articles/7000048762-valuation-tool> ·
  <https://www.rightmove.co.uk/agent-valuation>
- Zoopla: <https://www.zoopla.co.uk/home-values/> ·
  <https://help.zoopla.co.uk/hc/en-gb/articles/360005677897-Where-does-the-Zoopla-Estimate-data-come-from> ·
  <https://help.zoopla.co.uk/hc/en-gb/articles/360006701777-What-is-a-Zoopla-house-price-estimate>
- Purplebricks: <https://www.purplebricks.co.uk/services/book-a-free-house-valuation-online> ·
  <https://www.purplebricks.co.uk/book-your-free-valuation/find-your-address> ·
  <https://www.purplebricks.co.uk/how-does-purplebricks-work>
- Yopa: <https://www.getagent.co.uk/blog/online-agents/yopa-review> ·
  <https://www.sellingup.com/valuations>
- GetAgent: <https://www.getagent.co.uk/online-valuation> ·
  <https://www.getagent.co.uk/> · <https://www.getagent.co.uk/book-estate-agent-valuation>
- OnTheMarket: <https://www.onthemarket.com/instant-valuation/> ·
  <https://www.onthemarket.com/property-valuation/>
- Mouseprice: <https://data.mouseprice.com/valuations> ·
  <https://www.mouseprice.com/resources/property-valuation-for-home-buyers> ·
  <https://www.mouseprice.com/resources/faq>
- Nationwide HPI: <https://www.nationwide.co.uk/house-price-index> ·
  <https://www.nationwide.co.uk/-/assets/nationwidecouk/documents/about/house-price-index/nationwide-hpi-methodology.pdf>
