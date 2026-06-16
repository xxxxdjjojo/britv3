import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Stub fetch — component stays in loading state unless we resolve it
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { TransactionMilestones } from "./TransactionMilestones";

const MOCK_MILESTONES = [
  {
    id: "m1",
    milestone_key: "offer_accepted",
    status: "completed",
    notes: null,
    completed_date: "2024-01-10",
    label: "Offer Accepted",
    description: "The vendor has formally accepted the offer.",
    order: 1,
  },
  {
    id: "m2",
    milestone_key: "solicitors_instructed",
    status: "in_progress",
    notes: "Waiting on searches",
    completed_date: null,
    label: "Solicitors Instructed",
    description: "Instruction letters sent to both sides.",
    order: 2,
  },
  {
    id: "m3",
    milestone_key: "local_searches",
    status: "not_started",
    notes: null,
    completed_date: null,
    label: "Local Searches",
    description: "Local authority searches underway.",
    order: 3,
  },
];

function mockSuccessResponse() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ milestones: MOCK_MILESTONES }),
  });
}

describe("TransactionMilestones", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("renders loading skeletons initially", () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = render(
      <TransactionMilestones transactionId="txn-1" />,
    );
    // Skeletons are present while loading
    expect(container.querySelectorAll("[data-slot='skeleton']").length).toBeGreaterThan(0);
  });

  it("renders the horizontal stepper after load", async () => {
    mockSuccessResponse();
    render(<TransactionMilestones transactionId="txn-1" />);
    // Labels appear in both stepper rail and detail cards — use getAllByText
    expect((await screen.findAllByText("Offer Accepted")).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Solicitors Instructed").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Local Searches").length).toBeGreaterThanOrEqual(1);
  });

  it("renders 'Milestone Details' section heading", async () => {
    mockSuccessResponse();
    render(<TransactionMilestones transactionId="txn-1" />);
    expect(await screen.findByText(/milestone details/i)).toBeInTheDocument();
  });

  it("shows the completed date for a completed milestone", async () => {
    mockSuccessResponse();
    render(<TransactionMilestones transactionId="txn-1" />);
    // Wait for load, then assert date badge exists (unique text)
    await screen.findAllByText("Offer Accepted");
    expect(screen.getByText("2024-01-10")).toBeInTheDocument();
  });

  it("shows notes for a milestone that has them", async () => {
    mockSuccessResponse();
    render(<TransactionMilestones transactionId="txn-1" />);
    await screen.findAllByText("Solicitors Instructed");
    expect(screen.getByText("Waiting on searches")).toBeInTheDocument();
  });

  it("shows progress count after load", async () => {
    mockSuccessResponse();
    render(<TransactionMilestones transactionId="txn-1" />);
    // 1 of 3 completed
    expect(await screen.findByText("1/3 completed")).toBeInTheDocument();
  });

  it("hides Edit buttons in readOnly mode", async () => {
    mockSuccessResponse();
    render(<TransactionMilestones transactionId="txn-1" readOnly />);
    await screen.findAllByText("Offer Accepted");
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  });

  it("shows Edit buttons when not readOnly", async () => {
    mockSuccessResponse();
    render(<TransactionMilestones transactionId="txn-1" />);
    await screen.findAllByText("Offer Accepted");
    expect(screen.getAllByText("Edit").length).toBe(3);
  });
});
