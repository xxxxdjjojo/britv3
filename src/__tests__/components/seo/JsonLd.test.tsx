import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { JsonLd } from "@/components/seo/JsonLd";

describe("JsonLd", () => {
  it("renders a script tag with type application/ld+json", () => {
    const { container } = render(<JsonLd data={{ "@type": "WebSite" }} />);
    const script = container.querySelector("script");
    expect(script).not.toBeNull();
    expect(script?.getAttribute("type")).toBe("application/ld+json");
  });

  it("serialises the data prop as JSON in the script content", () => {
    const data = { "@context": "https://schema.org", "@type": "WebSite", name: "Britestate" };
    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector("script");
    expect(script?.innerHTML).toBe(JSON.stringify(data));
  });

  it("handles nested objects correctly", () => {
    const data = {
      "@context": "https://schema.org",
      "@type": "Organization",
      address: {
        "@type": "PostalAddress",
        addressCountry: "GB",
        addressLocality: "London",
      },
    };
    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector("script");
    const parsed = JSON.parse(script?.innerHTML ?? "{}");
    expect(parsed.address["@type"]).toBe("PostalAddress");
    expect(parsed.address.addressCountry).toBe("GB");
  });
});
