/**
 * Free `postcode` address driver — the cost-neutral default.
 *
 * Delegates to the existing postcodes.io wrapper (geocode-service). It never
 * stores a looked-up address list: per the Royal Mail PAF licence, only the
 * postcode and the user's typed `label` are persisted by callers.
 */

import type {
  AddressProvider,
  AddressSuggestion,
  ResolvedAddress,
} from "@/services/address/address-provider";
import {
  autocompletePostcode,
  geocodePostcode,
} from "@/services/search/geocode-service";
import { normalisePostcode } from "@/lib/valuation/postcode";

const UK_POSTCODE_SUBSTRING = /[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}/i;

export class PostcodeAddressAdapter implements AddressProvider {
  readonly name = "postcode";

  async autocomplete(query: string): Promise<AddressSuggestion[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    const results = await autocompletePostcode(trimmed);
    if (!results) return [];

    return results.map((pc) => ({ postcode: pc, label: pc }));
  }

  async resolve(text: string): Promise<ResolvedAddress | null> {
    const match = text.match(UK_POSTCODE_SUBSTRING);
    const display = normalisePostcode(match ? match[0] : null);
    if (!display) return null;

    const geo = await geocodePostcode(display);
    if (!geo) return null;

    return {
      postcode: geo.postcode,
      postcodeDisplay: display,
      lat: geo.lat,
      lng: geo.lng,
      label: text,
    };
  }
}
