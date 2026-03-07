import { describe, it, expect, vi, beforeEach } from "vitest";

// -- Mocks --------------------------------------------------------------------

const mockCallClaude = vi.fn();

vi.mock("./claude-service", () => ({
  callClaude: (...args: unknown[]) => mockCallClaude(...args),
}));

// -- Tests --------------------------------------------------------------------

describe("property-description prompt templates", () => {
  it("getDescriptionPrompt('professional') returns prompt with professional tone", async () => {
    const { getDescriptionPrompt } = await import("@/config/prompts/property-description");
    const prompt = getDescriptionPrompt("professional");

    expect(prompt).toContain("professional");
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(50);
  });

  it("getDescriptionPrompt('friendly') returns prompt with friendly tone", async () => {
    const { getDescriptionPrompt } = await import("@/config/prompts/property-description");
    const prompt = getDescriptionPrompt("friendly");

    expect(prompt).toContain("friendly");
  });

  it("getDescriptionPrompt('premium') returns prompt with premium/luxury tone", async () => {
    const { getDescriptionPrompt } = await import("@/config/prompts/property-description");
    const prompt = getDescriptionPrompt("premium");

    expect(prompt.toLowerCase()).toMatch(/premium|luxury/);
  });
});

describe("description generator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleListing = {
    propertyType: "Detached house",
    bedrooms: 3,
    bathrooms: 2,
    features: ["garden", "garage", "modern kitchen"],
    location: "Richmond, London",
    price: 750000,
    tenure: "freehold" as const,
  };

  it("calls callClaude with correct feature and formatted user message", async () => {
    mockCallClaude.mockResolvedValue({
      text: "A beautiful property...",
      inputTokens: 50,
      outputTokens: 100,
    });

    const { generatePropertyDescription } = await import("./description-generator");
    await generatePropertyDescription({
      userId: "user-1",
      listing: sampleListing,
      tone: "professional",
    });

    expect(mockCallClaude).toHaveBeenCalledOnce();
    const callArg = mockCallClaude.mock.calls[0][0];
    expect(callArg.feature).toBe("property_description");
    expect(callArg.userId).toBe("user-1");
    expect(callArg.userMessage).toContain("Detached house");
    expect(callArg.userMessage).toContain("3");
    expect(callArg.userMessage).toContain("Richmond, London");
  });

  it("returns null when callClaude returns null", async () => {
    mockCallClaude.mockResolvedValue(null);

    const { generatePropertyDescription } = await import("./description-generator");
    const result = await generatePropertyDescription({
      userId: "user-1",
      listing: sampleListing,
      tone: "friendly",
    });

    expect(result).toBeNull();
  });

  it("buildUserMessage formats property attributes into structured prompt", async () => {
    const { buildUserMessage } = await import("./description-generator");
    const message = buildUserMessage(sampleListing);

    expect(message).toContain("Detached house");
    expect(message).toContain("3");
    expect(message).toContain("2");
    expect(message).toContain("garden");
    expect(message).toContain("garage");
    expect(message).toContain("Richmond, London");
    expect(message).toContain("750,000");
    expect(message).toContain("freehold");
  });
});
