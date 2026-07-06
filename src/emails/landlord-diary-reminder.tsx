import { Link, Section, Text } from "@react-email/components";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailFooter } from "@/emails/_components/EmailFooter";

type Props = Readonly<{
  deadlineTitle: string;
  /** Human date label, e.g. "31 July 2026". */
  deadlineDateLabel: string;
  /** Days until the deadline (30, 7, or 1). */
  daysUntil: number;
  summary: string;
  citationUrl?: string;
  calendarUrl?: string;
  unsubscribeUrl: string;
}>;

/**
 * Landlord Deadline Diary reminder (T-30 / T-7 / T-1 before a dated
 * Renters' Rights Act deadline).
 *
 * Editorial by design: the body is the deadline and what to do about it —
 * the platform brand appears in the footer only (via EmailFooter). Carries
 * the per-audience unsubscribe link required on every diary email.
 */
export function LandlordDiaryReminderEmail({
  deadlineTitle,
  deadlineDateLabel,
  daysUntil,
  summary,
  citationUrl,
  calendarUrl,
  unsubscribeUrl,
}: Props) {
  const timeframe =
    daysUntil === 1 ? "Tomorrow" : `${daysUntil} days to go`;

  return (
    <EmailWrapper previewText={`${timeframe}: ${deadlineTitle}`}>
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
          The Landlord Deadline Diary
        </Text>
      </Section>
      <Section style={{ padding: "24px 32px 32px 32px" }}>
        <Text
          style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "#8A6D1F",
            textTransform: "uppercase",
            letterSpacing: "1px",
            margin: "0 0 8px 0",
          }}
        >
          {timeframe} · {deadlineDateLabel}
        </Text>
        <Text
          style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#0A0A0B",
            margin: "0 0 12px 0",
            lineHeight: "1.3",
          }}
        >
          {deadlineTitle}
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#5E5E6A",
            margin: "0 0 24px 0",
            lineHeight: "1.7",
          }}
        >
          {summary}
        </Text>

        {citationUrl && (
          <Text
            style={{
              fontSize: "13px",
              color: "#5E5E6A",
              margin: "0 0 16px 0",
              lineHeight: "1.6",
            }}
          >
            Source:{" "}
            <Link
              href={citationUrl}
              style={{ color: "#1B4D3E", textDecoration: "underline" }}
            >
              {citationUrl}
            </Link>
          </Text>
        )}

        {calendarUrl && (
          <Text
            style={{
              fontSize: "13px",
              color: "#5E5E6A",
              margin: "0 0 16px 0",
              lineHeight: "1.6",
            }}
          >
            Every dated deadline, in your calendar:{" "}
            <Link
              href={calendarUrl}
              style={{ color: "#1B4D3E", textDecoration: "underline" }}
            >
              subscribe to the .ics feed
            </Link>
            .
          </Text>
        )}

        <Text
          style={{
            fontSize: "13px",
            color: "#9E9EAB",
            margin: "0",
            lineHeight: "1.6",
          }}
        >
          This is general information, not legal advice. Speak to a qualified
          professional about your situation. You are receiving this because
          you subscribed to the Landlord Deadline Diary —{" "}
          <Link
            href={unsubscribeUrl}
            style={{ color: "#5E5E6A", textDecoration: "underline" }}
          >
            unsubscribe
          </Link>{" "}
          any time.
        </Text>
      </Section>
      <EmailFooter unsubscribeUrl={unsubscribeUrl} />
    </EmailWrapper>
  );
}
