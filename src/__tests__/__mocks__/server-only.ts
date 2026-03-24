// No-op stub for "server-only" used in Vitest.
// The real package throws when imported outside of a Next.js server context.
// This alias (set in vitest.config.mts) allows server modules to be unit-tested.
export {};
