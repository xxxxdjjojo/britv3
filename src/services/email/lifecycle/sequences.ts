/**
 * Typed lifecycle email sequences, one per role.
 *
 * Source of truth: docs/email/lifecycle-flows.md §5. Each step is fully
 * data-driven (subject, preview, heading, body paragraphs, CTA) so a single
 * generic template (src/emails/lifecycle-drip.tsx) renders every step — no
 * bespoke per-step templates.
 *
 * `kind`:
 *   - "onboarding": always-send (operational orientation for a service the
 *     user actively signed up for). Still carries an unsubscribe link and
 *     honours a global unsubscribe-all.
 *   - "marketing": preference-gated (skipped if the user opted out of
 *     marketing email or is globally unsubscribed).
 *
 * `delayDays` is measured from enrolment (day 0). All CTA hrefs are internal
 * absolute paths on truedeed.co.uk.
 */

export type LifecycleRole = "renter" | "homebuyer" | "landlord" | "seller" | "agent";

export type LifecycleStepKind = "onboarding" | "marketing";

export type LifecycleStep = {
  key: string;
  delayDays: number;
  kind: LifecycleStepKind;
  subject: string;
  previewText: string;
  heading: string;
  paragraphs: string[];
  ctaLabel: string;
  ctaHref: string;
};

const RENTER: LifecycleStep[] = [
  {
    key: "renter-welcome",
    delayDays: 0,
    kind: "onboarding",
    subject: "Welcome to TrueDeed — find your next rental",
    previewText: "Set a saved search and get instant alerts the moment a place lists.",
    heading: "Welcome to TrueDeed",
    paragraphs: [
      "TrueDeed helps renters find verified listings from trusted agents and landlords across the UK — all in one place.",
      "The fastest way to get ahead: set a saved search so you get instant alerts the moment a matching place lists.",
      "It takes one tap to start your search.",
    ],
    ctaLabel: "Start your search",
    ctaHref: "/search?listingType=rent",
  },
  {
    key: "renter-save-search",
    delayDays: 2,
    kind: "onboarding",
    subject: "Get matched the moment a place lists",
    previewText: "Saved searches mean instant new-listing alerts — be first to enquire.",
    heading: "Get matched the moment a place lists",
    paragraphs: [
      "Saved searches give you instant new-listing alerts, just like Rightmove and Zoopla — so you never miss the right home.",
      "Set your area, number of bedrooms and budget once, and we do the watching for you.",
      "Renters who set alerts are first to enquire — and first viewings win.",
    ],
    ctaLabel: "Save a search",
    ctaHref: "/search?listingType=rent",
  },
  {
    key: "renter-budget-tool",
    delayDays: 5,
    kind: "marketing",
    subject: "What rent can you actually afford?",
    previewText: "True move-in cost: rent, deposit and fees — no surprises.",
    heading: "What rent can you actually afford?",
    paragraphs: [
      "Work out your true move-in cost — rent, deposit and fees — before you fall for a place.",
      "We explain deposit-scheme protection so you know exactly where your money goes.",
      "Avoid surprise costs and budget with confidence.",
    ],
    ctaLabel: "Move-in cost calculator",
    ctaHref: "/tools/rental-yield-calculator",
  },
  {
    key: "renter-social-proof",
    delayDays: 9,
    kind: "marketing",
    subject: "How renters secure homes faster on TrueDeed",
    previewText: "Verified listings, verified agents, and deposit protection built in.",
    heading: "How renters secure homes faster",
    paragraphs: [
      "Every listing and agent on TrueDeed is verified, so you spend less time chasing ghosts.",
      "Renters who set alerts enquire first — and being first is how homes get secured.",
      "Tenancy deposit protection is built into the process from the start.",
    ],
    ctaLabel: "Browse rentals",
    ctaHref: "/search?listingType=rent",
  },
  {
    key: "renter-re-engagement",
    delayDays: 14,
    kind: "marketing",
    subject: "New rentals are waiting in your area",
    previewText: "Fresh listings since you joined — resume your search in one tap.",
    heading: "New rentals are waiting in your area",
    paragraphs: [
      "Plenty of fresh rentals have listed since you joined TrueDeed.",
      "Pick up where you left off in one tap.",
      "Haven't set a saved search yet? Now is the perfect time.",
    ],
    ctaLabel: "See what's new",
    ctaHref: "/dashboard",
  },
];

