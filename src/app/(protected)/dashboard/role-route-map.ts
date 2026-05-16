/**
 * Maps user_role enum values to dashboard route directory names.
 * Most roles match 1:1, but some have shortened route names.
 */
const ROLE_ROUTE_OVERRIDES: Record<string, string> = {
  service_provider: "provider",
  estate_agent: "agent",
  mortgage_broker: "broker",
};

export function roleToRoute(role: string): string {
  return ROLE_ROUTE_OVERRIDES[role] ?? role;
}
