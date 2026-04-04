import { Section } from "@react-email/components";
import { BRAND_PRIMARY } from "@/emails/_constants/colors";

type Props = Readonly<{
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}>;

export function EmailButton({ href, children, variant = "primary" }: Props) {
  const primaryStyle: React.CSSProperties = {
    display: "inline-block",
    backgroundColor: BRAND_PRIMARY,
    color: "#FFFFFF",
    padding: "12px 24px",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "14px",
  };

  const secondaryStyle: React.CSSProperties = {
    display: "inline-block",
    backgroundColor: "transparent",
    color: BRAND_PRIMARY,
    border: `2px solid ${BRAND_PRIMARY}`,
    padding: "12px 24px",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "14px",
  };

  return (
    <Section>
      <a href={href} style={variant === "primary" ? primaryStyle : secondaryStyle}>
        {children}
      </a>
    </Section>
  );
}
