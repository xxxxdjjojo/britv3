import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BRIEFING_EDITIONS } from "@/content/briefing";

// notFound must throw like the real implementation so the page stops
// rendering (per-file mock overrides the setup.ts default).
const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return { ...actual, notFound: () => notFoundMock() };
});

import BriefingEditionPage, {
  generateStaticParams,
} from "@/app/(main)/agent-briefing/archive/[slug]/page";

const KNOWN = BRIEFING_EDITIONS[0];

async function renderPage(slug: string): Promise<void> {
  const ui = await BriefingEditionPage({
    params: Promise.resolve({ slug }),
  });
  render(ui);
}

describe("agent-briefing archive [slug] page", () => {
  it("generateStaticParams covers every edition", () => {
    expect(generateStaticParams()).toEqual(
      BRIEFING_EDITIONS.map(({ slug }) => ({ slug })),
    );
  });

  it("renders the edition title, sections and external sources", async () => {
    await renderPage(KNOWN.slug);

    expect(
      screen.getByRole("heading", { level: 1, name: KNOWN.title }),
    ).toBeInTheDocument();

    for (const section of KNOWN.body) {
      expect(
        screen.getByRole("heading", { level: 2, name: section.heading }),
      ).toBeInTheDocument();
    }

    const sources = KNOWN.body.flatMap((section) => section.sources ?? []);
    expect(sources.length).toBeGreaterThan(0);
    for (const source of sources) {
      const link = screen.getByRole("link", {
        name: new RegExp(
          source.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "i",
        ),
      });
      expect(link).toHaveAttribute("href", source.url);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("renders the footer publication note and a subscribe CTA", async () => {
    await renderPage(KNOWN.slug);

    expect(
      screen.getByText(/The Independent Agent Briefing, by TrueDeed/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /get the briefing/i }),
    ).toBeInTheDocument();
  });

  it("calls notFound for an unknown slug", async () => {
    await expect(renderPage("not-a-real-edition")).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(notFoundMock).toHaveBeenCalled();
  });
});
