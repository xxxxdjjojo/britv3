---
status: testing
phase: 06-landlord-tools
source: 06-01-SUMMARY.md, 06-02-SUMMARY.md, 06-03-SUMMARY.md, 06-04-SUMMARY.md, 06-05-SUMMARY.md
started: 2026-03-08T00:00:00Z
updated: 2026-03-08T00:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 1
name: Portfolio Grid
expected: |
  Navigate to /dashboard/landlord/portfolio. A grid of property cards displays showing each property with summary info (tenant name, maintenance count, compliance status). If no properties exist, an empty state message is shown.
awaiting: user response

## Tests

### 1. Portfolio Grid
expected: Navigate to /dashboard/landlord/portfolio. A grid of property cards displays showing each property with summary info (tenant name, maintenance count, compliance status). If no properties exist, an empty state message is shown.
result: [pending]

### 2. Property Overview Page
expected: Click a property card from the portfolio. The property overview page loads at /dashboard/landlord/properties/[id]/overview with quick links to tenancies, maintenance, financials, and documents sections.
result: [pending]

### 3. Create Tenancy
expected: Navigate to a property's tenancies page. Click to add a new tenancy. A form appears with fields for tenant email, start date, end date, rent amount, rent frequency, and deposit. Submitting with valid data creates the tenancy and shows it in the list.
result: [pending]

### 4. View and Edit Tenancy
expected: From the tenancies list, click a tenancy to view its detail page. The page shows tenancy info with options to edit fields and end the tenancy. Editing updates the tenancy; ending it changes status to ended.
result: [pending]

### 5. Maintenance Request List
expected: Navigate to a property's maintenance page. A list of maintenance requests displays with status badges (color-coded). Filter controls allow filtering by status.
result: [pending]

### 6. Create Maintenance Request
expected: Click to create a new maintenance request. A form appears with title, description, priority selector, and photo upload. Photos show previews before submission. Submitting creates the request with status "new".
result: [pending]

### 7. Maintenance Status Transitions
expected: Open a maintenance request detail page. Status transition buttons show only valid next states (e.g., new -> acknowledged -> assigned -> in_progress -> resolved -> closed). Clicking a transition updates the status. Resolution notes field appears for resolve/close transitions.
result: [pending]

### 8. Provider Assignment
expected: On a maintenance request detail page, a provider assignment section shows a link to the marketplace and manual input fields for provider name/ID. Entering provider info and saving updates the request.
result: [pending]

### 9. Financial Summary with Period Selector
expected: Navigate to a property's financials page. Summary cards show total income, total expenses, and net for the selected period. A period selector allows switching between this month, quarter, year-to-date, and last 12 months.
result: [pending]

### 10. Log Income/Expense Entry
expected: On the financials page, a form allows creating income or expense entries with amount, description, date, and optional receipt upload. Toggling between income and expense changes the entry type. Submitting adds the entry to the recent entries table below.
result: [pending]

### 11. Rent Status Indicator
expected: On the financials page, a rent status indicator shows the current rent payment status (paid, partial, overdue, or not due) derived from actual payments in the current period. The status updates based on logged rent payments.
result: [pending]

### 12. Document Upload and List
expected: Navigate to a property's documents page. Upload a document (PDF, JPEG, or PNG) with a category and optional expiry date. The document appears in the list with an expiry status indicator: green (>30 days), amber (<=30 days), red (expired), or none (no expiry set).
result: [pending]

### 13. Compliance Alert Banner
expected: If any compliance documents (gas safety, EPC, electrical) are expiring within 30 days or expired, an amber/red alert banner appears on the property pages warning the landlord to take action.
result: [pending]

### 14. Lease PDF Generation
expected: From a tenancy detail page, navigate to the lease generation page. A lease preview shows all 7 AST sections pre-filled from tenancy data. A "Generate PDF" button creates and downloads the lease as a PDF. A "Save to Documents" option stores it in the property's documents.
result: [pending]

### 15. Compliance Guide Page
expected: Navigate to /dashboard/landlord/compliance-guide. A static page displays 8 UK landlord compliance requirements with descriptions and links to gov.uk resources.
result: [pending]

## Summary

total: 15
passed: 0
issues: 0
pending: 15
skipped: 0

## Gaps

[none yet]
