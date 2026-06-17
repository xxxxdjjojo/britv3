/**
 * Design-parity render tests for SaleProgressionKanban.
 * Only change design-related code: layout, spacing, typography, colors,
 * borders, radius, shadows, responsive behavior, component structure, and UI states.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { AgentSaleProgressionWithRisk } from "@/types/agent";
import { SaleProgressionKanban } from "./SaleProgressionKanban";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  closestCorners: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  verticalListSortingStrategy: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => "" } },
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

vi.mock("@/components/dashboard/agent/sales/ChainDetailDialog", () => ({
  ChainDetailDialog: () => null,
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_PROGRESSION: AgentSaleProgressionWithRisk = {
  id: "prog-001",
  agent_id: "agent-1",
  offer_id: "offer-1",
  property_id: "12 Richmond Mews, SW1",
  stage: "solicitors_instructed",
  expected_completion_date: "2026-09-30",
  solicitor_buyer: null,
  solicitor_seller: null,
  notes: "All confirmed",
  created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  chain_risk: null,
};

const MOCK_WITH_CHAIN: AgentSaleProgressionWithRisk = {
  ...MOCK_PROGRESSION,
  id: "prog-002",
  property_id: "44 Kensington Court",
  stage: "offer_accepted",
  chain_risk: {
    id: "risk-1",
    progression_id: "prog-002",
    chain_group_id: "group-1",
    risk_level: "high",
    risk_score: 72,
    chain_length: 4,
    chain_position: 2,
    slowest_link_id: null,
    slowest_link_days: 18,
    factors: [],
    computed_at: "",
    created_at: "",
    updated_at: "",
  },
};

const INITIAL: Parameters<typeof SaleProgressionKanban>[0]["initialProgressions"] = {
  solicitors_instructed: [MOCK_PROGRESSION],
  offer_accepted: [MOCK_WITH_CHAIN],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SaleProgressionKanban", () => {
  it("renders LISTING ACTIVE and UNDER OFFER tabs", () => {
    render(<SaleProgressionKanban initialProgressions={INITIAL} />);
    expect(screen.getByText(/listing active/i)).toBeDefined();
    expect(screen.getByText(/under offer/i)).toBeDefined();
  });

  it("shows sale card property IDs in listing active tab", () => {
    render(<SaleProgressionKanban initialProgressions={INITIAL} />);
    // solicitors_instructed is in LISTING_ACTIVE_STAGES
    expect(screen.getByText("12 Richmond Mews, SW1")).toBeDefined();
    // offer_accepted is also in LISTING_ACTIVE_STAGES
    expect(screen.getByText("44 Kensington Court")).toBeDefined();
  });

  it("switches to under offer tab and shows empty state", () => {
    render(<SaleProgressionKanban initialProgressions={INITIAL} />);
    fireEvent.click(screen.getByText(/under offer/i));
    expect(screen.getByText(/no sales in this view/i)).toBeDefined();
  });

  it("selects a card and shows detail panel on desktop", () => {
    render(<SaleProgressionKanban initialProgressions={INITIAL} />);
    fireEvent.click(screen.getByText("12 Richmond Mews, SW1"));
    // Detail panel shows the progression timeline header
    expect(screen.getByText(/progression timeline/i)).toBeDefined();
  });

  it("shows POTENTIAL CHAIN RISK badge for high-risk progressions", () => {
    render(<SaleProgressionKanban initialProgressions={INITIAL} />);
    expect(screen.getByText(/potential chain risk/i)).toBeDefined();
  });
});
