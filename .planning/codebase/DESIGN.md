# Britestate — Complete Google Stitch Prompt Library

## Master Context Block

> **Paste this at the top of EVERY Stitch prompt as context. It sets the design DNA for the entire platform.**

```
=== BRITESTATE MASTER CONTEXT ===

PROJECT: Britestate — AI-powered UK property platform (PropTech)
COMPETITORS: Rightmove, Zoopla, OnTheMarket, Hemnet (Sweden), Bienici (France)
DESIGN INSPIRATION: Hemnet.se (minimal, organic, content-first), Soho House (premium feel), Airbnb (trust & clarity)

TECH STACK:
- Next.js 14 (App Router, TypeScript)
- TailwindCSS 3.4+
- Shadcn/UI components (Radix primitives)
- Lucide React icons
- Recharts for data visualisation
- Mapbox GL for maps
- Framer Motion for animations

DESIGN PRINCIPLES:
1. "Invisible UI" — the interface should disappear, letting property content shine
2. Mobile-first — 75% of property searches start on mobile
3. Organic & warm — no harsh dark themes. Light, airy, natural palette
4. Content density without clutter — show more data, less chrome
5. 4-click rule — any primary action reachable in ≤4 clicks
6. Trust-first — verification badges, social proof, and transparency everywhere
7. Accessibility — WCAG 2.1 AA minimum, keyboard navigable, screen reader friendly

COLOUR TOKENS:
--brand-primary: #1B4D3E (deep forest green — trust, property, nature)
--brand-primary-light: #2D7A5F
--brand-primary-lighter: #E8F5EE
--brand-secondary: #D4A853 (warm gold — premium, quality)
--brand-secondary-light: #F5ECD7
--brand-accent: #2563EB (action blue — CTAs, links)
--brand-accent-light: #EFF6FF

--neutral-950: #0A0A0B
--neutral-900: #171719
--neutral-800: #2E2E33
--neutral-700: #46464F
--neutral-600: #5E5E6A
--neutral-500: #7A7A88
--neutral-400: #9E9EAB
--neutral-300: #C4C4CE
--neutral-200: #E2E2E8
--neutral-100: #F1F1F5
--neutral-50: #F8F8FA
--white: #FFFFFF

--success: #16A34A
--success-light: #DCFCE7
--warning: #CA8A04
--warning-light: #FEF9C3
--error: #DC2626
--error-light: #FEE2E2
--info: #2563EB
--info-light: #DBEAFE

TYPOGRAPHY:
- Headings: "Plus Jakarta Sans", sans-serif (weight 600–700)
- Body: "Inter", sans-serif (weight 400–500)
- Mono: "JetBrains Mono", monospace
- Type scale: 12px / 14px / 16px (base) / 18px / 20px / 24px / 30px / 36px / 48px / 60px

SPACING: 4px base unit (4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128)

BORDER RADIUS:
--radius-sm: 6px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 16px
--radius-2xl: 24px
--radius-full: 9999px

SHADOWS:
--shadow-xs: 0 1px 2px rgba(0,0,0,0.05)
--shadow-sm: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)
--shadow-md: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)
--shadow-lg: 0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.03)
--shadow-xl: 0 20px 25px rgba(0,0,0,0.08), 0 8px 10px rgba(0,0,0,0.03)

BREAKPOINTS:
- Mobile: 375px (default / design target)
- Tablet: 768px
- Desktop: 1280px
- Wide: 1440px (max content width)

COMPONENT RULES:
- Use Shadcn/UI primitives wherever possible (Button, Card, Dialog, Sheet, Table, Tabs, etc.)
- All components must be TypeScript with proper prop interfaces
- Export as named exports, one component per file
- Use "use client" directive only when client interactivity is needed
- All interactive elements must have focus-visible states
- Minimum touch target: 44x44px on mobile
- Use Lucide React for all icons
- Animations: subtle, purposeful, max 300ms duration
- No lorem ipsum — use realistic UK property data

=== END MASTER CONTEXT ===
```

---

---

## PHASE 0: Design System & Foundation Components

---

### 0.1 — Tailwind Config & CSS Variables

```
[PASTE MASTER CONTEXT]

Generate a complete tailwind.config.ts and globals.css for Britestate.

tailwind.config.ts should:
- Extend the default theme with all colour tokens from the master context
- Add the custom font families (Plus Jakarta Sans, Inter, JetBrains Mono)
- Add the custom border radius scale
- Add the custom shadow scale
- Add the custom spacing values beyond Tailwind defaults
- Configure container with centered, padded, and max-width 1440px
- Add custom keyframes for: fadeIn, fadeOut, slideUp, slideDown, slideInRight, scaleIn, spin, pulse, shimmer (for skeleton loaders)

globals.css should:
- Import the fonts from Google Fonts
- Define all CSS custom properties (the colour tokens, typography, spacing, shadows, radii)
- Include base styles for html, body (antialiased, smooth scroll, neutral-50 background)
- Include focus-visible utility ring style (2px brand-accent offset-2)
- Include a .scrollbar-hide utility
- Include a .text-balance utility for headings
- Ensure all Shadcn component CSS variable overrides map to Britestate tokens

Output the complete files, production-ready.
```

---

### 0.2 — Typography Components

```
[PASTE MASTER CONTEXT]

Create a set of typography components for Britestate:

1. <Heading> component
   Props: level (1-6), children, className, as (optional HTML element override)
   - H1: 48px/56px mobile, 60px/68px desktop, Plus Jakarta Sans 700, neutral-950
   - H2: 36px/44px mobile, 48px/56px desktop, Plus Jakarta Sans 700, neutral-950
   - H3: 30px/38px mobile, 36px/44px desktop, Plus Jakarta Sans 600, neutral-950
   - H4: 24px/32px mobile, 30px/38px desktop, Plus Jakarta Sans 600, neutral-900
   - H5: 20px/28px, Plus Jakarta Sans 600, neutral-900
   - H6: 18px/26px, Plus Jakarta Sans 600, neutral-800

2. <Text> component
   Props: size (xs|sm|base|lg|xl), weight (normal|medium|semibold), color, children, className, as
   - xs: 12px/16px, sm: 14px/20px, base: 16px/24px, lg: 18px/28px, xl: 20px/28px
   - Default: Inter 400, neutral-700

3. <Label> component
   Props: children, required, htmlFor, className
   - 14px/20px, Inter 500, neutral-700
   - If required, show red asterisk

4. <Caption> component
   Props: children, className
   - 12px/16px, Inter 400, neutral-500

5. <Overline> component
   Props: children, className
   - 11px/16px, Inter 600, uppercase, letter-spacing 0.08em, brand-primary

6. <Price> component
   Props: amount (number), size (sm|md|lg|xl), prefix (default "£"), period (optional, e.g. "pcm"), reduced (boolean), originalAmount (number)
   - Formats with commas (e.g. £425,000)
   - lg: 30px Plus Jakarta Sans 700
   - If reduced: show original price struck through in neutral-400, new price in error red
   - period shown in neutral-500 smaller text

All components should use forwardRef, accept standard HTML attributes via rest props, and merge classNames with cn() utility from shadcn.
```

---

### 0.3 — Layout Primitives

```
[PASTE MASTER CONTEXT]

Create layout primitive components:

1. <Container>
   Props: size (sm: 640px | md: 768px | lg: 1024px | xl: 1280px | full: 1440px), className, children
   - Centered, horizontal padding 16px mobile / 24px tablet / 32px desktop
   - Default: xl (1280px)

2. <Section>
   Props: children, className, padding (sm|md|lg|xl), background (white|neutral|primary|secondary)
   - Vertical padding: sm=32px, md=48px, lg=64px, xl=96px
   - background maps to surface colours

3. <Stack>
   Props: direction (row|column), gap (number from spacing scale), align, justify, wrap, children, className, as
   - Flexbox-based, mobile-first
   - Can switch direction at breakpoints via responsive prop

4. <Grid>
   Props: cols (1-12 or responsive object {sm:1, md:2, lg:3, xl:4}), gap, children, className
   - CSS Grid based
   - Responsive column counts

5. <Divider>
   Props: orientation (horizontal|vertical), className
   - 1px neutral-200 line with appropriate margins

6. <Spacer>
   Props: size (from spacing scale)
   - Empty div with fixed height/width

7. <AspectRatio>
   Props: ratio (e.g. 16/9, 4/3, 3/2, 1), children, className
   - For image/video containers

All components: TypeScript, forwardRef, cn() for className merging, proper prop interfaces exported.
```

---

### 0.4 — Button System

```
[PASTE MASTER CONTEXT]

Create a comprehensive <Button> component for Britestate:

VARIANTS:
1. primary — bg brand-primary, white text, hover: brand-primary-light
2. secondary — bg white, brand-primary text, border neutral-200, hover: neutral-50 bg
3. accent — bg brand-accent (blue), white text, hover: darker blue
4. ghost — transparent bg, neutral-700 text, hover: neutral-100 bg
5. destructive — bg error red, white text, hover: darker red
6. outline-destructive — white bg, error red border + text, hover: error-light bg
7. link — no bg/border, brand-accent text, underline on hover
8. premium — bg brand-secondary (gold), neutral-950 text, subtle gold gradient

SIZES:
- xs: h-7, px-2.5, text-xs (12px)
- sm: h-8, px-3, text-sm (14px)
- md: h-10, px-4, text-sm (14px) — DEFAULT
- lg: h-12, px-6, text-base (16px)
- xl: h-14, px-8, text-lg (18px)

STATES (all variants):
- default, hover (slight lift shadow + colour shift), active (pressed down), focus-visible (ring), disabled (opacity 50%, no pointer), loading (spinner replaces text or shows beside it)

FEATURES:
- leftIcon / rightIcon props (accepts Lucide icon component)
- loading prop (shows spinner, disables click)
- fullWidth prop
- asChild prop (Radix slot pattern for link buttons)
- iconOnly prop (square button, just icon, with tooltip)
- rounded prop (pill shape — radius-full)

Build on top of Shadcn's Button primitive. Include all variant classes using cva (class-variance-authority).

Also create:
- <ButtonGroup> — horizontal group with connected borders
- <IconButton> — square icon-only button with tooltip

Use realistic labels: "Book Viewing", "Get Instant Valuation", "Request Quote", "Save Property", "Contact Agent", "Apply Now".
```

---

### 0.5 — Form Input System

```
[PASTE MASTER CONTEXT]

Create a complete form input component library for Britestate:

SHARED BEHAVIOUR (all inputs):
- States: default, hover (border darkens), focus (brand-accent ring), filled, error (error red border + message), disabled (neutral-100 bg, neutral-400 text), read-only
- Height: 44px (meets touch target)
- Border: 1px neutral-200, radius-md (8px)
- Label above, error message below, helper text below
- Transition: border-color 150ms, box-shadow 150ms

COMPONENTS:

1. <TextInput>
   Props: label, placeholder, helperText, error, leftIcon, rightIcon, prefix (e.g. "£"), suffix (e.g. "per month"), size (sm|md|lg), required, disabled, readOnly
   Use Shadcn's Input as base.

2. <Textarea>
   Props: same as TextInput + rows, maxLength (show character count), autoResize
   
3. <Select>
   Props: label, options [{value, label, icon?, disabled?}], placeholder, error, searchable, multiple, clearable
   Use Shadcn's Select for single, Combobox for searchable.

4. <Combobox>
   Props: label, options, onSearch (async), loading, creatable, error
   Searchable dropdown with async option loading.

5. <Checkbox>
   Props: label, description, checked, indeterminate, error, disabled
   Use Shadcn Checkbox. Checkmark in brand-primary.

6. <RadioGroup>
   Props: label, options [{value, label, description?}], orientation (horizontal|vertical), error
   Use Shadcn RadioGroup. Selected dot in brand-primary.

7. <Switch>
   Props: label, description, checked, disabled, size (sm|md)
   Track: neutral-200 off, brand-primary on.

8. <Slider>
   Props: label, min, max, step, value/range, formatValue (e.g. "£{value}"), showTooltip
   Track: neutral-200, filled: brand-primary.

9. <RangeSlider>
   Props: same as Slider but with min/max handles (for price range, bedroom count)
   Show formatted values at each end. Critical for property search filters.

10. <DatePicker>
    Props: label, value, minDate, maxDate, error, format (DD/MM/YYYY for UK)
    Use Shadcn Calendar + Popover.

11. <FileUpload>
    Props: label, accept, maxSize, multiple, onUpload, preview (show thumbnails)
    Drag-and-drop zone with dashed border, upload icon, "or click to browse" text.
    Show upload progress bar. Show file previews with remove button.

12. <SearchInput>
    Props: placeholder, onSearch, suggestions, loading, onSelect, clearable
    Magnifying glass icon left, clear X right, dropdown suggestions below.
    Specific variant: PropertySearchInput with location autocomplete.

13. <NumberStepper>
    Props: label, min, max, step, value, formatValue
    Minus/Plus buttons on sides. For bedrooms, bathrooms count.

14. <PasswordInput>
    Props: same as TextInput + showStrengthMeter
    Eye icon toggle show/hide. Optional strength bar below (weak/fair/good/strong).

15. <OTPInput>
    Props: length (default 6), onComplete
    Individual digit boxes, auto-advance on input, paste support.

16. <PhoneInput>
    Props: label, defaultCountry ("GB"), error
    Country code selector + formatted phone input.

17. <CurrencyInput>
    Props: label, currency ("GBP"), error
    Auto-formats with commas, £ prefix. For property prices and budgets.

18. <PostcodeInput>
    Props: label, onValidate (checks UK postcode format), onLookup (address lookup)
    Validates UK postcode format, optional integration point for address API.

For EACH component, provide:
- Full TypeScript interface for props
- All visual states (default, hover, focus, filled, error, disabled)
- Mobile-responsive sizing
- Accessibility: proper aria labels, error announcements, keyboard navigation
- Use React Hook Form compatible patterns (register, Controller)
```

