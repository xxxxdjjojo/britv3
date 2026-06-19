/**
 * Shared types for the Feed Integration onboarding flow.
 * Keep in one place so all step components share the same contract.
 */

export type FeedImportReviewItem = {
  id: string;
  external_id: string;
  external_branch_id: string | null;
  status: string;
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
    status: string;
  };
};

export type FeedImportRun = {
  id: string;
  status: string;
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
