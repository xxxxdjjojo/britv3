import { describe, it, expect } from "vitest";

import {
  redactPii,
  redactExternalId,
  redactFreeText,
  redactName,
  redactEmail,
} from "./redact";

// ── The redaction choke-point (PR 9) ─────────────────────────────────────────
// This is the single guarantee that no PII/secret reaches an LLM context.
// Every branch of the packet builder passes through these functions, so the
// tests here are deliberately exhaustive and adversarial.

describe("redactPii — emails", () => {
  it("removes a plain email", () => {
    expect(redactPii("contact john.doe@example.com please")).toBe("contact [email] please");
  });

  it("removes emails with plus-addressing and subdomains", () => {
    expect(redactPii("a+tag@mail.co.uk and b@sub.domain.org")).toBe("[email] and [email]");
  });

  it("removes uppercase-domain emails", () => {
    expect(redactPii("SAM@EXAMPLE.COM")).toBe("[email]");
  });
});

describe("redactPii — UK phone numbers", () => {
  it.each([
    "+44 7911 123456",
    "+447911123456",
    "07911 123456",
    "07911123456",
    "0161 496 0000",
    "(0161) 496 0000",
  ])("masks %s", (phone) => {
    const out = redactPii(`call me on ${phone} today`);
    expect(out).not.toMatch(/\d{5,}/); // no long digit run survives
    expect(out).toContain("[phone]");
  });
});

describe("redactPii — UK postcodes", () => {
  it.each(["SW1A 1AA", "M1 1AE", "EC1A1BB", "ub6 0aa", "N1 9GU"])("masks %s", (pc) => {
    const out = redactPii(`lives at ${pc} now`);
    expect(out).toBe("lives at [postcode] now");
  });
});

describe("redactExternalId — Stripe/GoCardless → prefix + last4", () => {
  it("keeps the Stripe object prefix and last 4 chars", () => {
    expect(redactExternalId("cus_AB12cd34EF")).toBe("cus_…34EF");
    expect(redactExternalId("sub_1MxABCDEFghij")).toBe("sub_…ghij");
  });

  it("handles prefixless ids by keeping only last4", () => {
    expect(redactExternalId("MD000123456789")).toBe("…6789");
  });

  it("never returns the full id", () => {
    const full = "pi_3AbCdEfGhIjKlMnO";
    expect(redactExternalId(full)).not.toContain("AbCdEfGhIjKlM");
  });
});

describe("redactPii — inline external ids", () => {
  it("masks Stripe ids inside prose to prefix + last4", () => {
    expect(redactPii("charge pi_3AbCdEfGhIjK failed")).toBe("charge pi_…hIjK failed");
  });

  it("masks GoCardless mandate/payment ids", () => {
    const out = redactPii("mandate MD000ABC123XYZ and payment PM000DEF456UVW");
    expect(out).not.toContain("MD000ABC123XYZ");
    expect(out).not.toContain("PM000DEF456UVW");
    expect(out).toContain("…3XYZ");
    expect(out).toContain("…6UVW");
  });
});

describe("redactFreeText — bodies are stripped entirely", () => {
  it("replaces the body with a length-only placeholder", () => {
    const body = "Hi, my card ending 4242 was charged twice, ref order 5589, call 07911 123456.";
    const out = redactFreeText(body);
    expect(out).toBe(`[free text redacted · ${body.length} chars]`);
    // No fragment of the original body survives.
    expect(out).not.toMatch(/\d{4}/);
    expect(out).not.toContain("card");
  });

  it("handles empty/nullish bodies", () => {
    expect(redactFreeText("")).toBe("[empty]");
    expect(redactFreeText(null)).toBe("[empty]");
    expect(redactFreeText(undefined)).toBe("[empty]");
  });
});

describe("redactName / redactEmail helpers", () => {
  it("replaces a known name field", () => {
    expect(redactName("Samantha Jones")).toBe("[name]");
    expect(redactName(null)).toBe("[none]");
  });

  it("masks an email field to a placeholder", () => {
    expect(redactEmail("sam@example.com")).toBe("[email]");
    expect(redactEmail(null)).toBe("[none]");
  });
});

describe("redactPii — combined adversarial input", () => {
  it("scrubs every PII class from one blob", () => {
    const blob =
      "Sam Jones (sam.jones@example.com, 07911 123456) at SW1A 1AA — customer cus_AB12cd34EF, mandate MD000ABC123XYZ.";
    const out = redactPii(blob);
    expect(out).not.toContain("sam.jones@example.com");
    expect(out).not.toContain("07911");
    expect(out).not.toContain("SW1A 1AA");
    expect(out).not.toContain("cus_AB12cd34EF");
    expect(out).not.toContain("MD000ABC123XYZ");
    expect(out).toContain("[email]");
    expect(out).toContain("[phone]");
    expect(out).toContain("[postcode]");
    expect(out).toContain("cus_…34EF");
  });

  it("is a no-op on clean text", () => {
    expect(redactPii("subscription is active, plan changed 3 days ago")).toBe(
      "subscription is active, plan changed 3 days ago",
    );
  });
});
