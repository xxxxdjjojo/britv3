/**
 * Tests for PlanningApplicationsSection (TDD RED — component not yet implemented)
 *
 * Pins the contract of the async server component:
 *  1. Links render properly — each application row renders an <a> whose href
 *     equals the application's url, opened in a new tab with
 *     rel="noopener noreferrer" ("write test to make sure links render
 *     properly... then commit then update the code to make the test pass")
 *  2. Status badges render the status text
 *  3. Description, address, and reference render per application
 *  4. Empty state — /no planning applications/i, no application links
 *  5. Error state (service resolves null) — /currently unavailable/i
 *  6. Disclaimer — /verify with the local planning authority/i in all states
 *  7. Skeleton renders without throwing
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@/services/properties/planit-service", () => ({
  fetchNearbyPlanningApplications: vi.fn(),
}));

import {
  PlanningApplicationsSection,
  PlanningApplicationsSectionSkeleton,
} from "@/components/properties/detail/PlanningApplicationsSection";
import { fetchNearbyPlanningApplications } from "@/services/properties/planit-service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

type PlanningApplicationStatus =
  | "Permitted"
  | "Conditions"
  | "Rejected"
  | "Withdrawn"
  | "Undecided"
  | "Referred"
  | "Unresolved"
  | "Other";

type PlanningApplication = {
  reference: string;
  description: string;
  address: string;
  status: PlanningApplicationStatus;
  app_type: string;
  start_date: string;
  decided_date: string | null;
  url: string;
  distance_km: number;
  authority: string;
};

const APP_ONE: PlanningApplication = {
  reference: "24/01234/FUL",
  description: "Single storey rear extension",
  address: "12 Example Road, London SW1A 1AA",
  status: "Permitted",
  app_type: "Full",
  start_date: "2024-03-01",
  decided_date: "2024-05-10",
  url: "https://planning.example-council.gov.uk/app/123",
  distance_km: 0.21,
  authority: "Westminster",
};

const APP_TWO: PlanningApplication = {
  reference: "25/00077/HSE",
  description: "Loft conversion with rear dormer",
  address: "34 Sample Street, London SW1A 2BB",
  status: "Undecided",
  app_type: "Householder",
  start_date: "2025-01-20",
  decided_date: null,
  url: "https://www.planit.org.uk/planapplic/ABC/",
  distance_km: 0.45,
  authority: "Westminster",
};

const MOCK_APPLICATIONS = [APP_ONE, APP_TWO];

const APPLICATION_URLS = MOCK_APPLICATIONS.map((app) => app.url);

const mockService = vi.mocked(fetchNearbyPlanningApplications);

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PlanningApplicationsSection", () => {
  it("calls the planit service with the given coordinates", async () => {
    // Arrange
    mockService.mockResolvedValue(MOCK_APPLICATIONS);

    // Act
    render(await PlanningApplicationsSection({ lat: 51.5, lng: -0.1 }));

    // Assert
    expect(mockService).toHaveBeenCalledWith(51.5, -0.1);
  });

  it("renders each application as a link with the application's url, target _blank, and noopener noreferrer rel", async () => {
    // Arrange
    mockService.mockResolvedValue(MOCK_APPLICATIONS);

    // Act
    render(await PlanningApplicationsSection({ lat: 51.5, lng: -0.1 }));

    // Assert
    const links = screen.getAllByRole("link");
    const applicationLinks = links.filter((link) =>
      APPLICATION_URLS.includes(link.getAttribute("href") ?? ""),
    );

    expect(applicationLinks).toHaveLength(2);

    const hrefs = applicationLinks.map((link) => link.getAttribute("href"));
    expect(hrefs).toContain("https://planning.example-council.gov.uk/app/123");
    expect(hrefs).toContain("https://www.planit.org.uk/planapplic/ABC/");

    for (const link of applicationLinks) {
      expect(link.getAttribute("target")).toBe("_blank");
      const rel = link.getAttribute("rel") ?? "";
      expect(rel).toContain("noopener");
      expect(rel).toContain("noreferrer");
    }
  });

  it("renders a status badge for each application", async () => {
    // Arrange
    mockService.mockResolvedValue(MOCK_APPLICATIONS);

    // Act
    render(await PlanningApplicationsSection({ lat: 51.5, lng: -0.1 }));

    // Assert
    expect(screen.getByText("Permitted")).toBeInTheDocument();
    expect(screen.getByText("Undecided")).toBeInTheDocument();
  });

  it("renders description, address, and reference for each application", async () => {
    // Arrange
    mockService.mockResolvedValue(MOCK_APPLICATIONS);

    // Act
    render(await PlanningApplicationsSection({ lat: 51.5, lng: -0.1 }));

    // Assert
    for (const app of MOCK_APPLICATIONS) {
      expect(screen.getByText(app.description)).toBeInTheDocument();
      expect(screen.getByText(app.address)).toBeInTheDocument();
      expect(screen.getByText(app.reference)).toBeInTheDocument();
    }
  });

  it("renders an empty state with no application links when the service resolves []", async () => {
    // Arrange
    mockService.mockResolvedValue([]);

    // Act
    render(await PlanningApplicationsSection({ lat: 51.5, lng: -0.1 }));

    // Assert
    expect(
      screen.getByText(/no planning applications/i),
    ).toBeInTheDocument();

    const links = screen.queryAllByRole("link");
    const applicationLinks = links.filter((link) =>
      APPLICATION_URLS.includes(link.getAttribute("href") ?? ""),
    );
    expect(applicationLinks).toHaveLength(0);
  });

  it("renders an unavailable message when the service resolves null", async () => {
    // Arrange
    mockService.mockResolvedValue(null);

    // Act
    render(await PlanningApplicationsSection({ lat: 51.5, lng: -0.1 }));

    // Assert
    expect(screen.getByText(/currently unavailable/i)).toBeInTheDocument();
  });

  it.each([
    ["data", MOCK_APPLICATIONS],
    ["empty", []],
    ["error", null],
  ] as const)(
    "renders the verify-with-authority disclaimer in the %s state",
    async (_label, serviceResult) => {
      // Arrange
      mockService.mockResolvedValue(
        serviceResult as PlanningApplication[] | null,
      );

      // Act
      render(await PlanningApplicationsSection({ lat: 51.5, lng: -0.1 }));

      // Assert
      expect(
        screen.getByText(/verify with the local planning authority/i),
      ).toBeInTheDocument();
    },
  );
});

describe("PlanningApplicationsSectionSkeleton", () => {
  it("renders without throwing", () => {
    // Arrange / Act / Assert
    expect(() => render(<PlanningApplicationsSectionSkeleton />)).not.toThrow();
  });
});
