import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueuePosition } from "@/components/coming-soon/QueuePosition";
import type { QueueStatus } from "@/types/waitlist";

const status: QueueStatus = {
  code: "ABC123XY",
  position: 1245,
  referralCount: 1,
  total: 3000,
};

describe("QueuePosition", () => {
  it("renders the success headline", () => {
    render(<QueuePosition status={status} />);

    expect(
      screen.getByRole("heading", { name: /here's your spot/i }),
    ).toBeInTheDocument();
  });

  it("renders the real position and total, formatted", () => {
    render(<QueuePosition status={status} />);

    expect(screen.getByText(/#1,245/)).toBeInTheDocument();
    expect(screen.getByText(/of 3,000/)).toBeInTheDocument();
  });
});