const HOMEBUYER: LifecycleStep[] = [
  {
    key: "homebuyer-welcome",
    delayDays: 0,
    kind: "onboarding",
    subject: "Welcome to TrueDeed — let's find the one",
    previewText: "Saved searches and price alerts to help you find the right home.",
    heading: "Welcome to TrueDeed",
    paragraphs: [
      "TrueDeed gives buyers verified listings, real sold-price data and the tools to buy with confidence.",
      "Start with a saved search to get instant alerts on new listings and price cuts.",
      "It takes one tap to begin.",
    ],
    ctaLabel: "Start your search",
    ctaHref: "/search?listingType=sale",
  },
  {
    key: "homebuyer-save-search",
    delayDays: 2,
    kind: "onboarding",
    subject: "Never miss the right home again",
    previewText: "Instant alerts on new listings and price cuts — save properties to compare.",
    heading: "Never miss the right home again",
    paragraphs: [
      "Get instant alerts on new listings and price reductions the moment they happen.",
      "Save properties as you go so you can compare them side by side.",
      "Set your area, bedrooms and budget once and we'll keep watch.",
    ],
    ctaLabel: "Save a search",
    ctaHref: "/search?listingType=sale",
  },
  {
    key: "homebuyer-area-prices",
    delayDays: 5,
    kind: "marketing",
    subject: "What's really happening with prices near you",
    previewText: "Median sold prices by postcode and price history on every listing.",
    heading: "What's really happening with prices near you",
    paragraphs: [
      "See median sold prices by postcode so you know what homes really go for.",
      "Every listing shows its price history, so you can spot the full picture.",
      "Buy with data, not guesswork.",
    ],
    ctaLabel: "Explore area prices",
    ctaHref: "/area-prices",
  },
  {
    key: "homebuyer-feasibility",
    delayDays: 9,
    kind: "marketing",
    subject: "See what you could build on a home",
    previewText: "Permitted-development potential and ROI signals per property.",
    heading: "See what you could build on a home",
    paragraphs: [
      "Each property shows its indicative permitted-development potential — what you could add without full planning.",
      "ROI and renovation signals help you spot underpriced upside.",
      "Browse homes with their potential in plain view.",
    ],
    ctaLabel: "Browse with potential",
    ctaHref: "/search?listingType=sale",
  },
  {
    key: "homebuyer-re-engagement",
    delayDays: 14,
    kind: "marketing",
    subject: "New homes matching you just listed",
    previewText: "Listings since you joined — resume in one tap.",
    heading: "New homes matching you just listed",
    paragraphs: [
      "New homes have listed since you joined TrueDeed.",
      "Resume your search in one tap.",
      "Set a saved search to be alerted the instant the right one appears.",
    ],
    ctaLabel: "View new matches",
    ctaHref: "/dashboard",
  },
];

