import { Section, Text, Link, Img, Hr } from "@react-email/components";
import type { WeeklyDigestEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";
import {
  BRAND_PRIMARY,
  BRAND_ACCENT,
  NEUTRAL_950,
  NEUTRAL_600,
  NEUTRAL_400,
  NEUTRAL_200,
  NEUTRAL_50,
  SUCCESS,
  WARNING,
  WARNING_LIGHT,
} from "@/emails/_constants/colors";

export function WeeklyDigestEmail({
  firstName,
  weekStarting,
  savedSearchResults,
  upcomingViewings,
  unreadMessages,
  dashboardUrl,
}: Readonly<WeeklyDigestEmailProps>) {
  const formattedWeek = new Date(weekStarting).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <EmailWrapper previewText="Your weekly property digest">
      <EmailHeader />
      <Section style={{ padding: "32px" }}>
        <Text
          style={{
            fontSize: "24px",
            fontWeight: "700",
            color: BRAND_PRIMARY,
            margin: "0 0 4px 0",
            lineHeight: "1.3",
          }}
        >
          Your Weekly Digest
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: NEUTRAL_400,
            margin: "0 0 24px 0",
            lineHeight: "1.5",
          }}
        >
          Hi {firstName} &mdash; week of {formattedWeek}
        </Text>

        {savedSearchResults.length > 0 && (
          <>
            <Text
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: NEUTRAL_950,
                margin: "0 0 16px 0",
                lineHeight: "1.4",
                borderBottom: `2px solid ${BRAND_PRIMARY}`,
                paddingBottom: "8px",
              }}
            >
              Saved Search Results
            </Text>
            {savedSearchResults.map((result, index) => (
              <div key={index} style={{ marginBottom: "16px" }}>
                <Text
                  style={{
                    fontSize: "14px",
                    color: NEUTRAL_950,
                    margin: "0 0 8px 0",
                    lineHeight: "1.5",
                  }}
                >
                  <strong>{result.searchName}</strong>:{" "}
                  <span style={{ color: SUCCESS, fontWeight: "600" }}>
                    {result.newMatches} new {result.newMatches === 1 ? "match" : "matches"}
                  </span>
                </Text>
                {result.topProperty && (
                  <div
                    style={{
                      border: `1px solid ${NEUTRAL_200}`,
                      borderRadius: "8px",
                      padding: "12px",
                      backgroundColor: NEUTRAL_50,
                      marginLeft: "16px",
                    }}
                  >
                    {result.topProperty.imageUrl && (
                      <Img
                        src={result.topProperty.imageUrl}
                        alt={result.topProperty.address}
                        style={{
                          width: "100%",
                          height: "60px",
                          objectFit: "cover",
                          borderRadius: "6px",
                          marginBottom: "8px",
                          display: "block",
                        }}
                      />
                    )}
                    <Text
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: NEUTRAL_950,
                        margin: "0 0 2px 0",
                        lineHeight: "1.4",
                      }}
                    >
                      {result.topProperty.address}
                    </Text>
                    <Text
                      style={{
                        fontSize: "13px",
                        color: NEUTRAL_600,
                        margin: "0 0 6px 0",
                        lineHeight: "1.4",
                      }}
                    >
                      &pound;{result.topProperty.price.toLocaleString("en-GB")}
                    </Text>
                    <Link
                      href={result.topProperty.listingUrl}
                      style={{
                        fontSize: "12px",
                        color: BRAND_ACCENT,
                        textDecoration: "none",
                        fontWeight: "600",
                      }}
                    >
                      View &rarr;
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {upcomingViewings.length > 0 && (
          <>
            <Hr style={{ borderColor: NEUTRAL_200, margin: "24px 0 16px 0" }} />
            <Text
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: NEUTRAL_950,
                margin: "0 0 16px 0",
                lineHeight: "1.4",
                borderBottom: `2px solid ${BRAND_PRIMARY}`,
                paddingBottom: "8px",
              }}
            >
              Upcoming Viewings
            </Text>
            {upcomingViewings.map((viewing, index) => (
              <Text
                key={index}
                style={{
                  fontSize: "14px",
                  color: NEUTRAL_950,
                  margin: "0 0 8px 0",
                  lineHeight: "1.5",
                }}
              >
                <strong>{viewing.propertyAddress}</strong> &mdash; {viewing.date} at {viewing.time}
              </Text>
            ))}
          </>
        )}

        {unreadMessages > 0 && (
          <>
            <Hr style={{ borderColor: NEUTRAL_200, margin: "24px 0 16px 0" }} />
            <Text
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: NEUTRAL_950,
                margin: "0 0 12px 0",
                lineHeight: "1.4",
                borderBottom: `2px solid ${BRAND_PRIMARY}`,
                paddingBottom: "8px",
              }}
            >
              Messages
            </Text>
            <div
              style={{
                backgroundColor: WARNING_LIGHT,
                border: `1px solid ${WARNING}`,
                borderRadius: "8px",
                padding: "12px 16px",
              }}
            >
              <Text
                style={{
                  fontSize: "14px",
                  color: "#92400E",
                  margin: "0",
                  lineHeight: "1.5",
                  fontWeight: "500",
                }}
              >
                You have{" "}
                <strong>
                  {unreadMessages} unread {unreadMessages === 1 ? "message" : "messages"}
                </strong>{" "}
                in your inbox.
              </Text>
            </div>
          </>
        )}

        <div style={{ marginTop: "32px" }}>
          <EmailButton href={dashboardUrl} variant="primary">
            Go to Dashboard
          </EmailButton>
        </div>
      </Section>
      <EmailFooter unsubscribeUrl="https://britestate.co.uk/unsubscribe?token=placeholder" />
    </EmailWrapper>
  );
}
