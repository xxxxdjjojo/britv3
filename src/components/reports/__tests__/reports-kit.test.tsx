import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}));

import { EditionSwitcher } from "../EditionSwitcher";
import { EmbargoGate } from "../EmbargoGate";
import { ReportShell } from "../ReportShell";
import { ReportStatRow } from "../ReportStatRow";
import { signEmbargoToken } from "@/lib/reports/embargo-token";

const SHELL_PROPS = {
  eyebrow: "TrueDeed data report",
  title: "The Renters' Rights Gap 2026",
  strapline: "Where the law and the lived rental market diverge.",
  heroStat: {
    label: "Median illegal rent-rise attempt",
    value: "+14.2%",
    caption: "Across 4,100 tracked tenancies.",
  },
  methodology: {
    sources: [
      { label: "ONS Private Rent Index", url: "https://www.ons.gov.uk/rent-index" },
    ],
    caveats: ["Sample excludes Northern Ireland."],
    methodologyHref: "/reports/renters-rights-gap/methodology",
  },
  shareTitle: "The Renters' Rights Gap 2026",
  shareToolKey: "report-renters-rights-gap",
} as const;

describe("ReportShell", () => {
  it("renders hero, headline stat, children, share bar, and methodology footer", () => {
    render(
      <ReportShell {...SHELL_PROPS}>
        <p>Report body block</p>
      </ReportShell>,
    );

    expect(screen.getByText(SHELL_PROPS.eyebrow)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: SHELL_PROPS.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(SHELL_PROPS.strapline)).toBeInTheDocument();

    // Hero stat
    expect(screen.getByText(SHELL_PROPS.heroStat.label)).toBeInTheDocument();
    expect(screen.getByText(SHELL_PROPS.heroStat.value)).toBeInTheDocument();
    expect(screen.getByText(SHELL_PROPS.heroStat.caption)).toBeInTheDocument();

    // Children
    expect(screen.getByText("Report body block")).toBeInTheDocument();

    // Trust kit: share row + methodology footer
    expect(
      screen.getByRole("group", { name: /share this/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "ONS Private Rent Index" }),
    ).toHaveAttribute("href", SHELL_PROPS.methodology.sources[0].url);
    expect(
      screen.getByText("Sample excludes Northern Ireland."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /read the full methodology/i }),
    ).toHaveAttribute("href", SHELL_PROPS.methodology.methodologyHref);
  });

  it("omits the hero stat block when none is given", () => {
    render(
      <ReportShell {...SHELL_PROPS} heroStat={undefined}>
        <p>Body</p>
      </ReportShell>,
    );
    expect(screen.queryByText(SHELL_PROPS.heroStat.value)).not.toBeInTheDocument();
  });
});

describe("EditionSwitcher", () => {
  const EDITIONS = [
    { id: "2026-q2", label: "Q2 2026", href: "/reports/gap/2026-q2", current: false },
    { id: "2026-q3", label: "Q3 2026", href: "/reports/gap/2026-q3", current: true },
  ] as const;

  it("renders every edition as a link and marks the current one", () => {
    render(<EditionSwitcher editions={EDITIONS} />);

    const nav = screen.getByRole("navigation", { name: /report editions/i });
    expect(nav).toBeInTheDocument();

    const previous = screen.getByRole("link", { name: "Q2 2026" });
    expect(previous).toHaveAttribute("href", "/reports/gap/2026-q2");
    expect(previous).not.toHaveAttribute("aria-current");

    const current = screen.getByRole("link", { name: "Q3 2026" });
    expect(current).toHaveAttribute("href", "/reports/gap/2026-q3");
    expect(current).toHaveAttribute("aria-current", "page");
  });
});

describe("EmbargoGate", () => {
  const TEST_SECRET = "embargo-gate-test-secret";
  const REPORT_KEY = "renters-rights-gap";
  const EDITION = "2026-q3";
  const GATE_COPY = "This edition is not yet published.";
  const BANNER_COPY = "Embargoed preview — do not share";
  const CONTENT = "Secret embargoed findings";

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function renderGate(overrides: {
    published: boolean;
    previewToken?: string;
  }) {
    return render(
      <EmbargoGate
        published={overrides.published}
        reportKey={REPORT_KEY}
        edition={EDITION}
        previewToken={overrides.previewToken}
      >
        <p>{CONTENT}</p>
      </EmbargoGate>,
    );
  }

  it("renders children when published (no banner)", () => {
    renderGate({ published: true });
    expect(screen.getByText(CONTENT)).toBeInTheDocument();
    expect(screen.queryByText(BANNER_COPY)).not.toBeInTheDocument();
  });

  it("renders the gate panel and NOT children when unpublished without a token", () => {
    vi.stubEnv("QUOTE_SIGNING_SECRET", TEST_SECRET);
    renderGate({ published: false });
    expect(screen.getByText(GATE_COPY)).toBeInTheDocument();
    expect(screen.queryByText(CONTENT)).not.toBeInTheDocument();
  });

  it("renders children plus the preview banner for a valid embargo token", () => {
    vi.stubEnv("QUOTE_SIGNING_SECRET", TEST_SECRET);
    const token = signEmbargoToken(REPORT_KEY, EDITION, TEST_SECRET);
    renderGate({ published: false, previewToken: token });
    expect(screen.getByText(CONTENT)).toBeInTheDocument();
    expect(screen.getByText(BANNER_COPY)).toBeInTheDocument();
  });

  it("gates an invalid token", () => {
    vi.stubEnv("QUOTE_SIGNING_SECRET", TEST_SECRET);
    renderGate({ published: false, previewToken: "aa.bb.deadbeef" });
    expect(screen.getByText(GATE_COPY)).toBeInTheDocument();
    expect(screen.queryByText(CONTENT)).not.toBeInTheDocument();
  });

  it("gates a token signed for a different edition", () => {
    vi.stubEnv("QUOTE_SIGNING_SECRET", TEST_SECRET);
    const token = signEmbargoToken(REPORT_KEY, "2027-q1", TEST_SECRET);
    renderGate({ published: false, previewToken: token });
    expect(screen.getByText(GATE_COPY)).toBeInTheDocument();
    expect(screen.queryByText(CONTENT)).not.toBeInTheDocument();
  });
});

describe("ReportStatRow", () => {
  it("renders labelled stats with captions and sourced figures", () => {
    render(
      <ReportStatRow
        stats={[
          {
            label: "Tenancies tracked",
            value: "4,100",
            caption: "England and Wales",
            source: { label: "EHS", url: "https://www.gov.uk/ehs" },
          },
          { label: "Median gap", value: "£214/mo" },
        ]}
      />,
    );

    expect(screen.getByText("Tenancies tracked")).toBeInTheDocument();
    expect(screen.getByText("4,100")).toBeInTheDocument();
    expect(screen.getByText("England and Wales")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "EHS" })).toHaveAttribute(
      "href",
      "https://www.gov.uk/ehs",
    );
    expect(screen.getByText("£214/mo")).toBeInTheDocument();
  });
});
