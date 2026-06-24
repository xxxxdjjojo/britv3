import type { SourceConnector } from "./source-connector";

const registry = new Map<string, SourceConnector>();

/**
 * Register a connector by its provider key.
 * Throws if the same provider is registered twice (double-register guard).
 */
export function registerConnector(connector: SourceConnector): void {
  if (registry.has(connector.provider)) {
    throw new Error(
      `Connector provider "${connector.provider}" is already registered. Each provider may only be registered once.`,
    );
  }
  registry.set(connector.provider, connector);
}

/**
 * Resolve a connector by its provider key.
 * Throws a clear error for an unknown providerKey.
 */
export function getConnector(providerKey: string): SourceConnector {
  const connector = registry.get(providerKey);
  if (!connector) {
    throw new Error(`Unknown connector provider: ${providerKey}`);
  }
  return connector;
}

/**
 * Enumerate all registered provider keys.
 * Useful for the UI's "supported sources" list and for diagnostics.
 */
export function listConnectorProviders(): string[] {
  return Array.from(registry.keys());
}

/**
 * Reset the registry to an empty state.
 * FOR TESTING ONLY — never call this in production code.
 * @internal
 */
export function _resetRegistryForTesting(): void {
  registry.clear();
}
