import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

// next/script → render children/src as plain elements so we can assert on them.
vi.mock("next/script", () => ({
  default: ({ src, children }: { src?: string; children?: string }) =>
    src ? (
      <script data-testid="ga-src" data-src={src} />
    ) : (
      <script data-testid="ga-inline">{children}</script>
    ),
}));

let consent: { analytics: boolean } | null = null;
vi.mock("@/contexts/CookieConsentContext", () => ({
  useCookieConsent: () => ({ consent }),
}));

import { GoogleAnalytics } from "./GoogleAnalytics";

const GA_ID = "G-GCSQS7K9FR";

describe("GoogleAnalytics", () => {
  beforeEach(() => {
    consent = null;
    delete (window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`];
  });

  it("loads the gtag.js tag when consent is undecided (active by default)", () => {
    const { getByTestId } = render(<GoogleAnalytics />);
    expect(getByTestId("ga-src").getAttribute("data-src")).toContain(
      `id=${GA_ID}`,
    );
    expect(getByTestId("ga-inline").textContent).toContain(
      `gtag('config', '${GA_ID}')`,
    );
  });

  it("loads the tag when analytics consent is granted", () => {
    consent = { analytics: true };
    const { getByTestId } = render(<GoogleAnalytics />);
    expect(getByTestId("ga-src")).toBeTruthy();
  });

  it("renders nothing and disables GA when analytics consent is declined", () => {
    consent = { analytics: false };
    const { queryByTestId } = render(<GoogleAnalytics />);
    expect(queryByTestId("ga-src")).toBeNull();
    expect(queryByTestId("ga-inline")).toBeNull();
    expect(
      (window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`],
    ).toBe(true);
  });
});
