import { Section } from "@react-email/components";

type Props = Readonly<{
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}>;

export function EmailButton({ href, children, variant = "primary" }: Props) {
  const primaryStyle: React.CSSProperties = {
    display: "inline-block",
    backgroundColor: "#1B4D3E",
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
    color: "#1B4D3E",
    border: "2px solid #1B4D3E",
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
