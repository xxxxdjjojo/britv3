/**
 * Shared Supabase error handling utility.
 *
 * Accepts any error thrown by Supabase auth/postgrest calls and returns a
 * standardised, user-friendly result.  Components should call this instead
 * of showing raw `error.message` values to users.
 */

export type SupabaseErrorResult = {
  message: string;
  code: string;
  isRetryable: boolean;
};

// ---------------------------------------------------------------------------
// Friendly message map
// Keys are Supabase AuthApiError `code` values (snake_case strings) and
// well-known HTTP `message` substrings that Supabase surfaces as messages.
// ---------------------------------------------------------------------------

const AUTH_CODE_MESSAGES: Record<string, string> = {
  // Auth error codes (supabase-js v2)
  invalid_credentials: "Incorrect email or password.",
  user_not_found: "No account found with that email address.",
  email_not_confirmed: "Please verify your email before signing in.",
  user_already_exists: "An account with this email already exists.",
  email_exists: "An account with this email already exists.",
  weak_password: "Your password is too weak. Please choose a stronger one.",
  over_email_send_rate_limit:
    "Too many emails sent. Please wait a few minutes before trying again.",
  over_request_rate_limit:
    "Too many attempts. Please wait a moment and try again.",
  session_not_found: "Your session has expired. Please sign in again.",
  user_banned: "This account has been suspended. Please contact support.",
  same_password: "Your new password must be different from your current password.",
  token_expired: "This link has expired. Please request a new one.",
  otp_expired: "This code has expired. Please request a new one.",
  invite_not_found: "This invitation link is invalid or has already been used.",
};

// Supabase sometimes surfaces errors only as message strings (no structured
// code), so we also match against common substrings.
type MessagePattern = { pattern: RegExp; message: string; isRetryable: boolean };

const MESSAGE_PATTERNS: MessagePattern[] = [
  {
    pattern: /invalid login credentials/i,
    message: "Incorrect email or password.",
    isRetryable: true,
  },
  {
    pattern: /user already registered/i,
    message: "An account with this email already exists.",
    isRetryable: false,
  },
  {
    pattern: /email not confirmed/i,
    message: "Please verify your email before signing in.",
    isRetryable: false,
  },
  {
    pattern: /password should be at least/i,
    message: "Your password is too short. Please choose a longer one.",
    isRetryable: true,
  },
  {
    pattern: /rate.?limit|too many requests|429/i,
    message: "Too many attempts. Please wait a moment and try again.",
    isRetryable: true,
  },
  {
    pattern: /network|fetch|failed to fetch|load failed/i,
    message: "Network error. Please check your connection and try again.",
    isRetryable: true,
  },
];

// Auth error codes that indicate the operation can safely be retried.
const RETRYABLE_CODES = new Set([
  "over_email_send_rate_limit",
  "over_request_rate_limit",
  "network_error",
]);

const FALLBACK: SupabaseErrorResult = {
  message: "Something went wrong. Please try again.",
  code: "unknown",
  isRetryable: true,
};

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

type AuthApiErrorShape = {
  message: string;
  status?: number;
  code?: string;
  __isAuthError?: boolean;
};

type PostgrestErrorShape = {
  message: string;
  code: string;
  details?: string | null;
  hint?: string | null;
};

function isAuthApiError(err: unknown): err is AuthApiErrorShape {
  return (
    typeof err === "object" &&
    err !== null &&
    "__isAuthError" in err &&
    (err as Record<string, unknown>).__isAuthError === true
  );
}

function isPostgrestError(err: unknown): err is PostgrestErrorShape {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    "message" in err &&
    "details" in err
  );
}

// ---------------------------------------------------------------------------
// Main utility
// ---------------------------------------------------------------------------

/**
 * Convert any Supabase error value into a standardised, user-friendly result.
 *
 * @example
 * const { error: authError } = await signIn(email, password);
 * if (authError) {
 *   const { message } = handleSupabaseError(authError);
 *   setError(message);
 *   return;
 * }
 */
export function handleSupabaseError(err: unknown): SupabaseErrorResult {
  // --- AuthApiError (supabase-js v2) ---
  if (isAuthApiError(err)) {
    const code = err.code ?? "";
    const friendlyMessage = AUTH_CODE_MESSAGES[code];

    if (friendlyMessage) {
      return {
        message: friendlyMessage,
        code,
        isRetryable: RETRYABLE_CODES.has(code),
      };
    }

    // Rate-limit by HTTP status
    if (err.status === 429) {
      return {
        message: "Too many attempts. Please wait a moment and try again.",
        code: "over_request_rate_limit",
        isRetryable: true,
      };
    }

    // Fall back to pattern matching on the message string
    for (const { pattern, message, isRetryable } of MESSAGE_PATTERNS) {
      if (pattern.test(err.message)) {
        return { message, code: code || "unknown", isRetryable };
      }
    }

    // Last resort: surface the Supabase message directly (it is usually
    // already reasonably user-friendly for auth errors)
    return {
      message: err.message || FALLBACK.message,
      code: code || "unknown",
      isRetryable: false,
    };
  }

  // --- PostgrestError ---
  if (isPostgrestError(err)) {
    return {
      message: "A database error occurred. Please try again.",
      code: err.code,
      isRetryable: true,
    };
  }

  // --- Standard Error / network errors ---
  if (err instanceof TypeError) {
    return {
      message: "Network error. Please check your connection and try again.",
      code: "network_error",
      isRetryable: true,
    };
  }

  if (err instanceof Error) {
    // Pattern-match the message for known issues
    for (const { pattern, message, isRetryable } of MESSAGE_PATTERNS) {
      if (pattern.test(err.message)) {
        return { message, code: "unknown", isRetryable };
      }
    }

    return {
      message: err.message || FALLBACK.message,
      code: "unknown",
      isRetryable: false,
    };
  }

  // --- Completely unknown ---
  return FALLBACK;
}
