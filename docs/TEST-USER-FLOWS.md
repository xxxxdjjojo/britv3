# Britestate v3.0 — 20 Test User Flows (EXPANSION Mode)

**Date:** 2026-03-19
**Purpose:** End-to-end user flow testing for all 7 roles + cross-user interaction chains
**Mode:** EXPANSION — click-by-click detail, edge cases, cross-user flows

---

## Table of Contents

1. [User Roster](#user-roster)
2. [Cross-User Interaction Map](#cross-user-interaction-map)
3. [Individual User Flows (1-20)](#individual-user-flows)
4. [Cross-User Chains (A-E)](#cross-user-chains)
5. [Edge Case Matrix](#edge-case-matrix)

---

## User Roster

| # | Name | Email | Role | Persona | Password |
|---|------|-------|------|---------|----------|
| 1 | Emma Thompson | emma.thompson@test.britestate.co.uk | Homebuyer | First-time buyer, 28, nurse in Manchester | Test1234! |
| 2 | James Okafor | james.okafor@test.britestate.co.uk | Homebuyer | Upgrader, 42, software engineer, family of 4 | Test1234! |
| 3 | Priya Sharma | priya.sharma@test.britestate.co.uk | Homebuyer | Buy-to-let investor, 55, portfolio builder | Test1234! |
| 4 | Alex Chen | alex.chen@test.britestate.co.uk | Renter | Young professional, 24, moving to London | Test1234! |
| 5 | Fatima Hassan | fatima.hassan@test.britestate.co.uk | Renter | Family renter, 35, needs 3-bed near schools | Test1234! |
| 6 | Robert Williamson | robert.williamson@test.britestate.co.uk | Seller | Downsizer, 67, selling family home in Surrey | Test1234! |
| 7 | Sarah Mitchell | sarah.mitchell@test.britestate.co.uk | Seller | Relocating, 38, selling London flat, moving to Bristol | Test1234! |
| 8 | David Patel | david.patel@test.britestate.co.uk | Landlord | Single property, 45, first-time landlord | Test1234! |
| 9 | Margaret O'Brien | margaret.obrien@test.britestate.co.uk | Landlord | Portfolio landlord, 58, 6 properties across North West | Test1234! |
| 10 | Tom Richards | tom.richards@test.britestate.co.uk | Estate Agent | Independent agency owner, "Richards & Co", Surrey | Test1234! |
| 11 | Jessica Nguyen | jessica.nguyen@test.britestate.co.uk | Estate Agent | Chain agent, works at large firm, London | Test1234! |
| 12 | Mark Stevens | mark.stevens@test.britestate.co.uk | Estate Agent | New agent, just joined agency, learning the ropes | Test1234! |
| 13 | Gary Electrician | gary.watts@test.britestate.co.uk | Service Provider | Electrician, NICEIC certified, 15 years experience | Test1234! |
| 14 | Maria Plumber | maria.flores@test.britestate.co.uk | Service Provider | Plumber, Gas Safe registered, emergency callouts | Test1234! |
| 15 | Chris Survey | chris.drummond@test.britestate.co.uk | Service Provider | Chartered Surveyor, RICS member | Test1234! |
| 16 | Nina Convey | nina.green@test.britestate.co.uk | Service Provider | Conveyancer, CLC regulated, 10 years | Test1234! |
| 17 | Andrew Mortgage | andrew.blake@test.britestate.co.uk | Mortgage Broker | Independent broker, FCA registered | Test1234! |
| 18 | Sophie Finance | sophie.taylor@test.britestate.co.uk | Mortgage Broker | Works at Habito-style firm, specialises in FTB | Test1234! |
| 19 | Admin Joan | admin@test.britestate.co.uk | Admin | Platform admin, full back-office access | Test1234! |
| 20 | Raj Multi | raj.kapoor@test.britestate.co.uk | Landlord + Seller | Landlord selling one of his properties | Test1234! |

---

## Cross-User Interaction Map

```
  CHAIN A: Property Sale Flow
  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
  │ #6 Robert    │───▶│ #10 Tom      │───▶│ #1 Emma      │───▶│ #17 Andrew   │
  │ (Seller)     │    │ (Agent)      │    │ (Buyer)      │    │ (Broker)     │
  │ Lists home   │    │ Claims lead  │    │ Books viewing │    │ Mortgage app │
  │ in Surrey    │    │ Manages sale │    │ Makes offer   │    │ Arranges AIP │
  └─────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                │
                                         ┌──────▼──────┐    ┌──────────────┐
                                         │ #15 Chris   │    │ #16 Nina     │
                                         │ (Surveyor)  │    │ (Conveyancer)│
                                         │ Does survey  │    │ Legal work   │
                                         └─────────────┘    └──────────────┘

  CHAIN B: Rental Flow
  ┌─────────────┐    ┌──────────────┐
  │ #8 David     │───▶│ #4 Alex      │
  │ (Landlord)   │    │ (Renter)     │
  │ Lists rental │    │ Finds rental │
  │ Sets price   │    │ Applies      │
  └──────┬──────┘    └──────────────┘
         │
  ┌──────▼──────┐
  │ #13 Gary    │
  │ (Electrician)│
  │ EICR cert   │
  │ Maintenance  │
  └─────────────┘

  CHAIN C: Maintenance Flow
  ┌─────────────┐    ┌──────────────┐
  │ #9 Margaret  │───▶│ #14 Maria    │
  │ (Landlord)   │    │ (Plumber)    │
  │ Reports leak │    │ Gets quote   │
  │ in HMO       │    │ request      │
  └─────────────┘    └──────────────┘

  CHAIN D: Multi-Role Flow
  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
  │ #20 Raj      │───▶│ #11 Jessica  │───▶│ #2 James     │
  │ (Landlord    │    │ (Agent)      │    │ (Upgrader)   │
  │  + Seller)   │    │ Lists for Raj│    │ Buys Raj's   │
  │ Sells 1 prop │    │              │    │ property     │
  └─────────────┘    └──────────────┘    └──────────────┘

  CHAIN E: Investor Flow
  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
  │ #3 Priya     │───▶│ #18 Sophie   │───▶│ #15 Chris    │
  │ (Investor)   │    │ (Broker)     │    │ (Surveyor)   │
  │ Finds BTL    │    │ BTL mortgage │    │ Survey for   │
  │ property     │    │ advice       │    │ investment   │
  └─────────────┘    └──────────────┘    └──────────────┘
```

---

## Individual User Flows

---

### USER 1: Emma Thompson — First-Time Homebuyer

**Persona:** 28-year-old NHS nurse in Manchester. First property purchase. Budget £180k-£250k. Wants 2-bed flat near tram line. Nervous about the process.

#### Flow 1.1: Registration
1. **Navigate** to `britestate.co.uk`
2. **See** hero section: "Find your perfect British home, intelligently"
3. **Click** "Sign In" in header → redirected to `/login`
4. **Click** "Create an account" link below login form
5. **Arrive** at `/register`
6. **See** intent toggle: "I want to buy" | "I want to rent"
7. **Click** "I want to buy" → toggle highlights
8. **Fill in:**
   - First name: `Emma`
   - Last name: `Thompson`
   - Email: `emma.thompson@test.britestate.co.uk`
   - Password: `Test1234!` (password strength meter shows: strong)
9. **Check** "I agree to Terms of Service and Privacy Policy"
10. **Click** "Create Account" button
11. **Wait** for loading spinner → "Setting up..."
12. **Redirected** to `/verify-email`
13. **See** "Check your email" page with resend button (60s cooldown)

**Edge case:** Double-click "Create Account" → button should disable after first click
**Edge case:** Navigate away during signup → partial state lost, must restart

#### Flow 1.2: Email Verification
14. **Open** email inbox → find Britestate verification email
15. **Click** verification link in email
16. **Arrive** at `/verify-email/confirmed` → "Email verified!"
17. **Click** "Continue to setup" → redirected to `/register/onboarding/homebuyer`

#### Flow 1.3: Onboarding (Buyer - 4 Steps)
18. **See** WizardStepper: Step 1 of 4 — Location
19. **Type** "Manchester" in location input → press Enter
20. **See** "Manchester" chip appear
21. **Type** "Salford" → press Enter → second chip
22. **Click** "Continue"

23. **See** Step 2 of 4 — Budget
24. **Change** Min budget to `180000` (type or use arrows)
25. **Change** Max budget to `250000`
26. **Click** "Continue"

27. **See** Step 3 of 4 — Property Type
28. **Click** "Flat" pill button → highlights
29. **Set** Min bedrooms to `2` (click + once)
30. **Click** "Parking" must-have pill
31. **Click** "EPC A-C" must-have pill
32. **Click** "Continue"

33. **See** Step 4 of 4 — Alerts
34. **Click** "Instant" alert frequency
35. **Click** "Complete Setup"
36. **Wait** for save → redirected to `/dashboard`

**Edge case:** Click "Skip for now" on Step 1 → skips all onboarding, lands on dashboard with no preferences
**Edge case:** Press Back browser button mid-wizard → should preserve entered data

#### Flow 1.4: Dashboard Exploration
37. **Arrive** at `/dashboard/homebuyer`
38. **See** Homebuyer Dashboard with:
    - 4 stat cards: Saved Properties (0), Active Searches (0), Upcoming Viewings (0), Recent Views (0)
    - Welcome banner
    - "New Properties" carousel (may be empty if no listings match)
    - Recommended Services section
39. **See** left sidebar nav: Overview, Saved Properties, Searches, Viewings, Documents
40. **See** bottom nav: Inbox, Notifications, Profile

#### Flow 1.5: Property Search
41. **Click** "Buy" in header navigation → `/search?type=buy`
42. **See** search page with filters sidebar
43. **In search bar,** type "Manchester"
44. **In filters:**
    - Property Type: check "Flat"
    - Min Bedrooms: click "2"
    - Price Range: set min `180000`, max `250000`
45. **See** results grid update (filtered)
46. **Click** on a property card → `/properties/[slug]`

#### Flow 1.6: Property Detail & Save
47. **See** property detail page:
    - Gallery/images at top
    - Price, address, beds/baths/sqft
    - Description, features, floor plans
    - EPC display, price history
    - Local area: transport, schools, broadband, flood risk
    - Mortgage calculator widget (sidebar)
    - SDLT calculator widget (sidebar)
48. **Click** "Save Property" heart icon → property saved (toast notification)
49. **Use** mortgage calculator widget:
    - Adjust deposit slider
    - See monthly payment estimate
50. **Click** "Book Viewing" button → viewing booking modal opens
51. **Select** date and time for viewing
52. **Choose** "In Person" viewing type
53. **Click** "Confirm Booking"
54. **See** confirmation toast: "Viewing booked!"

**Edge case:** Click Save when not logged in → redirects to login, then back to property
**Edge case:** Book viewing for past date → should show validation error

#### Flow 1.7: Save Search
55. **Navigate** back to `/search`
56. **Apply** same filters as before
57. **Click** "Save Search" button
58. **Enter** search name: "Manchester 2-bed flats"
59. **Toggle** alerts: ON (Instant)
60. **Click** "Save"
61. **Navigate** to Dashboard → Searches → see saved search listed

#### Flow 1.8: Settings & Profile
62. **Click** Profile icon in sidebar footer → `/settings/account`
63. **See** account settings with pre-filled name and email
64. **Add** phone: `07700900123`
65. **Add** postcode: `M1 1AA`
66. **Upload** avatar photo (click avatar, select file)
67. **Click** "Save Changes"

68. **Click** "Security" tab → `/settings/security`
69. **See** password change form, MFA section, active sessions
70. **Click** "Enable" on Two-Factor Authentication
71. **See** QR code + secret key
72. **Scan** QR code with authenticator app
73. **Enter** 6-digit code → verify
74. **See** backup codes → copy/download
75. **2FA now enabled**

76. **Click** "Privacy & Data" tab → `/settings/privacy`
77. **Click** "Members Only" quick privacy mode
78. **See** all toggles update to members-only settings
79. **Click** "Save"

80. **Click** "Notifications" tab → `/settings/notifications`
81. **Toggle OFF** SMS for all categories (prefer email + push only)
82. **Click** "Save"

83. **Click** "Preferences" tab → `/settings/preferences`
84. **Verify** locale is `en-GB`, date is `DD/MM/YYYY`, currency is `GBP`
85. **Set** font size to "Medium"
86. **Toggle** "Reduced Motion" ON
87. **Click** "Save"

#### Flow 1.9: Documents
88. **Navigate** to Dashboard → Documents → `/dashboard/homebuyer/documents`
89. **See** Document Vault (empty state)
90. **Select** document type: "ID Proof"
91. **Click** upload → select passport scan PDF
92. **See** document appear in table: status "uploaded" → pending_review
93. **Upload** another: type "Proof of Funds" → bank statement PDF

---

### USER 2: James Okafor — Upgrader Homebuyer

**Persona:** 42-year-old software engineer in Bristol. Family of 4 (wife + 2 kids). Currently owns a 2-bed terrace, wants 4-bed detached. Budget £450k-£600k. Tech-savvy.

#### Flow 2.1: Registration (via Google OAuth)
1. **Navigate** to `britestate.co.uk`
2. **Click** "Sign In" → `/login`
3. **Click** "Continue with Google" button
4. **Google OAuth popup** → select Google account
5. **Redirected** to `/auth/callback` → processes OAuth code
6. **Auto-assigned** role: "homebuyer" (default for OAuth)
7. **Redirected** to `/dashboard` (or onboarding if first time)

**Edge case:** Google OAuth fails (popup blocked) → should show error banner on login page
**Edge case:** User has existing account with same email → should link accounts

#### Flow 2.2: Onboarding
8. **Redirected** to `/register/onboarding/homebuyer`
9. **Step 1 - Location:** Add "Bristol", "Bath", "North Somerset"
10. **Step 2 - Budget:** Min £450,000, Max £600,000
11. **Step 3 - Property Type:** Select "House", Min bedrooms: 4, Must-haves: "Garden", "Parking"
12. **Step 4 - Alerts:** Select "Daily"
13. **Click** "Complete Setup" → dashboard

#### Flow 2.3: Advanced Search & Compare
14. **Navigate** to `/search?type=buy`
15. **Set filters:** Detached, 4+ beds, 2+ baths, £450k-£600k, Bristol area
16. **View** results in Map view (toggle to map)
17. **See** property pins on MapLibre map
18. **Click** pin → see property popup
19. **Click** through to property detail

20. **On property detail page:**
    - **Use** SDLT calculator (sidebar) → see stamp duty for £520,000
    - **Check** Renovation ROI panel → see potential value-add scenarios
    - **Review** school catchment widget → check Ofsted ratings
    - **Review** transport widget → nearest stations
21. **Click** "Save Property"
22. **Repeat** for 3 more properties

23. **Navigate** to Dashboard → Saved Properties → `/dashboard/homebuyer/saved`
24. **See** 4 saved properties in grid

#### Flow 2.4: Use Calculators
25. **Navigate** to `/tools/mortgage-calculator`
26. **Enter:** Property price £520,000, Deposit £130,000 (25%), Term 25 years, Rate 4.5%
27. **See** monthly payment calculation
28. **Click** "Stamp Duty Calculator" link in sidebar → `/tools/stamp-duty-calculator`
29. **Enter** £520,000, Not first-time buyer
30. **See** SDLT breakdown by band
31. **Click** "Affordability Calculator" → `/tools/affordability-calculator`
32. **Enter** combined household income, expenses
33. **See** how much they can borrow

---

### USER 3: Priya Sharma — Buy-to-Let Investor

**Persona:** 55-year-old property investor. Already owns 3 BTL properties. Looking for next investment in Liverpool. Wants high rental yield. Experienced.

#### Flow 3.1: Registration
1. **Navigate** to `britestate.co.uk`
2. **Click** "Sign In" → "Create an account"
3. **Select** "I want to buy"
4. **Fill in:** First name: Priya, Last name: Sharma, email, password
5. **Complete** registration → verify email → onboarding

#### Flow 3.2: Onboarding (Investment Focus)
6. **Step 1 - Location:** "Liverpool", "Birkenhead"
7. **Step 2 - Budget:** Min £80,000, Max £200,000
8. **Step 3 - Property Type:** "Flat", "House", Min beds: 2, Must-haves: none (flexible)
9. **Step 4 - Alerts:** "Daily"
10. **Complete setup**

#### Flow 3.3: Investment Research
11. **Navigate** to `/search?type=buy`
12. **Filter** for Liverpool area, £80k-£200k, 2+ beds
13. **Open** property → focus on:
    - **Rental Yield calculator** (sidebar widget)
    - **Price History** chart → check growth trend
    - **EPC Rating** → assess energy costs for tenant
    - **Renovation ROI** panel → could this be improved?
14. **Save** 5 high-yield properties

15. **Navigate** to `/tools/rental-yield-calculator`
16. **Enter** purchase price £120,000, monthly rent £650
17. **See** gross yield: 6.5%

18. **Navigate** to `/tools/buy-vs-rent-calculator`
19. **Compare** buying vs renting for investment scenario

#### Flow 3.4: Find Mortgage Broker
20. **Navigate** to `/services` → click "Mortgage Brokers"
21. **Browse** broker profiles
22. **Find** Andrew Blake (User #17) → view profile
23. **Click** "Contact" → sends message via inbox

#### Flow 3.5: Find Surveyor
24. **Navigate** to `/marketplace`
25. **Search** "Surveyor Liverpool"
26. **Find** Chris Drummond (User #15) → view profile
27. **Compare** with 2 other surveyors using Compare feature
28. **Click** "Request Quote" → fills in RFQ form

---

### USER 4: Alex Chen — Young Professional Renter

**Persona:** 24-year-old graduate, starting first job in Canary Wharf. Needs 1-bed flat in East London. Budget £1,200-£1,600/month. Wants quick move-in.

#### Flow 4.1: Registration
1. **Navigate** to `britestate.co.uk`
2. **Click** "Rent" tab on homepage → `/search?type=rent`
3. **See** search results (browsing as guest)
4. **Find** a flat → click → property detail
5. **Click** "Book Viewing" → redirected to `/login` (not authenticated)
6. **Click** "Create an account"
7. **Select** "I want to rent"
8. **Fill in:** Alex, Chen, email, password
9. **Register** → verify email

#### Flow 4.2: Onboarding (Renter - Same as Buyer)
10. **Step 1 - Location:** "Canary Wharf", "Stratford", "Greenwich"
11. **Step 2 - Budget:** Min £1,200, Max £1,600 (monthly rent)
12. **Step 3 - Property Type:** "Flat", "Studio", Min beds: 1, Must-haves: none
13. **Step 4 - Alerts:** "Instant" (needs to move fast)
14. **Complete setup**

#### Flow 4.3: Rental Search
15. **Navigate** to `/search?type=rent`
16. **Filter:** East London, 1+ bed, £1,200-£1,600/month
17. **Toggle** to List view → see detailed rows
18. **Sort** by "Newest first"
19. **Open** 3 properties, save all 3
20. **Book viewing** for top choice:
    - Select earliest available date
    - Choose "Virtual" viewing (can't travel yet)
    - Confirm booking

#### Flow 4.4: Dashboard (Renter)
21. **Navigate** to `/dashboard/renter`
22. **See:** Saved Rentals (3), Applications Sent (0), Active Tenancy (None), Rent Due In (N/A)
23. **Click** "Viewings" in sidebar → `/dashboard/renter/viewings`
24. **See** upcoming virtual viewing listed

#### Flow 4.5: Upload Documents
25. **Navigate** to Dashboard → Documents
26. **Upload** "ID Proof" → passport scan
27. **Upload** "Proof of Funds" → 3 months bank statements
28. **See** documents: status "pending_review"

---

### USER 5: Fatima Hassan — Family Renter

**Persona:** 35-year-old teacher. Family of 5 (husband + 3 kids). Needs 3-bed house near good schools. Budget £1,400-£1,800/month. Currently in Birmingham.

#### Flow 5.1: Registration & Onboarding
1. **Register** with email/password, intent: "I want to rent"
2. **Onboarding:**
   - Location: "Birmingham", "Solihull", "Sutton Coldfield"
   - Budget: £1,400-£1,800
   - Property Type: "House", Min beds: 3, Must-haves: "Garden"
   - Alerts: "Daily"

#### Flow 5.2: School-Focused Search
3. **Navigate** to `/search?type=rent`
4. **Filter:** Birmingham, 3+ beds, House, £1,400-£1,800
5. **Open** property detail
6. **Focus on:**
   - **School Catchment Widget** → check Ofsted ratings for nearby primary & secondary
   - **Transport Widget** → check bus routes for commute
   - **Crime Stats** → check safety
7. **Save** properties near Outstanding-rated schools

#### Flow 5.3: Contact Landlord
8. **On property detail** → click "Contact" / "Send Message"
9. **Compose message:** "Hi, we're a family of 5 looking for a long-term tenancy. Are pets allowed?"
10. **Send** → message appears in Inbox

---

### USER 6: Robert Williamson — Downsizer Seller

**Persona:** 67-year-old retired, selling family 4-bed detached in Surrey (worth ~£750k). Downsizing to 2-bed bungalow. Not tech-savvy. Wants agent help.

#### Flow 6.1: Registration
1. **Navigate** to `britestate.co.uk`
2. **Click** "List Your Property" CTA on homepage → `/register?role=seller`
3. **See** registration form with "seller" role pre-selected (via URL param)
4. **Fill in:** Robert, Williamson, email, password
5. **Register** → verify email

#### Flow 6.2: Onboarding (Seller - 3 Steps)
6. **Redirected** to `/register/onboarding/seller`
7. **Step 1 - Your Property:**
   - Address: `14 Oak Lane, Guildford, Surrey`
   - Property type: "Detached"
   - Bedrooms: 4 (click + three times)
   - Bathrooms: 2 (click + once)
8. **Click** "Continue"

9. **Step 2 - Property Details:**
   - Tenure: "Freehold"
   - EPC Rating: "D"
   - Estimated value: `750000`
10. **Click** "Continue"

11. **Step 3 - Selling Intent:**
    - Timeline: "3 months"
    - Agent preference: "Use Britestate"
12. **Click** "Complete Setup"
13. **Redirected** to `/dashboard`

#### Flow 6.3: Seller Dashboard
14. **Arrive** at `/dashboard/seller`
15. **See:** Active Listings (1 draft), Total Views (0), Enquiries (0), Upcoming Viewings (0)
16. **Click** "My Listings" in sidebar → see draft listing

#### Flow 6.4: Create Full Listing (7-Step Wizard)
17. **Click** "Edit" on draft listing → `/dashboard/seller/listings/create?step=1&id=[listingId]`

18. **Step 1 - Address & Property Type:**
    - Verify pre-filled address: "14 Oak Lane, Guildford, Surrey"
    - Postcode: `GU1 1AA` → click "Lookup postcode" (validates via postcodes.io)
    - Property Type: "Detached" (already selected)
    - Tenure: "Freehold" (already selected)
19. **Click** "Next"

20. **Step 2 - Details:**
    - Bedrooms: 4, Bathrooms: 2 (pre-filled)
    - Reception rooms: 2
    - Square footage: estimate `2,200`
    - Parking: "Driveway" + "Garage"
    - Garden: "Large rear garden"
    - Features: "Conservatory", "Utility room", "En-suite"
21. **Click** "Next"

22. **Step 3 - Photos:**
    - Upload 12 photos (living room, kitchen, bedrooms, garden, exterior)
    - Drag to reorder (first photo = hero image)
    - Wait for upload progress bars
23. **Click** "Next"

24. **Step 4 - Description:**
    - Write description (or use AI: click "Generate with AI" → Claude generates description)
    - Review AI-generated text
    - Edit to add personal touches
25. **Click** "Next"

26. **Step 5 - Price:**
    - Price: `£749,950`
    - Price type: "Fixed price" or "Offers over"
27. **Click** "Next"

28. **Step 6 - EPC:**
    - Upload EPC certificate PDF
    - Or select "Exempt"
29. **Click** "Next"

30. **Step 7 - Review:**
    - See summary of all entered data
    - Photos preview
    - Description preview
    - Price display
31. **Click** "Publish Listing"
32. **See** confirmation: "Listing published!"
33. **Listing** now visible in search results

**Edge case:** Upload fails (file too large) → should show error, not lose other uploads
**Edge case:** Browser crash on Step 5 → draft should be saved, can resume
**Edge case:** Publish with missing required fields → should block with validation errors

#### Flow 6.5: Manage Viewings
34. **Navigate** to Seller Dashboard → Viewings → `/dashboard/seller/viewings`
35. **See** viewing requests from buyers (once Emma books)
36. **Accept** or **Decline** viewing requests
37. **See** confirmed viewings in calendar view

#### Flow 6.6: Review Offers
38. **Navigate** to Seller Dashboard → Offers → `/dashboard/seller/offers`
39. **See** incoming offers (once buyers make offers)
40. **Options:** Accept, Reject, Counter-offer
41. **Click** "Counter-offer" → enter new amount → send

#### Flow 6.7: Find Agent
42. **Navigate** to Seller Dashboard → sidebar → "Agents" or `/dashboard/seller/agents`
43. **Browse** local agents → find Tom Richards (User #10)
44. **Click** "Contact Agent"
45. **Send message:** "I'm looking for an agent to sell my 4-bed in Guildford"

---

### USER 7: Sarah Mitchell — Relocating Seller

**Persona:** 38-year-old marketing director. Selling 2-bed flat in Hackney (£520k), moving to Bristol. Time pressure — needs to sell within 2 months. Has agent already.

#### Flow 7.1: Registration & Onboarding
1. **Register** as seller
2. **Onboarding:**
   - Property: "42 Dalston Lane, Hackney, London", Flat, 2 beds, 1 bath
   - Tenure: Leasehold, EPC: C, Value: £520,000
   - Timeline: "ASAP", Agent: "Have an agent"
3. **Complete** setup → dashboard

#### Flow 7.2: Quick Listing Creation
4. **Create listing** through 7-step wizard (faster than Robert — knows what she's doing)
5. **Step 4 - Description:** Uses "Generate with AI" → edits for accuracy
6. **Publishes** immediately

#### Flow 7.3: Analytics Monitoring
7. **Navigate** to Seller Dashboard → see performance chart (30 days)
8. **Check** daily: views, enquiries, viewing requests
9. **Respond** quickly to all enquiries via Inbox

#### Flow 7.4: Sale Progression
10. **Once offer accepted:**
    - Navigate to `/dashboard/seller/sale-progress/[id]`
    - Track milestones: Offer Accepted → Solicitor Instructed → Searches → Exchange → Completion
    - Upload documents as requested

---

### USER 8: David Patel — First-Time Landlord

**Persona:** 45-year-old IT manager. Inherited parents' 2-bed flat in Leeds. Wants to let it out. First time being a landlord. Needs guidance.

#### Flow 8.1: Registration
1. **Navigate** to `britestate.co.uk`
2. **Click** "Sign In" → "Create an account"
3. **See** intent toggle → neither applies, so:
4. **Click** "I'm a professional" link (or navigate to role selector)
5. **Arrive** at `/register/role-select`
6. **Click** "Landlord" card → card highlights with checkmark
7. **Click** "Continue"
8. **Redirected** to `/register?professional=landlord`
9. **Fill in:** David, Patel, email, password
10. **Register** → verify email

#### Flow 8.2: Onboarding (Landlord - 3 Steps)
11. **Step 1 - Your Portfolio:**
    - Portfolio size: 1 (default)
    - Property types: click "Flat"
12. **Click** "Continue"

13. **Step 2 - First Property:**
    - Address: "28 Chapel Allerton Road, Leeds"
    - Property type: "Flat"
    - Bedrooms: 2
    - Monthly rent: £850
14. **Click** "Continue"

15. **Step 3 - Compliance Documents (Optional):**
    - Upload Gas Safety Certificate (PDF)
    - Upload EPC (PDF)
    - Skip EICR for now (needs to get one done → will hire Gary, User #13)
16. **Click** "Complete Setup"

#### Flow 8.3: Landlord Dashboard
17. **Arrive** at `/dashboard/landlord`
18. **See:**
    - Welcome Hero Banner (dark green)
    - Health Score card
    - 4 KPI cards: Properties (1), Occupancy (0%), Monthly Income (£0), Open Maintenance (0)
    - **Compliance Alert:** "EICR missing" → red indicator
    - Quick Actions: Add Property, Log Rent, View Compliance, etc.

#### Flow 8.4: View Property Detail
19. **Click** "Portfolio" in sidebar → `/dashboard/landlord/properties`
20. **See** property card: "28 Chapel Allerton Road"
21. **Click** → property detail page with tabs:
    - Overview, Listing, Documents, Financials, Maintenance, Tenancies

#### Flow 8.5: Create Rental Listing
22. **On property detail** → "Listing" tab → click "Create Listing"
23. **Fill in** rental listing details
24. **Publish** to rental search

#### Flow 8.6: Find Electrician for EICR
25. **Click** "Find Tradespeople" in Quick Actions → marketplace
26. **Search** "Electrician Leeds"
27. **Find** Gary Watts (User #13) profile
28. **Click** "Request Quote"
29. **Fill in RFQ:**
    - Service: "EICR Certificate"
    - Description: "Need EICR for rented 2-bed flat"
    - Preferred date: [next week]
    - Budget: "£100-£200"
30. **Submit** RFQ → sent to Gary

#### Flow 8.7: Compliance Dashboard
31. **Navigate** to Dashboard → Compliance → `/dashboard/landlord/compliance`
32. **See** document status:
    - Gas Safety: ✅ Valid (uploaded)
    - EPC: ✅ Valid (uploaded)
    - EICR: ❌ Missing → "Book Now" link
33. **After Gary completes EICR:**
    - Upload EICR certificate
    - Compliance score → 100%

#### Flow 8.8: Tenant Management (After Alex Applies)
34. **Navigate** to Dashboard → Tenants → `/dashboard/landlord/tenants`
35. **See** incoming application from Alex (User #4) — or equivalent tenant
36. **Review** application details
37. **Accept** or **Reject** application
38. **If accepted:** Create tenancy record, set move-in date

#### Flow 8.9: Financial Tracking
39. **Navigate** to Dashboard → Finances → `/dashboard/landlord/finance`
40. **Log** rent payment received
41. **Log** expenses (maintenance, insurance)
42. **View** profit/loss report
43. **View** tax report → `/dashboard/landlord/finance/tax`

---

### USER 9: Margaret O'Brien — Portfolio Landlord

**Persona:** 58-year-old professional landlord. 6 properties across Manchester and Liverpool (mix of HMOs and single lets). Very experienced. Wants efficiency.

#### Flow 9.1: Registration & Onboarding
1. **Register** via role selector → select "Landlord"
2. **Onboarding:**
   - Portfolio size: 6
   - Property types: "Flat", "House", "HMO"
   - First property: "15 Oxford Road, Manchester", HMO, 5 beds, £2,400/month
   - Documents: Upload all 3 (Gas, EPC, EICR)
3. **Complete** setup

#### Flow 9.2: Add Multiple Properties
4. **Dashboard** → Quick Action "Add Property" → `/dashboard/landlord/properties/add`
5. **Add** remaining 5 properties one by one:
   - Property 2: Flat, Liverpool, 2 beds, £750/month
   - Property 3: House, Manchester, 3 beds, £1,100/month
   - Property 4: Flat, Liverpool, 1 bed, £600/month
   - Property 5: HMO, Manchester, 6 beds, £3,000/month
   - Property 6: House, Liverpool, 3 beds, £950/month
6. **For each:** Fill address, type, beds, bathrooms, purchase price, monthly rent

#### Flow 9.3: Maintenance Request (Cross-User: Chain C)
7. **Navigate** to Dashboard → Maintenance → `/dashboard/landlord/maintenance`
8. **Click** "New Request" for Property 2 (Liverpool flat)
9. **Fill in:**
    - Issue: "Leaking bathroom tap"
    - Priority: "Medium"
    - Description: "Tenant reports dripping kitchen tap, water pooling under sink"
    - Photos: Upload 2 photos
10. **Submit** → maintenance ticket created
11. **Search marketplace** for plumber → find Maria Flores (User #14)
12. **Send** quote request through marketplace

#### Flow 9.4: Portfolio Analytics
13. **Navigate** to Dashboard → `/dashboard/landlord/analytics`
14. **See:**
    - Total portfolio value
    - Total monthly income (all 6 properties)
    - Occupancy rate across portfolio
    - Maintenance costs trend
    - Yield per property comparison

#### Flow 9.5: Compliance Management (Portfolio Scale)
15. **Navigate** to Compliance → see all 6 properties' compliance status
16. **Identify** which certificates expire in next 3 months
17. **Book** renewals via marketplace
18. **Upload** renewed certificates

---

### USER 10: Tom Richards — Independent Agent (Agency Owner)

**Persona:** 50-year-old runs "Richards & Co Estate Agents" in Guildford, Surrey. 3-person team. Traditional values, embracing digital. ARLA registered.

#### Flow 10.1: Registration
1. **Navigate** to `britestate.co.uk`
2. **Click** "Sign In" → "Create an account"
3. **Navigate** to `/register/role-select`
4. **Click** "Estate Agent" card → highlights
5. **Click** "Continue" → `/register?professional=agent`
6. **Fill in:** Tom, Richards, email, password
7. **Register** → verify email

#### Flow 10.2: Onboarding (Agent - 3 Steps)
8. **Step 1 - Your Agency:**
   - Agency name: `Richards & Co Estate Agents`
   - Office address: `25 High Street, Guildford, GU1 3DY`
   - Registration number: `ARLA-12345`
9. **Click** "Continue"

10. **Step 2 - Your Profile:**
    - Job title: `Director`
    - Coverage regions: click "South East" pill
    - Specialisms: click "Residential Sales", "Lettings"
11. **Click** "Continue"

12. **Step 3 - Invite Team:**
    - Enter: `jessica@richardsco.com` → click "Add" → role: "Agent"
    - Enter: `mark@richardsco.com` → click "Add" → role: "Agent"
13. **Click** "Complete Setup"
14. **Redirected** to `/two-factor-setup` (2FA required for agents)

#### Flow 10.3: Two-Factor Authentication Setup
15. **See** QR code for authenticator app
16. **Scan** with phone → enter 6-digit code → verify
17. **Download** backup codes
18. **Click** "Continue" → `/dashboard/agent`

#### Flow 10.4: Agent Dashboard
19. **Arrive** at `/dashboard/agent`
20. **See:** Welcome greeting, 4 KPI cards (Active Listings: 0, New Leads: 0, Viewings This Week: 0, Pending Offers: 0)
21. **See:** Lead Pipeline chart, Viewings This Week list, Recent Enquiries
22. **Sidebar:** Overview, Listings, Leads, Viewings, Revenue, Team

#### Flow 10.5: Create Listing for Client (Robert, User #6)
23. **Navigate** to Listings → "Create Listing" → `/dashboard/agent/listings/create`
24. **Step 1:** Enter Robert's property address (14 Oak Lane, Guildford)
25. **Step 2:** 4 beds, 2 baths, 2,200 sqft, Detached
26. **Step 3:** Upload Robert's photos
27. **Step 4:** Use "Generate with AI" → Claude generates professional description
28. **Step 5:** Price: £749,950, OIRO (offers in region of)
29. **Step 6:** Upload EPC
30. **Step 7:** Review → Publish

**Edge case:** Agent tries to create listing for address already listed by seller → system should flag duplicate
**Edge case:** AI description contains hallucinated features → agent must review before publishing

#### Flow 10.6: Lead Management
31. **Navigate** to Leads → `/dashboard/agent/leads`
32. **See** incoming leads (buyers who enquired about listings)
33. **Click** on lead → see buyer details, property interest, contact info
34. **Assign** lead status: Cold → Warm → Hot
35. **Move** to CRM → `/dashboard/agent/crm`

#### Flow 10.7: Viewing Management
36. **Navigate** to Viewings → `/dashboard/agent/viewings`
37. **See** viewing requests
38. **Confirm** viewing times
39. **After viewing:** Add feedback notes
40. **Send** follow-up via Inbox

#### Flow 10.8: Team Management
41. **Navigate** to Team → `/dashboard/agent/team`
42. **See** invited team members (Jessica, Mark)
43. **Check** invitation status: Pending/Accepted
44. **Assign** roles and permissions

#### Flow 10.9: Analytics & Revenue
45. **Navigate** to Analytics → `/dashboard/agent/analytics`
46. **See:** Listing performance, conversion rates, average days on market
47. **Navigate** to Revenue → `/dashboard/agent/revenue`
48. **See:** Commission tracking, invoices, Stripe Connect payouts

#### Flow 10.10: Billing & Subscription
49. **Navigate** to Billing → `/dashboard/agent/billing`
50. **See** current plan (or no plan)
51. **Click** "Subscribe" → `/dashboard/agent/billing/checkout/subscription`
52. **See** plan options: Performance, Professional, Enterprise
53. **Select** "Professional" (most popular)
54. **See** Stripe Embedded Checkout form
55. **Enter** card details → subscribe
56. **Redirected** to confirmation page

#### Flow 10.11: Public Agent Profile
57. **Navigate** to `/agents/richards-co` (public profile)
58. **See:** Agency hero, tabs (Overview, Listings, Sold/Let, Reviews, Team)
59. **Verify** profile looks professional
60. **Check** that listings appear under agency

---

### USER 11: Jessica Nguyen — Chain Agent

**Persona:** 30-year-old agent at a large London firm. Handles Raj's property (User #20). Specialises in East London. Tech-savvy, uses app daily.

#### Flow 11.1: Registration
1. **Register** as Estate Agent
2. **Onboarding:**
   - Agency: "London Premier Properties"
   - Office: "1 Canary Wharf, London E14"
   - Job title: "Senior Negotiator"
   - Coverage: "London"
   - Specialisms: "Residential Sales", "New Builds"
   - Team: skip (agency admin handles this)
3. **2FA setup** → dashboard

#### Flow 11.2: Handle Raj's Property Sale (Chain D)
4. **Navigate** to Listings → Create Listing
5. **Create** listing for Raj's property (see User #20 flow)
6. **Manage** enquiries, viewings, offers
7. **Coordinate** with James Okafor (User #2) who is interested

#### Flow 11.3: Daily Agent Workflow
8. **Morning:** Check Dashboard → new leads, viewings today
9. **Respond** to messages in Inbox
10. **Update** lead statuses in CRM
11. **After viewings:** Log feedback
12. **End of week:** Check analytics

---

### USER 12: Mark Stevens — New Agent

**Persona:** 23-year-old, just qualified. Joined Richards & Co (Tom's agency, User #10). Learning the ropes. Limited permissions.

#### Flow 12.1: Registration via Team Invite
1. **Receive** invitation email from Tom (team invite during onboarding)
2. **Click** invitation link → `/register?professional=agent&agency=[id]`
3. **Fill in:** Mark, Stevens, email, password
4. **Register** → auto-joined to Richards & Co agency
5. **Onboarding:**
   - Agency fields pre-filled (from invite)
   - Job title: "Junior Negotiator"
   - Coverage: "South East"
   - Specialisms: "Residential Sales"
   - Skip team invites
6. **2FA setup** → dashboard

#### Flow 12.2: Limited Agent Access
7. **Dashboard** → see team view (limited to assigned leads/listings)
8. **Cannot** create listings without approval (if permission restricted)
9. **Can** respond to enquiries, schedule viewings
10. **Can** add viewing feedback notes
11. **Cannot** access billing (admin-only)

---

### USER 13: Gary Watts — Electrician

**Persona:** 40-year-old electrician. NICEIC certified, 15 years experience. Based in Leeds/Bradford. Does EICR certs, rewires, consumer unit upgrades. Van + 2 employees.

#### Flow 13.1: Registration
1. **Navigate** to `britestate.co.uk`
2. **Scroll** to "For Professionals" CTA → "List Your Business"
3. **Or** navigate to `/register/role-select`
4. **Click** "Service Provider" card
5. **Click** "Continue" → `/register?professional=service_provider`
6. **Fill in:** Gary, Watts, email, password
7. **Register** → verify email

#### Flow 13.2: Onboarding (Tradesperson - 4 Steps)
8. **Step 1 - Trade Category:**
   - Click "Electrician" pill → highlights
9. **Click** "Continue"

10. **Step 2 - Coverage Area:**
    - Click "Yorkshire" pill
11. **Click** "Continue"

12. **Step 3 - Credentials:**
    - Qualifications: "NVQ Level 3 Electrical Installation, 18th Edition"
    - Insurance: "POL-98765432"
    - Accreditations: click "NICEIC" pill
13. **Click** "Continue"

14. **Step 4 - Availability:**
    - Available days: Mon-Sat (deselect Sun)
    - Response time: "Same day"
15. **Click** "Complete Setup"
16. **Redirected** to `/dashboard`

#### Flow 13.3: Provider Dashboard
17. **Arrive** at `/dashboard/provider`
18. **See:**
    - **Verification Banner** (not yet verified): "Complete your verification to unlock all features" (30% progress)
    - 4 KPI cards: New Leads (0), Active Jobs (0), Avg Rating (--), Total Earnings (£0)
    - Recent Activity (empty)
    - Upcoming Jobs (empty)
    - Quick Actions: New Quote, Log Payment, Add Portfolio Item, Invite to Review

#### Flow 13.4: Complete Verification
19. **Click** "Complete Verification" button → `/dashboard/provider/verification`
20. **Upload:**
    - NICEIC registration certificate
    - Public liability insurance document
    - ID proof (driving licence)
    - DBS check (optional)
21. **Submit** for verification → status changes to "Pending" (65% progress)
22. **Wait** for admin review (User #19 will approve)

#### Flow 13.5: Set Up Profile
23. **Navigate** to Profile → `/dashboard/provider/profile`
24. **Fill in:**
    - Business name: "Gary Watts Electrical Services"
    - Description: "Fully qualified NICEIC electrician with 15 years experience..."
    - Phone: `07700900456`
    - Service areas: Leeds, Bradford, Harrogate
    - Pricing: "From £60/hour + materials"
25. **Upload** portfolio photos (previous jobs)
26. **Save** profile

#### Flow 13.6: Set Availability
27. **Navigate** to Availability → `/dashboard/provider/availability`
28. **Set** available slots for the week
29. **Block** out bank holidays
30. **Set** emergency callout availability

#### Flow 13.7: Manage Services
31. **Navigate** to Services → `/dashboard/provider/services`
32. **Add** services offered:
    - EICR Certificate: £120-£180
    - Consumer Unit Upgrade: £400-£600
    - Full Rewire (3-bed): £3,000-£5,000
    - Socket/Switch Installation: £60-£120
    - Emergency Callout: £100 + hourly
33. **Save** service catalog

#### Flow 13.8: Receive Quote Request (From David, User #8)
34. **See** notification: "New quote request from David Patel"
35. **Navigate** to Quotes → `/dashboard/provider/quotes`
36. **See** RFQ: "EICR Certificate for 2-bed flat in Leeds"
37. **Click** "Create Quote"
38. **Use** Quote Builder:
    - Service: EICR Certificate
    - Price: £150
    - Description: "Full electrical inspection and testing, includes certificate"
    - Availability: [next Wednesday]
    - Validity: 14 days
39. **Optional:** Click "AI Quote Assist" → AI suggests pricing based on area/service
40. **Click** "Send Quote" → quote sent to David

#### Flow 13.9: Job Completion Flow
41. **David accepts quote** → Job moves to "Active"
42. **Navigate** to Jobs → `/dashboard/provider/jobs/active`
43. **See** job: "EICR - 28 Chapel Allerton Road, Leeds"
44. **On job day:**
    - Update status: "In Progress"
    - After completion: "Mark as Complete"
    - Upload: EICR certificate document
    - Add completion notes
45. **Send** invoice → `/dashboard/provider/invoices`
    - Create invoice: £150
    - Send to David
46. **Request** review from David

#### Flow 13.10: Reviews & Analytics
47. **Navigate** to Reviews → `/dashboard/provider/reviews`
48. **See** David's review (once submitted)
49. **Respond** to review (thank customer)
50. **Navigate** to Analytics → `/dashboard/provider/analytics`
51. **See:** Job count, revenue, average rating, response time

#### Flow 13.11: Boost Profile
52. **Navigate** to Boost → `/dashboard/provider/boost`
53. **See** premium listing options
54. **Select** boost package → pay via Stripe

---

### USER 14: Maria Flores — Plumber

**Persona:** 35-year-old plumber. Gas Safe registered. Based in Liverpool/Manchester. Emergency callouts. Solo operator.

#### Flow 14.1: Registration & Onboarding
1. **Register** as Service Provider
2. **Onboarding:**
   - Trade: "Plumber", "Gas Engineer"
   - Coverage: "North West"
   - Qualifications: "NVQ Level 3 Plumbing, ACS Gas Safety"
   - Insurance: "POL-55667788"
   - Accreditations: "Gas Safe"
   - Available: Mon-Sun (emergency plumber)
   - Response time: "Same day"
3. **Complete** setup → dashboard

#### Flow 14.2: Profile Setup
4. **Set up profile:**
   - Business: "Maria's Plumbing & Gas Services"
   - Description: "Gas Safe registered plumber, emergency callouts 24/7"
   - Services: Boiler repair, Bathroom installation, Emergency leaks, Gas safety checks
5. **Upload** portfolio: before/after bathroom photos

#### Flow 14.3: Receive Maintenance Request (Chain C - From Margaret, User #9)
6. **Notification:** "New quote request from Margaret O'Brien"
7. **View** RFQ: "Leaking kitchen tap, Liverpool flat"
8. **Create quote:**
   - Diagnosis visit: £50
   - Tap replacement: £80-£120 (depending on parts)
   - Total estimate: £130-£170
   - Availability: Tomorrow
9. **Send** quote

10. **Margaret accepts** → Job activated
11. **Complete** job → mark as done
12. **Upload** invoice
13. **Request** review

---

### USER 15: Chris Drummond — Chartered Surveyor

**Persona:** 48-year-old chartered surveyor. RICS member. Based in London/South East. Does Level 2 & 3 surveys, valuations. Small firm of 3 surveyors.

#### Flow 15.1: Registration & Onboarding
1. **Register** as Service Provider
2. **Onboarding:**
   - Trade: "Surveyor"
   - Coverage: "London", "South East"
   - Qualifications: "BSc (Hons) Building Surveying, MRICS"
   - Insurance: "POL-11223344"
   - Accreditations: "TrustMark"
   - Available: Mon-Fri
   - Response time: "48 hours"
3. **Complete** setup

#### Flow 15.2: Profile & Services
4. **Profile:**
   - Business: "Drummond Survey Associates"
   - Services:
     - HomeBuyer Report (Level 2): £400-£500
     - Building Survey (Level 3): £600-£900
     - Valuation Report: £250-£350
     - Snagging Survey: £300-£400
5. **Upload** portfolio: sample report extracts, accreditation logos

#### Flow 15.3: Receive Survey Request (Chain A - From Emma/Priya)
6. **Notification:** New quote request
7. **View** RFQ: "Level 2 survey for 2-bed flat, Manchester" (from Emma)
8. **Create quote:**
   - HomeBuyer Report (Level 2): £450
   - Turnaround: 5 working days
   - Includes: Structural assessment, damp check, valuation opinion
9. **Send** quote

#### Flow 15.4: Provider Comparison
10. **Note:** Emma may compare Chris with other surveyors via `/compare`
11. **Chris's profile** shows: rating, reviews, accreditations, response time
12. **If chosen:** Job activates → schedule survey → complete → upload report

---

### USER 16: Nina Green — Conveyancer

**Persona:** 42-year-old conveyancer. CLC regulated. 10 years experience. Based in Birmingham but works nationally (remote). Handles sales and purchases.

#### Flow 16.1: Registration & Onboarding
1. **Register** as Service Provider
2. **Onboarding:**
   - Trade: "Conveyancer"
   - Coverage: "London", "South East", "West Midlands", "East Midlands"
   - Qualifications: "CILEx, CLC Licensed Conveyancer"
   - Insurance: "POL-99887766"
   - Accreditations: none (CLC is the regulation)
   - Available: Mon-Fri
   - Response time: "24 hours"
3. **Complete** setup

#### Flow 16.2: Profile & Services
4. **Profile:**
   - Business: "Green Conveyancing"
   - Services:
     - Sale Conveyancing: £750-£1,200 + disbursements
     - Purchase Conveyancing: £850-£1,400 + disbursements
     - Remortgage: £400-£600
     - Transfer of Equity: £500-£800
5. **Save**

#### Flow 16.3: Receive Conveyancing Request (Chain A)
6. **Notification:** Quote request for sale conveyancing (Robert's property)
7. **Create quote:**
   - Legal fees: £950
   - Disbursements (estimated): £300 (searches, Land Registry)
   - Total: £1,250
   - Timeline: 8-12 weeks
8. **Send** quote → if accepted, manage case through milestones

---

### USER 17: Andrew Blake — Independent Mortgage Broker

**Persona:** 52-year-old independent mortgage broker. FCA regulated. Based in Surrey. 20+ years experience. Advises on residential and BTL mortgages.

#### Flow 17.1: Registration
1. **Navigate** to `/register/role-select`
2. **Click** "Mortgage Broker" card
3. **Click** "Continue" → `/register?professional=mortgage_broker`
4. **Fill in:** Andrew, Blake, email, password
5. **Register** → verify email

#### Flow 17.2: Onboarding (Mortgage Broker - 3 Steps)
6. **Step 1 - Your Firm:**
   - Firm name: "Blake Financial Advisory"
   - FCA reference: `123456` (6-digit numeric)
   - Office address: "10 Castle Street, Guildford, GU1 3UQ"
7. **Click** "Continue"

8. **Step 2 - Specialisms:**
   - Click: "First-time Buyers", "Buy-to-Let", "Remortgage", "Self-Employed"
9. **Click** "Continue"

10. **Step 3 - Coverage:**
    - Regions: "London", "South East"
    - Work style: "Both" (remote + in-person)
    - Max clients/month: 25 (click + once from default 20)
11. **Click** "Complete Setup"

#### Flow 17.3: Broker Dashboard
12. **Arrive** at `/dashboard/broker`
13. **See:**
    - 4 KPI cards: Active Leads, Clients in Pipeline, Avg Completion Time, Revenue This Month
    - Recent Activity feed
    - Pipeline Summary (stages: New Lead → Initial Consultation → Application → Underwriting → Approved → Completed)
    - Quick Actions: View Leads, Compare Products, FCA Status

#### Flow 17.4: FCA Verification
14. **Click** "FCA Status" → `/dashboard/broker/fca-verification`
15. **Submit** FCA verification documents
16. **Wait** for admin approval

#### Flow 17.5: Receive Client Enquiry (Chain A - From Emma, User #1)
17. **Notification:** "New lead from Emma Thompson"
18. **Navigate** to Leads → `/dashboard/broker/leads`
19. **See** lead: Emma Thompson, First-time buyer, Budget £180k-£250k
20. **Move** to Pipeline → "Initial Consultation"
21. **Message** Emma via Inbox: "Hi Emma, I'd love to help you find the right mortgage..."

#### Flow 17.6: Mortgage Products
22. **Navigate** to Products → `/dashboard/broker/products`
23. **Browse** available mortgage products
24. **Compare** products for Emma's situation
25. **Share** comparison via message

#### Flow 17.7: Billing
26. **Navigate** to Billing → `/dashboard/broker/billing`
27. **See** subscription plans
28. **Subscribe** to Professional plan

---

### USER 18: Sophie Taylor — Firm Mortgage Broker

**Persona:** 29-year-old broker at a digital-first firm. Specialises in first-time buyers. Remote work. High volume.

#### Flow 18.1: Registration & Onboarding
1. **Register** as Mortgage Broker
2. **Onboarding:**
   - Firm: "Digital Mortgages Ltd"
   - FCA ref: `789012`
   - Specialisms: "First-time Buyers", "Shared Ownership"
   - Coverage: All regions (click all)
   - Work style: "Remote"
   - Max clients: 40 (high volume)
3. **Complete** setup

#### Flow 18.2: Handle BTL Enquiry (Chain E - From Priya, User #3)
4. **Receive** lead from Priya: BTL investor, Liverpool, £80k-£200k property
5. **Move** to Pipeline
6. **Message** Priya: "I can help with BTL mortgages. What's your current portfolio?"
7. **Recommend** BTL mortgage products
8. **Track** through pipeline stages

#### Flow 18.3: Calculator Tools
9. **Navigate** to Calculators → `/dashboard/broker/calculators`
10. **Use** built-in calculators for client scenarios
11. **Share** results with clients

---

### USER 19: Admin Joan — Platform Administrator

**Persona:** Platform admin with full back-office access. Manages users, content, moderation, compliance.

#### Flow 19.1: Login & Admin Access
1. **Navigate** to `/login`
2. **Login** with admin credentials (requires `is_admin` flag in profiles table)
3. **Redirected** to `/admin` (admin dashboard)

#### Flow 19.2: Admin Dashboard
4. **See:** Platform health overview
    - Active Users, New Signups, Revenue, Active Listings
    - System Health indicators
    - Recent activity feed

#### Flow 19.3: User Management
5. **Navigate** to `/admin/users`
6. **Search** for users by name/email
7. **Click** on user → `/admin/users/[id]`
8. **See:** User profile, role, activity history, subscription status
9. **Actions:** Activate, Suspend, Ban, Delete, Change role

#### Flow 19.4: Verify Service Providers
10. **Navigate** to `/admin/verifications`
11. **See** pending verification requests:
    - Gary Watts (Electrician) → review NICEIC cert, insurance, ID
    - Maria Flores (Plumber) → review Gas Safe cert
    - Chris Drummond (Surveyor) → review RICS membership
12. **For each:**
    - Review uploaded documents
    - Cross-reference with registry (NICEIC, Gas Safe Register, RICS)
    - **Approve** or **Reject** with reason
13. **Approved** providers → verification badge on profile, unlock all features

#### Flow 19.5: Listing Moderation
14. **Navigate** to `/admin/reported`
15. **See** reported/flagged listings
16. **Review** each:
    - Check for policy violations
    - Verify property exists
    - Check photos are appropriate
17. **Actions:** Approve, Reject, Flag for review, Remove listing

#### Flow 19.6: Content Management
18. **Navigate** to `/admin/cms/blog`
19. **Create** new blog post
20. **Edit** existing content
21. **Manage** landing pages → `/admin/cms/landing`
22. **Manage** help articles → `/admin/cms/help`

#### Flow 19.7: Analytics
23. **Navigate** to `/admin/analytics`
24. **See:**
    - User growth charts
    - Revenue breakdown
    - Listing activity
    - Marketplace transactions
    - Geographic distribution

#### Flow 19.8: Feature Flags
25. **Navigate** to `/admin/feature-flags`
26. **Toggle** features on/off:
    - AI property descriptions
    - Virtual viewings
    - Referral system
    - New search algorithm

#### Flow 19.9: GDPR Management
27. **Navigate** to `/admin/gdpr`
28. **See** pending data requests:
    - Export requests → process data export
    - Deletion requests → review 30-day grace period
29. **Process** each request per GDPR requirements

#### Flow 19.10: Fraud Detection
30. **Navigate** to `/admin/fraud`
31. **Review** flagged accounts/activities
32. **Check** for: duplicate accounts, suspicious listings, fake reviews
33. **Take action:** warn, suspend, ban

#### Flow 19.11: System Health
34. **Navigate** to `/admin/system-health`
35. **Monitor:**
    - API response times
    - Error rates
    - Database performance
    - External service status (Stripe, Supabase, Claude)

---

### USER 20: Raj Kapoor — Multi-Role (Landlord + Seller)

**Persona:** 50-year-old owns 3 rental properties. Selling one property (converting from rental to sale). Needs both landlord and seller dashboard.

#### Flow 20.1: Registration
1. **Navigate** to `/register/role-select`
2. **Click** "Landlord" card → highlights
3. **Also click** "Seller" card → both highlighted (multi-select)
4. **Click** "Continue" → `/register?professional=landlord` (primary role)
5. **Fill in:** Raj, Kapoor, email, password
6. **Register** → verify email

#### Flow 20.2: Onboarding (Landlord Primary)
7. **Onboarding as Landlord:**
   - Portfolio size: 3
   - Types: "Flat", "House"
   - First property: "5 Mile End Road, London E1", Flat, 2 beds, £1,800/month
   - Documents: Upload Gas Safety, EPC, EICR
8. **Complete** setup → `/dashboard/landlord`

#### Flow 20.3: Add Remaining Properties
9. **Add** property 2: "12 Bethnal Green Road, London E2", House, 3 beds, £2,400/month
10. **Add** property 3: "88 Whitechapel Road, London E1", Flat, 1 bed, £1,400/month

#### Flow 20.4: Switch to Seller Role (Selling Property 3)
11. **Decision:** Sell property 3 (1-bed flat worth ~£380k)
12. **In sidebar** → click role switcher (if available) or navigate to profile
13. **Switch** active role to "Seller"
14. **Dashboard** changes to Seller view

#### Flow 20.5: Create Sale Listing
15. **Navigate** to Seller Dashboard → My Listings → Create Listing
16. **Create** listing for 88 Whitechapel Road
17. **Complete** 7-step wizard:
    - Address, details, photos, AI description, price (£380,000), EPC
18. **Publish** listing

#### Flow 20.6: Appoint Agent (Chain D)
19. **Browse** agents → find Jessica Nguyen (User #11)
20. **Message** Jessica: "I'd like you to handle the sale of my Whitechapel flat"
21. **Jessica** creates listing or manages existing one

#### Flow 20.7: Switch Back to Landlord
22. **Switch** active role back to "Landlord"
23. **Continue** managing remaining 2 rental properties
24. **Track** rental income, maintenance, compliance for active portfolio

#### Flow 20.8: Handle Both Roles Simultaneously
25. **Check** Seller notifications: viewing requests for Whitechapel flat
26. **Check** Landlord notifications: maintenance requests for rental properties
27. **Inbox** should show messages for both roles
28. **Switch** between dashboards as needed

**Edge case:** Listing property as both rental AND sale → system should prevent or warn
**Edge case:** Deleting a property that has active tenancy → should block with warning

---

## Cross-User Chains

### CHAIN A: Complete Property Sale (Users 6→10→1→17→15→16)

This chain tests the full property sale lifecycle across 6 users:

```
  TIME  │ ROBERT (Seller)    │ TOM (Agent)         │ EMMA (Buyer)        │ ANDREW (Broker)     │ CHRIS (Survey)    │ NINA (Convey)
  ──────┼────────────────────┼─────────────────────┼─────────────────────┼─────────────────────┼───────────────────┼──────────────
  Day 1 │ Creates listing    │                     │                     │                     │                   │
        │ (7-step wizard)    │                     │                     │                     │                   │
  ──────┼────────────────────┼─────────────────────┼─────────────────────┼─────────────────────┼───────────────────┼──────────────
  Day 2 │ Contacts Tom       │ Receives message    │                     │                     │                   │
        │ via inbox          │ from Robert         │                     │                     │                   │
  ──────┼────────────────────┼─────────────────────┼─────────────────────┼─────────────────────┼───────────────────┼──────────────
  Day 3 │                    │ Creates agent       │ Searches for        │                     │                   │
        │                    │ listing (or manages │ properties          │                     │                   │
        │                    │ Robert's listing)   │ Finds Guildford     │                     │                   │
        │                    │                     │ 4-bed               │                     │                   │
  ──────┼────────────────────┼─────────────────────┼─────────────────────┼─────────────────────┼───────────────────┼──────────────
  Day 4 │                    │ Receives viewing    │ Books viewing       │                     │                   │
        │                    │ request             │ (in-person)         │                     │                   │
  ──────┼────────────────────┼─────────────────────┼─────────────────────┼─────────────────────┼───────────────────┼──────────────
  Day 5 │ Sees viewing       │ Confirms viewing    │ Attends viewing     │                     │                   │
        │ on dashboard       │ Hosts viewing       │ Loves the property  │                     │                   │
  ──────┼────────────────────┼─────────────────────┼─────────────────────┼─────────────────────┼───────────────────┼──────────────
  Day 6 │                    │                     │ Contacts Andrew     │ Receives enquiry    │                   │
        │                    │                     │ for mortgage        │ from Emma            │                   │
        │                    │                     │ advice              │ Moves to Pipeline   │                   │
  ──────┼────────────────────┼─────────────────────┼─────────────────────┼─────────────────────┼───────────────────┼──────────────
  Day 7 │                    │                     │ Gets AIP letter     │ Issues AIP          │                   │
        │                    │                     │ Uploads to docs     │ for £700k           │                   │
  ──────┼────────────────────┼─────────────────────┼─────────────────────┼─────────────────────┼───────────────────┼──────────────
  Day 8 │ Receives offer     │ Receives offer      │ Makes offer:        │                     │                   │
        │ notification       │ Manages negotiation │ £720,000            │                     │                   │
  ──────┼────────────────────┼─────────────────────┼─────────────────────┼─────────────────────┼───────────────────┼──────────────
  Day 9 │ Counter-offers     │ Relays counter      │ Accepts counter     │                     │                   │
        │ £740,000           │ to Emma             │ at £735,000         │                     │                   │
  ──────┼────────────────────┼─────────────────────┼─────────────────────┼─────────────────────┼───────────────────┼──────────────
  Day 10│ Accepts £735k      │ Marks as "Sold STC" │ Instructs survey    │ Progresses          │ Receives quote    │
        │                    │                     │ Request to Chris    │ mortgage app        │ request           │
  ──────┼────────────────────┼─────────────────────┼─────────────────────┼─────────────────────┼───────────────────┼──────────────
  Day 12│                    │                     │ Instructs           │                     │ Sends quote       │ Receives quote
        │                    │                     │ conveyancer Nina    │                     │ £450 Level 2      │ request
  ──────┼────────────────────┼─────────────────────┼─────────────────────┼─────────────────────┼───────────────────┼──────────────
  Day 14│                    │                     │ Accepts Chris's     │                     │ Survey booked     │ Sends quote
        │                    │                     │ & Nina's quotes     │                     │                   │ £850+disb
  ──────┼────────────────────┼─────────────────────┼─────────────────────┼─────────────────────┼───────────────────┼──────────────
  Day 20│                    │                     │                     │ Mortgage offer      │ Survey complete   │ Searches ordered
        │                    │                     │                     │ issued              │ Report uploaded   │
  ──────┼────────────────────┼─────────────────────┼─────────────────────┼─────────────────────┼───────────────────┼──────────────
  Day 40│                    │ Sale progresses     │                     │                     │                   │ Exchange of
        │                    │ through milestones  │                     │                     │                   │ contracts
  ──────┼────────────────────┼─────────────────────┼─────────────────────┼─────────────────────┼───────────────────┼──────────────
  Day 56│ COMPLETION         │ Commission paid     │ Keys received!      │ Fee earned          │                   │ Completion
        │ Receives funds     │ via Stripe Connect  │ Moves in            │ Pipeline: Complete  │                   │ filed at LR
```

**What to verify at each step:**
- Day 1: Listing appears in search results for matching criteria
- Day 4: Viewing request visible in both seller and agent dashboards
- Day 5: Viewing confirmed in all parties' calendars
- Day 8: Offer notification sent to seller AND agent
- Day 9: Counter-offer visible to buyer
- Day 10: Status changes to "Sold STC" across all views
- Throughout: Messages between parties appear in correct inboxes

---

### CHAIN B: Rental Flow (Users 8→4)

```
  TIME  │ DAVID (Landlord)       │ ALEX (Renter)
  ──────┼────────────────────────┼────────────────────────
  Day 1 │ Lists rental property  │
        │ 2-bed Leeds, £850/mo   │
  ──────┼────────────────────────┼────────────────────────
  Day 3 │                        │ Finds listing in search
        │                        │ (filter: rent, Leeds)
  ──────┼────────────────────────┼────────────────────────
  Day 4 │                        │ Books virtual viewing
  ──────┼────────────────────────┼────────────────────────
  Day 5 │ Confirms viewing       │ Attends virtual viewing
  ──────┼────────────────────────┼────────────────────────
  Day 6 │                        │ Submits application
        │                        │ (ID, proof of funds)
  ──────┼────────────────────────┼────────────────────────
  Day 7 │ Reviews application    │ Sees "under_review"
        │ Checks documents       │ in Applications tab
  ──────┼────────────────────────┼────────────────────────
  Day 8 │ Accepts application    │ Sees "approved"
        │ Creates tenancy        │ Receives notification
  ──────┼────────────────────────┼────────────────────────
  Day 14│ Move-in day            │ Tenancy starts
        │ Logs deposit           │ Renter Dashboard shows
        │                        │ active tenancy
```

---

### CHAIN C: Maintenance Flow (Users 9→14)

```
  TIME  │ MARGARET (Landlord)       │ MARIA (Plumber)
  ──────┼───────────────────────────┼──────────────────────
  Day 1 │ Creates maintenance req   │
        │ "Leaking tap, Liverpool"  │
  ──────┼───────────────────────────┼──────────────────────
  Day 1 │ Sends RFQ via marketplace │ Receives notification
  ──────┼───────────────────────────┼──────────────────────
  Day 1 │                           │ Reviews RFQ details
        │                           │ Creates quote: £150
  ──────┼───────────────────────────┼──────────────────────
  Day 2 │ Receives quote            │
        │ Reviews price             │
        │ Accepts quote             │ Job activated
  ──────┼───────────────────────────┼──────────────────────
  Day 3 │                           │ Completes repair
        │                           │ Marks job complete
        │                           │ Sends invoice
  ──────┼───────────────────────────┼──────────────────────
  Day 4 │ Pays invoice              │ Payment received
        │ Logs expense in finances  │ Requests review
  ──────┼───────────────────────────┼──────────────────────
  Day 5 │ Leaves 5-star review      │ Review appears on
        │ "Quick, professional"     │ profile and dashboard
```

---

### CHAIN D: Multi-Role Sale (Users 20→11→2)

```
  TIME  │ RAJ (Landlord+Seller)     │ JESSICA (Agent)        │ JAMES (Buyer)
  ──────┼───────────────────────────┼────────────────────────┼──────────────
  Day 1 │ Switches to Seller role   │                        │
        │ Creates listing for       │                        │
        │ Whitechapel flat, £380k   │                        │
  ──────┼───────────────────────────┼────────────────────────┼──────────────
  Day 2 │ Messages Jessica          │ Receives message       │
        │ Appoints as agent         │ Takes on listing       │
  ──────┼───────────────────────────┼────────────────────────┼──────────────
  Day 5 │                           │ Markets listing        │ Finds listing
        │                           │                        │ in search
  ──────┼───────────────────────────┼────────────────────────┼──────────────
  Day 7 │                           │ Manages viewing        │ Books viewing
  ──────┼───────────────────────────┼────────────────────────┼──────────────
  Day 10│ Receives offer            │ Negotiates             │ Makes offer
  ──────┼───────────────────────────┼────────────────────────┼──────────────
  Day 12│ Accepts offer             │ Updates status         │ Instructs
        │ Switches to Landlord role │                        │ solicitor
        │ Manages remaining props   │                        │
```

---

### CHAIN E: Investor Flow (Users 3→18→15)

```
  TIME  │ PRIYA (Investor)          │ SOPHIE (Broker)        │ CHRIS (Surveyor)
  ──────┼───────────────────────────┼────────────────────────┼──────────────
  Day 1 │ Searches for BTL          │                        │
        │ Liverpool, high yield     │                        │
  ──────┼───────────────────────────┼────────────────────────┼──────────────
  Day 2 │ Finds property            │                        │
        │ Uses yield calculator     │                        │
        │ Saves property            │                        │
  ──────┼───────────────────────────┼────────────────────────┼──────────────
  Day 3 │ Contacts Sophie for       │ Receives lead          │
        │ BTL mortgage advice       │ BTL specialist         │
  ──────┼───────────────────────────┼────────────────────────┼──────────────
  Day 5 │                           │ Sends BTL mortgage     │
        │                           │ options                │
  ──────┼───────────────────────────┼────────────────────────┼──────────────
  Day 7 │ Requests survey           │                        │ Receives RFQ
        │ via marketplace           │                        │ Sends quote
  ──────┼───────────────────────────┼────────────────────────┼──────────────
  Day 8 │ Accepts quote             │ Processes BTL          │ Schedules
        │ Compares surveyors first  │ mortgage app           │ survey
  ──────┼───────────────────────────┼────────────────────────┼──────────────
  Day 14│ Survey report received    │ AIP issued             │ Report
        │ Reviews findings          │                        │ delivered
```

---

## Edge Case Matrix

### Authentication Edge Cases

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| E1 | Double-click register | Click "Create Account" rapidly | Button disables after first click, only 1 account created |
| E2 | Register with existing email | Enter email already in use | Error: "An account with this email already exists" |
| E3 | OAuth popup blocked | Click Google sign-in with popup blocker | Error banner on login page with instructions |
| E4 | Expired verification link | Click old email verification link | Error page with "Resend verification" option |
| E5 | Login with wrong password 5x | Enter wrong password repeatedly | Redirect to `/account-locked` with 30-min countdown |
| E6 | Back button during onboarding | Complete Step 2, press browser Back | Return to Step 1 with data preserved |
| E7 | Close tab during registration | Fill form, close tab | Data lost, must start over (no draft save for reg) |
| E8 | Session timeout mid-action | Leave dashboard open 1+ hours, try action | Redirect to login, then back to previous page |

### Listing Edge Cases

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| E9 | Upload oversized photo | Upload 50MB image in listing wizard | Error: "File too large. Maximum 10MB" |
| E10 | Publish with missing fields | Skip description step, click Publish | Validation error highlighting missing fields |
| E11 | Duplicate listing | Create listing for same address as existing | Warning: "A listing already exists for this address" |
| E12 | AI description with errors | Generate AI description that hallucinates features | Description editable, user must review before publish |
| E13 | Delete listing with active viewings | Try to delete listing with upcoming viewings | Warning: "Cancel X upcoming viewings first?" |
| E14 | Price change after offers | Change listing price after offers received | Offers remain, buyers notified of price change |

### Marketplace Edge Cases

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| E15 | Double-submit quote | Click "Send Quote" rapidly | Only 1 quote sent, button disabled after first click |
| E16 | Accept expired quote | Try to accept quote past validity | Error: "This quote has expired. Request a new one." |
| E17 | Provider no-show | Provider doesn't mark job complete | Auto-escalation notification after X days |
| E18 | Dispute after completion | Landlord disputes quality after job marked complete | Moderation flow, admin review |
| E19 | Cancel booking mid-flow | Start booking, navigate away | Booking not created (no partial state) |
| E20 | Review without using service | Try to review provider without completed booking | Blocked: "Complete a booking to leave a review" |

### Multi-Role Edge Cases

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| E21 | Switch role mid-session | Change from Landlord to Seller while on landlord page | Redirect to new role's dashboard |
| E22 | Message self | Landlord sends message to own seller listing | Should be blocked or warned |
| E23 | URL role spoofing | Homebuyer manually navigates to `/dashboard/agent` | Redirect to `/dashboard/homebuyer` (role enforcement) |
| E24 | List same property as rental AND sale | Create both rental and sale listing for same address | System should warn about conflicting listings |

### Search Edge Cases

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| E25 | Zero search results | Search for "Antarctica" | Empty state: "No properties found" with suggestions |
| E26 | Very broad search | No filters, search all | Paginated results, not browser crash |
| E27 | Special characters in search | Search for `<script>alert('xss')</script>` | Sanitized, no XSS execution |
| E28 | Map view with 10,000 pins | Very broad search on map | Clustering activates, performance acceptable |

### Billing Edge Cases

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| E29 | Card declined during subscription | Enter invalid card | Error: "Payment failed" with retry option |
| E30 | Cancel subscription mid-period | Cancel active subscription | Access until period end, then downgrade |
| E31 | Access premium feature after cancel | Try to access feature after subscription ends | Paywall/upgrade prompt |

### Settings Edge Cases

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| E32 | Delete account with active listings | Request deletion while listings are live | Warning about active listings, 30-day grace |
| E33 | GDPR data export | Request full data export | Generates downloadable archive within 72 hours |
| E34 | Change email to existing | Try to change email to one already in use | Error: "This email is already registered" |
| E35 | MFA lockout | Lose phone with authenticator | Backup codes allow login |

---

## Testing Execution Order

**Phase 1: Individual Registration & Onboarding (Users 1-20)**
Test each user's registration and onboarding independently. Verify all fields save correctly.

**Phase 2: Dashboard Verification (Users 1-20)**
Login as each user and verify their role-specific dashboard loads with correct data.

**Phase 3: Feature-Specific Flows**
- Search & filters (Users 1-5)
- Listing creation (Users 6-7, 10-12)
- Provider profile & services (Users 13-16)
- Broker setup (Users 17-18)
- Admin tools (User 19)

**Phase 4: Cross-User Chains (A-E)**
Execute chains in order. Each chain depends on earlier phase data.

**Phase 5: Edge Cases (E1-E35)**
Systematic edge case testing. Can be parallelized across testers.

**Phase 6: Settings & Account Management**
All users visit settings, update profiles, manage notifications, test privacy.

---

## Verification Checklist per User

For EACH of the 20 users, verify:

- [ ] Registration completes without errors
- [ ] Email verification works
- [ ] Onboarding wizard completes and data saves to DB
- [ ] Dashboard loads with correct role-specific content
- [ ] Sidebar navigation works (all links lead to correct pages)
- [ ] Profile/settings accessible and editable
- [ ] Inbox accessible (even if empty)
- [ ] Notifications accessible
- [ ] Billing page accessible (for professional roles)
- [ ] Can log out and log back in
- [ ] 2FA works (for agents, or optional for others)
- [ ] Mobile responsive (all pages render on mobile viewport)
- [ ] No console errors on any visited page
- [ ] All API calls return 200 (check network tab)
