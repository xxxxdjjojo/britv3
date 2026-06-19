# Estate Agent Listing Distribution Research

> **Date:** 2026-06-19
> **Scope:** UK estate-agent listing distribution — CRM/feed and portal integration
> methods that TrueDeed can legitimately consume to onboard an agency's existing
> portfolio in three actions (Connect → Review → Publish).
> **Gate:** A (discovery). Part of the Partner Ingestion documentation package.
> **House style:** matches `VALUATION_COMPETITOR_RESEARCH.md` /
> `VALUATION_DATA_DICTIONARY.md` (evidence tables, explicit confidence marks,
> reproducible source URLs).

This document **replaces** the 24-line stub of the same name. The correct facts
from the stub (Rightmove three-call contract, Zoopla branch-ID onboarding, Jupix
tombstones, NTS material-information gate) are preserved and expanded below.

## Confidence legend

Every factual cell is marked:

- **confirmed-official** — taken directly from the vendor's own published page/spec.
- **provider-reported** — stated by the vendor in a help article (not a formal spec).
- **historical** — a documented past state (e.g. a withdrawn format version).
- **inference** — reasoned from official facts, not stated verbatim.
- **unknown-commercial** — depends on a commercial contract / credentials we do not hold.

> **Non-negotiable framing (encode in every connector):** no portal scraping; no
> portal passwords; no fabricated fields; upstream deletion → archive + audit (never
> destructive delete); empty-feed safety check; strict tenant isolation; secrets never
> logged; **HTTP 200 ≠ import success** (a 200 from a feed/portal endpoint only means the
> transport succeeded — item-level validation still governs whether a listing is publishable).

---

## 1. Executive summary

The safe integration order is **authorised CRM/feed ingestion first, portal
distribution later**. Every UK route we found is a *formal, credentialled* feed or
REST API — none of them require or condone scraping a portal or collecting an
agent's portal password.

Two architectural facts dominate the design:

1. **Inbound vs outbound are different problems.** TrueDeed's MVP goal is to *ingest*
   an agency's portfolio (read the agency's listings out of its CRM/feed) and publish
   them as TrueDeed listings. The Rightmove/Zoopla/OnTheMarket specs are mostly about
   *outbound distribution* (a CRM pushing listings *to* a portal). The same data
   shapes (BLM/RTDF, Jupix XML, Reapit REST) are reusable, but TrueDeed sits where the
   *portal* sits in those specs, or consumes the *same feed the CRM emits to portals*.
2. **Delivery model splits into batch-pull (nightly XML/CSV at a unique URL) vs
   real-time push (REST + webhooks).** Jupix is batch-pull; Reapit/Street are
   real-time REST+webhooks; Rightmove moved batch→real-time (BLM/ADF → RTDF).

See [`PARTNER_CONNECTOR_ARCHITECTURE.md`](./PARTNER_CONNECTOR_ARCHITECTURE.md) for the
adapter contract and recommended build order that follows from this research.

---

## 2. Source matrix