const LANDLORD: LifecycleStep[] = [
  {
    key: "landlord-welcome",
    delayDays: 0,
    kind: "onboarding",
    subject: "Welcome to TrueDeed for landlords",
    previewText: "Manage listings, tenancies and compliance in one place.",
    heading: "Welcome to TrueDeed for landlords",
    paragraphs: [
      "Manage your listings, tenancies and compliance in a single hub.",
      "Your dashboard is the place to set everything up — start there.",
      "Everything you need to let well, in one workspace.",
    ],
    ctaLabel: "Go to your dashboard",
    ctaHref: "/dashboard",
  },
  {
    key: "landlord-list-property",
    delayDays: 2,
    kind: "onboarding",
    subject: "List your property in minutes",
    previewText: "Reach verified renters fast — your listing can go live the same day.",
    heading: "List your property in minutes",
    paragraphs: [
      "Reach verified renters fast by adding your property to TrueDeed.",
      "Add photos, rent and availability — the flow takes minutes.",
      "Your listing can be live the same day.",
    ],
    ctaLabel: "Add a property",
    ctaHref: "/dashboard",
  },
  {
    key: "landlord-yield-tool",
    delayDays: 5,
    kind: "marketing",
    subject: "What yield is your property really making?",
    previewText: "Gross and net yield in seconds, benchmarked to your area.",
    heading: "What yield is your property really making?",
    paragraphs: [
      "Calculate gross and net yield in seconds.",
      "Benchmark your return against the local area.",
      "Price the rent right and protect your margin.",
    ],
    ctaLabel: "Rental yield calculator",
    ctaHref: "/tools/rental-yield-calculator",
  },
  {
    key: "landlord-guide",
    delayDays: 8,
    kind: "marketing",
    subject: "The landlord guide: stay compliant, get paid",
    previewText: "Deposit deadlines, referencing, right-to-rent and rent reminders.",
    heading: "Stay compliant, get paid",
    paragraphs: [
      "Our landlord guide covers deposit-protection deadlines so you never miss one.",
      "Referencing and right-to-rent checks are explained step by step.",
      "Rent reminders are built in to keep payments on track.",
    ],
    ctaLabel: "Read the landlord guide",
    ctaHref: "/guides/landlord-guide",
  },
  {
    key: "landlord-social-proof",
    delayDays: 11,
    kind: "marketing",
    subject: "Why landlords switch their lettings to TrueDeed",
    previewText: "Verified tenant enquiries, compliance tracking and faster void fill.",
    heading: "Why landlords switch to TrueDeed",
    paragraphs: [
      "Verified tenant enquiries mean less time wasted on no-shows.",
      "Compliance tracking keeps your obligations in one place.",
      "Fill voids faster with renters who are ready to move.",
    ],
    ctaLabel: "See how it works",
    ctaHref: "/dashboard",
  },
  {
    key: "landlord-re-engagement",
    delayDays: 16,
    kind: "marketing",
    subject: "Your property dashboard is ready when you are",
    previewText: "Pick up where you left off — new renter demand in your area.",
    heading: "Your dashboard is ready when you are",
    paragraphs: [
      "Pick up your listing exactly where you left off.",
      "There's new renter demand in your area right now.",
      "It's one tap to publish.",
    ],
    ctaLabel: "Finish your listing",
    ctaHref: "/dashboard",
  },
];

const SELLER: LifecycleStep[] = [
  {
    key: "seller-welcome",
    delayDays: 0,
    kind: "onboarding",
    subject: "Welcome to TrueDeed — let's sell your home",
    previewText: "Start with a free, data-led valuation — one tap.",
    heading: "Welcome to TrueDeed",
    paragraphs: [
      "TrueDeed helps sellers price right and reach verified buyers.",
      "The best place to start is a free valuation of your home.",
      "It takes one tap.",
    ],
    ctaLabel: "Value my property",
    ctaHref: "/value-my-property",
  },
  {
    key: "seller-valuation",
    delayDays: 2,
    kind: "onboarding",
    subject: "What's your home worth today?",
    previewText: "An instant, data-led estimate with local sold-price comparables.",
    heading: "What's your home worth today?",
    paragraphs: [
      "Get an instant, data-led estimate of your home's value.",
      "We show local sold-price comparables so the number is grounded in reality.",
      "No obligation — just a clear starting point.",
    ],
    ctaLabel: "Get my free valuation",
    ctaHref: "/value-my-property",
  },
  {
    key: "seller-area-data",
    delayDays: 5,
    kind: "marketing",
    subject: "See what homes like yours sold for",
    previewText: "Sold prices by postcode and price trends near you.",
    heading: "See what homes like yours sold for",
    paragraphs: [
      "Browse sold prices by postcode to anchor your expectations.",
      "Spot the price trends in your area before you set an asking price.",
      "Set the right asking price from day one.",
    ],
    ctaLabel: "View area prices",
    ctaHref: "/area-prices",
  },
  {
    key: "seller-social-proof",
    delayDays: 9,
    kind: "marketing",
    subject: "How sellers list with confidence on TrueDeed",
    previewText: "Verified buyer enquiries and data-backed pricing.",
    heading: "List with confidence",
    paragraphs: [
      "Verified buyer enquiries mean fewer time-wasters.",
      "Data-backed pricing helps you list at a number that sells.",
      "A transparent process from valuation to completion.",
    ],
    ctaLabel: "Create your listing",
    ctaHref: "/dashboard",
  },
  {
    key: "seller-re-engagement",
    delayDays: 14,
    kind: "marketing",
    subject: "Your valuation is one tap away",
    previewText: "Pick up where you left off — buyer demand in your area.",
    heading: "Your valuation is one tap away",
    paragraphs: [
      "Pick up your valuation right where you left off.",
      "There's active buyer demand in your area.",
      "It's quick to complete.",
    ],
    ctaLabel: "Finish your valuation",
    ctaHref: "/value-my-property",
  },
];

