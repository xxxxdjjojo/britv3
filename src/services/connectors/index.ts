/**
 * Connector registration barrel.
 *
 * Import this module (or any file that imports it) before calling `getConnector`.
 * Each connector module registers itself as a side-effect. The guard below
 * prevents double-registration when the module is evaluated more than once
 * (e.g. in test environments that reset the registry between suites).
 *
 * To add a new connector: import it here and add a `safeRegister(...)` call.
 */
import { getConnector, listConnectorProviders, registerConnector } from "./registry";
import { reapitConnector } from "./reapit-connector";

/**
 * Idempotent for repeated imports of the same connector; throws if a different
 * connector is registered under an existing key.
 */
function safeRegister(connector: Parameters<typeof registerConnector>[0]): void {
  if (listConnectorProviders().includes(connector.provider)) {
    const existing = getConnector(connector.provider);
    if (existing !== connector) {
      throw new Error(
        `Connector conflict: a different connector is already registered for provider "${connector.provider}".`,
      );
    }
    // Same object — idempotent, skip re-registration.
    return;
  }
  registerConnector(connector);
}

safeRegister(reapitConnector);

// Re-export registry helpers so consumers only need one import.
export { getConnector, listConnectorProviders, registerConnector } from "./registry";
