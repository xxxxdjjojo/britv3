import { describe, it, expect } from "vitest";
import { detectSpam, redactPII } from "../spam-detector";

// ---------------------------------------------------------------------------
// detectSpam
// ---------------------------------------------------------------------------

describe("detectSpam", () => {
  // --- Contact info (phones & emails) ---

  describe("has_contact_info — UK mobile (07xxx)", () => {
    it("flags a standard UK mobile number", () => {
      const result = detectSpam("Call me on 07700 900123 to discuss the job");
      expect(result.has_contact_info).toBe(true);
      expect(result.spam_score).toBeGreaterThan(0);
    });

    it("flags a compact UK mobile number without spaces", () => {
      const result = detectSpam("Ring 07911234567 any evening");
      expect(result.has_contact_info).toBe(true);
    });
  });

  describe("has_contact_info — UK London landline (020xxx)", () => {
    it("flags a 020 London number", () => {
      const result = detectSpam("Our office number is 020 7946 0958");
      expect(result.has_contact_info).toBe(true);
    });
  });

  describe("has_contact_info — international +44 format", () => {
    it("flags a +44 international number", () => {
      const result = detectSpam("Reach us at +44 7700 900456 any time");
      expect(result.has_contact_info).toBe(true);
    });

    it("flags +44 without spaces", () => {
      const result = detectSpam("Call +447911123456 for a free quote");
      expect(result.has_contact_info).toBe(true);
    });
  });

  describe("has_contact_info — email addresses", () => {
    it("flags a plain email address", () => {
      const result = detectSpam("Email me at test@example.com for details");
      expect(result.has_contact_info).toBe(true);
    });

    it("flags an email with subdomains", () => {
      const result = detectSpam("Contact support@mail.company.co.uk directly");
      expect(result.has_contact_info).toBe(true);
    });

    it("flags an email with plus-addressing", () => {
      const result = detectSpam("Use user+tag@example.org to reach me");
      expect(result.has_contact_info).toBe(true);
    });
  });

  // --- URLs ---

  describe("has_links — http/https URLs", () => {
    it("flags an http URL", () => {
      const result = detectSpam("Visit http://example.com for more info");
      expect(result.has_links).toBe(true);
    });

    it("flags an https URL", () => {
      const result = detectSpam("See https://britestate.co.uk/listings for details");
      expect(result.has_links).toBe(true);
    });
  });

  describe("has_links — www. URLs", () => {
    it("flags a www. URL without protocol", () => {
      const result = detectSpam("Check out www.example.co.uk today");
      expect(result.has_links).toBe(true);
    });
  });

  // --- Excessive caps ---

  describe("has_excessive_caps", () => {
    it("flags text where more than 50% of letters are uppercase", () => {
      // "GREAT SERVICE WOW" — all caps
      const result = detectSpam("GREAT SERVICE FANTASTIC WOW EXCELLENT");
      expect(result.has_excessive_caps).toBe(true);
    });

    it("does not flag normal mixed-case prose", () => {
      const result = detectSpam("The service was good and the team was professional.");
      expect(result.has_excessive_caps).toBe(false);
    });

    it("does not flag short text (fewer than 10 letters)", () => {
      // "OK" is only 2 letters — below the minimum threshold
      const result = detectSpam("OK");
      expect(result.has_excessive_caps).toBe(false);
    });

    it("does not flag text where caps are just sentence starts", () => {
      const result = detectSpam("The plumber arrived on time. He fixed everything quickly.");
      expect(result.has_excessive_caps).toBe(false);
    });
  });

  // --- Promotional language ---

  describe("has_promotional", () => {
    it("flags 'free'", () => {
      expect(detectSpam("Get a free estimate today").has_promotional).toBe(true);
    });

    it("flags 'discount'", () => {
      expect(detectSpam("Huge discount on all services").has_promotional).toBe(true);
    });

    it("flags 'click here'", () => {
      expect(detectSpam("Click here to learn more").has_promotional).toBe(true);
    });

    it("flags 'call now'", () => {
      expect(detectSpam("Call now and save!").has_promotional).toBe(true);
    });

    it("flags 'act now'", () => {
      expect(detectSpam("Act now before the offer expires").has_promotional).toBe(true);
    });

    it("flags 'limited offer'", () => {
      expect(detectSpam("This is a limited offer").has_promotional).toBe(true);
    });

    it("flags 'buy now'", () => {
      expect(detectSpam("Buy now and get 10% off").has_promotional).toBe(true);
    });

    it("flags 'special offer'", () => {
      expect(detectSpam("Special offer for new customers").has_promotional).toBe(true);
    });

    it("flags 'guaranteed'", () => {
      expect(detectSpam("Results guaranteed or money back").has_promotional).toBe(true);
    });

    it("flags 'no obligation'", () => {
      expect(detectSpam("Book a no obligation quote").has_promotional).toBe(true);
    });

    it("flags 'risk free'", () => {
      expect(detectSpam("Risk free trial available").has_promotional).toBe(true);
    });

    it("flags 'winner'", () => {
      expect(detectSpam("You are a winner in our draw").has_promotional).toBe(true);
    });

    it("flags 'congratulations'", () => {
      expect(detectSpam("Congratulations you have been selected").has_promotional).toBe(true);
    });

    it("flags 'earn money'", () => {
      expect(detectSpam("Earn money from home today").has_promotional).toBe(true);
    });

    it("flags 'make money'", () => {
      expect(detectSpam("Make money fast with this scheme").has_promotional).toBe(true);
    });

    it("is case-insensitive", () => {
      expect(detectSpam("GET A FREE quote NOW").has_promotional).toBe(true);
    });

    it("does not flag clean review text", () => {
      const result = detectSpam("Very happy with the work. Would use again.");
      expect(result.has_promotional).toBe(false);
    });
  });

  // --- Repeated characters ---

  describe("has_repeated_chars", () => {
    it("flags four or more consecutive identical characters", () => {
      const result = detectSpam("This was amaziiiiing work");
      expect(result.has_repeated_chars).toBe(true);
    });

    it("flags repeated exclamation marks (4+)", () => {
      const result = detectSpam("Brilliant!!!!! Highly recommend");
      expect(result.has_repeated_chars).toBe(true);
    });

    it("does not flag three consecutive identical characters", () => {
      // Three repetitions fall below the threshold of 4 (.)\1{3,} means 4+ total
      const result = detectSpam("The sss was fine");
      expect(result.has_repeated_chars).toBe(false);
    });

    it("does not flag normal prose", () => {
      const result = detectSpam("Excellent communication throughout the project.");
      expect(result.has_repeated_chars).toBe(false);
    });
  });

  // --- Excessive punctuation ---

  describe("has_excessive_punctuation", () => {
    it("flags six or more consecutive ! marks", () => {
      const result = detectSpam("Amazing!!!!!!");
      expect(result.has_excessive_punctuation).toBe(true);
    });

    it("flags six or more mixed !?. marks", () => {
      const result = detectSpam("What is going on?!?!?!");
      expect(result.has_excessive_punctuation).toBe(true);
    });

    it("does not flag five consecutive ! marks", () => {
      const result = detectSpam("Great!!!!!");
      expect(result.has_excessive_punctuation).toBe(false);
    });

    it("does not flag normal sentence-ending punctuation", () => {
      const result = detectSpam("Good work. Would recommend!");
      expect(result.has_excessive_punctuation).toBe(false);
    });
  });

  // --- Clean text (zero score) ---

  describe("clean text — zero spam score", () => {
    it("returns spam_score 0 with all indicators false for a genuine review", () => {
      const result = detectSpam(
        "The plumber arrived on time and fixed the leak quickly. Very professional and reasonably priced.",
      );
      expect(result.spam_score).toBe(0);
      expect(result.has_contact_info).toBe(false);
      expect(result.has_links).toBe(false);
      expect(result.has_excessive_caps).toBe(false);
      expect(result.has_promotional).toBe(false);
      expect(result.has_repeated_chars).toBe(false);
      expect(result.has_excessive_punctuation).toBe(false);
    });

    it("returns spam_score 0 for an empty string", () => {
      const result = detectSpam("");
      expect(result.spam_score).toBe(0);
    });
  });

  // --- spam_score integrity ---

  describe("spam_score", () => {
    it("equals the sum of all boolean indicator flags", () => {
      const result = detectSpam(
        "CALL NOW 07700 900123 visit https://spam.com FREE DISCOUNT!!!!!!!",
      );
      const expectedScore =
        (result.has_contact_info ? 1 : 0) +
        (result.has_links ? 1 : 0) +
        (result.has_excessive_caps ? 1 : 0) +
        (result.has_promotional ? 1 : 0) +
        (result.has_repeated_chars ? 1 : 0) +
        (result.has_excessive_punctuation ? 1 : 0);
      expect(result.spam_score).toBe(expectedScore);
    });

    it("is bounded between 0 and 6", () => {
      const result = detectSpam(
        "CALL NOW 07700 900123 visit https://spam.com FREE!!!!!!!aaaaaaaa",
      );
      expect(result.spam_score).toBeGreaterThanOrEqual(0);
      expect(result.spam_score).toBeLessThanOrEqual(6);
    });
  });
});

