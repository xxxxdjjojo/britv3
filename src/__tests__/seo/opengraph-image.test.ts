import { isValidElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { brandConfig } from "@/config/brand";

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
    return textFrom(node.props.children);
  }

  return "";
}

describe("opengraph image", () => {
  it("exports TrueDeed alt text and renders the TrueDeed brand text", async () => {
    const { alt, size, default: Image } = await import("@/app/opengraph-image");

    const response = await Image() as unknown as { element: ReactNode; init: unknown };

    expect(alt).toBe(`${brandConfig.displayName} - UK Property Portal`);
    expect(textFrom(response.element)).toContain(brandConfig.displayName);
    expect(size).toEqual({ width: 1200, height: 630 });
    expect(imageResponseMock).toHaveBeenCalledWith(response.element, size);
  });
});
