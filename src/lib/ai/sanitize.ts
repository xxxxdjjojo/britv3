/**
 * Sanitize user-provided input before sending to LLM.
 * Strips control characters (except newline/tab) and enforces max length.
 */

type SanitizeOptions = Readonly<{
  maxLength?: number;
}>;

const DEFAULT_MAX_LENGTH = 10_000;

// Match ASCII control chars (0x00-0x1F) except \t (0x09) and \n (0x0A)
const CONTROL_CHARS_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

// Match JSON-encoded control char escape sequences (e.g. \u0000-\u001F) except
// \u0009 (tab) and \u000a (newline), as produced by JSON.stringify()
const JSON_CONTROL_ESCAPE_RE = /\\u00(?:0[0-8bce-f]|1[0-9a-f])/gi;

export function sanitizeAiInput(
  input: string,
  options?: SanitizeOptions,
): string {
  const maxLength = options?.maxLength ?? DEFAULT_MAX_LENGTH;
  // Strip actual control characters
  let cleaned = input.replace(CONTROL_CHARS_RE, "");
  // Strip JSON-encoded control character escape sequences
  cleaned = cleaned.replace(JSON_CONTROL_ESCAPE_RE, "");
  return cleaned.slice(0, maxLength);
}
