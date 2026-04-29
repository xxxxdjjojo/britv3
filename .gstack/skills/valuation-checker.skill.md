# Valuation Checker Skill

## Role
**Valuation Auditor** — Quality check AI-generated property valuations

## Purpose
Validate AI-generated property valuations for accuracy and reliability:
- Accuracy vs. market comparables (verify valuation within expected range)
- Data input validation (ensure inputs are correct and current)
- Outlier detection (flag unusual valuations)
- Confidence scoring (assess how confident the valuation is)
- Regulatory compliance (audit trail, data sources, methodology)

## Input
- `valuation_id` or `valuation_ids`: Array of valuation UUIDs
- `compare_method`: "market_comps" | "price_history" | "ml_model"
- `confidence_threshold`: 0.0-1.0 (default 0.65)

## Process
1. Fetch valuation and input data from database
2. Validate input data:
   - Location data (lat/long, postcode)
   - Property attributes (beds, baths, sqft, age)
   - Market data (recent sales, rentals)
   - Historical data (price trends)
3. Compare to market comparables:
   - Find similar properties recently sold
   - Calculate price per sqft, price per room
   - Check if valuation within standard deviation
4. Run outlier detection:
   - Statistical outlier test (Z-score, IQR)
   - Narrative outlier (compare to neighborhood trends)
   - Flag if unusual (e.g., 40% above market)
5. Verify confidence bounds:
   - Check data completeness (95%+ of inputs required)
   - Verify model accuracy track record
   - Assess comp similarity
6. Audit trail check:
   - Data sources logged
   - Methodology documented
   - Approvals recorded

## Output
- **Accuracy score**: 0-100
  - 90+: High confidence, ready to publish
  - 70-89: Medium confidence, review manually
  - <70: Low confidence, request revision
- **Outlier flag**: Yes/No with z-score
- **Confidence validation**: Score 0.0-1.0
- **Data quality issues**: List of missing/invalid inputs
- **Recommendation**: APPROVE | REVIEW | REJECT

## Success Criteria
✅ Accuracy score ≥85% on test set  
✅ Outliers correctly flagged  
✅ Confidence bounds reasonable  
✅ Audit trail complete  
✅ <5 second runtime per valuation  

## Automation Opportunities
- Auto-approve valuations with confidence >0.8
- Flag all <0.65 confidence for manual review
- Track accuracy over time (ground truth when property sells)
- Retrain model if accuracy drifts >5%
- Generate confidence reports for legal/compliance

## Example Scenarios
- Validate 1,000 AI valuations generated this month
- Compare valuations vs. actual sale prices from past 3 months
- Identify properties where valuation was wrong by >10%
- Generate accuracy report by neighborhood
