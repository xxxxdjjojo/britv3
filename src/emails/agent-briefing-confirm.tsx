import { Section, Text } from "@react-email/components";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";

type Props = Readonly<{
  confirmUrl: string;
}>;

/**
 * Double-opt-in confirmation for the Independent Agent Briefing.
 *
 * Editorial by design: the body is about what the briefing covers — the
 * platform brand appears in the footer only (via EmailFooter).
 */
export function AgentBriefingConfirmEmail({ confirmUrl }: Props) {
  return (
    <EmailWrapper previewText="Confirm your subscription to the Independent Agent Briefing">
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
          Confirm your subscription
        </Text>
        <Text
          style={{
            fontSize: "16px",
            color: "#5E5E6A",
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          You asked to receive the Independent Agent Briefing — a weekly email
          for independent estate and letting agents. One click and you&apos;re
          in.
        </Text>

        <div
          style={{
            backgroundColor: "#F8F8FA",
            border: "1px solid #E2E2E8",
            borderRadius: "12px",
            padding: "24px",
            margin: "0 0 28px 0",
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
            Every week, in one email
          </Text>
          <Text
            style={{
              fontSize: "14px",
              color: "#5E5E6A",
              margin: "0",
              lineHeight: "1.7",
            }}
          >
            The latest CAT-case updates and what they mean for your branch, fee
            benchmarks so you know where your market sits, and plain-English
            Renters&apos; Rights Act compliance notes for independent agents.
            No sales pitch — just the briefing.
          </Text>
        </div>

        <EmailButton href={confirmUrl} variant="primary">
          Confirm my subscription
        </EmailButton>

        <Text
          style={{
            fontSize: "13px",
            color: "#9E9EAB",
            margin: "24px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          Didn&apos;t request this? You can safely ignore this email — nothing
          will be sent unless you confirm. The link expires in 7 days.
        </Text>
      </Section>
      <EmailFooter />
    </EmailWrapper>
  );
}
