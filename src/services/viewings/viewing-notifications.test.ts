import { describe, it, expect, vi, beforeEach } from "vitest";

// --- mocks -----------------------------------------------------------------

const { mockCreateAdminClient, emailMocks } = vi.hoisted(() => ({
  mockCreateAdminClient: vi.fn(),
  emailMocks: {
    sendViewingConfirmation: vi.fn(),
    sendViewingBookedHostEmail: vi.fn(),
    sendViewingRequestHostEmail: vi.fn(),
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mockCreateAdminClient,
}));

vi.mock("@/services/email/email-service", () => emailMocks);

import { sendViewingBookedEmails, sendViewingRequestEmails } from "./viewing-notifications";

// --- fixtures --------------------------------------------------------------

const HOST_ID = "33333333-3333-3333-3333-333333333333";
const BOOKER_ID = "53d5b30f-8019-4324-b3f0-3b3bc02295a7";
const LISTING_ID = "bbbbbbbb-0006-0006-0006-bbbbbbbbbbbb";
const PROPERTY_ID = "cccccccc-0006-0006-0006-cccccccccccc";
const SLOT_ID = "a5156744-782c-4b28-8a92-b7389f1774d0";
const VIEWING_ID = "6daad3ed-57a1-4987-8fb7-0b3c8b41add8";

type Row = Record<string, unknown> | null;

/**
 * Build a fake admin client. `tables` maps table name -> the row `.single()`
 * resolves; `users` maps id -> email for auth.admin.getUserById.
 */
function makeAdmin(opts: {
  tables: Record<string, Row>;
  users: Record<string, { email: string } | null>;
}) {
  const from = vi.fn((table: string) => {
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      single: vi.fn(async () => ({ data: opts.tables[table] ?? null, error: null })),
    };
    return builder;
  });
  return {
    from,
    auth: {
      admin: {
        getUserById: vi.fn(async (id: string) => ({
          data: { user: opts.users[id] ? { id, email: opts.users[id]!.email } : null },
          error: null,
        })),
      },
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// --- tests -----------------------------------------------------------------

describe("sendViewingBookedEmails", () => {
  it("emails the booker (confirmation) and the host", async () => {
    mockCreateAdminClient.mockReturnValue(
      makeAdmin({
        tables: {
          listings: { property_id: PROPERTY_ID, user_id: HOST_ID },
          properties: { address_line1: "12 Oak Road", city: "Ealing", postcode: "W5 2AB" },
          viewing_slots: { start_time: "2027-03-29T10:00:00Z" },
          profiles: { display_name: "Sam Buyer" },
        },
        users: {
          [BOOKER_ID]: { email: "buyer@example.com" },
          [HOST_ID]: { email: "host@example.com" },
        },
      }),
    );

    await sendViewingBookedEmails({
      viewingId: VIEWING_ID,
      slotId: SLOT_ID,
      listingId: LISTING_ID,
      bookerId: BOOKER_ID,
    });

    expect(emailMocks.sendViewingConfirmation).toHaveBeenCalledTimes(1);
    const bookerArgs = emailMocks.sendViewingConfirmation.mock.calls[0][0];
    expect(bookerArgs.userId).toBe(BOOKER_ID);
    expect(bookerArgs.email).toBe("buyer@example.com");
    expect(bookerArgs.propertyAddress).toContain("12 Oak Road");

    expect(emailMocks.sendViewingBookedHostEmail).toHaveBeenCalledTimes(1);
    const hostArgs = emailMocks.sendViewingBookedHostEmail.mock.calls[0][0];
    expect(hostArgs.userId).toBe(HOST_ID);
    expect(hostArgs.email).toBe("host@example.com");
    expect(hostArgs.propertyAddress).toContain("12 Oak Road");
  });

  it("skips the host email when the host is also the booker", async () => {
    mockCreateAdminClient.mockReturnValue(
      makeAdmin({
        tables: {
          listings: { property_id: PROPERTY_ID, user_id: BOOKER_ID },
          properties: { address_line1: "1 Self St", city: "Ealing", postcode: "W5 1AA" },
          viewing_slots: { start_time: "2027-03-29T10:00:00Z" },
          profiles: { display_name: "Self" },
        },
        users: { [BOOKER_ID]: { email: "self@example.com" } },
      }),
    );

    await sendViewingBookedEmails({
      viewingId: VIEWING_ID,
      slotId: SLOT_ID,
      listingId: LISTING_ID,
      bookerId: BOOKER_ID,
    });

    expect(emailMocks.sendViewingBookedHostEmail).not.toHaveBeenCalled();
  });

  it("never throws when a lookup fails", async () => {
    mockCreateAdminClient.mockReturnValue(
      makeAdmin({ tables: { listings: null }, users: {} }),
    );

    await expect(
      sendViewingBookedEmails({
        viewingId: VIEWING_ID,
        slotId: SLOT_ID,
        listingId: LISTING_ID,
        bookerId: BOOKER_ID,
      }),
    ).resolves.toBeUndefined();

    expect(emailMocks.sendViewingConfirmation).not.toHaveBeenCalled();
  });
});

describe("sendViewingRequestEmails", () => {
  it("emails the host about a new request", async () => {
    mockCreateAdminClient.mockReturnValue(
      makeAdmin({
        tables: {
          listings: { property_id: PROPERTY_ID, user_id: HOST_ID },
          properties: { address_line1: "9 Elm Ave", city: "Acton", postcode: "W3 6QT" },
        },
        users: { [HOST_ID]: { email: "host@example.com" } },
      }),
    );

    await sendViewingRequestEmails({
      viewingId: VIEWING_ID,
      listingId: LISTING_ID,
      requesterId: BOOKER_ID,
      preferredTime: "2027-04-02T14:00:00Z",
    });

    expect(emailMocks.sendViewingRequestHostEmail).toHaveBeenCalledTimes(1);
    const args = emailMocks.sendViewingRequestHostEmail.mock.calls[0][0];
    expect(args.userId).toBe(HOST_ID);
    expect(args.email).toBe("host@example.com");
    expect(args.propertyAddress).toContain("9 Elm Ave");
  });
});
