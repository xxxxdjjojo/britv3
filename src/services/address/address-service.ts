/**
 * Address provider orchestration.
 *
 * getAddressProvider() selects the adapter from ADDRESS_PROVIDER (default
 * "postcode"). resetAddressProvider() clears the cached singleton so tests can
 * re-evaluate the env.
 */

import type { AddressProvider } from "@/services/address/address-provider";
import { PostcodeAddressAdapter } from "@/services/address/adapters/postcode-adapter";
import { OsPlacesAddressAdapter } from "@/services/address/adapters/os-places-adapter";

let _provider: AddressProvider | null = null;

/** Resolve the active address provider, keyed on ADDRESS_PROVIDER. */
export function getAddressProvider(): AddressProvider {
  if (_provider) return _provider;
  _provider =
    process.env.ADDRESS_PROVIDER === "os_places"
      ? new OsPlacesAddressAdapter()
      : new PostcodeAddressAdapter();
  return _provider;
}

/** Clear the cached provider (test-only seam for re-evaluating the env). */
export function resetAddressProvider(): void {
  _provider = null;
}
