import { describe, expect, it } from "vitest";
import { render } from "@react-email/components";
import { brandConfig } from "@/config/brand";
import { AgentBriefingConfirmEmail } from "./agent-briefing-confirm";
import { AgentBriefingWelcomeEmail } from "./agent-briefing-welcome";

const CONFIRM_URL = "https://truedeed.co.uk/api/newsletter/confirm?token=abc";
const UNSUBSCRIBE_URL = "https://truedeed.co.uk/api/newsletter/unsubscribe?token=xyz";

/**
 * Strategy requirement: briefing emails are editorial — the platform brand
 * appears in the footer only. EmailFooter mentions the display name exactly
 * twice ("{name}, {domain}" and the copyright line); any extra occurrence
 * means the brand leaked into the body.
 */
function brandMentions(html: string): number {
  return html.split(brandConfig.displayName).length - 1;
}

const FOOTER_BRAND_MENTIONS = 2;

describe("AgentBriefingConfirmEmail", () => {
  it("renders the confirm CTA and editorial coverage copy", async () => {
    const html = await render(AgentBriefingConfirmEmail({ confirmUrl: CONFIRM_URL }));

    expect(html).toContain(CONFIRM_URL);
    expect(html).toContain("Confirm my subscription");
    expect(html).toContain("The Independent Agent Briefing");
    expect(html).toContain("CAT-case updates");
    expect(html).toContain("fee benchmarks");
    expect(html).toContain("Renters&#x27; Rights Act");
  });

  it("mentions the platform brand in the footer only", async () => {
    const html = await render(AgentBriefingConfirmEmail({ confirmUrl: CONFIRM_URL }));

    expect(brandMentions(html)).toBe(FOOTER_BRAND_MENTIONS);
    // No brand-header tagline — the masthead is the briefing, not the portal.
    expect(html).not.toContain("Your trusted UK property portal");
  });
});

describe("AgentBriefingWelcomeEmail", () => {
  it("renders coverage copy and the per-audience unsubscribe link", async () => {
    const html = await render(
      AgentBriefingWelcomeEmail({ unsubscribeUrl: UNSUBSCRIBE_URL }),
    );

    expect(html).toContain("The Independent Agent Briefing");
    expect(html).toContain("CAT-case updates");
    expect(html).toContain("Fee benchmarks");
    expect(html).toContain("Renters&#x27; Rights Act");
    // Per-audience unsubscribe link (PECR requirement).
    expect(html).toContain(UNSUBSCRIBE_URL);
    expect(html).toContain("Unsubscribe");
  });

  it("mentions the platform brand in the footer only", async () => {
    const html = await render(
      AgentBriefingWelcomeEmail({ unsubscribeUrl: UNSUBSCRIBE_URL }),
    );

    expect(brandMentions(html)).toBe(FOOTER_BRAND_MENTIONS);
    expect(html).not.toContain("Your trusted UK property portal");
  });
});
