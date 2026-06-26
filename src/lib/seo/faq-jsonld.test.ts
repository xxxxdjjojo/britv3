import { describe, expect, it } from "vitest";
import { faqJsonLd } from "./faq-jsonld";

describe("faqJsonLd", () => {
  const items = [
    { question: "What is a median price?", answer: "The middle sale price." },
    { question: "Where is the data from?", answer: "HM Land Registry." },
  ];

  it("emits a FAQPage with one Question per item", () => {
    const ld = faqJsonLd(items);
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity).toHaveLength(2);
  });

  it("maps each item to a Question with an accepted Answer", () => {
    const ld = faqJsonLd(items);
    const first = ld.mainEntity[0]!;
    expect(first["@type"]).toBe("Question");
    expect(first.name).toBe("What is a median price?");
    expect(first.acceptedAnswer["@type"]).toBe("Answer");
    expect(first.acceptedAnswer.text).toBe("The middle sale price.");
  });

  it("handles an empty list", () => {
    expect(faqJsonLd([]).mainEntity).toEqual([]);
  });
});
