import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { brandConfig } from "@/config/brand";

const serwistMocks = vi.hoisted(() => ({
  addEventListeners: vi.fn(),
  CacheFirst: vi.fn(function CacheFirst(options: unknown) {
    return { type: "CacheFirst", options };
  }),
  ExpirationPlugin: vi.fn(function ExpirationPlugin(options: unknown) {
    return { type: "ExpirationPlugin", options };
  }),
  NetworkFirst: vi.fn(function NetworkFirst(options: unknown) {
    return { type: "NetworkFirst", options };
  }),
  Serwist: vi.fn(function Serwist() {
    return { addEventListeners: serwistMocks.addEventListeners };
  }),
}));

vi.mock("@serwist/next/worker", () => ({
  defaultCache: [],
}));

vi.mock("serwist", () => ({
  CacheFirst: serwistMocks.CacheFirst,
  ExpirationPlugin: serwistMocks.ExpirationPlugin,
  NetworkFirst: serwistMocks.NetworkFirst,
  Serwist: serwistMocks.Serwist,
}));

describe("service worker notifications", () => {
  let listeners: Map<string, EventListener>;
  let showNotification: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    listeners = new Map();
    showNotification = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(globalThis.self, "addEventListener").mockImplementation((type, listener) => {
      listeners.set(type, listener as EventListener);
    });

    Object.defineProperty(globalThis.self, "__SW_MANIFEST", {
      configurable: true,
      value: [],
    });

    Object.defineProperty(globalThis.self, "registration", {
      configurable: true,
      value: { showNotification },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses the TrueDeed brand name when a push payload has no title", async () => {
    await import("@/app/sw");

    const pushListener = listeners.get("push");
    expect(pushListener).toBeDefined();

    const waitUntil = vi.fn((promise: Promise<unknown>) => promise);
    pushListener?.({
      data: { json: () => ({ body: "Viewing reminder" }) },
      waitUntil,
    } as unknown as Event);

    await waitUntil.mock.results[0]?.value;

    expect(showNotification).toHaveBeenCalledWith(
      brandConfig.displayName,
      expect.objectContaining({ body: "Viewing reminder" }),
    );
  });

  it("keeps the generated public worker fallback title source-compatible", () => {
    const publicWorker = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");

    expect(publicWorker).toContain(`title??"${brandConfig.displayName}"`);
    expect(publicWorker).not.toContain('title??"Britestate"');
  });
});
