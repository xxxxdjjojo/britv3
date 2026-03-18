type Props = Readonly<{ data: Record<string, unknown> }>;

export function JsonLd({ data }: Props) {
  // Escape </script> sequences to prevent XSS when rendering inline JSON-LD.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
