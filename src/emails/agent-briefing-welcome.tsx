import { Section, Text } from "@react-email/components";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailFooter } from "@/emails/_components/EmailFooter";

type Props = Readonly<{
  unsubscribeUrl: string;
}>;

/**
 * Welcome email sent once a subscriber confirms the Independent Agent
 * Briefing.
 *
 * Editorial by design: the body is about what the briefing covers — the
 * platform brand appears in the footer only (via EmailFooter). Carries the
 * per-audience unsubscribe link required on every briefing email.
 */
export function AgentBriefingWelcomeEmail({ unsubscribeUrl }: Props) {
  return (
    <EmailWrapper previewText="You're subscribed to the Independent Agent Briefing">
      <Section
        style={{
          padding: "32px 32px 0 32px",
          borderTop: "4px solid #1B4D3E",
        }}
      >
        <Text
          style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "#1B4D3E",
            textTransform: "uppercase",
            letterSpacing: "2px",
            margin: "0",
          }}
        >
          The Independent Agent Briefing
        </Text>
      </Section>
      <Section style={{ padding: "24px 32px 32px 32px" }}>
        <Text
          style={{
            fontSize: "26px",
            fontWeight: "700",
            color: "#0A0A0B",
            margin: "0 0 12px 0",
            lineHeight: "1.3",
          }}
        >
          You&apos;re on the list
        </Text>
        <Text
          style={{
            fontSize: "16px",
            color: "#5E5E6A",
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Your subscription is confirmed. The next issue of the Independent
          Agent Briefing will land in this inbox — one email a week, written
          for independent estate and letting agents.
        </Text>

        <div
          style={{
            backgroundColor: "#F8F8FA",
            border: "1px solid #E2E2E8",
            borderRadius: "12px",
            padding: "24px",
            margin: "0 0 24px 0",
          }}
        >
          <Text
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "#1B4D3E",
              margin: "0 0 8px 0",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            What each issue covers
          </Text>
          <Text
            style={{
              fontSize: "14px",
              color: "#5E5E6A",
              margin: "0 0 10px 0",
              lineHeight: "1.7",
            }}
          >
            <strong>CAT-case updates</strong> — the week&apos;s material
            competition and consumer-protection developments, and what they
            change for your branch.
          </Text>
          <Text
            style={{
              fontSize: "14px",
              color: "#5E5E6A",
              margin: "0 0 10px 0",
              lineHeight: "1.7",
            }}
          >
            <strong>Fee benchmarks</strong> — where sales and lettings fees are
            moving, so you can position yours with evidence.
          </Text>
          <Text
            style={{
              fontSize: "14px",
              color: "#5E5E6A",
              margin: "0",
              lineHeight: "1.7",
            }}
          >
            <strong>Renters&apos; Rights Act compliance</strong> — plain-English
            notes on what independent agents need to have in place, and by
            when.
          </Text>
        </div>

        <Text
          style={{
            fontSize: "14px",
            color: "#5E5E6A",
            margin: "0",
            lineHeight: "1.6",
          }}
        >
          Nothing else lands between issues. If it stops being useful, the
          unsubscribe link is at the bottom of every email.
        </Text>
      </Section>
      <EmailFooter unsubscribeUrl={unsubscribeUrl} />
    </EmailWrapper>
  );
}