---

### 0.6 — Data Display Components

```
[PASTE MASTER CONTEXT]

Create data display components:

1. <Badge>
   Variants: default (neutral), primary (green), secondary (gold), accent (blue), success, warning, error, outline
   Sizes: sm (20px h), md (24px h), lg (28px h)
   Props: variant, size, dot (show status dot), removable (show X), icon
   Examples: "For Sale", "Under Offer", "Sold STC", "New", "Price Reduced", "Verified", "Premium"

2. <Avatar>
   Props: src, alt, fallback (initials), size (xs:24|sm:32|md:40|lg:48|xl:64|2xl:80), shape (circle|rounded), status (online|offline|busy), badge (verification tick)
   Use Shadcn Avatar. Show initials on image fail.

3. <AvatarGroup>
   Props: avatars[], max (show "+N more"), size
   Overlapping avatars with count overflow.

4. <Tooltip>
   Use Shadcn Tooltip. Props: content, side, align, delayDuration
   Style: neutral-900 bg, white text, 12px, radius-md, shadow-lg.

5. <StatCard>
   Props: label, value, change (percentage), changeDirection (up|down|neutral), icon, trend (array for sparkline)
   Card with large value, small label above, change badge bottom-left, optional mini sparkline.
   Examples: "Active Listings: 24", "Profile Views: 1,847 (+12%)", "Revenue: £4,250"

6. <ProgressBar>
   Props: value (0-100), label, showPercentage, size (sm|md|lg), colour (brand-primary|success|warning|error)
   Rounded bar with smooth animation.

7. <ProgressCircle>
   Props: value (0-100), size (sm:48|md:64|lg:96), strokeWidth, label (center text)
   SVG circle with animated fill.

8. <Rating>
   Props: value (0-5, supports halves), count (number of reviews), size (sm|md|lg), interactive (for input)
   Star icons filled/half/empty in brand-secondary (gold). Show "4.8 (127 reviews)".

9. <VerifiedBadge>
   Props: type (identity|insurance|gasafe|niceic|checked|premium|britestate-verified), size, showLabel
   Each type has a specific icon and colour:
   - identity: blue shield
   - insurance: green shield
   - gasafe: official Gas Safe colours
   - niceic: NICEIC brand
   - checked: green checkmark circle
   - premium: gold star
   - britestate-verified: brand-primary with Britestate logo mark

10. <PriceTag>
    Props: price, priceType (sale|rent|auction), reduced, originalPrice, period (pcm|pw|pa), guide (auction guide price)
    - Sale: "£425,000" large, bold
    - Rent: "£1,850 pcm" with period
    - Auction: "Guide: £200,000+" with gavel icon
    - Reduced: original struck through, new in green with "Reduced" badge

11. <StatusIndicator>
    Props: status (online|offline|away|busy|verified|pending|rejected), size, pulse (animated)
    Small coloured dot with optional pulse animation.

12. <Skeleton>
    Props: variant (text|circular|rectangular|card|propertyCard|avatar), width, height, lines (for text)
    Shimmer animation. Provide preset variants that match actual component shapes:
    - skeleton-property-card: matches property card layout
    - skeleton-profile: matches provider profile layout
    - skeleton-table-row: matches data table row

13. <EmptyState>
    Props: icon (Lucide), title, description, action ({label, onClick}), illustration (optional SVG)
    Centered layout with subtle illustration, clear message, single CTA button.
    Presets: noResults, noSavedProperties, noMessages, noListings, noReviews, noJobs

14. <Tag>
    Props: label, removable, onClick, colour (auto-assign from preset palette or custom)
    For property features: "Garden", "Parking", "Period Features", "Chain Free", "Leasehold"
    Removable variant for active search filters.

15. <CountdownTimer>
    Props: targetDate, onExpire, size, label
    For auction countdown. Shows days/hours/minutes/seconds.
```

---

### 0.7 — Icon System

```
[PASTE MASTER CONTEXT]

Create an icon system and custom property-specific icon components:

1. <Icon> wrapper component
   Props: name (Lucide icon name), size (16|20|24|32|40), colour, className
   Wraps Lucide icons with consistent sizing and colour application.

2. Property Feature Icons (create as individual SVG components, 24x24 viewBox):
   - <BedIcon> — bed/bedroom
   - <BathIcon> — bathtub/bathroom  
   - <ReceptionIcon> — sofa/reception room
   - <AreaIcon> — square footage (expanding arrows)
   - <GardenIcon> — tree/garden
   - <ParkingIcon> — car/parking
   - <GarageIcon> — garage door
   - <BalconyIcon> — balcony railing
   - <FloorIcon> — stacked layers/floor level
   - <ChainFreeIcon> — broken chain link
   - <NewBuildIcon> — sparkle/new
   - <PeriodIcon> — heritage/period building
   - <PetFriendlyIcon> — paw print
   - <FurnishedIcon> — armchair
   - <EPCIcon> — energy rating bar chart

3. Service Category Icons (24x24, line style matching Lucide):
   - <PlumberIcon>
   - <ElectricianIcon>
   - <BuilderIcon>
   - <PainterIcon>
   - <CarpenterIcon>
   - <RooferIcon>
   - <GardenerIcon>
   - <CleanerIcon>
   - <LocksmithIcon>
   - <HandymanIcon>
   - <ArchitectIcon>
   - <SurveyorIcon>
   - <ConveyancerIcon>
   - <MortgageBrokerIcon>
   - <RemovalsIcon>
   - <InteriorDesignerIcon>

4. Trust & Verification Icons (24x24):
   - <GasSafeIcon> — Gas Safe register mark
   - <NICEICIcon> — electrical certification
   - <TrustMarkIcon> — Government-endorsed quality
   - <CheckedVettedIcon> — Britestate's own verification badge
   - <InsuredIcon> — shield with check
   - <FCARegulatedIcon> — Financial Conduct Authority

All icons: consistent 1.5px stroke weight, currentColor for fill/stroke, properly accessible with title props.
```

---

### 0.8 — Navigation Components

```
[PASTE MASTER CONTEXT]

Create all navigation components:

1. <Navbar> — Top navigation bar
   
   LOGGED OUT variant:
   - Left: Britestate logo (links to /)
   - Centre: Main nav links — Buy, Rent, Find Services, Valuations, Advice
   - Right: "Sign In" ghost button, "List Your Property" primary button
   - Mobile: Logo left, hamburger right → full-screen slide-in menu
   - Sticky on scroll with subtle shadow. White bg, 64px height desktop, 56px mobile.
   - Transparent variant for homepage hero (white text, becomes solid on scroll)

   LOGGED IN variant:
   - Left: Logo
   - Centre: Same nav + "Dashboard" link
   - Right: Notification bell (with unread count badge), Messages icon, Avatar dropdown
   - Avatar dropdown menu: Dashboard, My Profile, Settings, Help, Sign Out
   - Role-specific: show relevant dashboard label ("Agent Dashboard", "Landlord Dashboard", etc.)
   - Mobile: Bottom tab bar with 5 icons (Home, Search, [+] Add, Messages, Profile)

2. <MobileBottomNav>
   - Fixed bottom bar, 56px height, white bg, top border
   - 5 tab items with icon + label
   - Active state: brand-primary colour, slightly larger icon
   - Buyer: Home, Search, Saved, Messages, Profile
   - Agent: Dashboard, Listings, Leads, Messages, Profile
   - Tradesperson: Dashboard, Jobs, Calendar, Messages, Profile
   - Landlord: Portfolio, Compliance, Maintenance, Messages, Profile

3. <Sidebar> — Dashboard sidebar navigation
   Props: items[], collapsed, onToggle, userRole
   - 280px expanded, 64px collapsed (icon only)
   - White bg, right border neutral-100
   - Logo at top, nav items with icons, labels, optional badge counts
   - Active item: brand-primary-lighter bg, brand-primary text, left border accent
   - Collapse toggle button at bottom
   - User info card at bottom: avatar, name, role badge
   - Mobile: hidden, replaced by bottom nav
   - Tablet: auto-collapsed, expand on hover

4. <Breadcrumbs>
   Props: items [{label, href}], separator (default ">")
   - 14px, neutral-500, last item neutral-900 (current page, no link)
   - Truncate middle items on mobile with "..." 

5. <TabBar>
   Props: tabs [{label, value, icon?, count?}], activeTab, onChange, variant (underline|pills|enclosed)
   - underline: bottom border indicator, brand-primary
   - pills: rounded bg toggle, brand-primary-lighter active bg
   - enclosed: card-style enclosed tabs
   - Scrollable horizontally on mobile with fade edges
   Use Shadcn Tabs as base.

6. <Pagination>
   Props: currentPage, totalPages, onPageChange, siblingsCount
   - Previous/Next buttons + page numbers
   - Truncate with "..." for many pages
   - Show "Showing 1-20 of 847 results" text above
   - Mobile: simplified Previous/Next only with page indicator

7. <Stepper>
   Props: steps [{label, description?}], currentStep, variant (horizontal|vertical)
   - Horizontal: numbered circles connected by lines, completed = green check, current = brand-primary filled, future = neutral outline
   - Vertical: for longer wizards, shows step content inline
   - Mobile: compact variant showing "Step 2 of 7" with progress bar

8. <BackHeader>
   Props: title, onBack, actions (right-side buttons)
   - Simple top bar: back arrow + title + optional action buttons
   - Used in detail views and sub-pages on mobile
```

---

### 0.9 — Card Components

```
[PASTE MASTER CONTEXT]

Create all card components — these are the most important visual elements on the platform:

1. <PropertyCard> — THE most critical component on the entire platform

   VARIANT A: Grid View (portrait, for search results grid)
   - 16:10 image with lazy loading + blur placeholder
   - Image carousel dots (swipeable on mobile, arrows on hover desktop)
   - Top-left overlay badges: "New", "Price Reduced", "Under Offer", "Sold STC"
   - Top-right: heart icon save button (toggle filled/outline, animated)
   - Below image:
     - Price (large, bold) + price type badge (For Sale / To Rent / Auction)
     - Address line 1 (street) — medium weight
     - Address line 2 (area, postcode) — neutral-500
     - Feature pills row: 🛏 3  🚿 2  📐 1,200 sq ft  (using property icons)
     - Agent logo small + "Listed by [Agency]" — neutral-400
   - Card: white bg, radius-lg, shadow-sm, hover: shadow-md + slight translateY(-2px)
   - Mobile: full-width card, slightly reduced padding
   - Image: rounded top corners only

   VARIANT B: List View (landscape, for search results list)
   - Horizontal layout: image left (40% width), content right
   - Same content as grid but more space for description excerpt (2 lines)
   - Shows time listed: "Listed 3 days ago"
   - Desktop only (mobile falls back to grid cards)

   VARIANT C: Map Popup (compact)
   - Small card that appears when clicking a map marker
   - Single image + price + address + beds/baths, 240px wide
   - "View Details" link at bottom

   VARIANT D: Compact (for "Similar Properties", "Saved Properties" carousels)
   - Smaller image, essential info only: price, address, beds/baths
   - Horizontal scroll in a carousel

   VARIANT E: Featured / Premium (highlighted listing)
   - Gold border top (brand-secondary)
   - "Featured" badge in gold
   - Slightly larger than standard cards
   - Subtle gold gradient on image overlay at bottom

2. <AgentCard>
   Props: agent {name, photo, agency, logo, rating, reviewCount, propertiesCount, phone, email, verified}
   - Avatar or agency logo
   - Name, agency name
   - Rating stars + review count
   - "X properties" count
   - Verified badge if applicable
   - "Contact Agent" button, phone icon button
   - Variant: compact (inline) and full (sidebar)

3. <TradespersonCard>
   Props: tradesperson {name, photo, trade, rating, reviewCount, verified, badges[], description, serviceArea, hourlyRate}
   - Avatar with verification overlay badge
   - Name, trade category
   - Rating + review count
   - Trust badges row (Gas Safe, Insured, etc.)
   - Short description (2 lines)
   - "From £X/hr" or "Free quotes"
   - "Get Quote" primary button, "View Profile" secondary
   - Service area tag

4. <ReviewCard>
   Props: review {author, avatar, rating, date, text, photos[], tradesperson/agent, verified, helpfulCount}
   - Avatar + author name + date
   - Star rating
   - Review text (expandable if long)
   - Photos grid (if any)
   - "Verified Review" badge
   - "Helpful (X)" button
   - Response from provider (indented, different bg)

5. <JobCard>
   Props: job {title, category, description, location, budget, postedDate, responses, urgent}
   - For tradesperson job board
   - Category icon + title
   - Location + posted time
   - Budget range
   - "X tradespeople responded"
   - Urgent badge if applicable
   - "Respond to Job" button

6. <BlogCard>
   Props: post {title, excerpt, image, category, author, date, readTime}
   - Featured image (16:9)
   - Category badge overlay
   - Title (heading 5)
   - Excerpt (2 lines)
   - Author avatar + name + date + read time

7. <PricingCard>
   Props: plan {name, price, period, features[], highlighted, ctaLabel, ctaHref}
   - Name at top, price large in centre
   - Feature list with check/cross icons
   - Highlighted card: brand-primary border, "Most Popular" badge, slightly scaled up
   - CTA button at bottom

8. <NotificationCard>
   Props: notification {type, title, message, time, read, actionUrl, icon}
   - Icon (colour-coded by type) + content + time
   - Unread: neutral-50 bg + left border brand-accent
   - Types: new_listing, price_change, viewing_reminder, offer_update, new_message, new_review, compliance_alert

9. <ActivityFeedItem>
   Props: activity {type, title, description, time, icon, user, link}
   - Timeline layout with dot + line
   - Icon represents activity type
   - Compact text with timestamp
```

