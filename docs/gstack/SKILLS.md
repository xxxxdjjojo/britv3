# Custom Skills for Brit-Estate

Brit-Estate includes 6 custom GStack skills for real estate automation:

1. **audit-listings** — Property listing quality auditor
2. **test-mls-sync** — Data synchronization validator
3. **valuation-checker** — AI valuation auditor
4. **landlord-report** — Portfolio report generator
5. **qa-marketplace** — Marketplace feature tester
6. **release-notes** — Release note generator

## Detailed Skill Reference

### 1. audit-listings

**Purpose:** Automatically audit property listings for quality and compliance.

**What it checks:**
- ✅ All required fields populated
- ✅ Description quality (word count, keywords, AI score)
- ✅ Images (count, quality, cache status)
- ✅ Metadata (EPC, council tax, location accuracy)
- ✅ SEO optimization (titles, descriptions, schema)
- ✅ Legal compliance (fair housing, GDPR)

**Scoring (0-100):**
- Completeness: 0-25 pts (all fields filled)
- Description: 0-25 pts (quality, readability)
- Images: 0-20 pts (count, quality)
- SEO: 0-20 pts (keywords, markup)
- Compliance: 0-10 pts (legal, GDPR)

**Usage:**
```bash
# Audit a specific listing
npm run gstack:audit-listings -- --listing-id=abc123

# Audit all listings
npm run gstack:audit-listings -- --all

# Run comprehensive audit
npm run gstack:audit-listings -- --profile=comprehensive

# Run quick audit
npm run gstack:audit-listings -- --profile=basic
```

**Output:**
- Quality score (0-100)
- Issues list (critical, high, medium, low)
- Recommendations (auto-fixable + manual)
- Compliance status (PASS/WARN/FAIL)

**Typical results:**
```
Listing: 4 Whitley Street, London SW1A 1AA
  Quality Score: 78/100
  Completeness: 25/25
  Description: 18/25 (too short, improve keyword usage)
  Images: 14/20 (10 images, need 2 more interior shots)
  SEO: 16/20 (missing schema markup)
  Compliance: 5/10 (GDPR: no cookie consent message)

  ISSUES:
  🔴 Critical: Add missing EPC rating
  🟠 High: Improve description to 200+ words
  🟡 Medium: Add interior kitchen photo
  🟢 Low: Add property maintenance history

  RECOMMENDATIONS:
  - Use template to add EPC rating (auto-fixable)
  - Rewrite description with 5 keywords
  - Upload high-res kitchen photo
```

---

### 2. test-mls-sync

**Purpose:** Test property data synchronization from external sources.

**Tests:**
- Data transformation accuracy (API → internal schema)
- Deduplication (catch duplicate listings)
- Price updates (track price changes)
- Image ingestion (download and cache)
- Metadata enrichment (computed fields)

**Usage:**
```bash
# Test Rightmove sync with 50 properties
npm run gstack:test-mls-sync -- --source=rightmove --sample=50

# Test full pipeline
npm run gstack:test-mls-sync -- --source=openrent --profile=full

# Quick test
npm run gstack:test-mls-sync -- --source=zoopla --profile=quick
```

**Output:**
- Transformation accuracy (95%+ = PASS)
- Deduplication report (new, duplicates, conflicts)
- Data validation results
- Price tracking status
- Image cache statistics
- Performance metrics

**Typical results:**
```
MLS Sync Test: Rightmove (50 properties)
  
  Transformation Accuracy: 98.2% ✓
  - 49/50 properties transformed correctly
  - 1 property had malformed price data (FIXED)
  
  Deduplication:
  - 48 new properties
  - 2 duplicates detected and merged
  - 0 false positives
  
  Price Updates:
  - 5 price changes detected
  - All tracked to history
  
  Image Pipeline:
  - 485/500 images cached ✓
  - 15 images failed (retrying...)
  
  Performance:
  - Avg: 0.8s per property
  - Peak: 1.2s
  - Memory: 245 MB
```

---

### 3. valuation-checker

**Purpose:** Validate AI-generated property valuations.

**Validates:**
- Accuracy vs. market comparables
- Outlier detection (flags unusual valuations)
- Confidence bounds
- Data quality
- Regulatory compliance

