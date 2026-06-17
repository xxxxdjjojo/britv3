// src/components/dashboard/provider/JobDetailView.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { JobDetailView } from "./JobDetailView";
import type { JobDetail } from "@/services/provider/provider-job-service";
import type { JobSidebarData } from "./JobDetailView";

// Mock Next.js navigation (uses useRouter / Link internally)
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => "/"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockJob: JobDetail = {
  id: "abc-123",
  status: "in_progress",
  serviceType: "Emergency Boiler Repair",
  description: "Full system failure reported. Boiler unit not responding.",
  client: {
    id: "client-1",
    name: "James Harrison",
    email: "j.harrison@email.co.uk",
    phone: "+44 7700 900123",
  },
  address: {
    line1: "24 High St",
    city: "Richmond",
    postcode: "TW10 6RE",
  },
  agreedPricePence: 24000,
  scheduledAt: "2026-06-14T09:00:00Z",
  completedAt: null,
  attachments: [],
  timeline: [
    { at: "2026-06-10T10:00:00Z", label: "Job created" },
    { at: "2026-06-11T14:30:00Z", label: "Quote sent" },
  ],
  createdAt: "2026-06-10T10:00:00Z",
};

const mockSidebar: JobSidebarData = {
  quote: { exists: true, totalPence: 24000, lineCount: 3 },
  invoice: { exists: false, number: null, status: null },
  review: { exists: false, rating: null, comment: null },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("JobDetailView", () => {
  it("renders the job service type as the page heading", () => {
    render(<JobDetailView job={mockJob} sidebar={mockSidebar} />);
    expect(
      screen.getByRole("heading", { name: /emergency boiler repair/i }),
    ).toBeInTheDocument();
  });

  it("renders the status badge", () => {
    render(<JobDetailView job={mockJob} sidebar={mockSidebar} />);
    expect(screen.getAllByText(/in progress/i).length).toBeGreaterThan(0);
  });

  it("renders the client name", () => {
    render(<JobDetailView job={mockJob} sidebar={mockSidebar} />);
    expect(screen.getAllByText(/james harrison/i).length).toBeGreaterThan(0);
  });

  it("renders Scope of Work section", () => {
    render(<JobDetailView job={mockJob} sidebar={mockSidebar} />);
    expect(screen.getByText(/scope of work/i)).toBeInTheDocument();
    expect(
      screen.getByText(/full system failure reported/i),
    ).toBeInTheDocument();
  });

  it("renders Job Timeline section", () => {
    render(<JobDetailView job={mockJob} sidebar={mockSidebar} />);
    expect(screen.getByText(/job timeline/i)).toBeInTheDocument();
  });

  it("renders Job Location in sidebar", () => {
    render(<JobDetailView job={mockJob} sidebar={mockSidebar} />);
    expect(screen.getByText(/job location/i)).toBeInTheDocument();
    // Address appears in both the meta row and the sidebar location card; at least one must exist
    expect(screen.getAllByText(/24 high st/i).length).toBeGreaterThan(0);
  });

  it("renders Quote section with formatted amount", () => {
    render(<JobDetailView job={mockJob} sidebar={mockSidebar} />);
    // £240.00 may appear in the quote card and/or meta chips — at least one
    expect(screen.getAllByText(/£240\.00/i).length).toBeGreaterThan(0);
  });
});
