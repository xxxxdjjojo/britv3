# Stitch Screen Registry — TrueDeed (britv3)

> **Audit date:** 2026-06-20.
> **Stitch project ID:** `15021896094385971052` (per master prompt).
> **Status:** ⚠️ **Stitch MCP fetch blocked** — see §1.

---

## 1. Stitch access status

- **MCP endpoint:** `https://stitch.googleapis.com/mcp` (configured in
  `.mcp.json`).
- **Auth:** `X-Goog-Api-Key` header, value stored in `.mcp.json`.
- **Handshake:** initialize succeeds (server returns
  `{"serverInfo":{"name":"StatelessServer"}}`).
- **Tool call:** ❌ **HTTP 401 — "Request had invalid authentication credentials."**
  Tested with `tools/call` for `get_project` and `list_screens`.
- **Most likely cause:** the API key has been **auto-revoked by Google's
  secret-scanning** because it is committed to the **public** GitHub repo
  `xxxxdjjojo/britv3` (see `docs/PRODUCT_DECISION_REGISTER.md` PDR-010).
  Google rotates/revokes leaked API keys detected in public repos.
- **Resolution required:** founder rotates the key in Google Cloud Console
  and provides it via a secure channel (env var, secret manager). Until then,
  no approved Stitch screen can be fetched fresh.

## 2. Supplied screen registry (per master prompt)

| # | Title | Screen ID | Local artifact? | Fetch status |
|---|---|---|---|---|
| A | Post a New Job — Requirement Details | `079c8886f95a4ed092d91ce900974ca8` | none | ⚠️ blocked |
| B1 | Sold Prices — Isleworth | `26427d4cccb74f2594189df14188f32f` | none | ⚠️ blocked |
| B2 | Market Trends — National Dashboard | `c80ed11953f84467a6558324fd9b7b60` | none | ⚠️ blocked |
| B3 | Area Guide — Isleworth, TW7 | `745318fd5f5c479cb1844ee6d23435b6` | none | ⚠️ blocked |
| B4 | Area Guide — Kensington, London | `f0acfce1d8af4823adac029fd847c8ba` | none | ⚠️ blocked |
| C1 | Service Category Template | `b950fff5aab6468f8e6cac55779b4a2b` | none | ⚠️ blocked |
| C2 | Service Provider — Search Hub | `bd11c1910af6426eb256cacf6b3a9ea8` | partial — `.planning/phases/17-service-provider-public-profiles/stitch/marketplace-search-home.html` is **possibly related** | ⚠️ blocked |
| C3 | Find a Mortgage Advisor | `fd6e86dfbc3c4268aad7311834318da7` | none | ⚠️ blocked |
| D1 | Landlord Onboarding — Step 1 (Portfolio Scope) | `c5ae2820a4e6447abe4349f5ec1feeba` | partial — `.planning/phases/14-landlord-dashboard/stitch/dashboard-home.html` is **possibly related** | ⚠️ blocked |
| D2 | Landlord Onboarding — Step 2 (Property Detail) | `f23dd993027c4d35a71f753d497816b2` | none | ⚠️ blocked |
| D3 | Landlord Onboarding — Step 3 (Compliance) | `323106588ee14e9db1dfdebf6ea2d382` | none | ⚠️ blocked |
| E1 | Buyer Dashboard — Messages Inbox | `a336220dfda54b959f507f93f9871ea4` | none | ⚠️ blocked |
| E2 | Buyer Dashboard — Offer Tracking | `475b4efcf08640faafa749e271b40779` | none | ⚠️ blocked |
| E3 | Buyer Dashboard — Document Vault | `41c5c29113ce466db5925797b3ca42f2` | none | ⚠️ blocked |
| E4 | Buyer Dashboard — AI Property Match | `7e059b5b40654dae8a584253867249ed` | none | ⚠️ blocked |

## 3. Existing local Stitch artifacts (already in repo)

These pre-date the master prompt's screen list and are **named by phase/theme**,
not by the supplied IDs. Without Stitch access we cannot confirm correspondence.
Treat as **weak signal** only — they are prior imports from older planning
phases, useful as style/structure reference but **not authoritative** for the
master-prompt parity requirement.

### `.planning/phases/14-landlord-dashboard/stitch/` (4 files)
- `dashboard-home.html` (18.6 KB)
- `maintenance-requests.html` (14.2 KB)
- `my-properties.html` (20.3 KB)
- `tenant-screening.html` (18.2 KB)

### `.planning/phases/17-service-provider-public-profiles/stitch/` (6 files)
- `agency-public-profile.html` (19.7 KB)
- `compare-providers.html` (13.9 KB)
- `localized-category-page.html` (25.3 KB)
- `marketplace-search-home.html` (20.2 KB)
- `tradesperson-public-profile.html` (17.9 KB)
- `tradesperson-search-results.html` (16.7 KB)

### `docs/search-page/reference/`
- `stitch-target.png` (130 KB)
- `stitch-code.html` (24.5 KB)
- `impl-desktop-1440.png` (561 KB) — implementation screenshot
- `impl-mobile-390.png` (49 KB) — implementation screenshot

### Root
- `stitch_homepage.html` (51 KB) — original Stitch-generated homepage markup
- `britestatestyle.txt` (103 KB) — style reference (pre-rebrand)

## 4. Recommended fetch sequence (when access is restored)

1. `list_screens({projectId: "15021896094385971052"})` to get the canonical
   screen list and IDs.
2. For each supplied screen ID, `get_screen({projectId, screenId, name})` to
   fetch metadata + asset URLs.
3. Download the image and code assets to
   `artifacts/stitch/<screen-id>/{image.png,code.html}`.
4. Compute sha256 checksums for integrity tracking.
5. Build `STITCH_FRONTEND_PARITY_AUDIT.md` by comparing each route's current
   implementation against the approved screen.

## 5. Ambiguity notes (per master prompt)

- Buyer Dashboard screens (E1-E4) must **not** be treated as service-provider
  landing screens.
- Sold Prices / Market Trends / Area Guide screens (B1-B4) must **not** be
  treated as Post a Job screens.
- Service Provider — Search Hub (C2) is the **currently identified source**
  for the service-provider search landing page.
- Post a New Job (A) is the source for **both** "Post a Job" and "Get a Quote"
  CTAs (same journey).
- For pages with no supplied screen ID — Rent landing, Mortgage comparison,
  Property comparison, How it works, Seller plans, Calculators, Auction centre,
  Renter guide, Credit-building page, Renters-insurance page — we must search
  the Stitch catalogue. **Blocked until access is restored.**

---

*This registry will be updated the moment a valid Stitch API key is available.*