**Usage:**
```bash
# Check a single valuation
npm run gstack:valuation-checker -- --valuation-id=v123

# Check multiple valuations
npm run gstack:valuation-checker -- --valuation-ids=v123,v124,v125

# Check with strict confidence threshold
npm run gstack:valuation-checker -- --all --confidence=0.8
```

**Output:**
- Accuracy score (0-100)
- Confidence level (0.0-1.0)
- Outlier flag (if applicable)
- Data quality issues
- Recommendation (APPROVE/REVIEW/REJECT)

**Accuracy Score Interpretation:**
- 90+: High confidence, auto-approve
- 70-89: Medium confidence, manual review
- <70: Low confidence, request revision

**Typical results:**
```
Valuation: 4 Whitley Street, London
  Asking: £850,000
  AI Valuation: £825,000
  Market Estimate: £820,000 - £835,000
  
  Accuracy Score: 92/100 ✓ HIGH CONFIDENCE
  Confidence: 0.89
  Outlier Flag: No (within 1 std dev)
  
  Data Quality:
  - Location accuracy: ✓
  - Property attributes: ✓
  - Market data: ✓
  - Recent comps: ✓ (8 within 6 months)
  
  Recommendation: APPROVE
  
  Audit Trail:
  - Valuation generated: 2026-04-28 14:23 UTC
  - Model: Brit-Estate ML v2.1
  - Data sources: Rightmove, Land Registry, ONS
  - Reviewed: Not yet
```

---

### 4. landlord-report

**Purpose:** Generate comprehensive monthly landlord portfolio reports.

**Includes:**
- Rental income summary (received, pending, overdue)
- Tenant status (current, applications, churned)
- Property performance (yield, appreciation, cash flow)
- Maintenance alerts (upcoming, in-progress, done)
- Compliance check (safety certs, licenses)
- Tax-ready export

**Usage:**
```bash
# Generate April report for landlord
npm run gstack:landlord-report -- --landlord-id=l789 --month=april --format=pdf

# Generate current month
npm run gstack:landlord-report -- --landlord-id=l789

# Export as CSV for accountant
npm run gstack:landlord-report -- --landlord-id=l789 --format=csv
```

**Output:**
- PDF report (ready to send to tenant)
- CSV export (for accounting software)
- JSON export (for APIs)

**Report sections:**
1. Executive Summary (key metrics)
2. Portfolio Overview (property count, total value)
3. Income Statement (rent, expenses, net)
4. Tenant Status (current, new, departed)
5. Property Performance (yield, appreciation)
6. Maintenance Summary (upcoming, in-progress)
7. Compliance Checklist (safety, licenses, insurance)
8. Tax Data (ready for accountant)
9. Action Items (follow-ups)

**Typical results:**
```
LANDLORD PORTFOLIO REPORT
April 2026 — John Smith

EXECUTIVE SUMMARY
  Properties: 3
  Total Value: £1,250,000
  Monthly Income: £3,450
  Annual Return: 3.3%

INCOME
  Rent Received: £3,200
  Pending Payments: £250 (1 tenant, 5 days late)
  Total April: £3,200

PROPERTIES
  1. Flat 1, 4 Whitley Street — £400k value, £850/mo rent, 2.55% yield
  2. Flat 2, 4 Whitley Street — £400k value, £900/mo rent, 2.7% yield
  3. Studio, Knightsbridge — £450k value, £1,700/mo rent, 4.5% yield

TENANTS
  ✓ All tenants current
  ⏳ 1 application pending (move-in May 1)

COMPLIANCE
  ✓ Gas Safety: Flat 1 (expires June 30)
  ✓ Gas Safety: Flat 2 (expires June 30)
  ✓ EICR: Studio (expires Dec 2026)
  ⚠ Deposits: All 3 properties in prescribed scheme

MAINTENANCE
  📅 Upcoming: Boiler service (Flat 1, May 15)
  🔧 In Progress: Kitchen tap repair (Flat 2)
  ✓ Completed: Carpet cleaning (Studio, £340)

TAX DATA
  Total Rent: £10,350
  Expenses: £1,240 (repairs, management)
  Net: £9,110
  Deductible: £1,240
```

---

### 5. qa-marketplace

**Purpose:** Automated end-to-end testing of marketplace features.