---

### 0.10 — Overlay & Feedback Components

```
[PASTE MASTER CONTEXT]

Create overlay and feedback components:

1. <Modal>
   Use Shadcn Dialog. Sizes: sm (400px), md (540px), lg (720px), xl (960px), fullscreen
   - Backdrop: black/50 blur-sm
   - Card: white bg, radius-xl, shadow-xl, padding 24px
   - Header: title + optional description + close X button
   - Body: scrollable content area
   - Footer: optional, typically action buttons right-aligned
   - Animation: fadeIn backdrop + scaleIn card (200ms)
   - Mobile: slides up from bottom (bottom sheet style) for sm/md sizes
   - Close on backdrop click, Escape key

2. <Drawer>
   Use Shadcn Sheet. Sides: left, right, bottom
   - Right drawer: 400px wide desktop, full-width mobile (for filters, details)
   - Bottom drawer: mobile-specific, with drag handle, snap to 50%/100% height
   - Left drawer: for navigation on mobile (280px)

3. <BottomSheet> (mobile-specific)
   Props: snapPoints (array of percentages), children, handle (show drag handle)
   - Swipe down to dismiss
   - Snap to defined heights
   - Drag handle: 40px wide, 4px tall, neutral-300, centered

4. <Toast>
   Use Shadcn Toast (Sonner). Variants: success, error, warning, info, default
   - Position: bottom-right desktop, bottom-center mobile
   - Auto-dismiss: 5s (configurable)
   - Action button support (e.g. "Undo")
   - Stack up to 3 visible
   - Progress bar at bottom showing remaining time
   Examples: "Property saved ✓", "Viewing booked for Thu 15 Mar", "Offer submitted successfully"

5. <AlertBanner>
   Props: variant (info|success|warning|error), title, description, dismissible, action
   - Full-width banner at top of page/section
   - Left icon, text, optional action link, optional dismiss X
   - Colours: use semantic colour light backgrounds with darker text
   Examples: "Your EPC expires in 30 days — upload a new certificate", "Price alert: A property matching your search has been reduced"

6. <ConfirmDialog>
   Props: title, description, confirmLabel, cancelLabel, variant (default|destructive), onConfirm, onCancel
   - Small modal with clear question and two buttons
   - Destructive: red confirm button
   Examples: "Remove saved property?", "Cancel viewing?", "Delete listing — this cannot be undone"

7. <Popover>
   Use Shadcn Popover. 
   - White bg, radius-lg, shadow-lg, border neutral-100
   - Arrow pointing to trigger element
   - Auto-position to avoid viewport overflow

8. <DropdownMenu>
   Use Shadcn DropdownMenu.
   - Items with icons, labels, optional keyboard shortcuts
   - Separators between groups
   - Destructive items in error red
   - Sub-menus supported

9. <CommandPalette>
   Use Shadcn Command (cmdk).
   - Full-screen overlay with search input
   - Grouped results: Pages, Properties, Actions, Settings
   - Keyboard navigable
   - ⌘K to open (desktop)
   - Recent searches section

10. <CookieConsent>
    - Bottom banner or bottom-left card
    - "We use cookies to improve your experience"
    - Buttons: "Accept All", "Manage Preferences", "Reject Non-Essential"
    - Preferences modal: toggles for Necessary, Analytics, Marketing, Functional
    - Compliant with UK ICO guidance and GDPR
```

---

### 0.11 — Property-Specific Molecules

```
[PASTE MASTER CONTEXT]

Create property-specific compound components:

1. <PropertySearchBar>
   VARIANT A: Hero (large, homepage)
   - Tall input (56px), prominent, centred on hero image
   - Tabs above: "Buy" | "Rent" | "New Builds" | "Find Services"
   - Location autocomplete input with map pin icon
   - "Search" primary button (large)
   - Below: quick filters row — Property Type, Min Price, Max Price, Beds
   - Radius: radius-2xl, shadow-xl, white bg

   VARIANT B: Compact (sticky top of search results)
   - Condensed horizontal bar (48px height)
   - Location input + key filter dropdowns inline
   - "Filters" button with active count badge
   - "Save Search" button (ghost)

   Location autocomplete:
   - Shows suggestions grouped: "Locations", "Postcodes", "Stations"
   - Each suggestion has type icon (pin, postcode, train)
   - Debounced search (300ms)
   - Recent searches section at top

2. <FilterPanel>
   - Used in search sidebar (desktop) and bottom drawer (mobile)
   - Sections:
     • Price range (RangeSlider, with min/max text inputs)
     • Property type (checkboxes: Detached, Semi, Terraced, Flat, Bungalow, Land, Commercial)
     • Bedrooms (number selector: Studio, 1, 2, 3, 4, 5+)
     • Bathrooms (number selector: 1, 2, 3, 4+)
     • Keywords (tag input: garden, parking, garage, new build, chain free)
     • Must-haves (toggles: garden, parking, garage)
     • Max days since listed (select: 24h, 3 days, 7 days, 14 days, 30 days)
     • Added by (checkboxes: agents, private sellers)
     • Include SSTC (toggle)
   - "Apply Filters" primary button, "Reset" ghost button
   - Active filter count shown on mobile trigger button
   - Each section collapsible

3. <ActiveFilterChips>
   Props: filters[], onRemove, onClearAll
   - Horizontal scrollable row of Tag components
   - Each chip shows filter value with remove X
   - "Clear All" link at end

4. <MapMarker>
   Props: price, type (sale|rent|auction), selected, cluster (count)
   - Custom marker: rounded rectangle with price text
   - Sale: brand-primary bg, white text
   - Rent: brand-accent bg, white text
   - Selected: larger, elevated shadow, darker colour
   - Cluster: circle with count number
   - Hover: slight scale up

5. <MapInfoWindow>
   Props: property (compact data)
   - Mini property card: image + price + address + beds/baths
   - "View Details" link
   - Appears on marker click
   - Close X button

6. <MortgageCalculator>
   - Property price input (pre-filled from listing)
   - Deposit amount / percentage toggle
   - Interest rate input
   - Term (years) slider: 5–40 years
   - Real-time calculation: monthly payment, total interest, total cost
   - Donut chart: principal vs interest breakdown
   - "Find a Mortgage Broker" CTA below results
   - Compact variant for property detail sidebar
   - Standalone variant for calculator page (larger, more inputs)

7. <StampDutyCalculator>
   - Property price input
   - Buyer type: first-time buyer, home mover, additional property, non-UK resident
   - Real-time calculation showing each tax band breakdown
   - Total stamp duty amount highlighted
   - Stacked bar chart showing band breakdown
   - Effective rate percentage

8. <EPCDisplay>
   Props: rating (A-G), score (number), expiry
   - Official EPC style horizontal bar chart (A=green to G=red)
   - Current rating highlighted and expanded
   - "Current: C (72)" text
   - "Potential: B (85)" if available
   - Expiry date with warning if <1 year

9. <PropertyFeatureGrid>
   Props: features {beds, baths, receptions, area, garden, parking, garage, epc, tenure, councilTax}
   - 2–3 column grid of icon + label + value items
   - Clean, scannable layout
   - Icons from the custom property icon set

10. <ViewingBookingWidget>
    Props: availableSlots[], agentName, propertyAddress
    - Date selector (next 14 days, scrollable day pills)
    - Time slot grid for selected date
    - In-person / Virtual toggle
    - Name, email, phone fields (pre-filled if logged in)
    - Message textarea
    - "Book Viewing" primary button
    - Confirmation state: green check + details + "Add to Calendar" links

11. <PriceHistoryChart>
    Props: history [{date, price, event}], comparables [{address, price, date, distance}]
    - Line chart showing price changes over time
    - Event markers: "Listed", "Reduced", "SSTC"
    - Comparables section below: table of nearby sold prices
    - Use Recharts

12. <TransportWidget>
    Props: stations [{name, type (rail|tube|bus), distance, walkTime}]
    - Nearest stations/stops list with transport type icons
    - Walking time for each
    - Optional: commute time calculator (input destination, show journey time)

13. <SchoolCatchmentWidget>
    Props: schools [{name, type (primary|secondary|independent), rating (outstanding|good|etc), distance}]
    - List sorted by distance
    - Ofsted rating badge (colour-coded)
    - School type icon
    - "Within catchment" indicator if applicable
```

---

### 0.12 — Verification & Trust Components

```
[PASTE MASTER CONTEXT]

Create verification and trust system components:

1. <VerificationProgress>
   Props: steps [{name, status (complete|current|pending|failed), description}], percentage
   - Vertical stepper with status indicators
   - Complete: green check
   - Current: pulsing blue dot, expanded to show action
   - Pending: grey circle
   - Failed: red X with retry option
   - Overall progress bar at top
   
   Steps for tradesperson:
   1. Identity Verification
   2. Insurance Documentation
   3. Professional Qualifications
   4. Client References (3 required) — show X/3 progress
   5. Peer References (3 required) — show X/3 progress
   6. Final Review

2. <TrustBadgeRow>
   Props: badges [{type, verified, expiryDate}]
   - Horizontal row of trust badge icons
   - Verified: full colour
   - Unverified: greyed out with "Pending" label
   - Expiring soon: orange warning
   - Tooltip on hover with details
   - Variants: compact (icons only), full (icons + labels)

3. <ReferenceRequestCard>
   Props: reference {type (client|peer), status (pending|submitted|verified|expired), contact, date, message}
   - Card showing reference status
   - Pending: "Awaiting response from [name]" + resend button
   - Submitted: "Reference received" + view button
   - Verified: green badge
   - "Request New Reference" action

4. <DocumentUploadCard>
   Props: document {type, name, status (required|uploaded|verified|expired|rejected), expiryDate, file}
   - Required: dashed border card with upload icon + "Upload [Document Type]"
   - Uploaded: file preview/icon + name + uploaded date + "Pending Review" badge
   - Verified: green border, check badge, expiry date shown
   - Expired: red border, "Expired on [date]" + "Upload New" button
   - Rejected: red border, "Rejected: [reason]" + "Upload New" button
   Types: Gas Safety Certificate, EICR, EPC, Public Liability Insurance, Professional Indemnity, DBS Check, Qualification Certificates

5. <TrustScore>
   Props: score (0-100), breakdown [{category, score}], level (bronze|silver|gold|platinum)
   - Circular score display (large number in centre)
   - Level badge below
   - Breakdown: mini bars showing score per category
   - Categories: "Verification", "Reviews", "Response Time", "Job Completion", "Repeat Customers"
   - Tooltip explaining how score is calculated

6. <VerifiedProviderBanner>
   Props: provider {name, verifiedDate, level, badges[]}
   - "Britestate Verified" banner for provider profiles
   - Shows what was verified and when
   - "What does this mean?" expandable explanation
```

---

### 0.13 — Page Section Organisms

