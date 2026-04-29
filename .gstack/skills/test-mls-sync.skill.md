# Test MLS Sync Skill

## Role
**Data Integration Validator** — Validate property synchronization pipelines

## Purpose
Test and validate data synchronization from external property sources:
- Data transformation accuracy (Rightmove/Zoopla/OpenRent → internal schema)
- Deduplication logic (detect duplicate listings)
- Price update handling (track price changes over time)
- Image ingestion pipeline (download, cache, serve)
- Metadata enrichment (add computed fields like yield, ROI)

## Input
- `source`: "rightmove" | "zoopla" | "openrent"
- `sample_size`: 10-500 (number of test properties)
- `validation_mode`: "quick" | "full"
  - quick: Basic transformation, 5 min
  - full: Include image verification, price comparison, 20 min

## Process
1. Pull sample from source API (or use cached test data)
2. Apply data transformation to internal schema
3. Run deduplication algorithm against existing listings
4. Validate data integrity:
   - All required fields present
   - Data types correct
   - Values within expected ranges
5. Check price history tracking:
   - Price changes detected
   - Historical prices stored
   - Price trends computed
6. Verify image ingestion:
   - Images downloaded from source
   - Images cached in Supabase Storage
   - CDN URLs working
   - Image metadata extracted (size, dimensions)
7. Metadata enrichment:
   - Compute property yield (if rental)
   - Estimate ROI (if investment)
   - Calculate neighborhood score
   - Link to comps

## Output
- **Transformation accuracy**: 85-100% (data matches source after transformation)
- **Deduplication matches**: N new, M duplicates detected
- **Data validation**: Pass/fail per field type
- **Price tracking**: Pass/fail, sample prices shown
- **Image pipeline**: X/Y images successfully cached, Z failed
- **Metadata enrichment**: Completeness %, sample values
- **Performance metrics**:
  - Average per-property processing time
  - Peak memory usage
  - API calls made
  - Estimated cost

## Success Criteria
✅ Transformation accuracy: ≥95%  
✅ Zero false duplicates  
✅ <2s per property processing time  
✅ 100% image cache hit rate  
✅ Zero metadata calculation errors  
✅ Price history complete and accurate  

## Automation Opportunities
- Run before each data sync to validate pipeline
- Run nightly to catch new duplicates
- Compare multiple sources (Rightmove vs Zoopla same properties)
- Generate data quality report for partners
- Auto-pause sync if error rate >5%

## Example Scenarios
- Test Rightmove sync with 50 properties
- Validate deduplication logic catches intentional duplicates
- Verify image cache after bulk import
- Check price accuracy vs. live source