**Tests:**
- Provider onboarding (sign up → verification)
- Reviews (submit, edit, delete, display)
- Ratings (aggregation accuracy)
- Leads (routing to correct providers)
- Messaging (real-time delivery)
- Quotes (generation and tracking)

**Usage:**
```bash
# Full marketplace QA
npm run gstack:qa-marketplace -- --url=https://staging.britstate.co.uk

# Test specific scenarios
npm run gstack:qa-marketplace -- --scenarios=onboarding,reviews,leads

# Quick smoke test
npm run gstack:qa-marketplace -- --quick

# Test on multiple browsers
npm run gstack:qa-marketplace -- --browsers=chromium,firefox,webkit
```

**Output:**
- Feature coverage (%)
- Pass/fail per scenario
- Performance metrics
- Browser compatibility matrix
- Screenshots of failures
- Recommendations

**Typical results:**
```
MARKETPLACE QA REPORT
Environment: staging.britstate.co.uk
Date: 2026-04-28 14:30 UTC
Duration: 12m 45s

FEATURE COVERAGE: 100% (6/6 scenarios)

SCENARIOS:
  ✓ Provider Onboarding (2m 10s)
    - Sign up form: PASS
    - Email verification: PASS
    - KYC document upload: PASS
    - Profile completion: PASS
  
  ✓ Review Submission (1m 30s)
    - Submit review form: PASS
    - Review display on profile: PASS (5s latency)
    - Edit review: PASS
    - Delete review: PASS
  
  ✓ Rating Aggregation (45s)
    - 5-star average accuracy: PASS
    - Distribution chart: PASS
    - Review count: PASS
  
  ✓ Lead Routing (2m 05s)
    - Lead delivered to provider: PASS (1.2s latency)
    - Provider notification: PASS (real-time)
    - Lead appears in dashboard: PASS
  
  ✓ Real-Time Messaging (2m 30s)
    - Message sent: PASS
    - Message received (real-time): PASS (0.8s latency)
    - Typing indicator: PASS
    - Read receipt: PASS
  
  ✓ Quote Generation (3m 45s)
    - Quote form visible: PASS
    - Quote submission: PASS (2.1s processing)
    - Quote appears in consumer dashboard: PASS
    - Quote notification: PASS

PERFORMANCE:
  Page Load Time: avg 0.8s, p95 1.2s ✓
  API Latency: avg 250ms, p95 500ms ✓
  Message Latency: avg 0.6s, p95 1.5s ✓
  Memory: peak 485 MB ✓

BROWSER COMPATIBILITY:
  Chrome: ✓
  Firefox: ✓
  Safari: ✓

RECOMMENDATIONS:
  - Message latency occasionally hits 1.5s (investigate)
  - Quote processing slow (2.1s) — optimize AI call
  - All other metrics excellent
```

---

### 6. release-notes

**Purpose:** Auto-generate release notes from git commits.

**Generates:**
- Feature summary (user-facing)
- Bug fixes (categorized by severity)
- Performance improvements
- Security patches
- Breaking changes (highlighted)
- Migration guide
- API changelog
- Contributors

**Usage:**
```bash
# Generate from v1.0.0 to v1.1.0
npm run gstack:release-notes -- --from=v1.0.0 --to=v1.1.0

# Generate from tag to HEAD
npm run gstack:release-notes -- --from=v1.1.0

# Generate detailed release notes
npm run gstack:release-notes -- --from=v1.0.0 --to=v1.1.0 --style=full
```

**Output:**
- Markdown-formatted release notes
- Ready to copy-paste to GitHub Releases
- Ready to send via email