```
[PASTE MASTER CONTEXT]

Create reusable page section organisms:

1. <HeroSection>
   VARIANT A: Homepage
   - Full-width, 70vh min height
   - Background: subtle property image with light overlay (not dark)
   - Centred content: Heading ("Find your perfect home"), subheading, PropertySearchBar (hero variant)
   - Below search: trust stats row ("25,000+ Properties | 5,000+ Verified Providers | 4.8★ Average Rating")
   - Gentle parallax scroll on image

   VARIANT B: Search Results
   - Compact, 120px height, white bg
   - Contains compact search bar + active filters
   
   VARIANT C: Landing Page (generic)
   - Props: title, subtitle, ctaLabel, ctaHref, image, alignment (left|centre)
   - Split layout: text left, image right (or centred text with bg image)

2. <FeatureGrid>
   Props: features [{icon, title, description}], columns (2|3|4), variant (cards|simple|icon-left)
   - cards: each feature in a Card with icon top, title, description
   - simple: icon + text, no card bg
   - icon-left: horizontal layout per feature
   - Used for "Why Britestate?", "How It Works" sections

3. <TestimonialSection>
   Props: testimonials [{quote, author, role, avatar, rating}], variant (carousel|grid|featured)
   - carousel: auto-playing with nav dots
   - featured: one large testimonial centred
   - Quote marks, rating stars, author info

4. <CTABanner>
   Props: title, description, primaryCTA, secondaryCTA, variant (default|brand|premium)
   - Full-width section with coloured bg
   - default: neutral-50 bg
   - brand: brand-primary bg, white text
   - premium: gradient gold bg
   - Two buttons side by side

5. <StatsBar>
   Props: stats [{value, label}]
   - Horizontal row of 3-5 stat items
   - Large number + small label
   - Animated count-up on scroll into view
   - Dividers between items

6. <PartnerLogos>
   Props: logos [{src, alt, href}]
   - "Trusted by" or "Featured in" header
   - Horizontal logo strip, greyscale, colour on hover
   - Auto-scroll carousel if many logos

7. <NewsletterSignup>
   - Email input + "Subscribe" button (inline)
   - "Get property alerts and market insights" subtext
   - Success state: check icon + "You're subscribed!"

8. <AppDownloadBanner>
   - "Download the Britestate App" heading
   - Phone mockup image
   - App Store + Google Play badge buttons
   - Key feature bullets beside phone

9. <Footer>
   VARIANT: Full
   - 4-5 column layout:
     Col 1: Logo, tagline, social icons (LinkedIn, Twitter/X, Instagram, Facebook)
     Col 2: "Properties" links (Buy, Rent, New Builds, Commercial, Sold Prices)
     Col 3: "Services" links (Find Tradespeople, Estate Agents, Mortgage Brokers, Valuations)
     Col 4: "Company" links (About, Careers, Press, Contact, Blog, Help)
     Col 5: "Legal" links (Terms, Privacy, Cookies, Accessibility, Complaints)
   - Bottom bar: © 2025 Britestate Ltd. All rights reserved. | Company No. XXXXXXXX
   - Mobile: accordion collapsible columns

   VARIANT: Minimal
   - Single row: © + key legal links
   - Used on auth pages, checkout
```

---

### 0.14 — Layout Templates

```
[PASTE MASTER CONTEXT]

Create page layout templates:

1. <PublicLayout>
   Props: children, transparentNav (for homepage hero)
   - Navbar (logged out or in based on auth state)
   - Main content area
   - Full Footer
   - Cookie consent banner (bottom)

2. <DashboardLayout>
   Props: children, sidebarItems[], userRole, pageTitle, breadcrumbs[]
   - Desktop: Sidebar (left, 280px) + Topbar (right, full width) + Content (right, below topbar)
   - Topbar: breadcrumbs left, search + notifications + avatar right, 64px height
   - Content: padding 24px desktop / 16px mobile, max-width 1280px, neutral-50 bg
   - Tablet: collapsed sidebar (64px) + content
   - Mobile: no sidebar, bottom nav bar, topbar simplified (title + actions)

3. <AuthLayout>
   Props: children, title, subtitle
   - Centred card on neutral-50 bg
   - Britestate logo above card
   - Card: white, radius-xl, shadow-lg, max-width 440px, padding 32px
   - Below card: footer links (Terms, Privacy, Help)
   - Optional: decorative side panel (50/50 split) with property image on desktop

4. <OnboardingLayout>
   Props: children, currentStep, totalSteps, stepLabels[]
   - Minimal nav: logo left, "Skip" or "Exit" right
   - Stepper component below nav
   - Content card centred, max-width 640px
   - "Back" and "Continue" buttons at bottom of card
   - Progress bar at very top (thin, brand-primary)

5. <SearchLayout>
   Props: children (list), sidebar (filters), map
   - Desktop: Filters sidebar (280px, scrollable) | Results list (flexible) | Map (50%, resizable)
   - Toggle buttons: "List", "Map", "Split" view
   - Tablet: Full results with filter drawer, map as separate view
   - Mobile: Full results with bottom filter sheet, map as toggle view
   - Sticky search bar at top

6. <DetailLayout>
   Props: mainContent, sidebar
   - Desktop: Main content (65%) | Sticky sidebar (35%, containing agent card + CTAs + calculator)
   - Sidebar sticks at top with offset, stops before footer
   - Mobile: Single column, sidebar content moves to sticky bottom CTA bar
   - Tab bar for mobile sections (Overview, Photos, Area, Financial)

7. <SettingsLayout>
   Props: children, navItems[]
   - Left nav (240px) with settings categories
   - Right content area with form sections
   - Mobile: nav becomes top tabs or dropdown selector

8. <EmailLayout>
   Props: children
   - 600px max-width, centred
   - White bg, subtle border
   - Header: Britestate logo
   - Footer: unsubscribe link, address, social icons
   - Table-based layout for email client compatibility
```

---

---

## PHASE 1: Public-Facing Pages & Auth

---

### 1.0 — Homepage

```
[PASTE MASTER CONTEXT]

Create the Britestate homepage. This is the single most important page on the platform and must be world-class.

STRUCTURE (top to bottom):

SECTION 1: Hero
- Use <HeroSection> variant A
- Full viewport height minus navbar
- Soft-focus property background image (English countryside home, warm lighting)
- Light gradient overlay (white at bottom for blending)
- Centred: "Find your perfect property" (H1), "Search over 25,000 homes and discover verified local professionals" (subtitle)
- PropertySearchBar hero variant with Buy/Rent/Find Services tabs
- Trust bar: "25,000+ Properties • 5,000+ Verified Pros • Trusted by 50,000 Users"

SECTION 2: Featured Properties (white bg)
- Heading: "Featured Properties"
- Tabs: "For Sale" | "To Rent" | "New Builds"
- 4-column grid of PropertyCard (grid variant), 3 on tablet, scroll on mobile
- "View All Properties →" link

SECTION 3: How It Works (neutral-50 bg)
- Heading: "Your property journey, simplified"
- 3 columns: 
  1. "Search & Discover" — magnifying glass icon, description
  2. "Connect with Verified Pros" — shield-check icon, description
  3. "Move In with Confidence" — home icon, description
- Each with numbered circle, illustration, text

SECTION 4: Find Services (white bg)
- Heading: "Trusted professionals, verified by us"
- "Every professional on Britestate passes our 3-client + 3-peer verification process"
- 6-item grid of service category cards with icons:
  Plumbers, Electricians, Builders, Estate Agents, Mortgage Brokers, Surveyors
- Each card: icon, category name, "X verified pros", hover → slight lift
- "Browse All Services →" link

SECTION 5: Trust & Verification (brand-primary bg, white text)
- Heading: "Why trust Britestate?"
- Stats: "12,500 Verified Reviews" | "98% Satisfaction Rate" | "£0 for Homeowners"
- Brief explanation of verification process with shield icon
- "Learn More About Our Standards →" button

SECTION 6: Testimonials (white bg)
- TestimonialSection carousel variant
- 3 testimonials rotating: homebuyer, landlord, tradesperson
- Star ratings, photos, names, roles

SECTION 7: Latest from the Blog (neutral-50 bg)
- 3 BlogCard components
- "Read More on Our Blog →"

SECTION 8: CTA (brand-primary-lighter bg)
- "Ready to get started?"
- "List Your Property" primary button + "Find a Professional" secondary button

SECTION 9: Footer (full variant)

ANIMATION: Sections fade-in-up on scroll (IntersectionObserver, Framer Motion)
PERFORMANCE: All images lazy loaded, hero image optimised (next/image), above-fold content SSR.

Make it breathtaking. This page should rival Airbnb's homepage in visual quality.
```

---

### 1.1 — Search Results Page

```
[PASTE MASTER CONTEXT]

Create the property search results page — the second most important page.

LAYOUT: SearchLayout template

TOP BAR (sticky):
- Compact PropertySearchBar with location shown
- Filter trigger button showing active count: "Filters (3)"
- Sort dropdown: "Most Recent" | "Price (Low–High)" | "Price (High–Low)" | "Most Popular"
- View toggle: Grid | List | Map (icon buttons)
- Results count: "847 properties for sale in London"

LEFT SIDEBAR (desktop only, 280px):
- FilterPanel with all filter sections
- "Save This Search" button at top with bell icon
- Collapsible sections with smooth animation

MAIN CONTENT AREA:
- Grid View: 2-col desktop, 1-col mobile grid of PropertyCard (grid variant)
- List View: Full-width PropertyCard (list variant) stacked
- Between every 8 results: contextual insert — "Looking for a mortgage? Compare rates →"
- Infinite scroll with skeleton loading (or pagination toggle option)
- "Back to top" floating button after scrolling

MAP PANEL (desktop, 50% right side):
- Mapbox map with custom MapMarker components
- Markers show price, colour-coded by type
- Click marker → MapInfoWindow popup
- Map controls: zoom, fullscreen, draw boundary
- "Search this area" button when map is panned
- Cluster markers at low zoom
- Current search boundary outlined

ZERO RESULTS STATE:
- EmptyState component
- Friendly illustration
- "No properties match your filters"
- Suggestions: "Try widening your search area", "Adjust your budget range", "Remove some filters"
- "Set up an alert for these criteria" CTA

MOBILE-SPECIFIC:
- Sticky bottom bar: "Map" toggle button, "Filters" button with count, "Sort" button
- Results default to single-column cards
- Map is a full-screen overlay when toggled
- Filter panel opens as bottom sheet (drawer)
- Swipeable property cards at bottom of map view

Ensure the page is FAST — skeleton loaders for cards, virtualised list if >50 results visible.
```

---

### 1.2 — Property Detail Page

```
[PASTE MASTER CONTEXT]

Create the property detail page — where buying decisions are made.

LAYOUT: DetailLayout template

TOP: Breadcrumbs (Home > London > Isleworth > [Address])

SECTION 1: Gallery
- Desktop: 2+2 grid (1 large left + 3 smaller right), "View All X Photos" button overlay
- Click any → fullscreen gallery lightbox with arrow navigation + thumbnails strip
- Mobile: Full-width swipeable carousel with dot indicators + count badge "1/24"
- Show video tour thumbnail with play button if available
- Show virtual tour button if 360° available

SECTION 2: Key Info Bar (sticky on scroll, white bg, bottom border)
- Price: "£425,000" (large, bold)
- Address: "14 Elm Road, Isleworth, TW7 4PQ"
- PropertyFeatureGrid compact: 🛏 3 | 🚿 2 | 🏠 Semi-Detached | 📐 1,200 sq ft
- "Book Viewing" primary button, "Save" heart button, "Share" button
- On mobile this becomes a sticky bottom bar: Price + "Book Viewing" button

SECTION 3: Main Content (left, 65%)

  3A: Description
  - "About this property" heading
  - Full description text (well-formatted paragraphs)
  - "Read more" expand if >300 words
  - Key features list: bullets like "South-facing garden", "Recently refurbished kitchen", etc.

  3B: Property Features
  - PropertyFeatureGrid full version
  - Two columns: key facts (tenure, council tax, EPC) + features (garden, parking, etc.)
  
  3C: Floor Plan
  - Floor plan image viewer (click to expand)
  - Multiple floors if applicable (tab per floor)

  3D: Location & Area
  - Map section with property pin + nearby amenities toggles (schools, transport, shops, restaurants)
  - TransportWidget — nearest stations
  - SchoolCatchmentWidget — nearby schools with Ofsted ratings
  - Walk score / transit score / bike score display
  - Area demographics summary

  3E: Insights
  - PriceHistoryChart for this property/area
  - "Nearby sold prices" comparables table
  - EPCDisplay with rating bar chart
  - Broadband speeds, mobile coverage, flood risk indicators
  - Crime statistics chart (relative to area average)

  3F: Stamp Duty & Mortgage
  - StampDutyCalculator (pre-filled with property price)
  - MortgageCalculator (pre-filled with property price)

SECTION 4: Sidebar (right, 35%, sticky)

  4A: Agent Card
  - AgentCard full variant
  - Agency logo, agent photo, name, phone
  - "Contact Agent" primary button (opens message compose)
  - "Request Viewing" secondary button (opens booking widget)
  - "Call [phone]" button (mobile: direct dial)

  4B: Viewing Booking
  - ViewingBookingWidget (available slots)

  4C: Mortgage Prompt
  - "Could you afford this home?"
  - Monthly payment estimate
  - "Speak to a Mortgage Broker →" link

SECTION 5: Related
  - "Similar Properties" carousel (PropertyCard compact, horizontal scroll)
  - "Recommended Tradespeople" for this area (if moving)

SECTION 6: Report & Share
  - "Report this listing" link (opens modal)
  - Share buttons: Copy Link, Email, WhatsApp, Facebook

MOBILE TAB BAR (sticky below key info bar):
  Tabs: Overview | Photos | Area | Financial | Agent
  Each tab scrolls to its section or switches content

Ensure this page loads fast despite data density. Use skeleton loaders per section, lazy load map and charts.
```

---

