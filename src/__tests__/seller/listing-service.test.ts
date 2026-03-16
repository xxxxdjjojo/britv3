// Wave 0 stub — implemented in Plan 13-02/13-05
// Covers: SELL-02 (My Listings status filter), SELL-18 (publish sets status=active)
import { describe, it } from "vitest";

describe("Listing Service", () => {
  it.todo("getSellerListings with status='active' returns only active listings");
  it.todo("getSellerListings with status='draft' returns only drafts");
  it.todo("getSellerListings returns listings with views_count, saves_count, enquiries_count");
  it.todo("publishListing sets status to active and sets published_at timestamp");
  it.todo("archiveListing sets status to archived");
  it.todo("createListing inserts with status=draft and returns the new record");
});
