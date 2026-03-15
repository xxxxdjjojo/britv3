// TODO: deprecated — migrate imports to src/services/admin/* domain files
// @deprecated — use src/services/admin/* directly

export {
  searchUsers,
  suspendUser,
  activateUser,
  type UserSearchResult,
} from "./admin/user-service";

export {
  getVerificationQueue,
  reviewVerification,
  type VerificationQueueItem,
} from "./admin/verification-service";

export {
  getReportedReviews,
  resolveReport,
  type ReportedReview,
} from "./admin/review-service";

// getAdminCounts is now getPlatformMetrics — alias kept for backward compat
export { getPlatformMetrics as getAdminCounts } from "./admin/analytics-service";

// Re-export AdminCounts type alias for backward compat
export type { PlatformMetrics as AdminCounts } from "./admin/analytics-service";
