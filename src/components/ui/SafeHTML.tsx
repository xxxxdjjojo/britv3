import { sanitizeHtml } from "@/lib/validation/sanitize";

type SafeHTMLProps = Readonly<{
  html: string;
  className?: string;
  as?: "div" | "span" | "section" | "article";
}>;

export function SafeHTML({ html, className, as: Tag = "div" }: SafeHTMLProps) {
  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}
