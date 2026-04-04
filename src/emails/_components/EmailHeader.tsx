import { Section, Text } from "@react-email/components";
import { BRAND_PRIMARY } from "@/emails/_constants/colors";

export function EmailHeader() {
  return (
    <Section
      style={{
        backgroundColor: BRAND_PRIMARY,
        padding: "24px 32px",
      }}
    >
      <Text
        style={{
          fontSize: "22px",
          fontWeight: "700",
          color: "#FFFFFF",
          letterSpacing: "0.5px",
          margin: "0",
          lineHeight: "1.2",
        }}
      >
        Britestate
      </Text>
      <Text
        style={{
          fontSize: "12px",
          color: "rgba(255,255,255,0.7)",
          margin: "4px 0 0 0",
          lineHeight: "1.4",
        }}
      >
        Your trusted UK property portal
      </Text>
    </Section>
  );
}
