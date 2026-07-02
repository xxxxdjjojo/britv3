import { describe, it, expect, beforeEach } from "vitest";
import {
  captureFirstTouch,
  getSignupSource,
} from "@/lib/analytics/signup-attribution";

const FIRST_TOUCH_KEY = "truedeed_first_touch";

function setUrl(url: string) {
  const w = window as unknown as {
    happyDOM?: { setURL: (u: string) => void };
  };
  if (w.happyDOM?.setURL) {
    w.happyDOM.setURL(url);
  } else {
    window.location.href = url;
  }
}

function setReferrer(referrer: string) {
  Object.defineProperty(document, "referrer", {
    value: referrer,
    configurable: true,
  });
}

function storedFirstTouch(): Record<string, unknown> {
  return JSON.parse(window.localStorage.getItem(FIRST_TOUCH_KEY) ?? "{}");
}

describe("captureFirstTouch", () => {
  beforeEach(() => {
    window.localStorage.clear();
    setReferrer("");
  });

  it("stores utm params, referrer, landing path, and a captured_at timestamp on first visit", () => {
    setUrl("http://localhost:3000/pledges?utm_source=google&utm_medium=cpc&utm_campaign=launch");
    setReferrer("https://www.google.com/");

    captureFirstTouch();

    const stored = storedFirstTouch();
    expect(stored.utm_source).toBe("google");
    expect(stored.utm_medium).toBe("cpc");
    expect(stored.utm_campaign).toBe("launch");
    expect(stored.referrer).toBe("https://www.google.com/");
    expect(stored.landing_path).toBe("/pledges");
    expect(typeof stored.captured_at).toBe("string");
  });

  it("stores nulls for absent utm params and referrer", () => {
    setUrl("http://localhost:3000/tools/rent-checker");

    captureFirstTouch();

    const stored = storedFirstTouch();
    expect(stored.utm_source).toBeNull();
    expect(stored.utm_medium).toBeNull();
    expect(stored.utm_campaign).toBeNull();
    expect(stored.referrer).toBeNull();
    expect(stored.landing_path).toBe("/tools/rent-checker");
  });

  it("is idempotent — a second visit never overwrites the first touch", () => {
    setUrl("http://localhost:3000/pledges?utm_source=google&utm_medium=cpc");
    captureFirstTouch();

    setUrl("http://localhost:3000/other?utm_source=facebook&utm_medium=social");
    captureFirstTouch();

    const stored = storedFirstTouch();
    expect(stored.utm_source).toBe("google");
    expect(stored.landing_path).toBe("/pledges");
  });
});

describe("getSignupSource", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns null when no first touch is stored", () => {
    expect(getSignupSource()).toBeNull();
  });

  it("derives utm:<source>/<medium> when utm params were captured", () => {
    window.localStorage.setItem(
      FIRST_TOUCH_KEY,
      JSON.stringify({
        utm_source: "google",
        utm_medium: "cpc",
        utm_campaign: "launch",
        referrer: "https://www.google.com/",
        landing_path: "/pledges",
        captured_at: "2026-07-02T00:00:00.000Z",
      }),
    );

    expect(getSignupSource()).toBe("utm:google/cpc");
  });

  it("derives ref:<host> from an external referrer when no utm params exist", () => {
    window.localStorage.setItem(
      FIRST_TOUCH_KEY,
      JSON.stringify({
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
        referrer: "https://reddit.com/r/HousingUK",
        landing_path: "/tools/rent-checker",
        captured_at: "2026-07-02T00:00:00.000Z",
      }),
    );

    expect(getSignupSource()).toBe("ref:reddit.com");
  });

  it("derives direct:<landing_path> when there is no utm and no external referrer", () => {
    window.localStorage.setItem(
      FIRST_TOUCH_KEY,
      JSON.stringify({
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
        referrer: null,
        landing_path: "/pledges",
        captured_at: "2026-07-02T00:00:00.000Z",
      }),
    );

    expect(getSignupSource()).toBe("direct:/pledges");
  });

  it("returns null when the stored value is corrupt JSON", () => {
    window.localStorage.setItem(FIRST_TOUCH_KEY, "{not json");

    expect(getSignupSource()).toBeNull();
  });
});
