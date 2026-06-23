/**
 * Shared types for the Feed Integration onboarding flow.
 * Keep in one place so all step components share the same contract.
 */

/** Status of a single import item after processing. */
export type ItemStatus = "eligible" | "approved" | "withdrawn" | "error";

/** Status of an import run. */
export type RunStatus = "pending" | "running" | "completed" | "failed";

/** Status of a published listing slot. */
export type ListingStatus = "active" | "withdrawn" | "error";

export type FeedImportReviewItem = {
  id: string;
  external_id: string;
  external_branch_id: string | null;
  status: ItemStatus;
  validation_errors: string[];
  listing: {
    title: string;
    address_line1: string;
    city: string;
    postcode: string;
    price: number;
    listing_type: string;
    planning_permission_status: string | null;
    media: { url: string }[];
    latitude: number | null;
    longitude: number | null;
    status: ListingStatus;
  };
};

export type FeedImportRun = {
  id: string;
  status: RunStatus;
  total_items: number;
  eligible_items: number;
  error_items: number;
  published_items: number;
};

export type FeedImportReview = {
  run: FeedImportRun;
  items: FeedImportReviewItem[];
};

export type PublishResult = {
  published_count: number;
  review: FeedImportReview;
};
