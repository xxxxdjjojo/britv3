import { describe, expect, it, vi } from "vitest";

import type { AlertFinding } from "./alert-rules";
import { type AlertStore, runAlertEngine } from "./alert-engine-service";

/** A sender mock whose call signature is inferred (so it types-checks as a sender). */
const makeSender = () => vi.fn((_finding: AlertFinding): Promise<void> => Promise.resolve());

/**
 * Alert-engine orchestration. A fake in-memory store + spy sender exercise the
 * open/resolve/email flow and the idempotency guarantee (email only on the
 * transition to firing).
 */

function fakeStore(openFingerprints: string[] = []): AlertStore & {
  opened: string[];
  resolved: string[];
  touched: string[];
} {
  const open = new Set(openFingerprints);
  const opened: string[] = [];
  const resolved: string[] = [];
  const touched: string[] = [];
  return {
    opened,
    resolved,
    touched,
    listOpenFingerprints: () => Promise.resolve(new Set(open)),
    openAlert: (f) => {
      opened.push(f.fingerprint);
      return Promise.resolve();
    },
    resolveAlert: (fp) => {
      resolved.push(fp);
      return Promise.resolve();
    },
    touchAlert: (fp) => {
      touched.push(fp);
      return Promise.resolve();
    },
  };
}

const finding = (fp: string): AlertFinding => ({
  ruleKey: fp,
  fingerprint: fp,
  severity: "critical",
  summary: `${fp}: 3 failed webhook event(s) awaiting attention.`,
  details: { value: 3 },
});

describe("runAlertEngine", () => {
  it("opens a new alert and emails once", async () => {
    const store = fakeStore([]);
    const sender = makeSender();
    const result = await runAlertEngine([finding("stripe_dlq_backlog")], store, sender);
    expect(store.opened).toEqual(["stripe_dlq_backlog"]);
    expect(sender).toHaveBeenCalledTimes(1);
    expect(result.opened).toBe(1);
  });

  it("is idempotent: an already-firing alert is touched, not re-opened or re-emailed", async () => {
    const store = fakeStore(["stripe_dlq_backlog"]);
    const sender = makeSender();
    const result = await runAlertEngine([finding("stripe_dlq_backlog")], store, sender);
    expect(store.opened).toEqual([]);
    expect(store.touched).toEqual(["stripe_dlq_backlog"]);
    expect(sender).not.toHaveBeenCalled();
    expect(result.firing).toBe(1);
  });

  it("resolves an alert whose condition has cleared", async () => {
    const store = fakeStore(["stripe_dlq_backlog"]);
    const sender = makeSender();
    const result = await runAlertEngine([], store, sender);
    expect(store.resolved).toEqual(["stripe_dlq_backlog"]);
    expect(result.resolved).toBe(1);
  });

  it("never passes PII to the email sender (summaries are counts only)", async () => {
    const store = fakeStore([]);
    const sender = makeSender();
    await runAlertEngine([finding("email_failures_24h")], store, sender);
    const sent = sender.mock.calls[0][0];
    expect(JSON.stringify(sent)).not.toMatch(/@/);
  });
});
