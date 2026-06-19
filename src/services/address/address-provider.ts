/**
 * Provider-agnostic address resolution interface.
 *
 * The app talks only to this interface; a concrete adapter (free postcode
 * driver today, an Ordnance Survey Places / PAF driver later) is selected by
 * the ADDRESS_PROVIDER env var. This keeps the paid integration swappable and
 * cost-neutral until a vendor is wired.
 */

export type AddressSuggestion = Readonly<{ postcode: string; label: string }>;

export type ResolvedAddress = Readonly<{
  postcode: string;
  postcodeDisplay: string;
  lat: number;
  lng: number;
  label?: string;
}>;

export interface AddressProvider {
  /** Provider identifier (matches ADDRESS_PROVIDER). */
  readonly name: string;

  /** Suggest postcodes for a partial query. */
  autocomplete(query: string): Promise<AddressSuggestion[]>;

  /** Resolve free-text input to a geocoded address, or null when none found. */
  resolve(query: string): Promise<ResolvedAddress | null>;
}