const AGENT: LifecycleStep[] = [
  {
    key: "agent-welcome",
    delayDays: 0,
    kind: "onboarding",
    subject: "Welcome to TrueDeed — set up your agency",
    previewText: "Listings, leads and jobs in one hub. Complete your agency profile.",
    heading: "Welcome — let's set up your agency",
    paragraphs: [
      "Manage listings, leads and jobs from a single workspace.",
      "Start by completing your agency profile so buyers and renters trust you.",
      "Everything your agency needs, in one hub.",
    ],
    ctaLabel: "Go to your dashboard",
    ctaHref: "/dashboard",
  },
  {
    key: "agent-first-listing",
    delayDays: 2,
    kind: "onboarding",
    subject: "Publish your first listing today",
    previewText: "Reach verified buyers and renters — go live the same day.",
    heading: "Publish your first listing today",
    paragraphs: [
      "Reach verified buyers and renters from your very first listing.",
      "The listing flow is quick — add a property in minutes.",
      "Your listing can go live the same day.",
    ],
    ctaLabel: "Add a listing",
    ctaHref: "/dashboard",
  },
  {
    key: "agent-complete-profile",
    delayDays: 5,
    kind: "onboarding",
    subject: "Win more enquiries with a complete profile",
    previewText: "Verified agencies get more leads — add your logo and coverage.",
    heading: "Win more enquiries with a complete profile",
    paragraphs: [
      "Verified agencies with complete profiles get more leads.",
      "Add your logo, coverage area and contact details.",
      "A complete profile builds trust and converts more enquiries.",
    ],
    ctaLabel: "Complete profile",
    ctaHref: "/dashboard",
  },
  {
    key: "agent-marketplace",
    delayDays: 8,
    kind: "marketing",
    subject: "Find trades & services in the marketplace",
    previewText: "Connect with vetted providers and post jobs to get quotes.",
    heading: "Find trades & services in the marketplace",
    paragraphs: [
      "Connect with vetted providers for surveys, EPCs, photography and more.",
      "Post a job to get competitive quotes fast.",
      "Speed up your transactions with the right people on call.",
    ],
    ctaLabel: "Explore the marketplace",
    ctaHref: "/marketplace",
  },
  {
    key: "agent-post-job",
    delayDays: 11,
    kind: "marketing",
    subject: "Need a survey, EPC or photos? Post a job",
    previewText: "Get competitive quotes from vetted providers and track responses.",
    heading: "Need a survey, EPC or photos?",
    paragraphs: [
      "Post a job and get competitive quotes fast.",
      "Every provider is vetted, so you can hire with confidence.",
      "Track responses in one place.",
    ],
    ctaLabel: "Post a job",
    ctaHref: "/post-a-job",
  },
  {
    key: "agent-re-engagement",
    delayDays: 16,
    kind: "marketing",
    subject: "Your agency dashboard is waiting",
    previewText: "Finish onboarding — new buyer and renter demand awaits.",
    heading: "Your agency dashboard is waiting",
    paragraphs: [
      "Finish your onboarding and unlock the full workspace.",
      "There's new buyer and renter demand in your area.",
      "It's one tap to list.",
    ],
    ctaLabel: "Pick up setup",
    ctaHref: "/dashboard",
  },
];

export const LIFECYCLE_SEQUENCES: Record<LifecycleRole, LifecycleStep[]> = {
  renter: RENTER,
  homebuyer: HOMEBUYER,
  landlord: LANDLORD,
  seller: SELLER,
  agent: AGENT,
};

export const LIFECYCLE_ROLES = Object.keys(LIFECYCLE_SEQUENCES) as LifecycleRole[];

/**
 * Map a profiles.active_role value to a lifecycle role. Returns null for roles
 * with no sequence (service_provider, mortgage_broker, admin).
 */
export function toLifecycleRole(activeRole: string | null | undefined): LifecycleRole | null {
  if (!activeRole) return null;
  return (LIFECYCLE_ROLES as string[]).includes(activeRole)
    ? (activeRole as LifecycleRole)
    : null;
}
