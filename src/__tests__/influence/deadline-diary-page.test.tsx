import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DeadlineDiaryClient } from "@/app/(main)/landlords/deadline-diary/DeadlineDiaryClient";
import { RRA_DEADLINES } from "@/content/rra-deadlines";

describe("DeadlineDiaryClient", () => {
  it("renders every deadline entry with its statutory source", () => {
    render(
      <DeadlineDiaryClient entries={RRA_DEADLINES} initialConfirmed={false} />,
    );

    for (const entry of RRA_DEADLINES) {
      expect(screen.getAllByText(entry.title).length).toBeGreaterThan(0);
    }
    // Statutory sources are linked, and the c. 26 citation is present.
    const links = screen.getAllByRole("link");
    expect(
      links.some((link) =>
        link.getAttribute("href")?.includes("legislation.gov.uk/ukpga/2025/26"),
      ),
    ).toBe(true);
  });

  it("labels unannounced deadlines instead of showing a date", () => {
    render(
      <DeadlineDiaryClient entries={RRA_DEADLINES} initialConfirmed={false} />,
    );
    const triggerCount = RRA_DEADLINES.filter((e) => e.kind === "trigger").length;
    expect(screen.getAllByText("Date not yet announced")).toHaveLength(triggerCount);
  });

  it("shows the confirmed state when arriving from the confirm email", () => {
    render(
      <DeadlineDiaryClient entries={RRA_DEADLINES} initialConfirmed={true} />,
    );
    expect(
      screen.getByText(/You're confirmed\. Deadline reminders will land/),
    ).toBeInTheDocument();
  });

  it("renders the signup form with the three profile questions", () => {
    render(
      <DeadlineDiaryClient entries={RRA_DEADLINES} initialConfirmed={false} />,
    );
    expect(
      screen.getByText(/tenancy that began before 1 May 2026/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Where are your properties?")).toBeInTheDocument();
    expect(
      screen.getByText(/managing agent look after your tenancies/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Get deadline reminders" }),
    ).toBeInTheDocument();
  });
});