| Platform | Entry method | Feed / API method | Auth | Full / Incremental | Status values | Media | Error reporting | Commercial approval | Public-doc availability | Source | Last verified |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Rightmove RTDF v3** (Real-Time Datafeed) | Outbound from CRM → portal; three mandatory calls **Send property**, **Remove property**, **Get branch property list** *(confirmed-official)* | Web-service API; request/response in **XML or JSON** (responds in the language you sent; `content-type` header must match) *(confirmed-official, search)* | **Certificate / keystore**: provider receives a test pack + keystore with cryptographic auth details via SMS; password delivered separately via SMS *(confirmed-official)* | Real-time per-property push (Send/Remove); branch reconciliation via Get-branch-property-list *(confirmed-official + inference)* | Property add vs remove are distinct calls; status/availability inside the property payload *(inference — full enum not in public page)* | In the property payload (RTDF spec PDFs); legacy BLM carried media URLs *(provider-reported; spec PDF behind vendor doc)* | API responses include status; Phase-3 calls cover **performance reporting** (e.g. GetPropertyEmails) *(confirmed-official, GitHub schema mirror)* | **Yes** — ADF team test access required; new members go live only once the **branch is visible and a GO LIVE call** from Rightmove Customer Service has happened *(confirmed-official)* | Landing page public; full spec PDFs gated behind contact form/EULA *(confirmed-official)* | https://www.rightmove.co.uk/adf.html ; media.rightmove.co.uk RTDF spec PDF | 2026-06-19 |
| **Rightmove BLM / ADF (legacy)** | Nightly upload of a data file *(historical)* | **BLM** flat-file batch format; ADF "Version 3/3a" *(historical)* | As above (keystore) *(historical)* | **Batch** (nightly file) — superseded by real-time RTDF *(historical)* | n/a | Media referenced in BLM record set *(historical)* | n/a | n/a | ADF v3/3a support **withdrawn 6 Jan 2016**; RTDF is the current path *(historical, search)* | https://www.rightmove.co.uk/adf.html ; sturents.com transition article | 2026-06-19 |
| **Zoopla / Houseful** | Listings added **manually** in ZooplaPro **or via feed**; feed uploads handled by property software (Alto, Jupix, Expert Agent) *(provider-reported)* | Branch feed from a connected feed provider; real-time uploaders publish **within 1 hour** *(provider-reported)* | **Branch-ID handshake**: agent emails written request to `members@zoopla.co.uk`; Member Services gives the **branch ID** to the feed provider so Zoopla accepts the feed *(provider-reported)* | Feed provider sends per-branch listings; manual + feed can coexist *(provider-reported)* | Live / not-live (goes live within ~1h on real-time uploaders) *(provider-reported)* | Handled by feed provider's payload *(inference)* | Via ZooplaPro / Member Services *(provider-reported)* | **Yes** — written request + branch-ID provisioning; not self-service *(provider-reported)* | Help-centre public (some pages 403 to automated fetch); developer.zoopla.co.uk legacy API docs exist *(provider-reported)* | https://support.zoopla.co.uk/hc/en-gb/articles/360007015338 ; .../360004573377 | 2026-06-19 |
| **OnTheMarket (OTM)** | Outbound from CRM/feed-provider → portal; **import APIs** for web devs/portals/software companies to populate accounts from their own app or the customer's feed provider/CRM *(provider-reported)* | Real-time data feed (e.g. Reapit↔OTM real-time feed markets new instructions "within minutes") *(provider-reported)* | Account-scoped; per-agency *(unknown-commercial)* | Real-time push *(provider-reported)* | n/a (portal-side) | Feed-provider payload *(inference)* | Portal-side *(unknown-commercial)* | **Yes** — agency account + feed-provider relationship *(provider-reported / unknown-commercial)* | Marketing/partner pages public; import-API spec gated *(provider-reported)* | https://expert.onthemarket.com/ ; propertyindustryeye.com Reapit↔OTM article | 2026-06-19 |
| **Reapit Foundations** | REST API; customer-scoped DB (resource IDs unique *per customer*, not global) *(confirmed-official)* | **REST, JSON**, HAL hypermedia (`_links`, `_embedded`, `embed` param); GET/POST(201)/PATCH(204)/DELETE(soft) *(confirmed-official)* | **OpenID Connect over OAuth 2.0**; Authorization-Code (user in context, via **Reapit Connect**) or **Client-Credentials** (machine-to-machine); `client_id`+`secret`; token at `connect.reapit.cloud/token`; **`reapit-customer` header** required *(confirmed-official)* | Incremental via pagination (`pageSize`,`pageNumber`,`totalCount`,`totalPageCount`); deltas via metadata filters & **webhooks** *(confirmed-official)* | Resource state per entity; `DELETE` is **soft delete** *(confirmed-official)* | Uploads ≤6MB direct; 6–30MB via **pre-signed S3 URL** (`POST /signedUrl`, 15-min validity) *(confirmed-official)* | HTTP `2xx/4xx/5xx`; body has `statusCode`,`dateTime`,`description`, `errors[]`; `422` for validation; **`x-amzn-RequestId`** per response *(confirmed-official)* | **Yes** — customer admin must **install** the app to grant data access; sandbox uses `SBOX` customer *(confirmed-official)* | **Public docs** (good); sandbox public *(confirmed-official)* | https://foundations-documentation.reapit.cloud/api/api-documentation ; github.com/reapit/foundations-documentation reapit-connect.md | 2026-06-19 |
| **Alto** (Zoopla/Houseful stable) | Outbound feed export | **Client Feed Export API** (PDF guide gives technical upload info) *(provider-reported)* | Agency / API access required *(unknown-commercial)* | Feed export *(provider-reported)* | n/a | Feed payload *(inference)* | Provider support *(unknown-commercial)* | **Yes** — agency/API access *(unknown-commercial)* | Help article public (article 403s to automated fetch; updated **2025-10-08** per stub) *(provider-reported)* | https://support.altosoftware.co.uk/hc/en-gb/articles/5048171901599 | 2026-06-19 |
| **Jupix** | Third-party web companies retrieve agent properties **nightly** from a **unique URL** *(confirmed-official, spec)* | **Website Listing XML Data Specification** (v2 dated 2014-02-18); pull XML between **2200–0700** nightly *(confirmed-official, spec)* | Unique per-agency URL issued after **test XML** is provided first *(confirmed-official, spec)* | **Full snapshot** each night — feed contains *all* on-market properties + media; existing properties resupplied with stable `propertyID` *(confirmed-official, spec)* | On-market vs absent. **Removed properties are simply absent** from the feed → consumer must remove/tombstone them *(confirmed-official, spec)* | New properties carry **all media** (photos, floorplans, EPC graphs, PDFs) with the property *(confirmed-official, spec)* | n/a (batch pull; no per-item ack) *(inference)* | No charge to the agent; test XML before unique URL *(confirmed-official, spec)* | **Spec PDF public** (mirrored copies) *(confirmed-official)* | JUPIX Website Listing XML Data Specification PDF; docplayer mirror | 2026-06-19 |
| **Street.co.uk** | Open developer API across companies, branches, viewings, valuations, applicants, vendors, tenants, landlords *(confirmed-official)* | "Full programmatic access to the data and events"; **webhooks** (no polling) *(confirmed-official)* | Not stated on the public page (REST/GraphQL + auth method unspecified) *(unknown-commercial)* | Webhook events (real-time) *(confirmed-official)* | Per-entity *(inference)* | Not stated *(unknown-commercial)* | Not stated *(unknown-commercial)* | **Yes** — partner program / agency-customer sandbox request; Street prioritises well-maintained, documented integrations *(confirmed-official)* | **Public** dev surface + sandbox *(confirmed-official)* | https://street.co.uk/developers/api | 2026-06-19 |
| **NTSELAT / National Trading Standards — Material Information** | Compliance regime (not a feed) | n/a | n/a | n/a | n/a | n/a | n/a | n/a | **Public** guidance *(confirmed-official)* | https://www.nationaltradingstandards.uk/news/full-material-information-guidance-published/ | 2026-06-19 |

