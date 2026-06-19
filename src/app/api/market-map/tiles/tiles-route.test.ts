import { describe, expect, it } from "vitest";
import { decodeByteaToBuffer } from "@/services/market-map/tile-service";

// "hello world" encoded both ways (see tile-service.decodeByteaToBuffer).
const EXPECTED = Buffer.from("hello world", "utf8");
const BASE64 = "aGVsbG8gd29ybGQ=";
const HEX = "\\x68656c6c6f20776f726c64";

describe("decodeByteaToBuffer", () => {
  it("decodes a base64 string to the expected bytes", () => {
    const buf = decodeByteaToBuffer(BASE64);
    expect(buf).not.toBeNull();
    expect(buf!.equals(EXPECTED)).toBe(true);
  });

  it("decodes a \\x-prefixed hex string to the same bytes", () => {
    const buf = decodeByteaToBuffer(HEX);
    expect(buf).not.toBeNull();
    expect(buf!.equals(EXPECTED)).toBe(true);
  });

  it("decodes both encodings to identical bytes", () => {
    const fromBase64 = decodeByteaToBuffer(BASE64);
    const fromHex = decodeByteaToBuffer(HEX);
    expect(fromBase64!.equals(fromHex!)).toBe(true);
  });

  it("returns null for null", () => {
    expect(decodeByteaToBuffer(null)).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(decodeByteaToBuffer("")).toBeNull();
  });

  it("returns null for a bare \\x prefix with no payload", () => {
    expect(decodeByteaToBuffer("\\x")).toBeNull();
  });
});
