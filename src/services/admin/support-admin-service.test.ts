import { describe, expect, it } from "vitest";

import { statusAfterAdminReply } from "./support-admin-service";

describe("statusAfterAdminReply", () => {
  it("moves an open/pending ticket to awaiting-customer on a public reply", () => {
    expect(statusAfterAdminReply("open", false)).toBe("pending_customer");
    expect(statusAfterAdminReply("pending_internal", false)).toBe("pending_customer");
  });

  it("leaves status unchanged for an internal note", () => {
    expect(statusAfterAdminReply("open", true)).toBe("open");
    expect(statusAfterAdminReply("pending_internal", true)).toBe("pending_internal");
  });

  it("never re-opens a resolved or closed ticket", () => {
    expect(statusAfterAdminReply("resolved", false)).toBe("resolved");
    expect(statusAfterAdminReply("closed", false)).toBe("closed");
  });
});
