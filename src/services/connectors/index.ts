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
import { listConnectorProviders, registerConnector } from "./registry";
import { reapitConnector } from "./reapit-connector";

function safeRegister(connector: Parameters<typeof registerConnector>[0]): void {
  if (!listConnectorProviders().includes(connector.provider)) {
    registerConnector(connector);
  }
}

safeRegister(reapitConnector);

// Re-export registry helpers so consumers only need one import.
export { getConnector, listConnectorProviders, registerConnector } from "./registry";