### 1.3 — Authentication Pages

```
[PASTE MASTER CONTEXT]

Create all authentication pages using AuthLayout template:

PAGE 1: Sign Up — Role Selector
- Heading: "Join Britestate"
- Subheading: "How would you like to use Britestate?"
- 5 role cards in a grid (2 cols desktop, 1 col mobile):
  - "I'm looking to Buy or Rent" — home icon, "Search properties and save favourites"
  - "I'm looking to Sell" — tag/price icon, "List your property and track interest"
  - "I'm a Landlord" — building icon, "Manage your portfolio and find tenants"
  - "I'm an Estate Agent" — briefcase icon, "List properties and manage your agency"
  - "I'm a Tradesperson / Service Provider" — wrench icon, "Get leads and grow your business"
- Each card: selectable (radio-style), icon, title, short description
- "Continue" button (disabled until selection)
- "Already have an account? Sign in" link

PAGE 2: Sign Up — Form
- Selected role badge at top ("Signing up as: Buyer/Renter")
- Social buttons: "Continue with Google", "Continue with Apple" (full-width, outline style)
- Divider: "or"
- Form: First Name, Last Name, Email, Password (with strength meter), Confirm Password
- Checkbox: "I agree to the Terms of Service and Privacy Policy"
- "Create Account" primary button
- "Already have an account? Sign in" link

PAGE 3: Email Verification — Pending
- Mail icon (large, animated)
- "Check your email"
- "We've sent a verification link to [email]"
- "Didn't receive it? Resend" link (with cooldown timer)
- "Change email address" link

PAGE 4: Email Verification — Confirmed
- Green check circle (animated)
- "Email verified!"
- "Your account is ready. Let's set up your profile."
- "Continue to Onboarding" primary button

PAGE 5: Login
- Heading: "Welcome back"
- Social buttons: Google, Apple
- Divider: "or"
- Form: Email, Password (with show/hide toggle)
- "Remember me" checkbox + "Forgot password?" link (same row)
- "Sign In" primary button
- "Don't have an account? Sign up" link

PAGE 6: Forgot Password
- Heading: "Reset your password"
- "Enter your email and we'll send you a reset link"
- Email input
- "Send Reset Link" primary button
- "Back to Sign In" link
- Success state: "Reset link sent to [email]"

PAGE 7: Reset Password
- Heading: "Create a new password"
- New Password (with strength meter)
- Confirm Password
- "Reset Password" primary button
- Success state: "Password updated. Sign in with your new password."

PAGE 8: 2FA Setup
- "Add an extra layer of security"
- QR code display (for authenticator app)
- Manual key shown below QR
- 6-digit code input to verify setup
- Backup codes display with "Download" and "Copy" buttons
- "Enable 2FA" primary button

PAGE 9: 2FA Code Entry
- "Two-factor authentication"
- "Enter the 6-digit code from your authenticator app"
- OTPInput component (6 digits)
- "Use backup code instead" link
- "Verify" primary button

PAGE 10: Account States
- Locked: warning icon, "Account temporarily locked", "Too many failed login attempts. Try again in 30 minutes or reset your password."
- Suspended: red icon, "Account suspended", "Your account has been suspended. Contact support for more information." + "Contact Support" button
- Deletion: "Account scheduled for deletion", "Your account and data will be permanently deleted on [date]. Changed your mind?" + "Cancel Deletion" button
```

---

### 1.4 — Onboarding Flows

```
[PASTE MASTER CONTEXT]

Create onboarding wizard flows using OnboardingLayout:

BUYER/RENTER ONBOARDING (4 steps):

Step 1: "Where are you looking?"
- Location search input (autocomplete, multiple locations allowed)
- "Add another area" button
- Max search radius slider (0.25mi – 10mi)
- Map preview showing selected areas

Step 2: "What's your budget?"
- Buy/Rent toggle (pre-selected from sign-up)
- If Buy: Price range slider (£50k – £2M+) with min/max inputs
- If Rent: Monthly budget slider (£400 – £5,000+ pcm)
- Property type multi-select: Detached, Semi, Terraced, Flat, Bungalow
- Bedrooms: number selector (Studio, 1, 2, 3, 4, 5+)

Step 3: "What matters most to you?"
- Must-have toggles: Garden, Parking, Garage, No Chain, New Build, Period Features
- Nice-to-have vs dealbreaker distinction
- "Anything else?" free-text input
- "We'll use AI to match you with ideal properties"

Step 4: "Stay in the loop"
- Notification preferences:
  - New matching properties: Instant / Daily / Weekly / Off
  - Price reductions: On / Off  
  - Market reports: Monthly / Off
- Email + Push toggle for each
- "Start Searching" primary button → redirect to search results

TRADESPERSON ONBOARDING (4 steps):

Step 1: "What do you do?"
- Trade category multi-select (icons): Plumber, Electrician, Builder, Painter, Carpenter, Roofer, Gardener, Cleaner, Locksmith, Handyman, Architect, Surveyor, Other
- Sub-specialisms per category (e.g. Plumber → Boiler Installation, Bathroom Fitting, Emergency Repairs)
- Years of experience selector

Step 2: "Where do you work?"
- Postcode input for centre point
- Service radius slider (5mi – 50mi)
- Map preview showing coverage area circle
- "Add another area" for non-contiguous coverage

Step 3: "Your credentials"
- Dynamic form based on trade:
  - Plumber → Gas Safe number input, ACS qualification upload
  - Electrician → NICEIC/NAPIT registration, Part P upload
  - All → Public liability insurance upload, optional other certs
- File upload for each credential
- "Skip for now" option (but explain verification benefits)

Step 4: "Show your best work"
- Photo upload grid (up to 20 photos)
- Before/after pairs option
- Short bio text area (AI-assisted: "Help me write this" button)
- Hourly rate or "Free quotes" toggle
- "Complete Setup" button → redirect to dashboard with verification CTA

ESTATE AGENT ONBOARDING (3 steps):

Step 1: "Your agency"
- Agency name
- Agency registration number
- Primary address + additional branches
- Logo upload
- Brand colour picker

Step 2: "Your team"
- Invite team members by email
- Set roles: Admin, Agent, Support
- Team size indicator

Step 3: "Your listings"
- Integration option: "Connect your CRM" (Reapit, Alto, Jupix, Expert Agent)
- Or: "Add listings manually"
- "Start Your Trial" button

LANDLORD ONBOARDING (3 steps):

Step 1: "Your portfolio"
- "How many properties do you manage?" selector: 1, 2-5, 6-10, 11-20, 20+
- Portfolio type: Residential, Commercial, Mixed, HMO

Step 2: "Add your first property"
- Property address (autocomplete)
- Property type, bedrooms, current tenancy status (vacant/occupied)
- Current rent amount
- Tenancy end date (if occupied)

Step 3: "Compliance check"
- Checklist with upload prompts:
  □ Gas Safety Certificate (upload or "Schedule inspection")
  □ EPC (upload or "Book assessment")
  □ EICR (upload or "Schedule inspection")
  □ Deposit protection (which scheme)
  □ Landlord insurance (upload)
- Each with traffic light status: ✅ Uploaded / ⚠️ Expiring Soon / ❌ Missing
- "Continue to Dashboard" → shows compliance dashboard
```

---

---

## PHASE 2: Consumer Dashboards

---

### 2.0 — Buyer Dashboard

```
[PASTE MASTER CONTEXT]

Create the Buyer/Renter dashboard using DashboardLayout:

SIDEBAR NAV ITEMS:
- Dashboard (home icon)
- Saved Properties (heart)
- Saved Searches (bell)
- Viewings (calendar)
- Offers (file-text)
- Messages (message-circle)
- Documents (folder)
- Moving Checklist (check-square)
- AI Match (sparkles)
- Financial Tools (calculator)
- Settings (settings)

DASHBOARD HOME PAGE:

Top: Welcome banner
"Good morning, [Name]! You have 3 new properties matching your searches."
Dismissible, shows once per session.

ROW 1: Quick Stats (4 StatCards)
- "Saved Properties: 12"
- "Active Alerts: 3"
- "Upcoming Viewings: 2"
- "Unread Messages: 5"

ROW 2: New Matches (PropertyCard compact carousel)
- Heading: "New Properties for You" + "View All →"
- Horizontal scroll of 6-8 property cards matching saved searches
- "Based on your saved search: 3-bed in Isleworth under £500k"

ROW 3: Upcoming Activity (2-column layout)
Left: Next Viewing card
- Property thumbnail + address
- Date/time, agent name
- "Get Directions" + "Reschedule" buttons
- If no viewings: "No upcoming viewings" empty state with "Search Properties" CTA

Right: Recent Activity feed
- Timeline of recent events:
  - "Price reduced on 14 Elm Road" (2h ago)
  - "New property matching 'Isleworth 3-bed'" (5h ago)
  - "Viewing confirmed for 22 Oak Lane" (1d ago)
- "View All Activity →"

ROW 4: Recommended Services
- "Professionals for your property journey"
- 3 cards: "Find a Mortgage Broker", "Find a Solicitor", "Find a Surveyor"
- Each with icon, brief description, CTA button

---

SAVED PROPERTIES PAGE:
- Grid/List toggle
- Sort: Date Saved, Price Low-High, Price High-Low
- Filter: For Sale, To Rent, All
- PropertyCard grid with "Remove" option (trash icon, confirm dialog)
- "Compare" feature: select 2-3 properties → comparison table modal
- Empty state: "No saved properties yet. Start exploring →"

---

SAVED SEARCHES & ALERTS PAGE:
- List of saved searches, each card showing:
  - Search criteria summary (location, price range, beds, type)
  - Alert frequency: Instant / Daily / Weekly / Off (toggle)
  - "X new properties since last check" badge
  - "Edit" and "Delete" actions
  - "View Results" button
- "Create New Alert" button

---

VIEWINGS PAGE:
- Calendar view (week/month toggle) using Calendar component
- List view alternative
- Each viewing shows: property thumbnail, address, date/time, type (in-person/virtual), agent
- Status badges: Confirmed, Pending, Completed, Cancelled
- "Add to Google/Apple Calendar" links
- Past viewings with "Leave feedback" prompt

---

OFFERS PAGE:
- Table/card view of all offers sent
- Columns: Property, Amount, Date, Status (Submitted/Under Review/Accepted/Rejected/Countered)
- Click to expand: full offer details, communication thread, agent response
- Submit Offer form: amount input, conditions textarea, mortgage AIP upload, "Submit Offer" button
- Status tracking: visual timeline (Submitted → Agent Reviewing → Vendor Considering → [Outcome])

---

MESSAGES PAGE:
- Left panel: conversation list (avatar, name, last message preview, time, unread badge)
- Right panel: message thread (chat bubble style)
- Message types: text, image attachment, document attachment, viewing request, offer notification
- Quick actions: "Schedule Viewing", "Ask a Question", "Send Document"
- Empty state: "No messages yet"
- Mobile: conversation list → tap → full-screen thread

---

DOCUMENTS PAGE:
- Document categories: Identity, Financial, Property
- Upload area per category
- Uploaded files: name, size, date, status (Uploaded, Verified, Rejected)
- "Upload Document" button → FileUpload modal
- Privacy note: "Your documents are encrypted and only shared with your consent"

---

AI PROPERTY MATCH PAGE:
- "Your Property Preferences" form (editable version of onboarding preferences)
- "Lifestyle Preferences" additions: commute destination, school priority, garden importance, etc.
- "Generate Matches" button
- Results: ranked list of properties with AI confidence score
- "Why this match?" expandable for each — AI explains reasoning
- "Refine Preferences" button to iterate
```

---

### 2.1 — Seller Dashboard

