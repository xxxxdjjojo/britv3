---
status: testing
phase: 07-production-readiness
source: [07-01-SUMMARY.md, 07-02-SUMMARY.md, 07-03-SUMMARY.md, 07-04-SUMMARY.md, 07-05-SUMMARY.md, 07-06-SUMMARY.md, 07-07-SUMMARY.md, 07-08-SUMMARY.md, 07-10-SUMMARY.md]
started: 2026-03-08T00:00:00Z
updated: 2026-03-08T00:00:00Z
---

## Current Test

<!-- OVERWRITE each test - shows where we are -->

number: 2
name: Offline Indicator Banner
expected: |
  With the dev server running and the app open, use DevTools → Network tab → set throttling to "Offline".
  The page should display an amber/yellow banner indicating you are offline.
  Going back online should hide it.
awaiting: user response

## Tests

### 1. PWA Manifest Served
expected: Navigate to http://localhost:3000/manifest.webmanifest. Should return JSON with Britestate brand config (name, theme_color "#005F73", display "standalone", 3 icon entries).
result: pass

### 2. Offline Indicator Banner
expected: With the dev server running and the app open, use DevTools → Network tab → set throttling to "Offline". The page should display an amber/yellow banner indicating you are offline. Going back online should hide it.
result: [pending]

### 3. Install Prompt (Deferred to 2nd Visit)
expected: Open DevTools → Application → Local Storage → set `britestate_visit_count` to `2`. Reload the page. An install prompt/banner should appear offering to install the app. In standalone mode (if installed) the banner should be hidden.
result: [pending]

### 4. Admin Access Guard
expected: While logged in as a non-admin user, navigate to http://localhost:3000/admin. You should be immediately redirected to the homepage (/). Admin-only users can access /admin; regular users cannot.
result: [pending]

### 5. Admin Dashboard Count Cards
expected: Log in as an admin user (or set is_admin=true on your profile in Supabase) and navigate to /admin. You should see a dashboard with 5 metric count cards (e.g. Users, Properties, Reviews, Reports, Providers). Each card shows a count and a Lucide icon. The sidebar should be visible with navigation links.
result: [pending]

### 6. Help Page FAQ Accordion
expected: Navigate to http://localhost:3000/help (no login required). You should see a help center page with multiple FAQ sections (Account & Registration, Property Search, Service Providers, Messaging, Landlord Tools, Payments & Billing). Clicking a question should expand to reveal the answer. A "Contact Us" CTA at the bottom links to /contact.
result: [pending]

### 7. Contact Form Submission
expected: Navigate to http://localhost:3000/contact. Fill in Name, Email, Subject, and Message (min 20 chars) and submit. You should see a success confirmation state. If you submit 4 times within an hour from the same IP, the 4th attempt should show a rate limit error.
result: [pending]

### 8. Mobile Bottom Tab Bar
expected: Open a protected page (e.g. /dashboard/homebuyer) on a mobile viewport (< 768px wide, use DevTools device emulation). A fixed bottom navigation bar with 5 role-appropriate tabs should appear (e.g. Search, Saved, Viewings, Messages, Profile for a homebuyer). On desktop (≥ 768px) it should be hidden.
result: [pending]

### 9. Pull-to-Refresh Gesture
expected: On a mobile viewport (DevTools device emulation with touch enabled), open a protected dashboard page. Scroll to the very top, then drag downward slowly. A spinning refresh icon (RefreshCw) should appear after pulling ~60px. Releasing should trigger a data refresh (page re-fetches server data).
result: [pending]

### 10. Admin User Management Page
expected: Logged in as admin, navigate to /admin/users. You should see a table of platform users with columns: Name, Email, Role, Status, Created, Actions. A search field at top lets you search by name/email. Each active user has a Suspend button; suspended users have an Activate button. Clicking View opens a detail modal/overlay.
result: [pending]

### 11. Admin Listing Moderation Queue
expected: Logged in as admin, navigate to /admin/moderation. You should see cards for flagged property listings. Each card shows flag details with severity badges (red for high, yellow for medium, blue for low). Approve and Reject buttons are present. If no flagged listings exist, an empty state is shown.
result: [pending]

### 12. Admin Verification Queue
expected: Logged in as admin, navigate to /admin/verifications. You should see provider verification request cards showing provider name, business name, email, and submission date. An Approve and Reject button are present, plus a notes field. If no pending verifications, an empty state is shown.
result: [pending]

### 13. Admin Review Moderation Queue
expected: Logged in as admin, navigate to /admin/reviews. You should see reported review cards with report ID, reason, and submission date. Each card has a "Remove Review" button and a "Dismiss Report" button. If no reported reviews, an empty state is shown.
result: [pending]

## Summary

total: 13
passed: 0
issues: 0
pending: 13
skipped: 0

## Gaps

[none yet]
