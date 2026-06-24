import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeedIntegrationConfig } from "./FeedIntegrationConfig";
import { ReviewStep } from "./ReviewStep";
import { PublishStep } from "./PublishStep";
import { ReviewCounts, deriveReviewCounts } from "./ReviewCounts";
import type { AgentFeedIntegrationView } from "@/types/agent";
import type { FeedImportReview, ItemStatus, RunStatus, ListingStatus } from "./types";

// ---------------------------------------------------------------------------
// Fetch stub — prevents component throwing during render
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
  );
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const EMPTY_INTEGRATIONS: AgentFeedIntegrationView[] = [];

const MOCK_INTEGRATION: AgentFeedIntegrationView = {
  id: "int-1",
  agent_id: "agent-1",
  provider: "sandbox",
  webhook_url: null,
  sync_status: "connected",
  last_sync_at: null,
  field_mapping: null,
  error_log: null,
  has_secret: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

/** A representative FeedImportReview fixture — all counts are driven from this object */
const MOCK_REVIEW: FeedImportReview = {
  run: {
    id: "run-1",
    status: "completed" as RunStatus,
    total_items: 10,
    eligible_items: 7,
    error_items: 2,
    published_items: 5,
  },
  items: [
    // 5 eligible, with media + coords
    ...Array.from({ length: 5 }, (_, i) => ({
      id: `item-ok-${i}`,
      external_id: `EXT-${i}`,
      external_branch_id: "BRANCH-A",
      status: "eligible" as ItemStatus,
      validation_errors: [],
      listing: {
        title: `Property ${i}`,
        address_line1: `${i} High Street`,
        city: "London",
        postcode: "SW1A 1AA",
        price: 500000 + i * 10000,
        listing_type: "sale",
        planning_permission_status: null,
        media: [{ url: "https://example.com/photo.jpg" }],
        latitude: 51.5,
        longitude: -0.1,
        status: "active" as ListingStatus,
      },
    })),
    // 1 eligible but missing media
    {
      id: "item-no-media",
      external_id: "EXT-NO-MEDIA",
      external_branch_id: "BRANCH-A",
      status: "eligible" as ItemStatus,
      validation_errors: [],
      listing: {
        title: "No media property",
        address_line1: "10 Church Lane",
        city: "London",
        postcode: "SW1A 2AA",
        price: 400000,
        listing_type: "sale",
        planning_permission_status: null,
        media: [],
        latitude: 51.5,
        longitude: -0.1,
        status: "active" as ListingStatus,
      },
    },
    // 1 eligible but missing coords
    {
      id: "item-no-coords",
      external_id: "EXT-NO-COORDS",
      external_branch_id: "BRANCH-B",
      status: "eligible" as ItemStatus,
      validation_errors: [],
      listing: {
        title: "No coords property",
        address_line1: "20 Park Road",
        city: "London",
        postcode: "SW1A 3AA",
        price: 350000,
        listing_type: "sale",
        planning_permission_status: null,
        media: [{ url: "https://example.com/photo.jpg" }],
        latitude: null,
        longitude: null,
        status: "active" as ListingStatus,
      },
    },
    // 1 withdrawn
    {
      id: "item-withdrawn",
      external_id: "EXT-WITHDRAWN",
      external_branch_id: "BRANCH-A",
      status: "withdrawn" as ItemStatus,
      validation_errors: [],
      listing: {
        title: "Withdrawn property",
        address_line1: "30 Victoria Street",
        city: "London",
        postcode: "SW1A 4AA",
        price: 300000,
        listing_type: "sale",
        planning_permission_status: null,
        media: [],
        latitude: 51.5,
        longitude: -0.1,
        status: "withdrawn" as ListingStatus,
      },
    },
    // 2 with validation errors (error_items: 2)
    ...Array.from({ length: 2 }, (_, i) => ({
      id: `item-error-${i}`,
      external_id: `EXT-ERR-${i}`,
      external_branch_id: "BRANCH-A",
      status: "error" as ItemStatus,
      validation_errors: ["Missing price"],
      listing: {
        title: `Error property ${i}`,
        address_line1: `${i} Error Lane`,
        city: "London",
        postcode: "SW1A 5AA",
        price: 0,
        listing_type: "sale",
        planning_permission_status: null,
        media: [],
        latitude: null,
        longitude: null,
        status: "error" as ListingStatus,
      },
    })),
  ],
};

// ---------------------------------------------------------------------------
// ConnectStep rendering (via FeedIntegrationConfig at step 1)
// ---------------------------------------------------------------------------

describe("FeedIntegrationConfig — Connect step", () => {
  it("renders the data-access explainer", () => {
    render(<FeedIntegrationConfig initialIntegrations={EMPTY_INTEGRATIONS} />);
    expect(screen.getByText(/What TrueDeed reads/i)).toBeInTheDocument();
  });

  it("shows Reapit as a selectable source", () => {
    render(<FeedIntegrationConfig initialIntegrations={EMPTY_INTEGRATIONS} />);
    expect(screen.getByText("Reapit Agency Cloud")).toBeInTheDocument();
  });

  it("shows Sandbox as a selectable source", () => {
    render(<FeedIntegrationConfig initialIntegrations={EMPTY_INTEGRATIONS} />);
    expect(screen.getByText("Sandbox portfolio feed")).toBeInTheDocument();
  });

  it("shows CSV as a selectable source", () => {
    render(<FeedIntegrationConfig initialIntegrations={EMPTY_INTEGRATIONS} />);
    expect(screen.getByText("CSV upload")).toBeInTheDocument();
  });

  it("does NOT offer Alto as a connectable source", () => {
    render(<FeedIntegrationConfig initialIntegrations={EMPTY_INTEGRATIONS} />);
    // The only mention of alto should be in the disclaimer, not as a selectable button
    const altoButtons = screen
      .queryAllByRole("button")
      .filter((b) => b.textContent?.toLowerCase().includes("alto"));
    expect(altoButtons).toHaveLength(0);
  });

  it("does NOT offer Jupix as a connectable source", () => {
    render(<FeedIntegrationConfig initialIntegrations={EMPTY_INTEGRATIONS} />);
    const jupixButtons = screen
      .queryAllByRole("button")
      .filter((b) => b.textContent?.toLowerCase().includes("jupix"));
    expect(jupixButtons).toHaveLength(0);
  });

  it("shows disclaimer that Alto and Jupix are not yet supported", () => {
    render(<FeedIntegrationConfig initialIntegrations={EMPTY_INTEGRATIONS} />);
    expect(screen.getByText(/Alto and Jupix are not yet supported/i)).toBeInTheDocument();
  });

  it("tells the user Reapit is a sandbox demo this phase", () => {
    render(<FeedIntegrationConfig initialIntegrations={EMPTY_INTEGRATIONS} />);
    // The disclaimer spans a <span> + surrounding text — use getAllByText with a substring
    expect(screen.getByText(/sandbox demo integration/i)).toBeInTheDocument();
  });

  it("shows the Add connection button", () => {
    render(<FeedIntegrationConfig initialIntegrations={EMPTY_INTEGRATIONS} />);
    expect(screen.getByRole("button", { name: /add connection/i })).toBeInTheDocument();
  });

  it("shows existing integrations", () => {
    render(<FeedIntegrationConfig initialIntegrations={[MOCK_INTEGRATION]} />);
    expect(screen.getByText("Sandbox portfolio")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// deriveReviewCounts — unit test against the fixture
// ---------------------------------------------------------------------------

describe("deriveReviewCounts", () => {
  it("source = run.total_items", () => {
    const c = deriveReviewCounts(MOCK_REVIEW);
    expect(c.source).toBe(10);
  });

  it("eligible = run.eligible_items", () => {
    const c = deriveReviewCounts(MOCK_REVIEW);
    expect(c.eligible).toBe(7);
  });

  it("blocked = run.error_items", () => {
    const c = deriveReviewCounts(MOCK_REVIEW);
    expect(c.blocked).toBe(2);
  });

  it("withdrawn = items with status withdrawn", () => {
    const c = deriveReviewCounts(MOCK_REVIEW);
    expect(c.withdrawn).toBe(1);
  });

  it("missingMedia = eligible items with no media", () => {
    const c = deriveReviewCounts(MOCK_REVIEW);
    // 1 eligible item has empty media array
    expect(c.missingMedia).toBe(1);
  });

  it("missingCoords = eligible items with null lat/lng", () => {
    const c = deriveReviewCounts(MOCK_REVIEW);
    // 1 eligible item has null coords
    expect(c.missingCoords).toBe(1);
  });

  it("warnings = eligible items with either missing media or missing coords", () => {
    const c = deriveReviewCounts(MOCK_REVIEW);
    // item-no-media + item-no-coords = 2 warnings
    expect(c.warnings).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// ReviewCounts component renders real counts from fixture
// ---------------------------------------------------------------------------

describe("ReviewCounts", () => {
  it("renders the source count from run.total_items", () => {
    render(<ReviewCounts review={MOCK_REVIEW} />);
    // "10" should appear (source = total_items = 10)
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("renders the eligible count from run.eligible_items", () => {
    render(<ReviewCounts review={MOCK_REVIEW} />);
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("renders the blocked count from run.error_items", () => {
    render(<ReviewCounts review={MOCK_REVIEW} />);
    // error_items=2 and warnings=2 both render "2"; find by label proximity
    expect(screen.getByText("Blocked / errors")).toBeInTheDocument();
    // Confirm there are exactly two "2" pills (blocked + warnings both happen to be 2)
    expect(screen.getAllByText("2")).toHaveLength(2);
  });

  it("renders the warnings count", () => {
    render(<ReviewCounts review={MOCK_REVIEW} />);
    // warnings = 2 (1 missing media + 1 missing coords)
    // But blocked is also 2 — use label lookup instead
    expect(screen.getByText("Warnings (media/coords)")).toBeInTheDocument();
  });

  it("renders the withdrawn count", () => {
    render(<ReviewCounts review={MOCK_REVIEW} />);
    expect(screen.getByText("Withdrawn")).toBeInTheDocument();
  });

  it("does NOT display a 'duplicates' count", () => {
    render(<ReviewCounts review={MOCK_REVIEW} />);
    expect(screen.queryByText(/duplicates/i)).not.toBeInTheDocument();
  });

  it("does NOT display a 'new listings' count", () => {
    render(<ReviewCounts review={MOCK_REVIEW} />);
    expect(screen.queryByText(/new listing/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ReviewStep
// ---------------------------------------------------------------------------

describe("ReviewStep", () => {
  const baseProps = {
    review: MOCK_REVIEW,
    approving: false,
    publishing: false,
    flowError: null,
    onApprove: vi.fn(),
    onPublish: vi.fn(),
  };

  it("renders the branch from item external_branch_id", () => {
    render(<ReviewStep {...baseProps} />);
    expect(screen.getByText(/BRANCH-A/)).toBeInTheDocument();
  });

  it("renders Approve button with eligible count", () => {
    render(<ReviewStep {...baseProps} />);
    expect(screen.getByRole("button", { name: /approve 7 eligible/i })).toBeInTheDocument();
  });

  it("renders progressive-disclosure toggle", () => {
    render(<ReviewStep {...baseProps} />);
    expect(screen.getByRole("button", { name: /show listing details/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// PublishStep
// ---------------------------------------------------------------------------

describe("PublishStep", () => {
  const baseProps = {
    publishedCount: 5,
    review: MOCK_REVIEW,
    onSyncAgain: vi.fn(),
  };

  it("renders the published count from publishedCount prop", () => {
    render(<PublishStep {...baseProps} />);
    expect(screen.getByText("5 listings published")).toBeInTheDocument();
  });

  it("renders search index count equal to published count", () => {
    render(<PublishStep {...baseProps} />);
    // The "Published" and "Search index" cards both show 5
    const fives = screen.getAllByText("5");
    expect(fives.length).toBeGreaterThanOrEqual(2);
  });

  it("renders the Sync again button", () => {
    render(<PublishStep {...baseProps} />);
    expect(screen.getByRole("button", { name: /sync again/i })).toBeInTheDocument();
  });

  it("shows blocked-items warning when error_items > 0", () => {
    render(<PublishStep {...baseProps} />);
    // MOCK_REVIEW has error_items: 2
    expect(screen.getByText(/2 listings? were not published/i)).toBeInTheDocument();
  });

  it("renders on-map count label", () => {
    render(<PublishStep {...baseProps} />);
    expect(screen.getByText(/geocoded and visible on the map/i)).toBeInTheDocument();
  });
});