```
[PASTE MASTER CONTEXT]

Create the Seller dashboard using DashboardLayout:

SIDEBAR NAV:
- Dashboard, My Listings, Create Listing, Analytics, Viewings, Offers, Sale Progress, Valuation, Find Agent, Messages, Settings

DASHBOARD HOME:
- Stats row: "Active Listings: 1", "Total Views: 2,847", "Enquiries: 24", "Upcoming Viewings: 3"
- Listing performance card: mini chart (views over last 30 days)
- Recent enquiries list
- Upcoming viewings list
- Quick actions: "Create Listing", "Update Price", "Manage Viewings"

MY LISTINGS PAGE:
- Tab bar: Active | Under Offer | Sold | Drafts
- Each listing card (horizontal): thumbnail, address, price, status badge, views, saves, enquiries, days listed
- Actions dropdown: Edit, Update Price, Pause, Archive, Delete
- Performance sparkline per listing

CREATE LISTING — 7-STEP WIZARD:
Use OnboardingLayout/Stepper.

Step 1: Address & Property Type
- Address lookup (PostcodeInput → address autocomplete)
- Property type select: Detached, Semi, Terraced, Flat/Apartment, Bungalow, Maisonette, Cottage, Other
- Tenure: Freehold, Leasehold (show remaining years + service charge fields), Share of Freehold

Step 2: Property Details
- Bedrooms, Bathrooms, Reception rooms (NumberStepper each)
- Total floor area (sq ft input)
- Garden: None, Private, Communal, Shared (+ Front/Rear/Both)
- Parking: None, On-street, Driveway, Garage, Underground
- Heating: Gas Central, Electric, Oil, Other
- Features multi-select: Double Glazing, Fireplace, Conservatory, Loft Conversion, Extension, Listed Building, New Build, etc.
- Council Tax band select (A-H)

Step 3: Photos & Media
- Photo upload grid (drag to reorder, first = main image)
- Minimum 5 photos recommended, max 30
- Tips banner: "Bright, well-lit photos get 60% more views"
- Floor plan upload (optional)
- Virtual tour link input (Matterport, etc.)
- Video upload (optional)

Step 4: Description (AI-Assisted)
- Large textarea for property description
- "Generate with AI" button → AI writes description from property details
- AI output appears in textarea, fully editable
- Tone selector: Professional, Warm, Luxury, Conversational
- Character count and readability score
- "Key Selling Points" bullet input (separate from description)

Step 5: Price & Listing Type
- Listing type: For Sale, To Rent, Auction
- Price input (CurrencyInput)
- Price qualifier: Guide Price, Offers Over, Fixed Price, Offers in Region, POA
- "Get AI Valuation" button → shows estimated range based on comparables
- Comparable properties section showing recently sold nearby

Step 6: EPC
- Upload existing EPC PDF/image
- Or enter EPC rating manually (A-G + score)
- "Book an EPC Assessment" link to find assessors
- Expiry date check

Step 7: Review & Publish
- Full preview of listing (as it will appear to buyers)
- Checklist: ✅ Address, ✅ Details, ✅ 12 Photos, ✅ Description, ✅ Price, ⚠️ No EPC
- Edit buttons next to each section
- Terms acceptance checkbox
- "Publish Listing" primary button
- "Save as Draft" secondary button

LISTING ANALYTICS PAGE:
- Date range selector
- Charts: Views over time (line), Saves over time (line), Enquiry sources (pie)
- Stats: Total views, unique viewers, saves, enquiries, average time on listing
- Comparison to area average
- "Boost Your Listing" CTA if performance is below average

OFFERS RECEIVED PAGE:
- Cards for each offer: amount, buyer name (or anonymous), date, status, conditions
- Accept / Reject / Counter buttons
- Counter offer: amount input + message
- Offer comparison table if multiple offers

SALE PROGRESSION TRACKER:
- Visual pipeline/timeline:
  1. Listed → 2. Viewings → 3. Offer Accepted → 4. Solicitors Instructed → 5. Searches → 6. Survey → 7. Mortgage Approved → 8. Exchange → 9. Completion
- Current stage highlighted
- Each stage expandable with details, actions, dates
- Delay warnings if stage is taking longer than average
- Key contacts shown: your solicitor, buyer's solicitor, mortgage broker

INSTANT VALUATION TOOL:
- Address input → AI-powered estimate
- Shows: Estimated range (£400k–£440k), confidence level, based on X comparables
- Comparable properties table with sold prices
- "Want a more accurate valuation? Find an Estate Agent"

FIND & COMPARE AGENTS:
- Search by area
- AgentCard grid with: agency name, logo, rating, fees, properties sold, avg days to sell
- Side-by-side comparison (up to 3)
- "Request Valuation" from each → sends lead to agent
```

---

### 2.2 — Landlord Dashboard

```
[PASTE MASTER CONTEXT]

Create the Landlord dashboard — the most feature-rich consumer dashboard:

SIDEBAR NAV:
- Dashboard, Portfolio, Add Property, Tenants, Rent Collection, Compliance, Maintenance, Financials, Find Services, Insurance, Analytics, Settings

DASHBOARD HOME:
- Top stats: "Properties: 5", "Occupied: 4 / Vacant: 1", "Monthly Income: £7,250", "Compliance Issues: 2"
- Compliance alerts (warning cards if certificates expiring within 30 days)
- Rent collection status: mini table showing each property, rent due, status (Paid/Overdue/Due Soon)
- Recent maintenance requests
- Quick actions: "Add Property", "Check Compliance", "Find Tradesperson"

PORTFOLIO VIEW:
- Grid/List toggle
- Cards per property:
  - Property thumbnail + address
  - Status: Occupied (green) / Vacant (amber) / Under Offer (blue)
  - Tenant name (if occupied)
  - Monthly rent
  - Tenancy end date
  - Compliance traffic light: green (all good) / amber (expiring) / red (expired/missing)
  - Quick actions: View, Edit, List for Rent
- "Add Property" button
- Portfolio summary bar at top: total value estimate, total monthly income, average yield

INDIVIDUAL PROPERTY MANAGEMENT PAGE:
- Property header: photo, address, type, bedrooms, status
- Tabs: Overview | Tenancy | Financial | Compliance | Maintenance | Documents
  
  Overview: key facts, current tenant, rent details, property value estimate
  Tenancy: tenant info, tenancy agreement, start/end dates, deposit details, notices
  Financial: rent history chart, expenses for this property, P&L
  Compliance: all certificates with status, upload, renewal scheduling
  Maintenance: request history, active issues
  Documents: all docs for this property (tenancy, certs, inventory, invoices)

COMPLIANCE DASHBOARD (critical for landlords):
- Overview grid: one card per certificate type per property
- Matrix view: properties (rows) × certificate types (columns)
- Each cell: ✅ Valid (green) / ⚠️ Expiring (amber, with date) / ❌ Expired (red) / ⬜ Not uploaded
- Certificate types: Gas Safety, EPC, EICR, Legionella, Fire Safety, Smoke & CO Alarms, Deposit Protection, Right to Rent, HMO License
- Click cell → upload modal or certificate details
- "Schedule Inspection" → finds nearby professionals
- Email reminder settings per certificate

MAINTENANCE REQUESTS:
- Inbox view with cards
- Each request: property address, tenant name, category (plumbing, electrical, structural, etc.), priority (urgent/high/medium/low), date, status
- Status flow: Reported → Acknowledged → Tradesperson Assigned → In Progress → Completed
- Detail page: description, photos from tenant, internal notes, assigned tradesperson, messages thread
- "Assign Tradesperson" → search Britestate providers or enter external details
- Cost tracking per request

RENT COLLECTION:
- Monthly calendar/table view
- Each property/month cell: Paid ✅ / Overdue ❌ / Due Soon ⏰ / Partial ⚠️
- Automated reminder settings
- Payment history per tenant (chart)
- Total income over time chart

FINANCIALS:
- Income by property chart
- Expense tracker: add expenses with category, amount, property, date, receipt upload
- Categories: Maintenance, Insurance, Mortgage, Management Fees, Utilities, Legal, Other
- Profit/Loss summary per property and portfolio-wide
- Tax-year summary export (CSV/PDF) for self-assessment
- Yield calculator per property

FIND SERVICES (landlord-specific):
- "Find a Letting Agent" with letting-specific filters (fees, management type)
- "Find Tradespeople" with property pre-selected
- Quick-access to Gas Safe engineers, electricians, cleaners, inventory clerks
```

---

---

## PHASE 3: Professional Dashboards

---

### 3.0 — Estate Agent Dashboard

```
[PASTE MASTER CONTEXT]

Create the Estate Agent dashboard — the most complex professional dashboard:

SIDEBAR NAV:
- Dashboard, Listings (with sub-items: Active, SSTC, Sold/Let, Drafts), Create Listing, Leads, Viewings, Offers, Progression, Reports, CRM, Team, Reviews, Billing, Integrations, Settings

DASHBOARD HOME:
- Stats row: "Active Listings: 42", "New Leads: 8", "Viewings This Week: 15", "Offers Pending: 3"
- Performance chart: listings vs enquiries vs viewings (last 30 days, Recharts line chart)
- Lead pipeline mini (horizontal bars showing count per stage)
- Today's viewings list
- Recent activity feed
- "Your Britestate Performance" score card comparing to area agents

LISTINGS MANAGEMENT:
- Data table (Shadcn Table) with columns: Photo, Address, Price, Status, Views, Enquiries, Days Listed, Actions
- Bulk actions: Feature, Archive, Update Price
- Status tabs: Active | Under Offer | Sold STC | Exchanged | Completed | Let | Withdrawn | Archived
- Quick-edit inline for price changes
- "Create Listing" button (uses enhanced version of seller create listing with more fields)

LEAD MANAGEMENT:
- Table view with columns: Name, Source, Property Interest, Status, Assigned To, Last Contact, Actions
- Status pipeline: New → Contacted → Viewing Booked → Offer Stage → Won / Lost
- Lead detail page:
  - Contact info, budget, preferences
  - Activity timeline (calls, emails, viewings, offers)
  - Notes section
  - "Send Properties" → select from listings to email to lead
  - Assign/reassign to team member
- Filters: source (Britestate, direct, referral), status, assigned agent, date range

VIEWINGS:
- Calendar component (week view default)
- Colour-coded by property/agent
- Click to view: property, client, time, type (in-person/virtual), notes
- Drag to reschedule
- After viewing: "Collect Feedback" form (rating, interest level, comments)
- Feedback aggregated per property in listing analytics

OFFERS DASHBOARD:
- Grouped by property
- Each property: list of offers with amount, buyer, status, conditions
- Comparison view: side-by-side for multiple offers on same property
- Actions: Accept, Reject, Counter
- Negotiation thread per offer (messages between agent and buyer's agent)

SALE PROGRESSION BOARD (Kanban):
- Columns: Listing Active | Under Offer | Solicitors Instructed | Searches | Survey | Mortgage | Exchange | Completed
- Draggable cards per property
- Card: property thumbnail, address, price, buyer name, days in stage
- Click card → detail sidebar with full progression timeline
- Automated stage suggestions based on data
- Warning flags: "Over 14 days in this stage" (amber), "Potential chain issue" (red)

REPORTS:
- Vendor Report: auto-generated PDF per property (views, enquiries, feedback summary, market context)
- Market Appraisal: comparable analysis tool for valuations
- Performance Report — Agent: individual agent stats (listings, viewings, offers, conversions)
- Performance Report — Branch: aggregated branch performance
- Competitor Analysis: compare your listings/prices/speed against other agents in the area

CRM:
- Client list (searchable, filterable by type: buyer, seller, landlord)
- Client profile: contact info, properties of interest, viewings, offers, notes, communication history
- Tagging system
- Bulk email capability

TEAM & BRANCH:
- Team members list with roles (Admin, Senior Agent, Agent, Negotiator, Support)
- Permissions matrix (who can publish listings, manage leads, view financials)
- Performance per team member
- Branch management (if multi-branch): switch between branches, branch-specific analytics

REVIEWS:
- All reviews listed with rating, text, property, date
- Respond to review (public response text)
- Request review from past clients
- Overall rating breakdown (star distribution chart)
- Embeddable review widget code for agency website

SUBSCRIPTION & BILLING:
- Current plan details
- Usage: X listings / Y limit
- Upgrade/downgrade options
- Billing history table
- Payment method management
- Invoice downloads

API & INTEGRATIONS:
- Property feed: connect CRM (Reapit, Alto, Jupix, Expert Agent)
- API keys for custom integration
- Webhook configuration
- Feed sync status and logs
```

---

### 3.1 — Tradesperson Dashboard

