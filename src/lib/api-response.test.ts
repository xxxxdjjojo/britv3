import { describe, it, expect } from "vitest";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiNotFound,
  apiValidationError,
} from "./api-response";

describe("apiSuccess", () => {
  it("returns 200 JSON response with data", async () => {
    const res = apiSuccess({ id: "123", name: "Test" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ id: "123", name: "Test" });
  });

  it("accepts custom status code", async () => {
    const res = apiSuccess({ created: true }, 201);
    expect(res.status).toBe(201);
  });
});

describe("apiError", () => {
  it("returns structured error with code and message", async () => {
    const res = apiError("Something broke", "INTERNAL_ERROR", 500);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "Something broke",
      },
    });
  });
});

describe("apiUnauthorized", () => {
  it("returns 401 with UNAUTHORIZED code", async () => {
    const res = apiUnauthorized();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});

describe("apiNotFound", () => {
  it("returns 404 with NOT_FOUND code", async () => {
    const res = apiNotFound("Listing");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.message).toBe("Listing not found");
  });
});

describe("apiValidationError", () => {
  it("returns 400 with field errors", async () => {
    const res = apiValidationError({ email: "Required" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.fields).toEqual({ email: "Required" });
  });
});
