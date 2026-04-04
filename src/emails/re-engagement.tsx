import { Section, Text, Link, Img } from "@react-email/components";
import type { ReEngagementEmailProps } from "@/types/email";
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
} from "@/emails/_constants/colors";

export function ReEngagementEmail({
  firstName,
  lastActiveDate,
  featuredProperties,
  loginUrl,
  unsubscribeUrl,
}: Readonly<ReEngagementEmailProps>) {
  const displayProperties = featuredProperties.slice(0, 3);

  return (
    <EmailWrapper previewText={`We've got new properties for you, ${firstName}`}>
      <EmailHeader />
      <Section style={{ padding: "32px" }}>
        <Text
          style={{
            fontSize: "26px",
            fontWeight: "700",
            color: BRAND_PRIMARY,
            margin: "0 0 12px 0",
            lineHeight: "1.3",
          }}
        >
          We Miss You, {firstName}!
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: NEUTRAL_600,
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          It&apos;s been a while since your last visit. Here are some properties we think
          you&apos;ll love:
        </Text>

        {displayProperties.map((property, index) => (
          <div
            key={index}
            style={{
              border: `1px solid ${NEUTRAL_200}`,
              borderRadius: "8px",
              overflow: "hidden",
              marginBottom: "12px",
              backgroundColor: "#FFFFFF",
            }}
          >
            {property.imageUrl && (
              <Img
                src={property.imageUrl}
                alt={property.address}
                style={{
                  width: "100%",
                  height: "80px",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            )}
            <div style={{ padding: "12px 16px" }}>
              <Text
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: NEUTRAL_950,
                  margin: "0 0 2px 0",
                  lineHeight: "1.4",
                }}
              >
                {property.address}
              </Text>
              <Text
                style={{
                  fontSize: "14px",
                  color: NEUTRAL_600,
                  margin: "0 0 8px 0",
                  lineHeight: "1.4",
                }}
              >
                &pound;{property.price.toLocaleString("en-GB")}
              </Text>
              <Link
                href={property.listingUrl}
                style={{
                  fontSize: "13px",
                  color: BRAND_ACCENT,
                  textDecoration: "none",
                  fontWeight: "600",
                }}
              >
                View Property &rarr;
              </Link>
            </div>
          </div>
        ))}

        <div style={{ marginTop: "24px" }}>
          <EmailButton href={loginUrl} variant="primary">
            Explore Britestate
          </EmailButton>
        </div>

        <Text
          style={{
            fontSize: "12px",
            color: NEUTRAL_400,
            margin: "20px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          If you no longer wish to receive these emails, you can{" "}
          <Link
            href={unsubscribeUrl}
            style={{
              color: NEUTRAL_400,
              textDecoration: "underline",
            }}
          >
            unsubscribe
          </Link>
          .
        </Text>
      </Section>
      <EmailFooter unsubscribeUrl={unsubscribeUrl} />
    </EmailWrapper>
  );
}
