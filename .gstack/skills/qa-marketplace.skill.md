# QA Marketplace Skill

## Role
**Marketplace Quality Officer** — Automated testing of marketplace features

## Purpose
Automated end-to-end testing of marketplace features:
- Provider onboarding flow (sign up, verification, profile setup)
- Review submission and display (post, edit, delete)
- Rating aggregation accuracy (average, distribution)
- Lead routing and delivery (quote requests sent to correct providers)
- Real-time messaging (messages delivered instantly, appear in UI)
- Quote generation (forms work, responses tracked)

## Input
- `environment_url`: "https://staging.britstate.co.uk"
- `test_scenarios`: ["onboarding", "reviews", "leads", "messaging", "quotes"] or "all"
- `headless`: Boolean (default true)
- `browsers`: ["chromium", "firefox", "webkit"] or specific browser

## Process
1. Provision test accounts:
   - Create test provider account (new)
   - Create test consumer account (new)
2. Provider onboarding (headless browser):
   - Navigate to signup
   - Fill form (email, password, business info)
   - Verify email (use test inbox)
   - Complete KYC/identity verification
   - Upload business documents
   - Verify account created in database
3. Review submission flow:
   - Consumer submits review (1-5 stars, text)
   - Review saved to database
   - Review appears on provider profile
   - Review aggregation updated (average rating, count)
4. Lead routing test:
   - Consumer submits quote request
   - System identifies appropriate providers
   - Lead delivered to provider inbox (real-time)
   - Provider receives notification
5. Messaging test:
   - Send test message
   - Verify message in database
   - Verify message appears in real-time in UI
   - Test latency (<1s)
6. Quote generation:
   - Provider submits quote
   - Quote appears in consumer dashboard
   - Notifications sent
   - Messages synced

## Output
- **Feature coverage**: % of scenarios tested
- **Pass/fail per scenario**: Detailed pass/fail list
- **Performance metrics**:
  - Page load time
  - Message latency
  - Lead delivery time
  - Response times
- **Browser compatibility matrix**:
  - Chrome ✓/✗
  - Firefox ✓/✗
  - Safari ✓/✗
- **Screenshots/video**: Of any failures
- **Recommendations**: Issues to fix

## Success Criteria
✅ 100% scenario pass rate  
✅ <2s latency on all operations  
✅ Zero data inconsistencies  
✅ Mobile responsive ✓  
✅ All 3 browsers passing  
✅ <15 minute total runtime  

## Automation Opportunities
- Run before every deployment
- Run nightly for regression testing
- Run on multiple networks (ensure performance consistent)
- Compare performance vs. baseline

## Example Scenarios
- Full marketplace QA before release
- Smoke test before deployment
- New provider flow test
- New consumer flow test
- Load test with 100 concurrent users