```
[PASTE MASTER CONTEXT]

Create the Tradesperson dashboard:

SIDEBAR NAV:
- Dashboard, Profile, Verification, Services, Availability, Jobs (sub: Leads, Active, Completed), Quotes & Invoices, Payments, Portfolio, Reviews, Analytics, Subscription, Referrals, Settings

DASHBOARD HOME:
- Verification status banner at top if not fully verified:
  "Complete your verification to get up to 5x more leads" — progress bar (65%) — "Continue Verification" button
- Stats: "New Leads: 4", "Active Jobs: 3", "Completed: 47", "Rating: 4.8★ (89 reviews)"
- Earnings summary: "This Month: £3,420" with chart vs last month
- New lead cards (urgent ones highlighted)
- Upcoming jobs today
- Quick actions: "Update Availability", "Send Quote", "View New Leads"

PROFILE EDIT PAGE:
- Avatar/photo upload with crop tool
- Business name, personal name
- Bio textarea (with AI "Help me write this" button)
- Years of experience
- Trade categories (editable from onboarding selection)
- Sub-specialisms
- Phone, email, website
- Insurance details display (linked from verification)
- Social proof: "Member since [date]", total jobs, response rate

VERIFICATION CENTRE (critical):
- VerificationProgress component (vertical stepper)
- Current overall level: Bronze / Silver / Gold / Platinum
- Requirements for next level clearly shown

  Section: Identity Verification
  - Upload government ID → status badge
  - Address verification → status badge

  Section: Insurance & Qualifications
  - DocumentUploadCard for each:
    - Public Liability Insurance (required)
    - Professional Indemnity (if applicable)
    - Trade-specific (Gas Safe, NICEIC, NAPIT, etc.)
  - Each showing: status, expiry, view document button

  Section: Client References (3 required)
  - ReferenceRequestCard for each reference
  - "Request Reference" button → enter client email/phone → sends template request
  - Progress: 1/3 received, 2/3 received, 3/3 ✅
  - Each reference shows: client name, job type, rating, date, status

  Section: Peer References (3 required)
  - Same as client but from other tradespeople
  - "Must be from different trades" note
  
  Section: Final Review
  - "Under review by Britestate team" status
  - Average review time: 2-3 business days
  - Verified badge preview

SERVICES MANAGEMENT:
- List of services offered
- Add/edit: service name, description, base price (fixed or "From £X"), typical duration
- Price types: Hourly Rate, Fixed Price, Free Quotes Only, Day Rate
- Emergency call-out toggle and surcharge

SERVICE AREA MAP:
- Map with drawn coverage area
- Edit tools: draw circle, draw polygon, adjust radius
- Multiple areas supported
- Shows postcode districts covered

AVAILABILITY CALENDAR:
- Week/month view
- Mark available/unavailable blocks
- Working hours per day (e.g. Mon-Fri 8am-6pm, Sat 9am-1pm)
- Holiday/time off blocks
- Syncs with job schedule (confirmed jobs shown)
- Emergency availability toggle

JOBS — LEADS PAGE:
- Card list of new enquiries
- Each: customer name, job category, description (truncated), location, date posted, budget estimate
- "Express Interest" / "Decline" buttons
- Detail view: full description, photos from customer, location map, customer's preferred dates
- "Send Quote" action

JOBS — ACTIVE:
- Cards with: job title, customer, status (Quoted/Accepted/In Progress/Awaiting Payment)
- Timeline per job: enquiry → quote sent → accepted → scheduled → in progress → completed → paid → reviewed
- In-job communication thread (messages + photo sharing)

JOBS — COMPLETED:
- Historical list with: job, customer, date, amount, rating
- "Request Review" if no review left
- Filters: date range, rating, job type

QUOTES & INVOICES:
- Quote Builder:
  - Customer name (pre-filled from lead)
  - Line items: description, quantity, unit price, total
  - Add/remove lines
  - Subtotal, VAT toggle (show VAT reg number), total
  - Notes / terms section
  - Validity period (default 30 days)
  - "Send Quote" (email + in-app message)
  - Quote PDF preview

- Invoice Generator:
  - Similar to quote but with payment terms, due date, bank details
  - Status: Draft, Sent, Viewed, Paid, Overdue
  - "Mark as Paid" action
  - Invoice PDF download

PAYMENTS:
- Overview: "Total Earned: £42,500 (this year)", "Pending: £1,200", "Last Payout: £850"
- Transaction history table: date, job, customer, amount, status
- Filter by date range, status

PORTFOLIO / GALLERY:
- Photo grid (masonry layout)
- Before/after pair uploads
- Captions and job descriptions per photo
- Category tags
- Reorder capability
- "Upload Photos" with drag-and-drop

REVIEWS DASHBOARD:
- Overall: 4.8★ from 89 reviews
- Star distribution chart (5★: 72, 4★: 12, 3★: 3, 2★: 1, 1★: 1)
- Recent reviews list (ReviewCard components)
- Respond to each review
- "Request Review" → send link to past customer
- Review highlights: "Punctual", "Clean Worker", "Great Value" (auto-extracted keywords)

ANALYTICS:
- Profile views over time
- Enquiry rate (views to enquiries conversion)
- Quote conversion rate
- Average job value
- Response time metrics
- Revenue by month chart
- Comparison to area average

SUBSCRIPTION & BILLING:
- Current plan: Free / Professional (£29/mo) / Premium (£59/mo)
- Plan comparison table
- Boost credits remaining
- Billing history
- Upgrade CTA if on free plan

REFERRAL PROGRAMME:
- "Refer a tradesperson, earn £50"
- Unique referral link + share buttons
- Referral history: name, date, status (Pending/Registered/Verified/Paid)
- Total earned from referrals
```

---

### 3.2 — Mortgage Broker Dashboard

```
[PASTE MASTER CONTEXT]

Create the Mortgage Broker dashboard (simpler than agent/trades):

SIDEBAR NAV:
- Dashboard, Profile, Leads, Pipeline, Products, Calculators, Reviews, Analytics, Billing, Settings

DASHBOARD HOME:
- Stats: "New Leads: 6", "Active Clients: 12", "Completions This Month: 4", "Revenue: £8,400"
- New leads requiring response
- Pipeline summary (horizontal bar)
- Upcoming meetings

PROFILE:
- FCA registration number (verified badge)
- Specialisms: First-Time Buyers, Remortgage, Buy-to-Let, Commercial, Adverse Credit, Self-Employed
- Fee structure: Free / Fixed Fee / Percentage
- Bio, photo, qualifications

LEAD MANAGEMENT:
- Table of leads from Britestate (homebuyers clicking "Speak to Broker")
- Lead info: name, property interest, budget, deposit, employment type
- Actions: Contact, Add to Pipeline, Decline

PIPELINE (Kanban):
- Columns: Lead → Consultation → AIP → Property Found → Full Application → Valuation → Offer Issued → Completion
- Cards: client name, property, loan amount, lender, stage duration

MORTGAGE PRODUCTS:
- Searchable database of mortgage products (informational)
- Filter: lender, type, rate type (fixed/variable/tracker), LTV, term
- Comparison: select 2-3 products → side-by-side

CALCULATOR TOOLS:
- Affordability calculator
- Repayment calculator
- Stamp duty calculator
- Buy-to-let yield calculator
- All sharable with clients via link

REVIEWS & ANALYTICS:
- Same pattern as tradesperson reviews
- Analytics: lead conversion rate, average deal size, client satisfaction score
```

---

---

## PHASE 4: Marketplace & Public Profiles

---

### 4.0 — Service Provider Marketplace

```
[PASTE MASTER CONTEXT]

Create the service provider marketplace pages:

FIND A TRADESPERSON — SEARCH:
- Hero: "Find Trusted Tradespeople Near You"
- Search bar: "What do you need?" (autocomplete categories) + "Where?" (postcode/area)
- "Search" button
- Popular categories grid below (icon cards): Plumber, Electrician, Builder, Painter, Carpenter, Roofer, Gardener, Cleaner
- "Browse All Categories →"

SEARCH RESULTS:
- Left filters (desktop) / bottom sheet (mobile):
  - Service type
  - Distance slider
  - Rating minimum
  - Verification level (any, verified, premium)
  - Price range
  - Availability (today, this week, flexible)
  - Emergency services toggle
- Results: TradespersonCard grid (3 cols desktop, 1 col mobile)
- Sort: Recommended, Rating, Distance, Price, Reviews
- Map toggle showing provider locations
- "Can't find what you need? Post a Job →"

CATEGORY PAGE (SEO):
- URL: /tradespeople/plumbers/isleworth
- Heading: "Plumbers in Isleworth" (H1)
- Stats: "X verified plumbers in your area"
- Top 3 featured providers (premium badge)
- All providers list (paginated)
- Area description (SEO content)
- FAQ: "How much does a plumber cost in Isleworth?", "How do I find an emergency plumber?", etc.

TRADESPERSON PUBLIC PROFILE:
- ProfileLayout: hero banner + avatar overlay + key info
- Hero: cover photo or gradient
- Below hero: name, trade, location, rating (stars + count), verification badges, "Member since"
- CTAs: "Get a Free Quote" primary, "Call" button, "Message" button
- Tabs:
  1. About: bio, experience, specialisms, service area map
  2. Services & Pricing: service list with prices
  3. Portfolio: photo gallery (masonry grid, before/after, lightbox)
  4. Reviews: ReviewCard list, sortable by recent/rating, star distribution chart
  5. Availability: mini calendar showing available dates
- Sidebar (desktop): sticky booking/quote widget

AGENT PUBLIC PROFILE:
- Agency header: logo, name, address, phone, "X years on Britestate"
- Stats: total properties, sold this year, avg days to sell, rating
- Tabs:
  1. Active Listings: PropertyCard grid of their current listings
  2. Sold / Let: historical listings
  3. Reviews: ReviewCard list with star distribution
  4. Team: grid of individual agents with photo, name, role, personal rating
  5. About: agency description, services offered, areas covered
- CTA: "Request a Free Valuation"

COMPARE PROVIDERS:
- Side-by-side comparison (2-3 providers)
- Rows: photo, name, rating, review count, verification level, response time, price range, experience, badges
- Highlight differences
- "Get Quote" button per provider

POST A JOB:
- Form: job category, description, photos (upload), location, budget range, preferred timeline, contact details
- Preview before posting
- Success: "Your job has been posted. You'll start receiving responses from verified tradespeople."

JOB BOARD (tradesperson view):
- JobCard list with filters: category, location, budget, urgency
- Each card: category icon, title, brief description, location, budget, posted time, responses count
- "Express Interest" button per job
```

---

---

## PHASE 5: Financial Tools & Area Pages

---

### 5.0 — Standalone Financial Tools

```
[PASTE MASTER CONTEXT]

Create standalone financial calculator pages. Each is a public-facing SEO page with its own URL.

SHARED LAYOUT for all calculators:
- Hero: tool name heading + brief description
- Main content: interactive calculator (left/centre)
- Sidebar (desktop): "Speak to a Mortgage Broker" CTA, related calculators links, recently viewed properties
- Below calculator: "How is this calculated?" expandable explanation
- FAQ section for SEO
- Related blog posts

MORTGAGE CALCULATOR (/tools/mortgage-calculator):
- Inputs: Property price, Deposit (£ or %), Interest rate, Mortgage term (years slider 5-40), Repayment type (repayment/interest-only)
- Results (real-time update):
  - Monthly payment (large, prominent)
  - Total amount repayable
  - Total interest paid
  - Donut chart: principal vs interest
  - Amortisation table (expandable): month-by-month breakdown with running balance
  - Overpayment scenario: "If you paid £X extra/month, you'd save £Y and pay off Z years early"
- "Find a Mortgage Broker" CTA

STAMP DUTY CALCULATOR (/tools/stamp-duty-calculator):
- Inputs: Property price, Buyer type (first-time/moving home/additional property/non-UK resident)
- Results:
  - Total stamp duty amount (large)
  - Effective rate percentage
  - Band breakdown table: each SDLT band with rate and amount
  - Stacked bar chart visualisation
  - Comparison: "As a first-time buyer you save £X"

AFFORDABILITY CALCULATOR (/tools/affordability-calculator):
- Inputs: Annual income (applicant 1 + optional applicant 2), Monthly outgoings, Deposit available, Interest rate assumption
- Results:
  - "You could borrow up to £X"
  - "Your budget: £Y" (borrowing + deposit)
  - Monthly payment at this level
  - "Properties in your budget" → link to search results filtered by price

RENTAL YIELD CALCULATOR (/tools/rental-yield-calculator):
- Inputs: Property purchase price, Monthly rent, Annual costs (maintenance, insurance, management fees, void periods)
- Results:
  - Gross yield percentage
  - Net yield percentage
  - Annual profit/loss
  - Comparison to area average yield
  - ROI timeline chart

BUY VS RENT CALCULATOR (/tools/buy-vs-rent-calculator):
- Inputs: Monthly rent, Property price, Deposit, Mortgage rate, Expected property growth rate, Investment return rate (if renting and investing)
- Results: Break-even timeline chart, cumulative cost comparison over 1/5/10/25 years
- Verdict: "Buying becomes cheaper than renting after X years"

ENERGY BILL ESTIMATOR (/tools/energy-bill-estimator):
- Inputs: Property type, bedrooms, EPC rating, heating type
- Results: Estimated monthly energy cost, comparison to area average, tips to reduce
- "Find an Energy Assessor" CTA

All calculators: shareable URL with parameters, "Save to My Dashboard" button if logged in, print/PDF option.
```

---

### 5.1 — Area Guide Pages

```
[PASTE MASTER CONTEXT]

Create area guide pages (SEO-optimised):

AREA GUIDE — CITY (/properties/london):
- Hero: city photo + "Properties in London" (H1)
- Stats bar: average price, YoY change, number of listings, avg days to sell
- Popular boroughs/areas grid: thumbnail + name + avg price per area
- "Properties For Sale in London" preview (top 4 PropertyCards) + "View All X Results →"
- "Properties To Rent in London" preview
- Market overview: price chart (5-year trend), transaction volumes
- Area description (editorial SEO content)
- Transport overview
- "Find Local Services" section

AREA GUIDE — BOROUGH (/properties/london/isleworth):
- Hero: area photo + "Properties in Isleworth, TW7" (H1)
- Stats: avg price, listings count, most common property type, avg price by type table
- Map showing area boundary with listings plotted
- Property listings for area (compact grid)
- Area data dashboard:
  - Price trends chart
  - Property type distribution pie chart
  - New listings vs sold chart
  - Demographics: population, age distribution, household types
  - Schools table with Ofsted ratings
  - Transport: nearest stations, journey times to key destinations
  - Amenities: restaurants, shops, parks count
  - Crime stats: overall rate, comparison to borough average
  - Broadband average speed
- Local professionals: agents and tradespeople in this area
- Area description (editorial SEO content)

SOLD PRICES (/sold-prices/isleworth):
- Search: postcode or address
- Results table: address, type, beds, sold price, sold date, price paid vs asking
- Map with sold price markers
- Stats: average sold price, total transactions, price vs listing price
- Trend chart: sold prices over time

MARKET TRENDS (/market-trends):
- National overview dashboard
- Regional selector
- Charts: average prices by region, transaction volumes, time to sell, asking vs sold gap
- "Hot" and "Cold" market indicators
- Month-on-month and year-on-year comparisons
- Commentary section (editorial)
```

