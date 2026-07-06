import { Link, Section, Text } from "@react-email/components";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailFooter } from "@/emails/_components/EmailFooter";

type Props = Readonly<{
  calendarUrl?: string;
  unsubscribeUrl: string;
}>;

/**
 * Confirmation welcome for landlord_diary audience.
 * Editorial pattern: platform brand in footer only.
 * Not legal advice — the diary is an informational compliance aid.
 */
export function LandlordDiaryWelcomeEmail({ calendarUrl, unsubscribeUrl }: Props) {
  return (
    <EmailWrapper previewText="You're signed up to the Landlord Deadline Diary">
      <Section style={{ padding: "32px 0 16px" }}>
        <Text style={{ fontSize: "22px", fontWeight: "700", margin: "0 0 12px" }}>
          You&rsquo;re signed up to the Landlord Deadline Diary
        </Text>
        <Text style={{ fontSize: "15px", lineHeight: "1.6", margin: "0 0 16px" }}>
          We&rsquo;ll send you reminders at 30 days, 7 days, and 1 day before each Renters&rsquo;
          Rights Act compliance deadline — so you have time to act, not just read.
        </Text>
        <Text style={{ fontSize: "15px", lineHeight: "1.6", margin: "0 0 16px" }}>
          <strong>Not legal advice.</strong> The diary is an information service. For advice
          specific to your tenancy, consult a qualified solicitor or housing professional.
        </Text>
        {calendarUrl && (
          <Text style={{ fontSize: "15px", lineHeight: "1.6", margin: "0 0 16px" }}>
            <Link href={calendarUrl} style={{ color: "#1B4D3E" }}>
              Subscribe to the calendar feed
            </Link>{" "}
            to get deadlines in your calendar app automatically.
          </Text>
        )}
      </Section>
      <EmailFooter unsubscribeUrl={unsubscribeUrl} />
    </EmailWrapper>
  );
}