// ---------------------------------------------------------------------------
// redactPII
// ---------------------------------------------------------------------------

describe("redactPII", () => {
  describe("phone number redaction", () => {
    it("replaces a UK mobile number with [phone redacted]", () => {
      const result = redactPII("Call me on 07700 900123 please");
      expect(result).not.toContain("07700 900123");
      expect(result).toContain("[phone redacted]");
    });

    it("replaces a +44 international number", () => {
      const result = redactPII("My number is +44 7700 900456");
      expect(result).not.toContain("+44 7700 900456");
      expect(result).toContain("[phone redacted]");
    });

    it("replaces a 020 London landline", () => {
      const result = redactPII("Office: 020 7946 0958 — ask for Jane");
      expect(result).not.toContain("020 7946 0958");
      expect(result).toContain("[phone redacted]");
    });

    it("replaces multiple phone numbers in one string", () => {
      const result = redactPII("Home: 07700 900001, work: 07700 900002");
      expect(result).not.toContain("07700 900001");
      expect(result).not.toContain("07700 900002");
      // Both replaced
      expect(result.match(/\[phone redacted\]/g)?.length).toBe(2);
    });
  });

  describe("email address redaction", () => {
    it("replaces an email with [email redacted]", () => {
      const result = redactPII("Contact test@example.com for help");
      expect(result).not.toContain("test@example.com");
      expect(result).toContain("[email redacted]");
    });

    it("replaces an email regardless of case", () => {
      const result = redactPII("Send to User@Example.COM");
      expect(result).not.toContain("User@Example.COM");
      expect(result).toContain("[email redacted]");
    });

    it("replaces multiple emails in one string", () => {
      const result = redactPII("CC alice@a.com and bob@b.org on that");
      expect(result).not.toContain("alice@a.com");
      expect(result).not.toContain("bob@b.org");
      expect(result.match(/\[email redacted\]/g)?.length).toBe(2);
    });
  });

  describe("text without PII", () => {
    it("passes through unchanged when there is no PII", () => {
      const clean = "Really happy with the work done. Would highly recommend.";
      expect(redactPII(clean)).toBe(clean);
    });

    it("passes through an empty string unchanged", () => {
      expect(redactPII("")).toBe("");
    });
  });

  describe("mixed PII redaction", () => {
    it("redacts both a phone number and an email in the same string", () => {
      const result = redactPII(
        "Call 07700 900123 or email contact@example.co.uk for a quote",
      );
      expect(result).toContain("[phone redacted]");
      expect(result).toContain("[email redacted]");
      expect(result).not.toContain("07700 900123");
      expect(result).not.toContain("contact@example.co.uk");
    });
  });
});
