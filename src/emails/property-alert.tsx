import { Section, Text, Link, Img } from "@react-email/components";
import type { PropertyAlertEmailProps } from "@/types/email";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";

export function PropertyAlertEmail({
  firstName,
  searchName,
  matchingProperties,
  manageAlertsUrl,
}: Readonly<PropertyAlertEmailProps>) {
  const displayProperties = matchingProperties.slice(0, 5);
  const count = matchingProperties.length;

  return (
    <EmailWrapper previewText={`${count} new properties matching '${searchName}'`}>
      <EmailHeader />
      <Section style={{ padding: "32px" }}>
        <Text
          style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#1B4D3E",
            margin: "0 0 8px 0",
            lineHeight: "1.3",
          }}
        >
          New Properties Matching Your Search
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#5E5E6A",
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Hi {firstName},{" "}
          <strong>
            {count} new {count === 1 ? "property" : "properties"}
          </strong>{" "}
          match &apos;{searchName}&apos;
        </Text>

        {displayProperties.map((property) => (
          <div
            key={property.id}
            style={{
              border: "1px solid #E2E2E8",
              borderRadius: "8px",
              padding: "16px",
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
                  height: "60px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  marginBottom: "12px",
                  display: "block",
                }}
              />
            )}
            <Text
              style={{
                fontSize: "15px",
                fontWeight: "600",
                color: "#0A0A0B",
                margin: "0 0 4px 0",
                lineHeight: "1.4",
              }}
            >
              {property.address}
            </Text>
            <Text
              style={{
                fontSize: "14px",
                color: "#5E5E6A",
                margin: "0 0 8px 0",
                lineHeight: "1.5",
              }}
            >
              £{property.price.toLocaleString("en-GB")} &middot; {property.bedrooms}{" "}
              {property.bedrooms === 1 ? "bedroom" : "bedrooms"}
            </Text>
            <Link
              href={property.listingUrl}
              style={{
                fontSize: "13px",
                color: "#2563EB",
                textDecoration: "none",
                fontWeight: "600",
              }}
            >
              View Property &rarr;
            </Link>
          </div>
        ))}

        <div style={{ marginTop: "24px" }}>
          <EmailButton href={manageAlertsUrl} variant="secondary">
            Manage My Alerts
          </EmailButton>
        </div>
      </Section>
      <EmailFooter />
    </EmailWrapper>
  );
}
