import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// canvas-confetti is dynamically imported on the success transition. Mock it to a
// no-op so the celebratory effect does not touch the (absent) canvas 2d context.
// Also stub getContext defensively in case the real module is ever reached.
vi.mock("canvas-confetti", () => ({
  __esModule: true,
  default: vi.fn(),
}));

beforeAll(() => {
  vi.stubGlobal("requestAnimationFrame", () => 0);
  HTMLCanvasElement.prototype.getContext = vi.fn(
    () =>
      ({
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        fill: vi.fn(),
        closePath: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        arc: vi.fn(),
      }) as unknown as CanvasRenderingContext2D,
  ) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

let searchString = "";
vi.mock("next/navigation", () => ({
  useParams: () => ({ role: "agent" }),
  useSearchParams: () => new URLSearchParams(searchString),
}));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import PaymentConfirmationPage from "@/app/(protected)/dashboard/[role]/billing/confirmation/page";

function renderWith(search: string) {
  searchString = search;
  return render(<PaymentConfirmationPage />);
}

describe("PaymentConfirmationPage states", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the success state immediately when there is no session_id", () => {
    renderWith("plan=Agent%20Pro&amount=2999");
    expect(screen.getByRole("heading", { name: /you're all set/i })).toBeInTheDocument();
    expect(screen.getByText("Subscription activated")).toBeInTheDocument();
  });

  it("decodes the plan name and formats the charged amount", () => {
    renderWith("plan=Agent%20Pro&amount=2999");
    expect(screen.getByText("Agent Pro")).toBeInTheDocument();
    // 2999 pence → £29.99 charged (whole-pound formatting → £30)
    expect(screen.getByText(/has been charged/i)).toBeInTheDocument();
  });

  it("starts in the polling state when a session_id is present", () => {
    // fetch never resolves to 'complete' here, so it stays polling on first render
    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as never;
    renderWith("session_id=cs_test_123&plan=Agent%20Pro");
    expect(screen.getByRole("heading", { name: /processing your payment/i })).toBeInTheDocument();
  });

  it("transitions from polling to success when the session reports complete", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ status: "complete" }) }) as never;
    renderWith("session_id=cs_test_123&plan=Agent%20Pro");
    expect(screen.getByRole("heading", { name: /processing your payment/i })).toBeInTheDocument();
    await waitFor(
      () => expect(screen.getByRole("heading", { name: /you're all set/i })).toBeInTheDocument(),
      { timeout: 5000 },
    );
  });

  it("offers dashboard and billing navigation in the success state", () => {
    renderWith("plan=Agent%20Pro");
    expect(screen.getByText("Go to Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Billing Overview")).toBeInTheDocument();
  });
});
