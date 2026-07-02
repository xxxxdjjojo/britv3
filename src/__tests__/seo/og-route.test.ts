import { isValidElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { buildOgProps } from "@/lib/og/og-props";

const imageResponseMock = vi.hoisted(() =>
  vi.fn(function ImageResponse(element: ReactNode, init: unknown) {
    return { element, init };
  }),
);

vi.mock("next/og", () => ({
  ImageResponse: imageResponseMock,
}));

function textFrom(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(textFrom).join(" ");
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    if (typeof node.type === "function") {
      const rendered = (node.type as (props: unknown) => ReactNode)(node.props);
      return textFrom(rendered);
    }
    return textFrom(node.props.children);
  }

  return "";
}

function search(query: Record<string, string>): URLSearchParams {
  return new URLSearchParams(query);
}

describe("buildOgProps", () => {
  it("returns null for an unknown kind", () => {
    expect(buildOgProps("banana", search({ title: "Hello" }))).toBeNull();
    expect(buildOgProps("", search({}))).toBeNull();
  });

  describe("postcode kind", () => {
    it("builds full props with formatted medians", () => {
      const props = buildOgProps(
        "postcode",
        search({
          postcode: "m1 1ae",
          area: "Manchester",
          flatMedian: "311000",
          houseMedian: "286750",
        }),
      );

      expect(props).toEqual({
        kind: "postcode",
        postcode: "M1 1AE",
        area: "Manchester",
        flatMedian: "£311,000",
        houseMedian: "£286,750",
      });
    });

    it("accepts an outward-only postcode", () => {
      const props = buildOgProps("postcode", search({ postcode: "W5" }));
      expect(props).toMatchObject({ kind: "postcode", postcode: "W5" });
    });

    it("rejects garbage postcodes", () => {
      for (const bad of ["not a postcode", "<script>", "12345", "M1 1AEX", "'; DROP TABLE--"]) {
        expect(buildOgProps("postcode", search({ postcode: bad }))).toBeNull();
      }
    });

    it("returns null when postcode is missing", () => {
      expect(buildOgProps("postcode", search({ area: "London" }))).toBeNull();
    });

    it("drops non-numeric or absurd median values instead of rendering them", () => {
      const props = buildOgProps(
        "postcode",
        search({ postcode: "SW1A 1AA", flatMedian: "cheap", houseMedian: "99999999999999" }),
      );
      expect(props).toEqual({
        kind: "postcode",
        postcode: "SW1A 1AA",
        area: undefined,
        flatMedian: undefined,
        houseMedian: undefined,
      });
    });
  });

  describe("pledge kind", () => {
    it("builds props from title", () => {
      expect(buildOgProps("pledge", search({ title: "No hidden fees" }))).toEqual({
        kind: "pledge",
        title: "No hidden fees",
      });
    });

    it("returns null without a title", () => {
      expect(buildOgProps("pledge", search({}))).toBeNull();
      expect(buildOgProps("pledge", search({ title: "   " }))).toBeNull();
    });

    it("caps title length at 120 characters", () => {
      const long = "a".repeat(300);
      const props = buildOgProps("pledge", search({ title: long }));
      expect(props?.kind).toBe("pledge");
      expect(props && "title" in props ? props.title.length : 0).toBe(120);
    });

    it("strips control characters from the title", () => {
      const props = buildOgProps("pledge", search({ title: "Hello\u0000 \u0007world\u001F" }));
      expect(props).toEqual({ kind: "pledge", title: "Hello world" });
    });
  });

  describe("briefing kind", () => {
    it("builds props with optional edition", () => {
      expect(
        buildOgProps("briefing", search({ title: "Market pulse", edition: "July 2026" })),
      ).toEqual({ kind: "briefing", title: "Market pulse", edition: "July 2026" });
    });

    it("returns null without a title", () => {
      expect(buildOgProps("briefing", search({ edition: "July 2026" }))).toBeNull();
    });
  });

  describe("tool kind", () => {
    it("builds props with optional subtitle", () => {
      expect(
        buildOgProps("tool", search({ title: "Stamp duty calculator", subtitle: "2026 rates" })),
      ).toEqual({ kind: "tool", title: "Stamp duty calculator", subtitle: "2026 rates" });
    });

    it("returns null without a title", () => {
      expect(buildOgProps("tool", search({}))).toBeNull();
    });
  });
});

describe("GET /api/og/[kind]", () => {
  it("returns 404 for an unknown kind", async () => {
    const { GET } = await import("@/app/api/og/[kind]/route");

    const response = await GET(new Request("https://truedeed.co.uk/api/og/banana"), {
      params: Promise.resolve({ kind: "banana" }),
    });

    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(404);
    expect(await (response as Response).text()).toBe("Not found");
  });

  it("returns 404 for a valid kind with invalid params", async () => {
    const { GET } = await import("@/app/api/og/[kind]/route");

    const response = await GET(
      new Request("https://truedeed.co.uk/api/og/postcode?postcode=garbage"),
      { params: Promise.resolve({ kind: "postcode" }) },
    );

    expect((response as Response).status).toBe(404);
  });

  it("renders the postcode card with cache headers", async () => {
    const { GET } = await import("@/app/api/og/[kind]/route");
    imageResponseMock.mockClear();

    const response = await GET(
      new Request(
        "https://truedeed.co.uk/api/og/postcode?postcode=m1+1ae&area=Manchester&flatMedian=311000",
      ),
      { params: Promise.resolve({ kind: "postcode" }) },
    ) as unknown as { element: ReactNode; init: { width: number; height: number; headers: Record<string, string> } };

    expect(imageResponseMock).toHaveBeenCalledTimes(1);
    expect(response.init.width).toBe(1200);
    expect(response.init.height).toBe(630);
    expect(response.init.headers["Cache-Control"]).toBe(
      "public, s-maxage=86400, stale-while-revalidate=604800",
    );

    const text = textFrom(response.element);
    expect(text).toContain("Median sold price in M1 1AE");
    expect(text).toContain("Manchester");
    expect(text).toContain("£311,000");
    expect(text).toContain("HM Land Registry");
    expect(text).toContain("TrueDeed");
  });

  it("renders the briefing card with its kicker", async () => {
    const { GET } = await import("@/app/api/og/[kind]/route");

    const response = await GET(
      new Request("https://truedeed.co.uk/api/og/briefing?title=Market+pulse&edition=July+2026"),
      { params: Promise.resolve({ kind: "briefing" }) },
    ) as unknown as { element: ReactNode };

    const text = textFrom(response.element);
    expect(text).toContain("Independent Agent Briefing");
    expect(text).toContain("Market pulse");
    expect(text).toContain("July 2026");
    expect(text).toContain("truedeed.co.uk");
  });
});
