import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ComplianceLibraryPage from "@/app/(main)/compliance/page";
import PreLaunchAuditPage from "@/app/(main)/compliance/pre-launch-audit-2026/page";
import { AUDIT_META, AUDIT_SECTIONS } from "@/content/compliance/pre-launch-audit-2026";

describe("Compliance Library (Campaign 42)", () => {
  it("index lists the pre-launch audit with a link to its page", () => {
    render(<ComplianceLibraryPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "What we publish and why" }),
    ).toBeInTheDocument();
    expect(screen.getByText(AUDIT_META.title)).toBeInTheDocument();

    const link = screen.getByRole("link", { name: new RegExp(AUDIT_META.title) });
    expect(link).toHaveAttribute("href", "/compliance/pre-launch-audit-2026");
  });

  it("audit page renders the intro, every section heading, and the footer", () => {
    render(<PreLaunchAuditPage />);

    expect(screen.getByText(AUDIT_META.plainEnglishIntro)).toBeInTheDocument();
    for (const section of AUDIT_SECTIONS) {
      expect(
        screen.getByRole("heading", { level: 2, name: section.title }),
      ).toBeInTheDocument();
    }
    expect(
      screen.getByRole("heading", { name: "Why we publish this" }),
    ).toBeInTheDocument();
    expect(screen.getByText(AUDIT_META.whyWePublish)).toBeInTheDocument();
  });
});
