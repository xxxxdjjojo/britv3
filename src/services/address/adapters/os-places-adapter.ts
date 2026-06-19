/**
 * Stub Ordnance Survey Places (PAF) address driver.
 *
 * Selected when ADDRESS_PROVIDER=os_places, but not wired to any network today.
 * A real OS Places driver (requires OS_PLACES_API_KEY) drops in here later.
 */

import type {
  AddressProvider,
  AddressSuggestion,
  ResolvedAddress,
} from "@/services/address/address-provider";

export class OsPlacesAddressAdapter implements AddressProvider {
  readonly name = "os_places";

  async autocomplete(): Promise<AddressSuggestion[]> {
    throw new Error("os_places provider not configured");
  }

  async resolve(): Promise<ResolvedAddress | null> {
    throw new Error("os_places provider not configured");
  }
}
