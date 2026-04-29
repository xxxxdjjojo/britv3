# Landlord Report Skill

## Role
**Landlord Analytics Officer** — Generate automated landlord portfolio reports

## Purpose
Generate comprehensive monthly portfolio reports for landlords:
- Rental income summary (received, pending, overdue)
- Tenant status (current, pending application, evicted/churned)
- Property performance (yield %, appreciation, cash flow)
- Maintenance alerts (upcoming, in-progress, completed)
- Compliance check (safety certificates, licenses, insurance)
- Tax preparation data (income/expenses, depreciation, deductions)

## Input
- `landlord_id`: UUID
- `report_month`: "2026-04" or "April" or "current"
- `format`: "pdf" | "csv" | "json"
- `include_tax`: Boolean (default true)

## Process
1. Fetch landlord portfolio (all properties they own/manage)
2. Aggregate rental income:
   - Sum received payments
   - Identify pending payments
   - Flag overdue (>30 days)
3. Summarize tenant activity:
   - Current tenants (name, lease dates, status)
   - New applicants (pending decisions)
   - Churned tenants (moved out, evicted)
4. Calculate property performance:
   - Gross rental yield (annual rent / property value)
   - Net yield (after expenses/vacancy)
   - Cash flow (positive/negative)
   - Appreciation (value change vs. last quarter)
5. Maintenance tracking:
   - Alert for upcoming maintenance (boiler service, etc.)
   - In-progress items (repairs, renovations)
   - Completed work (invoices, costs)
6. Compliance verification:
   - Safety inspection date (Gas Safe, EICR)
   - Licenses current (where required)
   - Insurance active and adequate
   - Deposits protected (prescribed within 30 days)
7. Tax data extraction:
   - Rental income total
   - Expenses (mortgage interest, repairs, utilities, management)
   - Depreciation (if applicable)
   - Deductible items
   - Net profit/loss

## Output
- **Formatted report** (PDF, CSV, or JSON):
  - Executive summary (key metrics)
  - Portfolio overview (property count, total value, total income)
  - Income statement (rent received, expenses, net)
  - Tenant status table
  - Maintenance summary
  - Compliance checklist
  - Tax-ready export (for accountant)
  - Action items (follow-ups)

## Success Criteria
✅ 100% data accuracy  
✅ All properties included  
✅ All required fields populated  
✅ Formatting perfect (PDF readable, CSV importable)  
✅ <30 seconds to generate (typical portfolio)  
✅ Tax export audit-ready  

## Automation Opportunities
- Generate automatically on last day of month
- Email to landlord automatically
- Track trends (yield trend chart, tenant turnover)
- Alert for compliance issues
- Suggest tax optimization strategies
- Compare portfolio to neighborhood averages

## Example Scenarios
- Generate April report for 1 landlord
- Bulk generate for 1,000 landlords (scheduled monthly)
- Export tax data for accountant
- Compare properties: Which has best yield?
- Alert: Gas safe cert expires next month
