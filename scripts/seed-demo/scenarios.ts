/**
 * Seed Demo — Scenario Presets
 *
 * Re-exports scenario types from config and provides helpers
 * for scenario-aware seed modules.
 */

export { SCENARIO_DESCRIPTIONS } from "./config";
export type { Scenario } from "./config";

/** All valid scenario names. */
export const VALID_SCENARIOS = [
  "happy-path",
  "fire-drill",
  "growth-mode",
] as const;

/** Type guard — checks if a string is a valid scenario name. */
export function isValidScenario(value: string): value is (typeof VALID_SCENARIOS)[number] {
  return (VALID_SCENARIOS as readonly string[]).includes(value);
}