---

## 3. NTSELAT Material Information (the publish gate)

Both sales **and** lettings agents must comply; the guidance clarifies an existing
obligation under the **Consumer Protection Regulations (CPRs)** "not to omit any
material information on property listings" *(confirmed-official)*.

| Part | Status / date | Content | TrueDeed publish-gate role |
|---|---|---|---|
| **Part A** | Announced early 2022 | Always material regardless of property: **council tax band/rate**; **price & tenure** (for sales) *(confirmed-official)* | **Hard gate** — block publish if missing (tenure, price already validated by Codex's `validateNormalizedListing`). |
| **Part B** | Published 2023-11-30 | Should be established for all properties: property type & **construction materials**, **room numbers & measurements**, utilities (electricity, water, sewerage, heating, **broadband speed**, **mobile signal**), **parking** *(confirmed-official)* | **Soft gate / warn** — surface missing Part-B in Review; some map to existing `properties` columns, some are net-new. |
| **Part C** | Published 2023-11-30 | If applicable: building safety (cladding, asbestos), restrictions (conservation area, **listed status**), rights & easements, **flood/coastal-erosion risk**, **planning permissions**, accessibility, mining/coal status *(confirmed-official)* | **Conditional gate** — `planning_permission_status` already a publish guard in `listing-service.ts`; flood already a Local-Area layer. |

Cross-reference: TrueDeed already surfaces flood risk and broadband as property
Local-Area layers (see `CLAUDE.md` "Local Area data layers"), so several Part-B/C
items are *derivable* rather than feed-supplied.

---

## 4. Contradictions / conflicts found (recorded, not silently resolved)

Per the source-of-truth rule, conflicts are logged rather than resolved by fiat:

1. **Rightmove "ADF" naming collision.** Rightmove's own landing page is titled
   "Automated Datafeed (ADF)" yet the *current* product is the **Real-Time Datafeed
   (RTDF)**; the **legacy** ADF "Version 3/3a" batch/BLM format had support
   **withdrawn 6 Jan 2016**. The stub used "Rightmove ADF" loosely. **Resolution
   deferred to implementation:** treat "ADF" as the org/onboarding team name and
   **RTDF v3** as the wire format. Do not build the legacy BLM path.
2. **Jupix spec date is old (v2, 2014-02-18).** The XML spec we can verify is a decade
   old; Jupix/Alto are now both Houseful-owned and Alto exposes a newer "Client Feed
   Export API" (updated 2025-10-08). The nightly-XML model may be superseded by the
   Alto export path. **Conflict:** two plausible Jupix/Alto ingestion routes
   (legacy nightly XML vs Alto Client Feed Export). Pilot selection must confirm which
   is current with live agency credentials.
3. **Zoopla help pages 403 automated fetch** but render for humans; facts here are from
   Zoopla's own help-centre text surfaced via search, marked *provider-reported* not
   *confirmed-official*. The legacy `developer.zoopla.co.uk` API is a *consumer* search
   API, **not** an agency listing-ingestion API — do not confuse the two.
4. **`agent_feed_integrations.provider` enum** in the codebase only allows
   `reapit|alto|jupix` (`supabase/migrations/20260313_agent_dashboard.sql:493`), but the
   working build's pilot connectors are a **CSV connector** and a **generic sandbox
   feed** — neither is in the enum. This is a real schema gap recorded in the
   [audit](./PARTNER_INGESTION_CODEBASE_AUDIT.md) and
   [capability matrix](./PARTNER_INGESTION_CAPABILITY_MATRIX.md).

---

## 5. MVP boundary (what this research authorises)

- **In scope now:** feed *connection records*, secret redaction, durable *import ledger*,
  a deterministic Reapit-shaped fixture, a **CSV connector**, a **generic sandbox feed
  connector** with synthetic fixtures, review, approval, canonical **draft** publish.
- **Contract-tested only (synthetic fixtures, no live credentials):** Reapit, Alto, Jupix.
- **Out of scope:** live Rightmove/Zoopla/OnTheMarket distribution, **any** portal
  scraping, **any** portal-password collection, and live CRM OAuth until agency
  credentials exist.

---

## Sources

- [Rightmove Automated Datafeed (ADF) specifications](https://www.rightmove.co.uk/adf.html)
- [Rightmove Real Time Datafeed Specification PDF](https://media.rightmove.co.uk/ps/pdf/guides/adf/Rightmove_Real_Time_Datafeed_Specification.pdf)
- [StuRents: From BLM ADF to RTDF](https://sturents.com/student-accommodation-news/en/2023/09/20/from-blm-adf-to-rtdf-what-rightmove-s-data-feed-updates-mean-for-you/3169)
- [Zoopla Member Support — How do I set up a feed?](https://support.zoopla.co.uk/hc/en-gb/articles/360007015338)
- [Zoopla Member Support — How long before my property goes live?](https://support.zoopla.co.uk/hc/en-gb/articles/360004573377)
- [Reapit Foundations API documentation](https://foundations-documentation.reapit.cloud/api/api-documentation)
- [Reapit Connect (OAuth/OIDC) docs](https://github.com/reapit/foundations-documentation/blob/master/api/reapit-connect.md)
- [Alto Client Feed Export API User Guide](https://support.altosoftware.co.uk/hc/en-gb/articles/5048171901599-Client-Feed-Export-API-User-Guide)
- [Jupix Website Listing XML Data Specification v2 (mirror)](https://docplayer.net/50528801-Jupix-website-listing-xml-data-specification-v2.html)
- [Street.co.uk developer API](https://street.co.uk/developers/api)
- [Reapit and OnTheMarket real-time data feed (Property Industry Eye)](https://propertyindustryeye.com/reapit-and-onthemarket-collaborate-to-provide-real-time-data-feed-for-agents/)
- [NTSELAT full material information guidance](https://www.nationaltradingstandards.uk/news/full-material-information-guidance-published/)