---

---

## PHASE 6: Admin, Payments, Settings, Email & System States

---

### 6.0 — Admin Dashboard

```
[PASTE MASTER CONTEXT]

Create the admin back-office using DashboardLayout with an admin-specific sidebar:

SIDEBAR NAV:
- Dashboard, Users, Listings, Verification, Reviews, Reported Content, Content (Blog, Help, Landing Pages), SEO, Analytics, Subscriptions, Promos, Email Campaigns, Feature Flags, System Health, Fraud, GDPR Requests, Audit Log, Team & Permissions

ADMIN DASHBOARD HOME:
- KPI cards row: Total Users (+ new today), Active Listings, Revenue (MTD), Verification Queue, Moderation Queue
- User growth chart (last 12 months, by role)
- Revenue chart (MRR, broken down by stream: subscriptions, featured listings, referral fees)
- Platform health: API response time, error rate, uptime
- Alerts: critical issues requiring attention

USER MANAGEMENT:
- Data table: name, email, role, status (active/suspended/banned), joined, last active
- Search + filters: role, status, verification level, date range
- Click → user detail page: full profile, activity log, listings/jobs, subscription, notes
- Actions: suspend, ban, delete, impersonate (for debugging), send message, force password reset, export data (GDPR)

LISTING MANAGEMENT:
- Moderation queue: listings awaiting approval
- Each: property preview, submitted by, date, auto-check results (inappropriate content, duplicate detection)
- Actions: approve, reject (with reason), flag for review, edit
- Bulk approve/reject
- Active listings: searchable table with all listings

VERIFICATION QUEUE:
- Queue of pending verifications grouped by type
- Each: provider name, document type, submitted document preview, submission date
- Actions: approve, reject (with reason), request resubmission
- Verification statistics: average processing time, approval rate

REVIEWS MODERATION:
- Flagged reviews queue
- Each: review text, reporter reason, original rating, author, subject
- Actions: keep (dismiss flag), edit, remove, warn user, ban user
- Automated flags: profanity, suspected fake, suspicious patterns

CONTENT MANAGEMENT:
- Blog editor: WYSIWYG with image upload, categories, tags, SEO metadata, publish/draft/schedule
- Help articles editor: same format, categorised
- Landing pages: simple page builder or template selection

ANALYTICS:
- Platform metrics: DAU/MAU, retention, session duration
- Revenue reports: breakdown by source, projections
- User behaviour: popular searches, conversion funnels, drop-off points
- Search query insights: top searches, zero-result queries, trending areas

FEATURE FLAGS:
- Toggle list of feature flags
- Each: name, description, status (on/off), rollout percentage, created date
- Targeting: by role, by user segment, by geography
- Activity log per flag

SYSTEM HEALTH:
- Uptime monitoring dashboard
- API endpoint response times
- Error rate charts
- Database performance
- CDN hit rates
- Queue depths (verification, moderation, email)

FRAUD DETECTION:
- Suspicious activity alerts
- Patterns: fake reviews, listing spam, account takeover attempts
- User risk scores
- Action queue: investigate, clear, ban

GDPR DATA REQUESTS:
- Queue of data export/deletion requests
- Status: Pending, Processing, Completed
- Automated export generation
- Deletion confirmation workflow

AUDIT LOG:
- Searchable log of all admin actions
- Who did what, when, to whom/what
- Exportable
```

---

### 6.1 — Account Settings & Payments

```
[PASTE MASTER CONTEXT]

Create shared account settings pages (used by all user roles):

SETTINGS — using SettingsLayout:

Left nav items: Personal Details, Security, Notifications, Privacy, Connected Accounts, Data & Storage, Appearance, Help

PERSONAL DETAILS:
- Avatar upload with crop
- First name, Last name
- Email (with "Change email" flow → verification)
- Phone number (with verification)
- Location / Postcode
- "Save Changes" button

SECURITY:
- Change Password section: current password, new password (strength meter), confirm
- Two-Factor Authentication: enable/disable toggle, QR code setup, backup codes
- Active Sessions: list with device, location, last active, "Sign out" per session
- Login History: table of recent logins with IP, device, location, time

NOTIFICATIONS:
- Matrix: rows = notification types, columns = channels (email, push, SMS, in-app)
- Categories:
  - Property Alerts (new matches, price reductions)
  - Viewing Updates (confirmations, reminders, cancellations)
  - Offer Updates (received, status changes)
  - Messages (new messages)
  - Reviews (new reviews, responses)
  - Compliance (certificate expiry, reminders) — landlord/trades only
  - Marketing (newsletter, tips, market reports)
- Toggle per cell
- "Unsubscribe from all marketing" link at bottom

PRIVACY:
- Profile visibility: Public / Registered Users Only / Private
- Search engine indexing: Allow / Block (providers)
- Data sharing preferences
- Activity visibility to other users
- "Download My Data" button (GDPR export)
- "Delete My Account" (red, confirm dialog with password entry)

CONNECTED ACCOUNTS:
- Google, Apple, Facebook connect/disconnect toggles
- Connected CRM systems (agents)
- Connected accounting software (tradespeople)

---

CHECKOUT / SUBSCRIPTION:

Subscription Purchase:
- Plan comparison: 3 columns (Free, Professional, Premium)
- Feature comparison rows with check/cross
- Monthly/Annual toggle (annual shows "Save 20%")
- "Subscribe" button per plan
- Stripe payment form: card number, expiry, CVC
- Promo code input
- Order summary sidebar
- Terms acceptance

Payment Confirmation:
- Green check animation
- "Welcome to [Plan Name]!"
- Summary: plan, price, next billing date
- "Go to Dashboard" button

Payment Failed:
- Red X icon
- "Payment couldn't be processed"
- Retry with different card option
- Contact support link

Subscription Management:
- Current plan card: name, price, renewal date, status
- Usage: "X of Y listings used", etc.
- "Change Plan" → plan comparison with current highlighted
- "Cancel Subscription" → confirmation flow with retention offer ("Stay on for 50% off next month?")

Billing History:
- Table: date, description, amount, status, invoice download link
- Filter by date range

Payment Methods:
- List of cards: type icon, last 4 digits, expiry, default badge
- Add new card, remove, set default
```

---

### 6.2 — Error Pages & System States

```
[PASTE MASTER CONTEXT]

Create error and system state pages:

404 — NOT FOUND:
- Centred layout, minimal
- Large "404" number (60px, light grey, Plus Jakarta Sans)
- Illustration: a house with a "?" on the door (friendly, on-brand)
- "Page not found"
- "The page you're looking for doesn't exist or has been moved."
- "Go Home" primary button + "Search Properties" secondary button
- Search bar below (in case they're looking for a property)

403 — ACCESS DENIED:
- Lock icon illustration
- "Access denied"
- "You don't have permission to view this page."
- "If you think this is a mistake, contact support."
- "Go Home" button + "Contact Support" button

500 — SERVER ERROR:
- Spanner/wrench illustration
- "Something went wrong"
- "We're working on fixing this. Please try again in a moment."
- "Try Again" button + "Go Home" button
- "Status page →" link

503 — MAINTENANCE:
- Construction/tools illustration
- "We'll be right back"
- "Britestate is currently undergoing maintenance."
- Estimated return time if available
- "Subscribe to updates" email input
- Social links

OFFLINE STATE (PWA):
- Cloud with X icon
- "You're offline"
- "Check your internet connection and try again."
- Show cached/saved content if available: saved properties, recent searches

SESSION EXPIRED:
- Clock icon
- "Your session has expired"
- "Please sign in again to continue."
- "Sign In" button (preserves return URL)

RATE LIMITED:
- Hourglass icon
- "Too many requests"
- "Please wait a moment before trying again."
- Countdown timer showing when they can retry

All error pages: use PublicLayout with minimal footer, brand-consistent illustrations, ensure they don't look broken or scary.
```

---

### 6.3 — Email Templates

```
[PASTE MASTER CONTEXT]

Create HTML email templates using table-based layout for email client compatibility:

SHARED EMAIL STRUCTURE:
- Max width: 600px, centred
- Background: #F8F8FA (neutral-50)
- Content card: white, 24px padding, rounded corners (where supported)
- Header: Britestate logo centred, 40px height, padding 24px
- Footer: "Britestate Ltd, [Address]", unsubscribe link, social icons, legal text
- Font: Arial/Helvetica fallback stack (web fonts unreliable in email)
- CTA buttons: 44px height, brand-primary bg, white text, rounded, full-width on mobile

TEMPLATE 1: Welcome Email
- Subject: "Welcome to Britestate, [First Name]! 🏠"
- Hero: "Welcome to Britestate" heading
- Personalised greeting
- 3-step "Get Started" section with icons: 1. Complete Profile, 2. Set Preferences, 3. Start Exploring
- Primary CTA: "Complete Your Profile"
- Footer with social + support links

TEMPLATE 2: Email Verification
- Subject: "Verify your email address"
- Brief: "Please verify your email to get started"
- CTA: "Verify Email" button
- Fallback: "Or copy this link: [URL]"
- "This link expires in 24 hours"

TEMPLATE 3: Password Reset
- Subject: "Reset your password"
- CTA: "Reset Password" button
- "If you didn't request this, ignore this email"
- "This link expires in 1 hour"

TEMPLATE 4: New Property Alert
- Subject: "X new properties matching your search"
- Search criteria summary
- 2-3 property cards: image, price, address, beds/baths
- "View All Matches" CTA
- "Edit Alert Preferences" link

TEMPLATE 5: Viewing Confirmation
- Subject: "Viewing confirmed: [Address]"
- Property mini card
- Date, time, type (in-person/virtual)
- Agent name & contact
- "Add to Calendar" links (Google, Apple, Outlook)
- "Need to reschedule?" link
- Property address with map static image

TEMPLATE 6: Offer Received (to seller/agent)
- Subject: "New offer received on [Address]"
- Offer amount (prominently displayed)
- Buyer details (name, position: first-time buyer, chain-free, etc.)
- "View Offer" CTA
- "You have 48 hours to respond"

TEMPLATE 7: New Enquiry (to tradesperson/agent)
- Subject: "New lead from Britestate"
- Customer name, job type, location
- Brief description
- "Respond Now" CTA
- "Average response time of top providers: 2 hours"

TEMPLATE 8: New Review Received
- Subject: "[Name] left you a review"
- Star rating visual (using images, not unicode)
- Review text (truncated)
- "View & Respond" CTA

TEMPLATE 9: Compliance Expiry Warning (landlord)
- Subject: "⚠️ [Certificate] expires in [X days]"
- Property address
- Certificate type and expiry date
- "Upload New Certificate" CTA
- "Find a [Professional Type] on Britestate" secondary CTA

TEMPLATE 10: Weekly Digest
- Subject: "Your weekly Britestate update"
- Sections:
  - New property matches (count)
  - Price changes on saved properties
  - New messages/enquiries
  - Platform news/tips
- "View Dashboard" CTA

TEMPLATE 11: Re-engagement (dormant 30 days)
- Subject: "We miss you, [Name]! New properties await"
- "X new properties have been listed in your area since your last visit"
- 2-3 featured property cards
- "Explore Properties" CTA
- "Update your preferences" link

All emails: 
- Responsive (fluid tables for mobile)
- Dark mode compatible (use both background-color and bgcolor)
- Alt text on all images
- Preheader text for each template
- Unsubscribe one-click compliant (List-Unsubscribe header)
```

---

---

## Appendix: Stitch Workflow Cheatsheet

### Prompt Formula

```
[PASTE MASTER CONTEXT]

Create [component/page name] for Britestate.

PURPOSE: [What this component does and where it appears]

LAYOUT: [Describe the structure — sections, columns, positioning]

CONTENT: [Specify what data/content appears, use realistic UK property examples]

INTERACTIONS: [Hover states, click actions, animations, loading states]

RESPONSIVE: [Mobile, tablet, desktop specific behaviours]

ACCESSIBILITY: [Keyboard navigation, screen reader considerations, ARIA labels]

OUTPUT: [Single TSX file using Next.js 14, TypeScript, TailwindCSS, Shadcn UI]
Do NOT include API calls, data fetching, or business logic.
Accept all data via props with TypeScript interfaces.
Use Lucide React for icons.
```

### Integration Steps (repeat per component)

```
1. Generate in Stitch
2. Copy TSX output
3. Create feature branch
4. Place in correct directory (e.g. /components/ui/PropertyCard.tsx)
5. Define prop interface matching existing data structures
6. Replace existing component's JSX return block
7. Keep existing: hooks, state, API calls, event handlers
8. Map Stitch classes → your Tailwind tokens
9. Test: 375px → 768px → 1280px → 1440px
10. Test: all states (loading, error, empty, populated)
11. Lighthouse: target 95+ each category
12. Merge
```
