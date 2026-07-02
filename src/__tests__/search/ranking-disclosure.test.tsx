import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RankingDisclosure } from "@/components/search/RankingDisclosure";
import { SEARCH_RANKING_DISCLOSURE } from "@/config/pledges";

describe("RankingDisclosure (Campaign 43)", () => {
  it("renders the exact disclosure line from @/config/pledges", () => {
    const { container } = render(<RankingDisclosure />);
    expect(container.textContent).toContain(SEARCH_RANKING_DISCLOSURE);
  });

  it("links to the no-premium-placement pledge", () => {
    render(<RankingDisclosure />);
    expect(screen.getByRole("link", { name: "Our pledge" })).toHaveAttribute(
      "href",
      "/pledges/no-premium-placement",
    );
  });
});