**Typical results:**
```markdown
# Brit-Estate v1.2.0 — April 28, 2026

## ✨ New Features

### Properties (4 features)
- **AI Property Descriptions v2** — Improved description generation with better keyword usage
- **Property Valuation API** — New `/api/valuations` endpoint for valuations
- **Area Guides Auto-Publish** — Automatically publish area guides for new regions
- **Property Comparison Tool** — Compare up to 5 properties side-by-side

### Marketplace (2 features)
- **Provider Verification v2** — Enhanced KYC with document verification
- **Quote Expiry** — Quotes now auto-expire after 30 days

### Landlord Tools (3 features)
- **Tenant Application Screening** — AI-powered tenant pre-screening
- **Monthly Portfolio Reports** — Automated landlord reports (PDF export)
- **Maintenance Scheduling** — Schedule and track property maintenance

## 🐛 Bug Fixes

### Critical (1)
- **Property Search**: Fixed crash when searching with special characters in postcode

### High (3)
- **Marketplace**: Messages not syncing in real-time (race condition)
- **Dashboard**: Landlord income graph showing incorrect totals
- **Auth**: Password reset emails sometimes not delivered

### Medium (5)
- Property images not cached in CDN
- Valuation accuracy report 404 error
- Subscription renewal email typo
- And 2 more...

## 🚀 Performance Improvements

- **API Response Time**: 15% faster (avg 250ms → 210ms)
- **Dashboard Load**: 28% faster (avg 2.1s → 1.5s)
- **Search**: 40% faster pagination (50ms → 30ms)
- **Database**: Optimized 12 slow queries, improved indexes

## 🔒 Security Patches

- **Critical**: XSS vulnerability in property description field (CVE-2026-1234)
- **High**: CSRF token not validated on profile updates
- **Medium**: Rate limiting bypass on auth endpoints

## ⚠️ Breaking Changes

### Database
- `properties.description` field renamed to `properties.description_manual`
- New column `properties.description_ai_v2` for AI descriptions
- Run migrations: `npm run migrate`

### API
- `/api/valuations` endpoint moved to `/api/valuations/v2`
- Old endpoint deprecated, will remove in v1.3.0
- Authentication now required (was optional)

### Schemas
- Property schema includes new fields: `valuation_confidence`, `description_ai_version`

## 📖 Migration Guide

### For Users
No action required. All changes backward compatible.

### For Developers
1. Pull latest code
2. Run migrations: `npm run migrate`
3. Test with new schema
4. Update API calls to new `/v2` endpoints

### For Landlords
1. Log in to see new "Monthly Reports" button
2. Download PDF reports in Landlord Dashboard
3. No action needed — reports auto-generate monthly

## 👥 Contributors

This release was built by:
- garrytan (20 commits)
- claude (156 commits)
- jojo (12 commits)

## 📊 Release Stats

- **Commits**: 188
- **Files Changed**: 247
- **Lines Added**: 12,845
- **Lines Removed**: 3,102
- **Issues Closed**: 34
- **PRs Merged**: 18

**Full Changelog**: https://github.com/xxxxdjjojo/britv3/compare/v1.1.0...v1.2.0
```

---

## Running Skills Automatically

### Daily Listing Audit

Add to `.github/workflows/daily-audit.yml`:

```yaml
name: Daily Listing Audit
on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM UTC, every day

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: npm run gstack:audit-listings
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Pre-Deployment QA

Add to `.github/workflows/pre-deploy-qa.yml`:

```yaml
name: Pre-Deploy QA
on:
  workflow_dispatch:

jobs:
  qa:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: npm run gstack:qa-marketplace -- --url=https://staging.britstate.co.uk
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Monthly Landlord Reports

Add to `.github/workflows/monthly-reports.yml`:

```yaml
name: Generate Monthly Reports
on:
  schedule:
    - cron: '23 23 L * *'  # Last day of month, 11:23 PM UTC

jobs:
  reports:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: npm run gstack:landlord-report -- --all --format=pdf
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

---

## Performance Benchmarks

| Skill | Typical Time | Max Time | CPU | Memory |
|-------|-------------|----------|-----|--------|
| audit-listings (1) | 5-10s | 60s | Low | 100MB |
| audit-listings (1000) | 3-5min | 20min | Medium | 500MB |
| test-mls-sync (50) | 45-90s | 10min | High | 300MB |
| valuation-checker (1) | 0.5-1s | 5s | Low | 50MB |
| landlord-report (1) | 10-30s | 1min | Low | 150MB |
| qa-marketplace | 10-15min | 20min | High | 1GB |
| release-notes | 2-3min | 5min | Low | 100MB |

---

## Support

For issues:
1. Check `.gstack/skills-registry.json` for skill status
2. Review logs in `./logs/`
3. Check artifacts in `./artifacts/`
4. Open GitHub issue with logs + error message

---

**Happy automating! 🚀**
