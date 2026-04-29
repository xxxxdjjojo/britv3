# Audit Listings Skill

## Role
**AI Listing Quality Auditor** — Automatically audit property listings for quality, completeness, and compliance

## Purpose
Continuously audit property listings across the platform to ensure:
- ✅ All required fields are populated
- ✅ Description quality meets standards (AI-generated or manual)
- ✅ Image assets are properly ingested and cached
- ✅ Metadata is accurate (EPC, council tax, location data)
- ✅ SEO is optimized (keywords, schema markup, internal links)
- ✅ Compliance with fair housing and GDPR regulations
- ✅ Pricing is accurate relative to market comps

## Input
- `listing_ids`: String array (if empty, audit all listings)
- `profile`: "basic" | "comprehensive" | "compliance"
  - basic: Field completeness + image count (5 min)
  - comprehensive: Add description quality + SEO check (15 min)
  - compliance: Add GDPR/FHO validation + legal review (25 min)
- `save_results`: Boolean (default true — save to database)

## Process
1. Fetch listings from Supabase
2. Validate all required fields present and non-empty
3. Analyze description text:
   - Word count, reading level, keyword usage
   - Sentiment analysis (neutral, marketing language)
   - AI quality check (if generated via platform)
4. Check image asset pipeline:
   - Count images (target ≥10)
   - Verify cached in Supabase Storage
   - Check dimensions and file size
   - Analyze composition (exterior, rooms, details)
5. Verify metadata:
   - Location accuracy (lat/long)
   - EPC rating presence
   - Council tax band
   - Postcode validity
6. SEO analysis:
   - Title/description tags present
   - Keywords included naturally
   - Schema.org markup complete
   - Internal links count
7. Compliance check (if enabled):
   - Fair Housing compliance
   - GDPR data minimization
   - Cookie consent
   - Accessibility (WCAG 2.1 AA)

## Output
- **Quality scorecard** (0-100):
  - Completeness: 0-25
  - Description quality: 0-25
  - Images/media: 0-20
  - SEO: 0-20
  - Compliance: 0-10
- **Issues list** (priority-sorted):
  - Critical (must fix before listing live)
  - High (should fix within 1 week)
  - Medium (nice to fix)
  - Low (future improvement)
- **Recommendations** (auto-fixable + manual):
  - "Add [N] more images"
  - "Improve description quality: too short (<100 words)"
  - "Add EPC rating"
  - etc.
- **Compliance status**: PASS/WARN/FAIL with details

## Success Criteria
✅ Field completeness: 100%  
✅ Description quality score: ≥7/10  
✅ Image count: ≥10  
✅ Image cache hit rate: 100%  
✅ SEO score: ≥85/100  
✅ Compliance: PASS or WAR with clear fix list  
✅ Execution time: <1 min per listing (comprehensive profile)  

## Automation Opportunities
- Run daily on all listings (off-peak hours, batched)
- Auto-flag low-scoring listings for agent review
- Auto-fix common issues (missing EPC → lookup, bad coords → reverse geocode)
- Notify agents: "Your listings averaged 72/100 — here's how to improve"
- Track trends: Average score over time, identify patterns
- Tier pricing: Agents with >80/100 average get featured placement

## Example Scenarios
- **Daily audit**: 50,000 listings → 2-3 hours, identify bottom 5% for agent outreach
- **New listing check**: Auto-audit within 1 hour of publication, flag issues
- **Pre-featured**: Only list in "Featured" if score ≥80
- **Compliance sweep**: Monthly full compliance check on all listings
