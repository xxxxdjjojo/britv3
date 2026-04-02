Tradesperson/Service Provider — 10 FAANG-Level End-to-End User Flow Scenarios                                                                                                        
                                                                
 Context                             

 Britestate is a UK property portal with a comprehensive tradesperson dashboard (25 pages, 27 components, 10 service files, 16 API endpoints). These 10 scenarios test the complete
 tradesperson experience from signup to business growth, covering happy paths, edge cases, error recovery, and cross-feature integration.

 Goal: Validate every critical user journey a tradesperson takes on the platform, identify what works and what doesn't, and ensure FAANG-level quality across onboarding,
 verification, quoting, job management, payments, reviews, analytics, and growth features.

 ---
 Scenario 1: "First Day on the Platform" — New Provider Onboarding to First Lead

 Persona

 - Name: Dave Mitchell
 - Trade: Plumber (Gas Safe registered)
 - Experience: 12 years, sole trader
 - Location: SE15 (Peckham, London)
 - Goal: Get set up on Britestate and start receiving leads within 24 hours

 Preconditions

 - No existing account
 - Has Gas Safe certificate, public liability insurance, 3 client references ready

 Flow

 ┌──────┬───────────────────────────────────────┬──────────────────────────────────────────────────┬─────────────────────────────────────┬──────────────────────────────────────┐
 │ Step │                Action                 │                  Page/Component                  │           System Response           │             State Change             │
 ├──────┼───────────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────┼──────────────────────────────────────┤
 │ 1    │ Visits britestate.com, clicks "List   │ Homepage → /register?professional=provider       │ Shows RegisterForm with             │ —                                    │
 │      │ as Professional"                      │                                                  │ service_provider pre-selected       │                                      │
 ├──────┼───────────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────┼──────────────────────────────────────┤
 │ 2    │ Fills: Dave Mitchell,                 │ RegisterForm.tsx                                 │ Validates password (8+ chars,       │ —                                    │
 │      │ dave@mitchellplumbing.co.uk, password │                                                  │ uppercase, number)                  │                                      │
 ├──────┼───────────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────┼──────────────────────────────────────┤
 │      │                                       │                                                  │ Creates auth.users + profiles row,  │ profiles row created, user_roles     │
 │ 3    │ Submits registration                  │ POST /auth/signup                                │ assigns service_provider role via   │ row: service_provider                │
 │      │                                       │                                                  │ assign_role_atomic RPC              │                                      │
 ├──────┼───────────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────┼──────────────────────────────────────┤
 │ 4    │ Redirected to verify-email page       │ /verify-email                                    │ Supabase sends confirmation email   │ —                                    │
 ├──────┼───────────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────┼──────────────────────────────────────┤
 │ 5    │ Clicks email link                     │ Email → /auth/callback                           │ exchangeCodeForSession(), detects   │ Session created                      │
 │      │                                       │                                                  │ new user, sends welcome email       │                                      │
 ├──────┼───────────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────┼──────────────────────────────────────┤
 │ 6    │ Redirected to onboarding              │ /register/onboarding/provider →                  │ Shows Step 1: Trade Category        │ —                                    │
 │      │                                       │ TradespersonOnboarding.tsx                       │                                     │                                      │
 ├──────┼───────────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────┼──────────────────────────────────────┤
 │ 7    │ Selects "Plumber" and "Gas Engineer"  │ Step 1 of onboarding wizard                      │ Validates at least 1 category       │ —                                    │
 │      │                                       │                                                  │ selected                            │                                      │
 ├──────┼───────────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────┼──────────────────────────────────────┤
 │ 8    │ Selects coverage: "London", "South    │ Step 2: Coverage Area                            │ Shows UK region checkboxes          │ —                                    │
 │      │ East"                                 │                                                  │                                     │                                      │
 ├──────┼───────────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────┼──────────────────────────────────────┤
 │      │ Enters Gas Safe reg number, selects   │                                                  │                                     │                                      │
 │ 9    │ "Gas Safe" accreditation, enters      │ Step 3: Credentials                              │ Optional fields accepted            │ —                                    │
 │      │ insurance policy number               │                                                  │                                     │                                      │
 ├──────┼───────────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────┼──────────────────────────────────────┤
 │ 10   │ Selects Mon-Sat available, "Same day" │ Step 4: Availability                             │ Validates at least 1 day selected   │ —                                    │
 │      │  response time                        │                                                  │                                     │                                      │
 ├──────┼───────────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────┼──────────────────────────────────────┤
 │ 11   │ Clicks "Complete Setup"               │ TradespersonOnboarding.tsx                       │ Upserts service_provider_profiles,  │ service_provider_profiles created,   │
 │      │                                       │                                                  │ bulk upserts provider_service_areas │ 2x provider_service_areas rows       │
 ├──────┼───────────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────┼──────────────────────────────────────┤
 │      │                                       │                                                  │ Shows ProviderDashboard.tsx with    │ profiles.active_role =               │
 │ 12   │ Redirected to provider dashboard      │ /dashboard/provider                              │ empty KPIs, verification prompt     │ service_provider                     │
 │      │                                       │                                                  │ banner                              │                                      │
 ├──────┼───────────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────┼──────────────────────────────────────┤
 │ 13   │ Sees "Complete verification to appear │ ProviderDashboard.tsx → VerificationStepper.tsx  │ Shows 0/5 steps complete            │ —                                    │
 │      │  in search" banner                    │                                                  │                                     │                                      │
 ├──────┼───────────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────┼──────────────────────────────────────┤
 │      │                                       │                                                  │ Shows 5-step stepper: ID,           │                                      │
 │ 14   │ Clicks banner → Verification Centre   │ /dashboard/provider/verification                 │ Insurance, Qualifications, Client   │ —                                    │
 │      │                                       │                                                  │ Refs, Peer Refs                     │                                      │
 ├──────┼───────────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────┼──────────────────────────────────────┤
 │ 15   │ Uploads passport photo for ID         │ /dashboard/provider/verification/credentials →   │ File uploaded to Supabase Storage   │ provider_documents row:              │
 │      │ verification                          │ CredentialUploadCard.tsx                         │ (private bucket), EXIF stripped     │ type=identity_proof, status=pending  │
 ├──────┼───────────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────┼──────────────────────────────────────┤
 │ 16   │ Uploads Gas Safe certificate          │ Same page                                        │ Validates PDF/JPEG/PNG/WebP, max    │ provider_documents row:              │
 │      │                                       │                                                  │ 10MB                                │ type=gas_safe_certificate            │
 ├──────┼───────────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────┼──────────────────────────────────────┤
 │ 17   │ Uploads public liability insurance    │ Same page                                        │ Stores with expiry date             │ provider_documents row:              │
 │      │ cert                                  │                                                  │                                     │ type=public_liability_insurance      │
 ├──────┼───────────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────┼──────────────────────────────────────┤
 │ 18   │ Returns to dashboard, sees 3/5        │ /dashboard/provider                              │ Stepper shows progress, still       │ verification_status = pending_review │
 │      │ verification steps initiated          │                                                  │ "unverified" until admin review     │                                      │
 └──────┴───────────────────────────────────────┴──────────────────────────────────────────────────┴─────────────────────────────────────┴──────────────────────────────────────┘

 Notifications

 - Email: Welcome email (step 5)
 - In-app: "Complete your verification" persistent banner
 - Email: "Verification documents received" confirmation

 Success Criteria

 - Account created with correct role and trade categories
 - Onboarding data persisted correctly in service_provider_profiles
 - Service areas saved for London + South East
 - 3 verification documents uploaded to Supabase Storage
 - Dashboard loads with empty-state KPIs
 - Verification stepper reflects uploaded documents

 Failure Points

 ┌─────────────────────────────────┬──────────────────────────────────────────────────────────┐
 │             Failure             │                    Expected Handling                     │
 ├─────────────────────────────────┼──────────────────────────────────────────────────────────┤
 │ Email already registered        │ RegisterForm shows "Email already in use" error          │
 ├─────────────────────────────────┼──────────────────────────────────────────────────────────┤
 │ File upload > 10MB              │ Client-side validation blocks, shows size error          │
 ├─────────────────────────────────┼──────────────────────────────────────────────────────────┤
 │ Invalid file type (.doc)        │ Server-side magic byte check rejects, shows format error │
 ├─────────────────────────────────┼──────────────────────────────────────────────────────────┤
 │ Network drops during onboarding │ localStorage preserves form state, resume on reconnect   │
 ├─────────────────────────────────┼──────────────────────────────────────────────────────────┤
 │ Supabase Storage bucket full    │ 500 error caught, user shown retry prompt                │
 └─────────────────────────────────┴──────────────────────────────────────────────────────────┘

 Metrics to Track

 - provider_signup_started, provider_signup_completed
 - onboarding_step_completed (step 1-4)
 - verification_document_uploaded (per type)
 - Time from signup to first document upload

 ---
 Scenario 2: "Getting Verified" — Full Verification Pipeline with References

 Persona

 - Name: Sarah Chen
 - Trade: Electrician (NICEIC registered)
 - Experience: 8 years, runs a 3-person team
 - Location: M14 (Manchester)
 - Goal: Achieve full "Verified" status with all badges to appear in marketplace search

 Preconditions

 - Registered account, onboarding complete
 - verification_status = unverified
 - Has completed 20+ jobs outside the platform

 Flow

 ┌──────┬─────────────────────────────────┬─────────────────────────────────────────────┬──────────────────────────────────────────────┬────────────────────────────────────────┐
 │ Step │             Action              │               Page/Component                │               System Response                │              State Change              │
 ├──────┼─────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────────┤
 │      │                                 │ /dashboard/provider/verification →          │ Shows 5 steps: ID (0%), Insurance (0%),      │                                        │
 │ 1    │ Opens Verification Centre       │ VerificationStepper.tsx                     │ Qualifications (0%), Client Refs (0%), Peer  │ —                                      │
 │      │                                 │                                             │ Refs (0%)                                    │                                        │
 ├──────┼─────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────────┤
 │ 2    │ Step 1 — ID: Uploads driver's   │ /verification/credentials →                 │ Two files uploaded, EXIF stripped, stored in │ 2x provider_documents rows:            │
 │      │ license (front + back)          │ CredentialUploadCard.tsx                    │  private bucket                              │ identity_proof                         │
 ├──────┼─────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────────┤
 │      │ Step 2 — Insurance: Uploads PL  │                                             │ Stores with expiry_date, system schedules    │ provider_documents:                    │
 │ 3    │ insurance cert (expiry:         │ Same page                                   │ 30-day renewal reminder                      │ public_liability_insurance, expiry     │
 │      │ 2027-03-15)                     │                                             │                                              │ tracked                                │
 ├──────┼─────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────────┤
 │      │ Step 3 — Qualifications:        │                                             │                                              │ provider_documents:                    │
 │ 4    │ Uploads NICEIC registration     │ Same page                                   │ Validates document, stores                   │ niceic_registration                    │
 │      │ cert                            │                                             │                                              │                                        │
 ├──────┼─────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────────┤
 │ 5    │ Uploads Part P Building         │ Same page                                   │ Second qualification document                │ provider_documents: part_p_certificate │
 │      │ Regulations cert                │                                             │                                              │                                        │
 ├──────┼─────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────────┤
 │ 6    │ Step 4 — Client References:     │ /verification/client-references →           │ Shows reference request form                 │ —                                      │
 │      │ Clicks "Request References"     │ ReferenceTracker.tsx type="client"          │                                              │                                        │
 ├──────┼─────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────────┤
 │ 7    │ Enters 3 client emails and      │ Reference request form                      │ Creates 3 pending reference records, queues  │ 3x provider_references rows:           │
 │      │ project descriptions            │                                             │ Inngest email jobs                           │ type=client, status=pending            │
 ├──────┼─────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────────┤
 │ 8    │ Client #1 receives email,       │ External email → reference submission page  │ Reference submitted and recorded             │ Reference #1: status=submitted         │
 │      │ clicks link, submits reference  │                                             │                                              │                                        │
 ├──────┼─────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────────┤
 │ 9    │ Client #2 submits reference     │ Same flow                                   │ Second reference recorded                    │ Reference #2: status=submitted         │
 ├──────┼─────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────────┤
 │ 10   │ Client #3 ignores email for 7   │ —                                           │ System sends reminder email at day 5         │ Reminder email queued                  │
 │      │ days                            │                                             │                                              │                                        │
 ├──────┼─────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────────┤
 │ 11   │ Client #3 finally submits       │ Email reminder → submission page            │ Third reference recorded                     │ Reference #3: status=submitted         │
 ├──────┼─────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────────┤
 │ 12   │ Step 5 — Peer References:       │ /verification/peer-references →             │ Creates pending peer reference records       │ 2x provider_references rows:           │
 │      │ Requests 2 peer references      │ ReferenceTracker.tsx type="peer"            │                                              │ type=peer, status=pending              │
 ├──────┼─────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────────┤
 │ 13   │ Both peers submit references    │ External flow                               │ References recorded                          │ Both: status=submitted                 │
 ├──────┼─────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────────┤
 │ 14   │ Admin reviews all documents and │ Admin panel (out of scope)                  │ Admin approves all items                     │ All documents: status=approved, all    │
 │      │  references                     │                                             │                                              │ references: status=verified            │
 ├──────┼─────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────────┤
 │ 15   │ System updates verification     │ Background job                              │ Provider now "verified"                      │ verification_status = verified         │
 │      │ status                          │                                             │                                              │                                        │
 ├──────┼─────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────────┤
 │ 16   │ Sarah receives notification     │ In-app + email                              │ "Congratulations! Your profile is now        │ —                                      │
 │      │                                 │                                             │ verified"                                    │                                        │
 ├──────┼─────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────────┤
 │      │                                 │                                             │ Shows earned badges: "ID Verified",          │                                        │
 │ 17   │ Checks badge gallery            │ /verification/badges → BadgeGallery.tsx     │ "Insured", "NICEIC Certified", "Client       │ 5x provider_badges rows                │
 │      │                                 │                                             │ Approved", "Peer Endorsed"                   │                                        │
 ├──────┼─────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────────┤
 │ 18   │ Profile now visible in          │ /api/providers/search                       │ Sarah's profile appears in search results    │ —                                      │
 │      │ marketplace search              │                                             │ for electricians in Manchester               │                                        │
 └──────┴─────────────────────────────────┴─────────────────────────────────────────────┴──────────────────────────────────────────────┴────────────────────────────────────────┘

 Notifications

 - Email to each reference request recipient (6 total)
 - Email reminder for non-responsive references (day 5)
 - In-app: Step completion notifications
 - Email + In-app: "Verification complete" celebration
 - Email: Insurance expiry reminder (30 days before 2027-03-15)

 Success Criteria

 - All 5 verification steps completed
 - verification_status transitions: unverified → pending_review → verified
 - 5 badges earned and displayed in BadgeGallery
 - Profile appears in marketplace search results
 - Insurance expiry date tracked with renewal reminder scheduled
 - All documents stored securely in private Supabase Storage bucket

 Failure Points

 ┌─────────────────────────────────────────┬─────────────────────────────────────────────────────────────┐
 │                 Failure                 │                      Expected Handling                      │
 ├─────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
 │ Reference recipient email bounces       │ Inngest job fails, Sarah notified to update email           │
 ├─────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
 │ Admin rejects a document (blurry photo) │ Status → rejected with reason, Sarah notified to re-upload  │
 ├─────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
 │ Insurance cert expired                  │ Validation catches expiry < today, prompts for current cert │
 ├─────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
 │ Duplicate reference email submitted     │ System deduplicates by email per provider                   │
 ├─────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
 │ Admin takes > 48 hours to review        │ Escalation flag raised in admin queue                       │
 └─────────────────────────────────────────┴─────────────────────────────────────────────────────────────┘

 Metrics to Track

 - verification_step_initiated, verification_step_completed (per step)
 - reference_request_sent, reference_submitted, reference_reminder_sent
 - Time from first upload to full verification
 - Admin review SLA (target: 48h average)

 ---
 Scenario 3: "Winning Work" — Lead Discovery, AI Quote Assist, and Securing a Job

 Persona

 - Name: James Okafor
 - Trade: Painter & Decorator
 - Experience: 5 years
 - Location: BS1 (Bristol)
 - Goal: Respond to a matched lead using AI Quote Assist and win the job

 Preconditions

 - Verified account, subscription active
 - Services: Interior painting, exterior painting, wallpapering
 - Coverage: Bristol, South West
 - Average rating: 4.7 (15 reviews)

 Flow

 Step: 1
 Action: Homeowner in BS3 creates RFQ: "Repaint 3-bed Victorian terrace, all rooms"
 Page/Component: Customer side (out of scope)
 System Response: RFQ matching algorithm runs: category match (50pts) + postcode overlap (30pts) + proximity (20pts) + rating bonus (9.4pts) = 109.4
 State Change: service_requests row created, status=open
 ────────────────────────────────────────
 Step: 2
 Action: James matched as #2 of top 10 providers
 Page/Component: Matching engine
 System Response: In-app notification fires immediately
 State Change: Match record created
 ────────────────────────────────────────
 Step: 3
 Action: Sees notification bell badge on dashboard
 Page/Component: /dashboard/provider → ProviderDashboard.tsx
 System Response: New lead count incremented in KPI card
 State Change: —
 ────────────────────────────────────────
 Step: 4
 Action: Clicks "New Leads" or notification
 Page/Component: /dashboard/provider/jobs/leads → JobLeadsClient.tsx
 System Response: Shows lead card with: title, location (BS3), budget (£2,000-£3,500), urgency: medium, 47h remaining
 State Change: —
 ────────────────────────────────────────
 Step: 5
 Action: Clicks lead to view details
 Page/Component: JobLeadCard.tsx expanded view
 System Response: Full description, 3 photos of rooms, property type, preferred start date (2 weeks), customer's message
 State Change: RFQ view_count incremented
 ────────────────────────────────────────
 Step: 6
 Action: Clicks "Create Quote"
 Page/Component: /dashboard/provider/quotes/builder → QuoteBuilderForm.tsx
 System Response: Empty quote form pre-linked to this RFQ
 State Change: —
 ────────────────────────────────────────
 Step: 7
 Action: Types job title: "Full interior repaint, 3-bed Victorian terrace"
 Page/Component: Quote builder title field
 System Response: —
 State Change: —
 ────────────────────────────────────────
 Step: 8
 Action: Clicks "AI Suggest Items" button
 Page/Component: GET /api/provider/quotes/suggest-items
 System Response: Claude Haiku generates line items: Preparation & masking (£350), Primer coat all rooms (£400), 2x topcoat bedrooms (£600), 2x topcoat living areas (£500), Hallway
 &
   stairs (£300), Materials (£450)
 State Change: —
 ────────────────────────────────────────
 Step: 9
 Action: Reviews AI suggestions, adjusts: removes "Materials" (will supply own), adds "Skirting boards & door frames" (£200)
 Page/Component: QuoteBuilderForm.tsx line item editor
 System Response: localStorage auto-save triggers every 30s
 State Change: quote_draft_{providerId} in localStorage
 ────────────────────────────────────────
 Step: 10
 Action: Sets total: £2,350, adds scope of work, 14-day validity, 20% deposit terms
 Page/Component: Quote form fields
 System Response: Real-time total calculation
 State Change: —
 ────────────────────────────────────────
 Step: 11
 Action: Clicks "Preview Quote"
 Page/Component: QuotePreview.tsx
 System Response: Shows formatted quote with all line items, terms, total
 State Change: —
 ────────────────────────────────────────
 Step: 12
 Action: Clicks "Send Quote"
 Page/Component: POST /api/provider/quotes then POST /api/provider/quotes/{id}/send
 System Response: Quote created as draft, then transitioned to "sent" status. Inngest event fires customer notification. localStorage draft cleared.
 State Change: quotes row: status=sent, quote_number=QT-2026-0847
 ────────────────────────────────────────
 Step: 13
 Action: Customer receives quote notification
 Page/Component: Customer email + in-app
 System Response: Quote visible in customer's RFQ detail page
 State Change: —
 ────────────────────────────────────────
 Step: 14
 Action: James checks quote status on dashboard
 Page/Component: /dashboard/provider/quotes/builder or jobs list
 System Response: Shows "Sent" badge, waiting for response
 State Change: —
 ────────────────────────────────────────
 Step: 15
 Action: Customer views quote
 Page/Component: Customer side
 System Response: James gets "Quote viewed" in-app notification
 State Change: quotes.status = viewed
 ────────────────────────────────────────
 Step: 16
 Action: Customer accepts James's quote
 Page/Component: Customer side
 System Response: Booking auto-created, other providers' quotes declined
 State Change: bookings row created: status=pending_confirmation, quotes.status = accepted
 ────────────────────────────────────────
 Step: 17
 Action: James receives "Quote Accepted!" notification
 Page/Component: In-app + email
 System Response: Confetti animation, booking details shown
 State Change: —
 ────────────────────────────────────────
 Step: 18
 Action: James confirms booking on his end
 Page/Component: /dashboard/provider/jobs/{id} → JobDetailView.tsx
 System Response: Clicks "Confirm Booking" button
 State Change: bookings.status = confirmed, booking_status_history logged
 ────────────────────────────────────────
 Step: 19
 Action: Lead removed from leads list, appears in active jobs
 Page/Component: /dashboard/provider/jobs/active
 System Response: Job card shows: confirmed, scheduled date, customer contact details
 State Change: —

 Notifications

 - In-app: New matched lead (immediate, step 2)
 - Email: New lead (if unread after 1 hour)
 - In-app: "Quote viewed" (step 15)
 - In-app + Email: "Quote accepted!" (step 16)
 - In-app: Booking confirmed (step 18)

 Success Criteria

 - RFQ matching scored correctly (category + postcode + proximity + rating)
 - AI Quote Assist generates relevant, correctly-priced line items for painting
 - localStorage auto-save prevents data loss during quote creation
 - Quote number auto-generated in QT-YYYY-NNNN format
 - Quote status transitions: draft → sent → viewed → accepted
 - Booking auto-created on acceptance with correct reference number
 - Lead moves from leads list to active jobs on confirmation

 Failure Points

 ┌──────────────────────────────────────────┬───────────────────────────────────────────────────────────────────────────┐
 │                 Failure                  │                             Expected Handling                             │
 ├──────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
 │ AI Quote Assist API timeout              │ Graceful fallback — empty line items with "Add manually" prompt           │
 ├──────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
 │ Lead expires (48h) before James responds │ Lead card shows "Expired" badge, cannot create quote                      │
 ├──────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
 │ Another provider already accepted        │ RFQ status = awarded, James sees "This RFQ has been awarded"              │
 ├──────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
 │ localStorage full                        │ Fallback to session storage, warn user to save frequently                 │
 ├──────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
 │ Duplicate quote attempt for same RFQ     │ API returns 409 Conflict: "You already have an active quote for this RFQ" │
 ├──────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────┤
 │ Network drops during quote send          │ Draft preserved in localStorage, retry button shown                       │
 └──────────────────────────────────────────┴───────────────────────────────────────────────────────────────────────────┘

 Metrics to Track

 - lead_received, lead_viewed, lead_expired
 - quote_ai_assist_used, quote_ai_items_accepted (count of items kept vs modified)
 - quote_created, quote_sent, quote_accepted
 - quote_response_time (lead received → quote sent)
 - booking_confirmed

 ---
 Scenario 4: "A Day's Work" — Managing Active Jobs Through to Completion and Payment

 Persona

 - Name: Priya Patel
 - Trade: Surveyor (RICS certified)
 - Experience: 15 years, small firm (5 surveyors)
 - Location: SW1 (Central London)
 - Goal: Manage 3 concurrent jobs through completion, generate invoices, receive payments

 Preconditions

 - Verified, subscription active, Stripe Connect linked
 - 3 confirmed bookings:
   - Job A: HomeBuyer Survey, £450, SW3 (today)
   - Job B: Building Survey, £800, W1 (tomorrow)
   - Job C: Valuation Report, £250, SE1 (in 3 days)

 Flow

 ┌──────┬───────────────────────────┬───────────────────────────────────────────────────────┬──────────────────────────────────────────────┬────────────────────────────────────┐
 │ Step │          Action           │                    Page/Component                     │               System Response                │            State Change            │
 ├──────┼───────────────────────────┼───────────────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────┤
 │ 1    │ Opens dashboard, checks   │ /dashboard/provider → KPI cards + UpcomingJobs        │ Shows: 3 active jobs, Job A highlighted as   │ —                                  │
 │      │ today's schedule          │                                                       │ "Today"                                      │                                    │
 ├──────┼───────────────────────────┼───────────────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────┤
 │ 2    │ Navigates to active jobs  │ /dashboard/provider/jobs/active                       │ Lists all 3 jobs with status "confirmed",    │ —                                  │
 │      │                           │                                                       │ sorted by scheduled_date                     │                                    │
 ├──────┼───────────────────────────┼───────────────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────┤
 │ 3    │ Opens Job A detail        │ /dashboard/provider/jobs/{jobA_id} →                  │ Full detail: client info, SW3 address,       │ —                                  │
 │      │                           │ JobDetailView.tsx                                     │ survey type, timeline, message thread        │                                    │
 ├──────┼───────────────────────────┼───────────────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────┤
 │ 4    │ Marks Job A as "In        │ Status change button                                  │ Confirmation dialog, client notified         │ bookings.status = in_progress,     │
 │      │ Progress"                 │                                                       │                                              │ booking_status_history logged      │
 ├──────┼───────────────────────────┼───────────────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────┤
 │ 5    │ Completes survey on-site, │ —                                                     │ —                                            │ —                                  │
 │      │  returns to platform      │                                                       │                                              │                                    │
 ├──────┼───────────────────────────┼───────────────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────┤
 │ 6    │ Marks Job A as            │ JobDetailView.tsx → "Mark Complete"                   │ Confirmation dialog with notes field. Priya  │ bookings.status = completed,       │
 │      │ "Completed"               │                                                       │ adds "Full report to follow within 48hrs"    │ history logged                     │
 ├──────┼───────────────────────────┼───────────────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────┤
 │ 7    │ Client receives           │ Client email + in-app                                 │ Client can now leave a review                │ —                                  │
 │      │ completion notification   │                                                       │                                              │                                    │
 ├──────┼───────────────────────────┼───────────────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────┤
 │      │ Generates invoice for Job │ /dashboard/provider/quotes/{quoteA_id}/invoice →      │ Pre-filled from booking: line items from     │                                    │
 │ 8    │  A                        │ InvoiceGenerator.tsx                                  │ accepted quote, VAT (20%), total £540 inc    │ —                                  │
 │      │                           │                                                       │ VAT                                          │                                    │
 ├──────┼───────────────────────────┼───────────────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────┤
 │ 9    │ Reviews invoice preview   │ InvoicePreview.tsx                                    │ Shows formatted invoice with Priya's         │ —                                  │
 │      │                           │                                                       │ business details, client info, line items    │                                    │
 ├──────┼───────────────────────────┼───────────────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────┤
 │ 10   │ Sends invoice to client   │ POST /api/provider/invoices + send                    │ Invoice created, status=sent. Inngest fires  │ provider_invoices row: status=sent │
 │      │                           │                                                       │ client email with PDF link.                  │                                    │
 ├──────┼───────────────────────────┼───────────────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────┤
 │ 11   │ Client pays via Stripe    │ Client side → Stripe Checkout                         │ payment_intent.succeeded webhook fires       │ Invoice: status=paid, Stripe       │
 │      │ payment link              │                                                       │                                              │ payment recorded                   │
 ├──────┼───────────────────────────┼───────────────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────┤
 │ 12   │ Priya receives payment    │ In-app + email                                        │ "Payment received: £540.00 for HomeBuyer     │ —                                  │
 │      │ notification              │                                                       │ Survey"                                      │                                    │
 ├──────┼───────────────────────────┼───────────────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────┤
 │ 13   │ Checks Payments dashboard │ /dashboard/provider/payments → PaymentsOverview.tsx   │ Shows: Available balance increased by        │ stripe_connect_accounts balance    │
 │      │                           │                                                       │ £526.50 (£540 - 2.5% commission = £526.50)   │ updated                            │
 ├──────┼───────────────────────────┼───────────────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────┤
 │      │ Next day: marks Job B as  │                                                       │                                              │                                    │
 │ 14   │ in progress, then         │ Same flow as steps 4-6                                │ Job B follows identical state machine        │ Job B: completed                   │
 │      │ completed                 │                                                       │                                              │                                    │
 ├──────┼───────────────────────────┼───────────────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────┤
 │ 15   │ Generates and sends Job B │ Same flow as steps 8-10                               │ Invoice for £960 sent                        │ Invoice B: status=sent             │
 │      │  invoice: £960 inc VAT    │                                                       │                                              │                                    │
 ├──────┼───────────────────────────┼───────────────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────┤
 │      │                           │                                                       │ Updated metrics: 2 completed this week,      │                                    │
 │ 16   │ Checks analytics          │ /dashboard/provider/analytics → AnalyticsCharts.tsx   │ £1,500 invoiced, conversion funnel           │ —                                  │
 │      │                           │                                                       │ visualization                                │                                    │
 ├──────┼───────────────────────────┼───────────────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────┤
 │ 17   │ Views payout schedule     │ /dashboard/provider/payments                          │ Next payout: £1,463.10 on Friday (both       │ —                                  │
 │      │                           │                                                       │ payments minus 2.5% commission)              │                                    │
 ├──────┼───────────────────────────┼───────────────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────────────────┤
 │      │ Job C scheduled in 2 days │ /dashboard/provider/availability →                    │                                              │                                    │
 │ 18   │  — checks availability    │ AvailabilityCalendar.tsx                              │ Shows Job C on calendar, no conflicts        │ —                                  │
 │      │ calendar                  │                                                       │                                              │                                    │
 └──────┴───────────────────────────┴───────────────────────────────────────────────────────┴──────────────────────────────────────────────┴────────────────────────────────────┘

 Notifications

 - In-app: Status change confirmations (steps 4, 6)
 - Email to client: "Job in progress" (step 4), "Job completed" (step 6)
 - Email to client: Invoice with PDF link (step 10)
 - In-app + Email: Payment received (step 11)
 - In-app: Payout scheduled (step 17)

 Success Criteria

 - Job status machine enforced: confirmed → in_progress → completed (cannot skip)
 - All status transitions logged in booking_status_history
 - Invoice correctly calculates VAT (20%) on top of quote amount
 - PDF invoice accessible only by authenticated provider (auth gate: session.user.id === invoice.provider_id)
 - Stripe payment correctly recorded, 2.5% commission deducted
 - Payments dashboard reflects accurate balance
 - Analytics update with completed job data
 - Multiple concurrent jobs managed without conflict

 Failure Points

 ┌───────────────────────────────────┬────────────────────────────────────────────────────────────────────────────┐
 │              Failure              │                             Expected Handling                              │
 ├───────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
 │ Client disputes completion        │ bookings.status = disputed, escalation flow triggered                      │
 ├───────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
 │ Stripe payout fails               │ payout.failed webhook updates status, Priya notified to check bank details │
 ├───────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
 │ Invoice PDF generation fails      │ Retry mechanism, fallback to HTML invoice view                             │
 ├───────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
 │ Double-marking job as complete    │ Idempotent — second request returns current state                          │
 ├───────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
 │ Client doesn't pay within 30 days │ Invoice: status=overdue, automated reminder email                          │
 └───────────────────────────────────┴────────────────────────────────────────────────────────────────────────────┘

 Metrics to Track

 - job_status_changed (per status transition)
 - invoice_created, invoice_sent, invoice_paid, invoice_overdue
 - payment_received, payout_completed, payout_failed
 - Average time: job_completed → invoice_sent → payment_received
 - Commission revenue per transaction

 ---
 Scenario 5: "Show Me the Money" — Stripe Connect Setup and Financial Management

 Persona

 - Name: Tom Wright
 - Trade: Builder (general construction)
 - Experience: 20 years, limited company
 - Location: LS1 (Leeds)
 - Goal: Set up Stripe Connect, understand fee structure, manage cash flow, download tax records

 Preconditions

 - Verified provider, completed 5 jobs but hasn't set up Stripe yet
 - Clients have been paying via bank transfer (offline)
 - Wants to switch to platform payments for convenience

 Flow

 ┌──────┬──────────────────────────────┬────────────────────────────────────────────────┬───────────────────────────────────────────┬───────────────────────────────────────────┐
 │ Step │            Action            │                 Page/Component                 │              System Response              │               State Change                │
 ├──────┼──────────────────────────────┼────────────────────────────────────────────────┼───────────────────────────────────────────┼───────────────────────────────────────────┤
 │ 1    │ Navigates to Payments        │ /dashboard/provider/payments →                 │ Shows "Set up Stripe to receive payments" │ —                                         │
 │      │                              │ PaymentsOverview.tsx                           │  banner with CTA                          │                                           │
 ├──────┼──────────────────────────────┼────────────────────────────────────────────────┼───────────────────────────────────────────┼───────────────────────────────────────────┤
 │ 2    │ Clicks "Connect Stripe       │ POST /api/stripe/connect/create-account        │ Creates Stripe Connect Express account    │ stripe_connect_accounts row:              │
 │      │ Account"                     │                                                │ for Tom                                   │ onboarding_complete=false                 │
 ├──────┼──────────────────────────────┼────────────────────────────────────────────────┼───────────────────────────────────────────┼───────────────────────────────────────────┤
 │      │ Redirected to Stripe         │ POST /api/stripe/connect/onboarding-link →     │ Stripe collects: business type (company), │                                           │
 │ 3    │ onboarding                   │ Stripe hosted                                  │  company details, bank account, identity  │ —                                         │
 │      │                              │                                                │ verification                              │                                           │
 ├──────┼──────────────────────────────┼────────────────────────────────────────────────┼───────────────────────────────────────────┼───────────────────────────────────────────┤
 │      │ Completes Stripe KYC:        │                                                │                                           │                                           │
 │ 4    │ uploads company docs, enters │ Stripe hosted onboarding                       │ Stripe verifies identity and bank details │ —                                         │
 │      │  bank sort code + account    │                                                │                                           │                                           │
 │      │ number                       │                                                │                                           │                                           │
 ├──────┼──────────────────────────────┼────────────────────────────────────────────────┼───────────────────────────────────────────┼───────────────────────────────────────────┤
 │      │                              │                                                │                                           │ stripe_connect_accounts:                  │
 │ 5    │ Redirected back to           │ /dashboard/provider/payments                   │ "Stripe Connected!" success message.      │ onboarding_complete=true,                 │
 │      │ Britestate                   │                                                │ account.updated webhook fires.            │ charges_enabled=true,                     │
 │      │                              │                                                │                                           │ payouts_enabled=true                      │
 ├──────┼──────────────────────────────┼────────────────────────────────────────────────┼───────────────────────────────────────────┼───────────────────────────────────────────┤
 │ 6    │ Reviews payments dashboard   │ PaymentsOverview.tsx                           │ Shows: Available £0.00, Pending £0.00,    │ —                                         │
 │      │                              │                                                │ Next payout: None yet                     │                                           │
 ├──────┼──────────────────────────────┼────────────────────────────────────────────────┼───────────────────────────────────────────┼───────────────────────────────────────────┤
 │      │ Completes a new job and      │                                                │                                           │                                           │
 │ 7    │ sends invoice for £5,000     │ Quote → Job → Invoice flow                     │ Invoice sent to client                    │ provider_invoices created                 │
 │      │ (extension build)            │                                                │                                           │                                           │
 ├──────┼──────────────────────────────┼────────────────────────────────────────────────┼───────────────────────────────────────────┼───────────────────────────────────────────┤
 │ 8    │ Client pays £5,000 via       │ Client Stripe Checkout                         │ payment_intent.succeeded webhook          │ Invoice: paid, payment recorded           │
 │      │ Stripe                       │                                                │                                           │                                           │
 ├──────┼──────────────────────────────┼────────────────────────────────────────────────┼───────────────────────────────────────────┼───────────────────────────────────────────┤
 │      │                              │                                                │ Available: £0 (processing), Pending:      │                                           │
 │ 9    │ Checks payments dashboard    │ PaymentsOverview.tsx                           │ £4,875.00 (£5,000 - 2.5% = £4,875), Next  │ Balance updated                           │
 │      │                              │                                                │ payout: In 7 days                         │                                           │
 ├──────┼──────────────────────────────┼────────────────────────────────────────────────┼───────────────────────────────────────────┼───────────────────────────────────────────┤
 │ 10   │ 7 days later: payout arrives │ payout.paid webhook                            │ £4,875.00 deposited to bank. In-app +     │ Payout: status=paid                       │
 │      │                              │                                                │ email notification.                       │                                           │
 ├──────┼──────────────────────────────┼────────────────────────────────────────────────┼───────────────────────────────────────────┼───────────────────────────────────────────┤
 │      │                              │ /dashboard/provider/payments/{txn_id} →        │ Breakdown: Gross £5,000 → Platform fee    │                                           │
 │ 11   │ Views transaction detail     │ TransactionDetail.tsx                          │ £125 (2.5%) → Stripe processing £0        │ —                                         │
 │      │                              │                                                │ (included) → Net £4,875                   │                                           │
 ├──────┼──────────────────────────────┼────────────────────────────────────────────────┼───────────────────────────────────────────┼───────────────────────────────────────────┤
 │ 12   │ Views payout history for tax │ PaymentsOverview.tsx → payout tab              │ List of all payouts with dates, amounts,  │ —                                         │
 │      │  purposes                    │                                                │ statuses                                  │                                           │
 ├──────┼──────────────────────────────┼────────────────────────────────────────────────┼───────────────────────────────────────────┼───────────────────────────────────────────┤
 │ 13   │ Second payment comes in:     │ Same flow                                      │ Pending: £1,950                           │ —                                         │
 │      │ £2,000 job                   │                                                │                                           │                                           │
 ├──────┼──────────────────────────────┼────────────────────────────────────────────────┼───────────────────────────────────────────┼───────────────────────────────────────────┤
 │ 14   │ Checks analytics for         │ /dashboard/provider/analytics →                │ Monthly earnings chart shows £6,825 net   │ —                                         │
 │      │ earnings                     │ AnalyticsCharts.tsx → getEarningsByMonth()     │ this month                                │                                           │
 └──────┴──────────────────────────────┴────────────────────────────────────────────────┴───────────────────────────────────────────┴───────────────────────────────────────────┘

 Notifications

 - In-app: Stripe account connected (step 5)
 - Email: Payment received £5,000 (step 8)
 - In-app + Email: Payout completed £4,875 (step 10)
 - Email: Payment received £2,000 (step 13)

 Success Criteria

 - Stripe Connect Express onboarding completes end-to-end
 - Webhook handling: account.updated, payment_intent.succeeded, payout.paid all processed
 - Idempotency: duplicate webhook events handled via stripe_events table
 - Commission correctly calculated: exactly 2.5% of gross
 - Payout timeline accurate (7-day standard)
 - Transaction detail shows clear gross → fees → net breakdown
 - Earnings analytics aggregate correctly across multiple payments

 Failure Points

 ┌─────────────────────────────────────┬───────────────────────────────────────────────────────────────────────────────────────────┐
 │               Failure               │                                     Expected Handling                                     │
 ├─────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┤
 │ Stripe KYC fails (incomplete docs)  │ account.updated webhook: charges_enabled=false, Tom prompted to complete KYC              │
 ├─────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┤
 │ Payout fails (invalid bank details) │ payout.failed webhook, email alert, dashboard shows "Payout failed — update bank details" │
 ├─────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┤
 │ Webhook signature invalid           │ Request rejected (401), logged for debugging, no state change                             │
 ├─────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┤
 │ Duplicate webhook event             │ stripe_events unique constraint catches, returns 200 OK without processing                │
 ├─────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┤
 │ Client initiates chargeback         │ Dispute webhook, Tom notified, platform assists with evidence                             │
 └─────────────────────────────────────┴───────────────────────────────────────────────────────────────────────────────────────────┘

 Metrics to Track

 - stripe_connect_started, stripe_connect_completed
 - payment_received, payout_completed, payout_failed
 - commission_earned (platform metric)
 - Average payout time, total GMV through platform

 ---
 Scenario 6: "Building My Reputation" — Portfolio, Reviews, and Public Profile

 Persona

 - Name: Aisha Hussain
 - Trade: Interior Designer
 - Experience: 3 years, freelance
 - Location: EH1 (Edinburgh)
 - Goal: Build a compelling public profile with portfolio and 5-star reviews to stand out from competitors

 Preconditions

 - Verified, 8 completed jobs on platform
 - 3 existing reviews (avg 4.3)
 - No portfolio items yet
 - Wants to climb marketplace rankings

 Flow

 Step: 1
 Action: Opens Portfolio page
 Page/Component: /dashboard/provider/portfolio → PortfolioGrid.tsx
 System Response: Empty state: "Add your first project to showcase your work"
 State Change: —
 ────────────────────────────────────────
 Step: 2
 Action: Clicks "Add Project"
 Page/Component: PortfolioItemCard.tsx create mode
 System Response: Form: title, description, before image, after image, category
 State Change: —
 ────────────────────────────────────────
 Step: 3
 Action: Uploads before photo of living room (dull, dated)
 Page/Component: File upload
 System Response: Image uploaded to Supabase Storage, thumbnail generated
 State Change: —
 ────────────────────────────────────────
 Step: 4
 Action: Uploads after photo (stunning modern redesign)
 Page/Component: File upload
 System Response: Before/after pair stored
 State Change: provider_portfolio_items row: display_order=1
 ────────────────────────────────────────
 Step: 5
 Action: Adds title: "Victorian Terrace Living Room Transformation" and description
 Page/Component: Form fields
 System Response: Saved
 State Change: —
 ────────────────────────────────────────
 Step: 6
 Action: Repeats for 4 more projects (kitchen, bedroom, bathroom, home office)
 Page/Component: Same flow x4
 System Response: 5 portfolio items total
 State Change: 5x provider_portfolio_items rows
 ────────────────────────────────────────
 Step: 7
 Action: Drag-and-drops to reorder: best project first
 Page/Component: PortfolioGrid.tsx with @dnd-kit
 System Response: PUT /api/provider/portfolio/reorder updates display_order
 State Change: All display_order values updated
 ────────────────────────────────────────
 Step: 8
 Action: Checks Reviews page
 Page/Component: /dashboard/provider/reviews → ReviewsBreakdown.tsx
 System Response: Shows: 3 reviews, avg 4.3, breakdown by dimension. One review has 3 stars (critical).
 State Change: —
 ────────────────────────────────────────
 Step: 9
 Action: Opens the 3-star review
 Page/Component: Review detail
 System Response: "Good design ideas but communication could improve. Took longer than quoted." — Mary S.
 State Change: —
 ────────────────────────────────────────
 Step: 10
 Action: Clicks "Respond"
 Page/Component: /dashboard/provider/reviews/{id}/respond → ReviewResponseForm.tsx
 System Response: Text area (1-1000 chars) for public response
 State Change: —
 ────────────────────────────────────────
 Step: 11
 Action: Writes thoughtful response: "Thank you for the feedback, Mary. You're right that we had some scheduling challenges on this project. I've since implemented a weekly update
   system..."
 Page/Component: Response form
 System Response: Validates length, no prohibited content
 State Change: —
 ────────────────────────────────────────
 Step: 12
 Action: Submits response
 Page/Component: PUT /api/provider/reviews/{id}/respond
 System Response: Response saved, Mary notified
 State Change: reviews.provider_response updated
 ────────────────────────────────────────
 Step: 13
 Action: New job completes — client leaves 5-star review
 Page/Component: Client side
 System Response: Review enters moderation queue
 State Change: reviews row: moderation_status=pending
 ────────────────────────────────────────
 Step: 14
 Action: Admin approves review
 Page/Component: Admin side
 System Response: Review visible on Aisha's profile
 State Change: reviews.moderation_status = approved
 ────────────────────────────────────────
 Step: 15
 Action: Aisha sees new review notification
 Page/Component: In-app
 System Response: "New 5-star review from John D.!"
 State Change: —
 ────────────────────────────────────────
 Step: 16
 Action: Checks updated ratings
 Page/Component: ReviewsBreakdown.tsx
 System Response: Now 4 reviews, avg 4.5, response rate: 25% (1/4 responded to)
 State Change: provider_rating_stats updated
 ────────────────────────────────────────
 Step: 17
 Action: Views public profile to see how it looks
 Page/Component: Public profile page (/providers/{slug})
 System Response: Shows: business name, services, 5 portfolio items, 4 reviews, 4.5 avg rating, verification badges, service area map
 State Change: —

 Notifications

 - In-app: New review received (step 13/14)
 - Email to reviewer: "Aisha responded to your review" (step 12)
 - In-app: Portfolio items saved confirmation

 Success Criteria

 - Portfolio before/after images display correctly with proper ordering
 - Drag-and-drop reorder persists via display_order column
 - Review response saves and displays inline below the original review
 - Rating statistics recalculate correctly after new review
 - Public profile shows complete: portfolio + reviews + badges + services
 - Review moderation pipeline works (pending → approved → visible)
 - Response rate metric accurate (reviews with response / total reviews)

 Failure Points

 ┌─────────────────────────────────────────┬───────────────────────────────────────────────────────────────────────────────────┐
 │                 Failure                 │                                 Expected Handling                                 │
 ├─────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
 │ Image upload fails (corrupt file)       │ Error message: "Unable to process image. Please try a different file."            │
 ├─────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
 │ Review response contains profanity      │ Content filter catches, shows "Response cannot contain inappropriate language"    │
 ├─────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
 │ Review flagged as spam/fake             │ Moderation catches via sentiment analysis + spam detection, held for admin review │
 ├─────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
 │ Portfolio drag-and-drop fails on mobile │ Touch events handled via @dnd-kit touch sensor                                    │
 ├─────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤
 │ Public profile shows stale rating       │ Cache invalidated on new review (5-min Redis cache)                               │
 └─────────────────────────────────────────┴───────────────────────────────────────────────────────────────────────────────────┘

 Metrics to Track

 - portfolio_item_created, portfolio_reordered
 - review_response_written
 - public_profile_viewed (from marketplace visitors)
 - Average rating trend over time
 - Response rate improvement

 ---
 Scenario 7: "Growing My Territory" — Service Expansion and Area Management

 Persona

 - Name: Mike O'Brien
 - Trade: Roofer
 - Experience: 10 years
 - Location: B1 (Birmingham)
 - Goal: Expand from Birmingham to cover the entire West Midlands, add guttering services, update pricing

 Preconditions

 - Verified, 30 completed jobs
 - Current services: Roof repairs (£500-£2000), Roof replacement (£3000-£8000)
 - Current area: Birmingham city centre (10-mile radius)
 - Rating: 4.8 (25 reviews)

 Flow

 ┌──────┬──────────────────────────────────────┬────────────────────────────────────────────┬────────────────────────────────────────┬──────────────────────────────────────────┐
 │ Step │                Action                │               Page/Component               │            System Response             │               State Change               │
 ├──────┼──────────────────────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────┼──────────────────────────────────────────┤
 │ 1    │ Opens Services page                  │ /dashboard/provider/services →             │ Shows 2 existing services with pricing │ —                                        │
 │      │                                      │ ServiceCard.tsx list                       │                                        │                                          │
 ├──────┼──────────────────────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────┼──────────────────────────────────────────┤
 │ 2    │ Clicks "Add Service"                 │ ServiceCard.tsx create mode                │ Form: category, name, description,     │ —                                        │
 │      │                                      │                                            │ pricing type, price                    │                                          │
 ├──────┼──────────────────────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────┼──────────────────────────────────────────┤
 │      │ Adds "Guttering & Fascias" service:  │                                            │                                        │ provider_services row: category=roofer,  │
 │ 3    │ fixed price £300-£800, description   │ Service form                               │ Validates required fields              │ pricing_type=fixed                       │
 │      │ of what's included                   │                                            │                                        │                                          │
 ├──────┼──────────────────────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────┼──────────────────────────────────────────┤
 │ 4    │ Adds "Chimney Repairs" service:      │ Service form                               │ No price required for                  │ provider_services row:                   │
 │      │ quote on request                     │                                            │ "quote_on_request"                     │ pricing_type=quote_on_request            │
 ├──────┼──────────────────────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────┼──────────────────────────────────────────┤
 │ 5    │ Updates "Roof Repairs" pricing:      │ ServiceCard.tsx edit mode                  │ Updates existing service               │ provider_services row updated            │
 │      │ £600-£2500 (inflation adjustment)    │                                            │                                        │                                          │
 ├──────┼──────────────────────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────┼──────────────────────────────────────────┤
 │ 6    │ Opens Service Areas                  │ /dashboard/provider/services/areas →       │ MapLibre map showing current 10-mile   │ —                                        │
 │      │                                      │ ServiceAreaMapEditor.tsx                   │ radius around B1                       │                                          │
 ├──────┼──────────────────────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────┼──────────────────────────────────────────┤
 │ 7    │ Clicks "Add Area"                    │ ServiceAreaMapEditorWrapper.tsx            │ Options: Radius or Polygon             │ —                                        │
 ├──────┼──────────────────────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────┼──────────────────────────────────────────┤
 │ 8    │ Selects "Radius" — sets centre to    │ Map interaction via terra-draw             │ Circle overlay drawn on map            │ —                                        │
 │      │ Wolverhampton (WV1), 15-mile radius  │                                            │                                        │                                          │
 ├──────┼──────────────────────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────┼──────────────────────────────────────────┤
 │ 9    │ Saves new service area               │ POST /api/provider/service-areas           │ GeoJSON geometry stored with PostGIS   │ provider_service_areas row:              │
 │      │                                      │                                            │                                        │ zone_type=radius, radius_km=24           │
 ├──────┼──────────────────────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────┼──────────────────────────────────────────┤
 │      │ Adds polygon area: draws custom      │                                            │                                        │                                          │
 │ 10   │ shape covering Coventry, Solihull,   │ terra-draw polygon tool on map             │ Custom polygon drawn                   │ —                                        │
 │      │ Warwick                              │                                            │                                        │                                          │
 ├──────┼──────────────────────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────┼──────────────────────────────────────────┤
 │ 11   │ Saves polygon area                   │ POST /api/provider/service-areas           │ MultiPolygon geometry stored           │ provider_service_areas row:              │
 │      │                                      │                                            │                                        │ zone_type=polygon, geometry=MultiPolygon │
 ├──────┼──────────────────────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────┼──────────────────────────────────────────┤
 │ 12   │ Sets Birmingham area as "primary"    │ Area settings                              │ Primary flag toggles                   │ provider_service_areas: is_primary=true  │
 │      │                                      │                                            │                                        │ for Birmingham                           │
 ├──────┼──────────────────────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────┼──────────────────────────────────────────┤
 │ 13   │ Views map showing all 3 coverage     │ ServiceAreaMapEditor.tsx                   │ Three overlapping zones displayed,     │ —                                        │
 │      │ zones with overlap visualization     │                                            │ legend shows primary vs secondary      │                                          │
 ├──────┼──────────────────────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────┼──────────────────────────────────────────┤
 │      │                                      │                                            │ KPI cards now reflect expanded         │                                          │
 │ 14   │ Returns to dashboard                 │ /dashboard/provider                        │ coverage. "Matched leads" may          │ —                                        │
 │      │                                      │                                            │ increase.                              │                                          │
 ├──────┼──────────────────────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────┼──────────────────────────────────────────┤
 │ 15   │ New RFQ from Solihull (within new    │ Matching engine                            │ Lead appears in Mike's inbox because   │ —                                        │
 │      │ polygon area) matches Mike           │                                            │ postcode falls within polygon geometry │                                          │
 ├──────┼──────────────────────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────┼──────────────────────────────────────────┤
 │      │                                      │                                            │ New lead: "Guttering replacement,      │                                          │
 │ 16   │ Checks Leads                         │ /dashboard/provider/jobs/leads             │ 3-bed semi, B91" — matched to new      │ —                                        │
 │      │                                      │                                            │ service + new area                     │                                          │
 └──────┴──────────────────────────────────────┴────────────────────────────────────────────┴────────────────────────────────────────┴──────────────────────────────────────────┘

 Notifications

 - In-app: Service created/updated confirmations (steps 3, 4, 5)
 - In-app: New matched lead from expanded area (step 15)

 Success Criteria

 - New services created with correct pricing types (fixed, quote_on_request)
 - Service area map renders correctly with MapLibre + terra-draw
 - Radius area stored as GeoJSON circle geometry with correct radius_km
 - Polygon area stored as MultiPolygon geometry
 - PostGIS spatial queries correctly match new RFQs within expanded areas
 - Primary area flag affects lead matching priority
 - Existing services can be edited without data loss
 - Map overlays render correctly for multiple zones

 Failure Points

 ┌──────────────────────────────────────┬──────────────────────────────────────────────────────────────────┐
 │               Failure                │                        Expected Handling                         │
 ├──────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
 │ MapTiler API key invalid             │ Map gracefully degrades to list view of postcodes                │
 ├──────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
 │ terra-draw polygon self-intersects   │ Validation catches, prompts user to fix shape                    │
 ├──────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
 │ PostGIS geometry invalid             │ Backend validates GeoJSON before storage, returns 400            │
 ├──────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
 │ Service area too large (> 100 miles) │ Business rule limit enforced, "Maximum coverage area exceeded"   │
 ├──────────────────────────────────────┼──────────────────────────────────────────────────────────────────┤
 │ Duplicate service category           │ Allowed — providers can offer multiple services in same category │
 └──────────────────────────────────────┴──────────────────────────────────────────────────────────────────┘

 Metrics to Track

 - service_created, service_updated, service_deleted
 - service_area_created, service_area_modified
 - coverage_area_sqkm (total coverage)
 - Lead match rate before vs after expansion
 - Conversion rate by service area (primary vs secondary)

 ---
 Scenario 8: "Levelling Up" — Boosts, Analytics, and Referral-Driven Growth

 Persona

 - Name: Lisa & Dan Cooper
 - Trade: Husband-wife team — Landscaping
 - Experience: 7 years together
 - Location: OX1 (Oxford)
 - Goal: Double monthly leads using boosts, understand analytics, and recruit referrals

 Preconditions

 - Verified, 50 completed jobs, 4.9 rating
 - Current: 8 leads/month, 40% conversion, £3,200/month average earnings
 - Subscription: Professional plan active

 Flow

 ┌──────┬────────────────────────────────┬────────────────────────────────────┬────────────────────────────────────────────────────────────┬────────────────────────────────────┐
 │ Step │             Action             │           Page/Component           │                      System Response                       │            State Change            │
 ├──────┼────────────────────────────────┼────────────────────────────────────┼────────────────────────────────────────────────────────────┼────────────────────────────────────┤
 │      │                                │ /dashboard/provider/analytics →    │ Shows: profile views (120/month), enquiry rate (12%),      │                                    │
 │ 1    │ Opens Analytics page           │ AnalyticsPageClient.tsx            │ conversion funnel (viewed → enquired → quoted → booked),   │ —                                  │
 │      │                                │                                    │ earnings trend (3 months)                                  │                                    │
 ├──────┼────────────────────────────────┼────────────────────────────────────┼────────────────────────────────────────────────────────────┼────────────────────────────────────┤
 │ 2    │ Studies conversion funnel      │ ConversionFunnel.tsx               │ Funnel: 120 views → 14 enquiries → 10 quotes sent → 4      │ —                                  │
 │      │                                │                                    │ bookings. Drop-off: 86% at view→enquiry.                   │                                    │
 ├──────┼────────────────────────────────┼────────────────────────────────────┼────────────────────────────────────────────────────────────┼────────────────────────────────────┤
 │      │ Realizes profile views are     │                                    │                                                            │                                    │
 │ 3    │ high but enquiry rate is low — │ Analytics insight                  │ —                                                          │ —                                  │
 │      │  needs more visibility AND     │                                    │                                                            │                                    │
 │      │ better conversion              │                                    │                                                            │                                    │
 ├──────┼────────────────────────────────┼────────────────────────────────────┼────────────────────────────────────────────────────────────┼────────────────────────────────────┤
 │ 4    │ Opens Boost page               │ /dashboard/provider/boost →        │ Shows 3 options: Featured Profile (£29/week), Area         │ —                                  │
 │      │                                │ BoostSelector.tsx                  │ Spotlight (£49/week), Category Top (£79/week)              │                                    │
 ├──────┼────────────────────────────────┼────────────────────────────────────┼────────────────────────────────────────────────────────────┼────────────────────────────────────┤
 │ 5    │ Selects "Area Spotlight" for   │ BoostSelector.tsx                  │ Preview: "Your profile will appear in the spotlight        │ —                                  │
 │      │ Oxford area — 2 weeks          │                                    │ section for Oxford & surrounding areas"                    │                                    │
 ├──────┼────────────────────────────────┼────────────────────────────────────┼────────────────────────────────────────────────────────────┼────────────────────────────────────┤
 │ 6    │ Clicks "Purchase Boost"        │ POST /api/provider/boost → Stripe  │ Redirected to Stripe for £98 payment (£49 x 2 weeks)       │ —                                  │
 │      │                                │ Checkout                           │                                                            │                                    │
 ├──────┼────────────────────────────────┼────────────────────────────────────┼────────────────────────────────────────────────────────────┼────────────────────────────────────┤
 │      │                                │                                    │                                                            │ provider_boosts row:               │
 │ 7    │ Completes Stripe payment       │ Stripe Checkout → redirect back    │ Boost activated immediately                                │ type=area_spotlight,               │
 │      │                                │                                    │                                                            │ duration_days=14, is_active=true   │
 ├──────┼────────────────────────────────┼────────────────────────────────────┼────────────────────────────────────────────────────────────┼────────────────────────────────────┤
 │ 8    │ Returns to dashboard, sees     │ ProviderDashboard.tsx              │ Green badge showing days remaining                         │ —                                  │
 │      │ "Boost Active" badge           │                                    │                                                            │                                    │
 ├──────┼────────────────────────────────┼────────────────────────────────────┼────────────────────────────────────────────────────────────┼────────────────────────────────────┤
 │ 9    │ Opens Referrals page           │ /dashboard/provider/referrals      │ Shows unique referral code: COOPER-OX23, referral stats (0 │ —                                  │
 │      │                                │                                    │  referrals), reward structure                              │                                    │
 ├──────┼────────────────────────────────┼────────────────────────────────────┼────────────────────────────────────────────────────────────┼────────────────────────────────────┤
 │ 10   │ Copies referral link           │ Referral code copy button          │ Link copied to clipboard:                                  │ —                                  │
 │      │                                │                                    │ britestate.com/register?ref=COOPER-OX23                    │                                    │
 ├──────┼────────────────────────────────┼────────────────────────────────────┼────────────────────────────────────────────────────────────┼────────────────────────────────────┤
 │      │ Shares link with 3             │                                    │                                                            │                                    │
 │ 11   │ tradesperson friends (a        │ External (WhatsApp, email)         │ —                                                          │ —                                  │
 │      │ plumber, an electrician, a     │                                    │                                                            │                                    │
 │      │ painter)                       │                                    │                                                            │                                    │
 ├──────┼────────────────────────────────┼────────────────────────────────────┼────────────────────────────────────────────────────────────┼────────────────────────────────────┤
 │ 12   │ Friend #1 (plumber) signs up   │ Registration flow                  │ Referral attributed via /api/referrals/v2/attribute        │ provider_referrals row:            │
 │      │ using referral link            │                                    │                                                            │ status=signed_up                   │
 ├──────┼────────────────────────────────┼────────────────────────────────────┼────────────────────────────────────────────────────────────┼────────────────────────────────────┤
 │ 13   │ Lisa checks referral dashboard │ /dashboard/provider/referrals      │ Shows: 1 signed up, 0 verified, 0 rewarded. "£25 reward    │ —                                  │
 │      │                                │                                    │ when they complete verification"                           │                                    │
 ├──────┼────────────────────────────────┼────────────────────────────────────┼────────────────────────────────────────────────────────────┼────────────────────────────────────┤
 │ 14   │ Friend #1 completes            │ Their flow                         │ Referral status updated                                    │ provider_referrals.status =        │
 │      │ verification                   │                                    │                                                            │ verified                           │
 ├──────┼────────────────────────────────┼────────────────────────────────────┼────────────────────────────────────────────────────────────┼────────────────────────────────────┤
 │      │                                │                                    │ Lisa receives £25 credit. Notification: "You earned £25    │ provider_referrals.status =        │
 │ 15   │ Reward credited                │ Background job                     │ from your referral!"                                       │ rewarded, reward_amount = 2500     │
 │      │                                │                                    │                                                            │ (pence)                            │
 ├──────┼────────────────────────────────┼────────────────────────────────────┼────────────────────────────────────────────────────────────┼────────────────────────────────────┤
 │ 16   │ 1 week later: checks analytics │ /dashboard/provider/analytics      │ Profile views up 180% (340 views), enquiry rate up to 18%, │ —                                  │
 │      │  again                         │                                    │  6 new leads this week vs 2 average                        │                                    │
 ├──────┼────────────────────────────────┼────────────────────────────────────┼────────────────────────────────────────────────────────────┼────────────────────────────────────┤
 │ 17   │ Views earnings breakdown by    │ getEarningsByMonth()               │ Bar chart: Jan £2,800, Feb £3,200, Mar £5,100 (boost       │ —                                  │
 │      │ month                          │                                    │ effect visible)                                            │                                    │
 ├──────┼────────────────────────────────┼────────────────────────────────────┼────────────────────────────────────────────────────────────┼────────────────────────────────────┤
 │ 18   │ Checks top categories          │ getTopCategories()                 │ Garden design: 45%, Landscaping: 35%, Fencing: 20%         │ —                                  │
 └──────┴────────────────────────────────┴────────────────────────────────────┴────────────────────────────────────────────────────────────┴────────────────────────────────────┘

 Notifications

 - In-app: Boost activated (step 7)
 - In-app: Referral signed up (step 12)
 - In-app + Email: Referral reward earned (step 15)
 - In-app: Boost expiring soon (2 days before end)

 Success Criteria

 - Boost purchase flows through Stripe Checkout correctly
 - Boost appears active in dashboard with countdown timer
 - Boost actually affects search ranking (area_spotlight surfaces in area results)
 - Referral code generated uniquely per provider
 - Referral attribution tracks: signed_up → verified → rewarded
 - Reward amount credited correctly (£25 per verified referral)
 - Analytics data reflects boost impact (pre/post comparison)
 - Earnings chart renders correctly via Recharts
 - Conversion funnel accurately calculates drop-off rates

 Failure Points

 ┌─────────────────────────────────────────────────┬────────────────────────────────────────────────────────────────────┐
 │                     Failure                     │                         Expected Handling                          │
 ├─────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────┤
 │ Stripe Checkout payment fails                   │ Boost not activated, user prompted to retry                        │
 ├─────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────┤
 │ Boost overlaps with existing boost of same type │ Business rule: cannot stack same boost type, show upgrade option   │
 ├─────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────┤
 │ Referral code used by existing user             │ Rejected — referrals only for new signups                          │
 ├─────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────┤
 │ Analytics data not yet computed (new provider)  │ "Stats updated daily at 02:00 UTC" message, show estimated metrics │
 ├─────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────┤
 │ Referral friend never verifies                  │ Status stays "signed_up", no reward, shows in pending tab          │
 └─────────────────────────────────────────────────┴────────────────────────────────────────────────────────────────────┘

 Metrics to Track

 - boost_purchased (by type), boost_roi (leads during boost / cost)
 - referral_link_shared, referral_signed_up, referral_verified, referral_rewarded
 - Profile view lift during active boost
 - Enquiry rate change during active boost
 - Cost per acquired lead (boost cost / additional leads)

 ---
 Scenario 9: "When Things Go Wrong" — Disputes, Negative Reviews, and Recovery

 Persona

 - Name: Kevin Reeves
 - Trade: Carpenter / Joiner
 - Experience: 18 years
 - Location: NG1 (Nottingham)
 - Goal: Handle a disputed job, respond professionally to a negative review, manage an expired lead, and recover from a failed payout

 Preconditions

 - Verified, 75 completed jobs, 4.6 rating
 - 1 active job that's going badly (client unhappy with progress)
 - 1 expired lead he missed
 - Stripe payout failed last week (wrong bank details)

 Flow

 Step: Thread A: Disputed Job
 Action:
 Page/Component:
 System Response:
 State Change:
 ────────────────────────────────────────
 Step: 1
 Action: Opens active job detail for kitchen cabinet installation
 Page/Component: /dashboard/provider/jobs/{id} → JobDetailView.tsx
 System Response: Shows: in_progress, client messages expressing frustration about delays
 State Change: —
 ────────────────────────────────────────
 Step: 2
 Action: Client marks job as "disputed" from their end
 Page/Component: Client action
 System Response: Kevin receives notification: "Job disputed by client"
 State Change: bookings.status = disputed, booking_status_history logged with reason
 ────────────────────────────────────────
 Step: 3
 Action: Kevin sees dispute banner on job detail
 Page/Component: JobDetailView.tsx
 System Response: Red banner: "This job has been disputed. Reason: 'Work quality not as discussed, cabinets not aligned properly'"
 State Change: —
 ────────────────────────────────────────
 Step: 4
 Action: Kevin sends message via job thread: explains issue, proposes fix
 Page/Component: Message form in JobDetailView.tsx
 System Response: Message delivered to client
 State Change: Message record created
 ────────────────────────────────────────
 Step: 5
 Action: Client agrees to give Kevin another chance
 Page/Component: Client action → resolves dispute
 System Response: bookings.status returns to in_progress
 State Change: Status history logged
 ────────────────────────────────────────
 Step: 6
 Action: Kevin completes the fix, marks job complete
 Page/Component: Status change
 System Response: Confirmation with notes: "Realigned all cabinets, added extra support brackets"
 State Change: bookings.status = completed
 ────────────────────────────────────────
 Step: Thread B: Negative Review
 Action:
 Page/Component:
 System Response:
 State Change:
 ────────────────────────────────────────
 Step: 7
 Action: Different client leaves 2-star review: "Arrived late both days, work was average. Wouldn't recommend."
 Page/Component: Client review submission
 System Response: Review enters moderation, passes (legitimate review)
 State Change: reviews row: overall_rating=2, moderation_status=approved
 ────────────────────────────────────────
 Step: 8
 Action: Kevin sees the negative review
 Page/Component: /dashboard/provider/reviews → ReviewCard.tsx
 System Response: 2-star review visible with all dimensions: punctuality 1, quality 3, value 3, professionalism 2
 State Change: Rating stats recalculated
 ────────────────────────────────────────
 Step: 9
 Action: Kevin's overall rating drops from 4.6 to 4.5
 Page/Component: ReviewsBreakdown.tsx
 System Response: Rating distribution chart updates
 State Change: provider_rating_stats updated
 ────────────────────────────────────────
 Step: 10
 Action: Kevin writes thoughtful response
 Page/Component: /dashboard/provider/reviews/{id}/respond → ReviewResponseForm.tsx
 System Response: "Thank you for the honest feedback. I apologize for the punctuality issues — I was managing an emergency on another site. I've since hired a second pair of hands
 to
   prevent this..."
 State Change: —
 ────────────────────────────────────────
 Step: 11
 Action: Submits response
 Page/Component: PUT /api/provider/reviews/{id}/respond
 System Response: Response saved, client notified
 State Change: reviews.provider_response updated
 ────────────────────────────────────────
 Step: Thread C: Expired Lead
 Action:
 Page/Component:
 System Response:
 State Change:
 ────────────────────────────────────────
 Step: 12
 Action: Checks leads inbox
 Page/Component: /dashboard/provider/jobs/leads → JobLeadsClient.tsx
 System Response: One lead shows "Expired" badge (48h elapsed). Grey card, "Create Quote" button disabled.
 State Change: —
 ────────────────────────────────────────
 Step: 13
 Action: Cannot act on expired lead
 Page/Component: Lead detail
 System Response: Message: "This lead expired on 15 Mar 2026. The homeowner may have already found a provider."
 State Change: —
 ────────────────────────────────────────
 Step: Thread D: Failed Payout
 Action:
 Page/Component:
 System Response:
 State Change:
 ────────────────────────────────────────
 Step: 14
 Action: Opens Payments
 Page/Component: /dashboard/provider/payments → PaymentsOverview.tsx
 System Response: Red alert banner: "Your last payout of £2,340.00 failed. Please update your bank details."
 State Change: —
 ────────────────────────────────────────
 Step: 15
 Action: Views failed payout detail
 Page/Component: /dashboard/provider/payments/{payout_id} → TransactionDetail.tsx
 System Response: Status: Failed, Reason: "Bank account details invalid", Date: 8 Mar 2026
 State Change: —
 ────────────────────────────────────────
 Step: 16
 Action: Clicks "Update Bank Details"
 Page/Component: Redirects to Stripe Connect dashboard
 System Response: Kevin corrects sort code (was 1 digit off)
 State Change: —
 ────────────────────────────────────────
 Step: 17
 Action: Returns to Britestate
 Page/Component: Payments page
 System Response: account.updated webhook fires, bank details verified
 State Change: stripe_connect_accounts updated
 ────────────────────────────────────────
 Step: 18
 Action: Next payout cycle succeeds
 Page/Component: payout.paid webhook
 System Response: £2,340.00 + any new earnings deposited
 State Change: Payout: status=paid

 Notifications

 - In-app: Job disputed (step 2)
 - In-app: New review received (step 7)
 - Email: Negative review alert (step 7)
 - In-app + Email: Payout failed (step 14)
 - In-app + Email: Payout succeeded after retry (step 18)

 Success Criteria

 - Dispute flow: status transitions correctly (in_progress → disputed → in_progress → completed)
 - All status transitions logged with actor and reason in booking_status_history
 - Negative review displayed correctly with per-dimension ratings
 - Review response publishes inline and notifies reviewer
 - Rating recalculates correctly after negative review (weighted average)
 - Expired leads clearly marked, quote creation blocked
 - Failed payout prominently surfaced with clear remediation path
 - Payout retry succeeds after bank details corrected

 Failure Points

 ┌───────────────────────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────┐
 │                          Failure                          │                          Expected Handling                          │
 ├───────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
 │ Dispute escalation (neither party resolves)               │ Admin intervention triggered after 7 days                           │
 ├───────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
 │ Provider tries to delete negative review                  │ Not possible — reviews can only be flagged, not deleted by provider │
 ├───────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
 │ Provider response to review is abusive                    │ Content filter catches, response rejected                           │
 ├───────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
 │ Multiple consecutive payout failures                      │ Account flagged for manual Stripe review                            │
 ├───────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
 │ Lead shows as expired but was within 48h (timezone issue) │ All times stored UTC, frontend converts to user's timezone          │
 └───────────────────────────────────────────────────────────┴─────────────────────────────────────────────────────────────────────┘

 Metrics to Track

 - job_disputed, dispute_resolved, dispute_escalated
 - negative_review_received (< 3 stars), review_response_written
 - lead_expired (missed opportunities)
 - payout_failed, payout_retry_success
 - Rating recovery time (days from drop to return to previous level)

 ---
 Scenario 10: "The Multi-Trade Powerhouse" — Complex Multi-Service Provider with Advanced Scheduling

 Persona

 - Name: Raj Mehta
 - Trade: Gas Engineer + Plumber + Heating Specialist
 - Experience: 25 years, employs 4 engineers
 - Location: CR0 (Croydon, South London)
 - Goal: Manage 3 different service categories simultaneously, handle complex scheduling across team, maximize platform features

 Preconditions

 - Verified with Gas Safe, NICEIC accreditations
 - 3 services: Gas Boiler Installation (£1,800-£3,500), Plumbing Repairs (£80-£500/hr), Central Heating Installation (£4,000-£8,000)
 - 150 completed jobs, 4.9 rating (120 reviews)
 - 3 active service areas (Croydon 15mi, Central London polygon, Surrey polygon)
 - Active "Featured Profile" boost
 - 12 active jobs across his team

 Flow

 ┌──────┬────────────────────────────────┬──────────────────────────────────────────────────┬─────────────────────────────────────────────────────┬────────────────────────────┐
 │ Step │             Action             │                  Page/Component                  │                   System Response                   │        State Change        │
 ├──────┼────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────────────────────┼────────────────────────────┤
 │ 1    │ Monday morning: opens          │ /dashboard/provider → ProviderDashboard.tsx      │ KPIs: 5 new leads, 12 active jobs, 3 pending        │ —                          │
 │      │ dashboard                      │                                                  │ quotes, £18,500 monthly earnings, 4.9 rating        │                            │
 ├──────┼────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────────────────────┼────────────────────────────┤
 │ 2    │ Checks availability calendar   │ /dashboard/provider/availability →               │ Weekly view: 12 jobs spread across Mon-Fri, 2 slots │ —                          │
 │      │ for the week                   │ AvailabilityCalendar.tsx                         │  available on Wed and Fri                           │                            │
 ├──────┼────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────────────────────┼────────────────────────────┤
 │      │ Sets recurring unavailability: │                                                  │ JSONB rule created: {days: ["Sunday"],              │ provider_availability      │
 │ 3    │  every Sunday + Bank Holidays  │ Availability recurring rules                     │ effective_from: "2026-03-17", effective_until:      │ rules updated              │
 │      │                                │                                                  │ null}                                               │                            │
 ├──────┼────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────────────────────┼────────────────────────────┤
 │      │                                │ /dashboard/provider/jobs/leads →                 │ 5 leads across all 3 categories: 2x boiler          │                            │
 │ 4    │ Reviews 5 new leads            │ JobLeadsClient.tsx                               │ installs, 1x emergency plumbing, 1x full heating    │ —                          │
 │      │                                │                                                  │ system, 1x boiler service                           │                            │
 ├──────┼────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────────────────────┼────────────────────────────┤
 │ 5    │ Lead #1: Emergency burst pipe  │ JobLeadCard.tsx                                  │ High urgency flag, customer marked "ASAP"           │ —                          │
 │      │ in CR7 — 43h remaining         │                                                  │                                                     │                            │
 ├──────┼────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────────────────────┼────────────────────────────┤
 │      │ Creates quick quote: Emergency │                                                  │                                                     │                            │
 │ 6    │  call-out £150 + hourly rate   │ QuoteBuilderForm.tsx                             │ Fast turnaround — skips AI assist for simple quote  │ quotes row created and     │
 │      │ £80/hr, est 3 hours = £390     │                                                  │                                                     │ sent                       │
 │      │ total                          │                                                  │                                                     │                            │
 ├──────┼────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────────────────────┼────────────────────────────┤
 │      │                                │                                                  │ AI generates: Survey (£0 — free), Boiler unit       │                            │
 │ 7    │ Lead #2: Boiler install in     │ GET /api/provider/quotes/suggest-items           │ (£1,200), Installation labour (£800), Flue kit      │ —                          │
 │      │ SE25 — uses AI Quote Assist    │                                                  │ (£150), Magna clean filter (£120), Gas safety cert  │                            │
 │      │                                │                                                  │ (£80), Disposal of old boiler (£50) = £2,400        │                            │
 ├──────┼────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────────────────────┼────────────────────────────┤
 │      │ Adjusts AI suggestions:        │                                                  │ Total: £2,950. Adds 7-year manufacturer warranty    │                            │
 │ 8    │ upgrades boiler model to       │ QuoteBuilderForm.tsx line items                  │ note.                                               │ quotes row: £2,950         │
 │      │ £1,500, adds PowerFlush (£350) │                                                  │                                                     │                            │
 ├──────┼────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────────────────────┼────────────────────────────┤
 │      │ Lead #3: Full central heating  │                                                  │ Creates quote with just "Site Survey" line item (£0 │                            │
 │ 9    │ system, large house — needs    │ Lead detail                                      │  — free) and note: "Full quote to follow after      │ Preliminary quote sent     │
 │      │ site survey first              │                                                  │ survey"                                             │                            │
 ├──────┼────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────────────────────┼────────────────────────────┤
 │ 10   │ Declines Lead #4 and #5 (too   │ Lead cards                                       │ Clicks "Decline" with reason. Leads removed from    │ Leads marked as declined   │
 │      │ far, outside expertise)        │                                                  │ inbox.                                              │ for this provider          │
 ├──────┼────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────────────────────┼────────────────────────────┤
 │      │ Emergency pipe client accepts  │                                                  │                                                     │ bookings row:              │
 │ 11   │ quote within 1 hour            │ Client action                                    │ Booking created, Raj confirms                       │ status=confirmed,          │
 │      │                                │                                                  │                                                     │ emergency priority         │
 ├──────┼────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────────────────────┼────────────────────────────┤
 │ 12   │ Dispatches team member to      │ External coordination                            │ Marks job as "in_progress"                          │ Status updated             │
 │      │ emergency job                  │                                                  │                                                     │                            │
 ├──────┼────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────────────────────┼────────────────────────────┤
 │      │ Meanwhile: manages existing    │ /dashboard/provider/jobs/{id} →                  │ Timeline shows: Day 1 ✓, Day 2 ✓, Day 3 (today),    │                            │
 │ 13   │ Job #7 (heating install day 3  │ JobDetailView.tsx → JobTimeline.tsx              │ Day 4, Day 5                                        │ —                          │
 │      │ of 5)                          │                                                  │                                                     │                            │
 ├──────┼────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────────────────────┼────────────────────────────┤
 │      │ Sends client update message on │                                                  │ "Radiators installed in bedrooms today. Tomorrow    │                            │
 │ 14   │  Job #7                        │ Message thread in job detail                     │ we'll do living areas. On track for Friday          │ Message record created     │
 │      │                                │                                                  │ completion."                                        │                            │
 ├──────┼────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────────────────────┼────────────────────────────┤
 │ 15   │ Boiler install client accepts  │ Client action                                    │ Second new booking created                          │ bookings created,          │
 │      │ quote (£2,950)                 │                                                  │                                                     │ quotes.status = accepted   │
 ├──────┼────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────────────────────┼────────────────────────────┤
 │      │ Checks: would new boiler       │                                                  │                                                     │                            │
 │ 16   │ install conflict with existing │ AvailabilityCalendar.tsx                         │ Calendar shows Thursday-Friday open — no conflict   │ —                          │
 │      │  schedule?                     │                                                  │                                                     │                            │
 ├──────┼────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────────────────────┼────────────────────────────┤
 │ 17   │ Confirms boiler install        │ JobDetailView.tsx                                │ Booking confirmed for Thursday                      │ bookings.status =          │
 │      │ booking for Thursday           │                                                  │                                                     │ confirmed                  │
 ├──────┼────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────────────────────┼────────────────────────────┤
 │ 18   │ Emergency job completed same   │ Status change                                    │ Team member reports back. Raj marks complete.       │ bookings.status =          │
 │      │ day                            │                                                  │                                                     │ completed                  │
 ├──────┼────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────────────────────┼────────────────────────────┤
 │ 19   │ Generates invoice for          │ Invoice flow                                     │ Invoice sent immediately                            │ provider_invoices created  │
 │      │ emergency: £390                │                                                  │                                                     │                            │
 ├──────┼────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────────────────────┼────────────────────────────┤
 │      │                                │                                                  │ Today's summary: 2 quotes sent, 2 jobs confirmed, 1 │                            │
 │ 20   │ End of day: checks analytics   │ /dashboard/provider/analytics                    │  completed, £390 invoiced. Conversion funnel: 60%   │ —                          │
 │      │                                │                                                  │ (3/5 leads converted)                               │                            │
 ├──────┼────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────────────────────┼────────────────────────────┤
 │ 21   │ Views earnings breakdown by    │ getTopCategories()                               │ Gas Boiler: 45% of revenue, Plumbing: 30%, Heating: │ —                          │
 │      │ service category               │                                                  │  25%                                                │                            │
 ├──────┼────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────────────────────┼────────────────────────────┤
 │ 22   │ Notices Gas Safe cert expires  │ /dashboard/provider/verification/badges →        │ Yellow warning: "Gas Safe certification expires on  │ —                          │
 │      │ in 25 days                     │ BadgeGallery.tsx                                 │ 11 Apr 2026"                                        │                            │
 ├──────┼────────────────────────────────┼──────────────────────────────────────────────────┼─────────────────────────────────────────────────────┼────────────────────────────┤
 │ 23   │ Uploads renewed Gas Safe       │ /dashboard/provider/verification/credentials     │ New document replaces expiring one                  │ provider_documents updated │
 │      │ certificate                    │                                                  │                                                     │  with new expiry           │
 └──────┴────────────────────────────────┴──────────────────────────────────────────────────┴─────────────────────────────────────────────────────┴────────────────────────────┘

 Notifications

 - In-app: 5 new leads (step 4)
 - In-app: Emergency lead with urgency flag (step 5)
 - In-app: Quote accepted x2 (steps 11, 15)
 - Email: Gas Safe expiry warning 30 days before (step 22)

 Success Criteria

 - Multi-category matching works (leads across all 3 service types)
 - Availability calendar prevents double-booking
 - Recurring unavailability rules stored and enforced correctly
 - Multiple concurrent jobs manageable from single dashboard
 - AI Quote Assist generates category-appropriate line items (gas-specific items for boiler)
 - Emergency/urgent leads flagged prominently
 - Decline functionality removes leads cleanly
 - Credential expiry warnings surface at 30 days
 - Analytics correctly segments by service category
 - High-volume provider (150+ jobs, 12 active) dashboard performs well (< 2s load)

 Failure Points

 ┌────────────────────────────────────────────────────────────────────┬───────────────────────────────────────────────────────────────────────────────────────────────┐
 │                              Failure                               │                                       Expected Handling                                       │
 ├────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤
 │ Calendar double-booking (2 jobs same day same time)                │ Conflict detection warns but allows (provider manages team internally)                        │
 ├────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤
 │ Gas Safe expires without renewal                                   │ Verification status downgraded, marketplace visibility reduced, prominent dashboard warning   │
 ├────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤
 │ 12 active jobs causes slow dashboard load                          │ Dashboard queries optimized with pagination, pre-computed stats from provider_analytics_daily │
 ├────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤
 │ AI Quote Assist generates wrong items (plumbing items for gas job) │ User can dismiss all suggestions and add manually                                             │
 ├────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤
 │ Team member marks wrong job as complete                            │ Status can be reverted by provider with admin approval                                        │
 └────────────────────────────────────────────────────────────────────┴───────────────────────────────────────────────────────────────────────────────────────────────┘

 Metrics to Track

 - leads_per_category, conversion_per_category
 - concurrent_active_jobs (capacity utilization)
 - quote_response_time_by_urgency
 - revenue_per_category, revenue_per_area
 - credential_renewal_rate (renewed before expiry vs after)
 - Dashboard load time at high job volume

 ---
 Cross-Scenario Test Matrix

 ┌──────────────────────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬───────┐
 │         Feature          │ Sc.1 │ Sc.2 │ Sc.3 │ Sc.4 │ Sc.5 │ Sc.6 │ Sc.7 │ Sc.8 │ Sc.9 │ Sc.10 │
 ├──────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼───────┤
 │ Registration/Onboarding  │ P    │      │      │      │      │      │      │      │      │       │
 ├──────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼───────┤
 │ Verification Pipeline    │ P    │ P    │      │      │      │      │      │      │      │ P     │
 ├──────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼───────┤
 │ Lead Matching/Discovery  │      │      │ P    │      │      │      │ P    │      │ P    │ P     │
 ├──────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼───────┤
 │ AI Quote Assist          │      │      │ P    │      │      │      │      │      │      │ P     │
 ├──────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼───────┤
 │ Quote Builder            │      │      │ P    │ P    │      │      │      │      │      │ P     │
 ├──────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼───────┤
 │ Job State Machine        │      │      │ P    │ P    │      │      │      │      │ P    │ P     │
 ├──────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼───────┤
 │ Invoice Generation       │      │      │      │ P    │ P    │      │      │      │      │ P     │
 ├──────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼───────┤
 │ Stripe Connect           │      │      │      │ P    │ P    │      │      │      │ P    │       │
 ├──────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼───────┤
 │ Payments/Payouts         │      │      │      │ P    │ P    │      │      │      │ P    │       │
 ├──────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼───────┤
 │ Portfolio Management     │      │      │      │      │      │ P    │      │      │      │       │
 ├──────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼───────┤
 │ Review/Rating System     │      │      │      │      │      │ P    │      │      │ P    │       │
 ├──────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼───────┤
 │ Review Response          │      │      │      │      │      │ P    │      │      │ P    │       │
 ├──────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼───────┤
 │ Service Management       │      │      │      │      │      │      │ P    │      │      │ P     │
 ├──────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼───────┤
 │ Service Area Map         │      │      │      │      │      │      │ P    │      │      │       │
 ├──────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼───────┤
 │ Availability Calendar    │      │      │      │      │      │      │      │      │      │ P     │
 ├──────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼───────┤
 │ Boosts                   │      │      │      │      │      │      │      │ P    │      │       │
 ├──────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼───────┤
 │ Analytics                │      │      │      │      │      │      │      │ P    │      │ P     │
 ├──────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼───────┤
 │ Referrals                │      │      │      │      │      │      │      │ P    │      │       │
 ├──────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼───────┤
 │ Dispute Resolution       │      │      │      │      │      │      │      │      │ P    │       │
 ├──────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼───────┤
 │ Error Recovery           │      │      │      │      │ P    │      │      │      │ P    │       │
 ├──────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼───────┤
 │ Multi-Service Management │      │      │      │      │      │      │      │      │      │ P     │
 ├──────────────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼───────┤
 │ Credential Expiry        │      │ P    │      │      │      │      │      │      │      │ P     │
 └──────────────────────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴───────┘

 P = Primary coverage, P = Secondary coverage

 ---
 FAANG-Level Quality Checklist

 Performance Targets

 - Dashboard load < 2s at 100+ active jobs
 - Search results < 200ms (P95) at 10K providers
 - Map rendering < 1s with 3+ service areas
 - Quote builder localStorage save < 100ms
 - PDF invoice generation < 3s

 Security Targets

 - All provider endpoints verify auth.uid() === provider_id
 - PDF access: server-side auth gate
 - Stripe webhook: signature verification + idempotency
 - File uploads: magic byte validation, EXIF stripping
 - RLS on every provider table
 - No cross-provider data leakage in any scenario

 Accessibility Targets

 - All flows keyboard-navigable
 - Screen reader compatible (ARIA labels on map, drag-and-drop)
 - Colour contrast meets WCAG 2.1 AA
 - Touch targets ≥ 44px for mobile

 Reliability Targets

 - All state machines enforce valid transitions only
 - Idempotent API endpoints (safe to retry)
 - localStorage fallback for form data
 - Graceful degradation when external services fail (Stripe, MapTiler, Claude AI)
 - Webhook processing resilient to out-of-order delivery

 ---
 Verification Plan

 To validate these user flows work end-to-end:

 1. Unit Tests: Service layer functions for each flow step (existing test stubs in src/services/provider/__tests__/)
 2. Integration Tests: API route tests for each endpoint with auth + RLS verification
 3. E2E Tests (Playwright): Automate each scenario as a test suite
 4. Manual QA: Walk through each scenario using /qa skill on deployed staging
 5. Load Testing: Dashboard performance with high job counts (Scenario 10)
 6. Security Audit: Cross-provider access attempts, Stripe webhook tampering, file upload exploits