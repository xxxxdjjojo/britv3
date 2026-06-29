/**
 * MarketMapRentPanel — body of the "Rent" tab in the market-map side panel.
 *
 * Honest empty state. Rent data does not exist in the app yet, so this shows
 * NO figures, NO placeholder numbers, and NO charts — only a "coming soon"
 * message that cites the planned data sources (ONS PIPR + VOA PRMS).
 */

export function MarketMapRentPanel() {
  return (
    <section
      aria-labelledby="market-map-rent-heading"
      className="flex flex-col gap-3 p-4"
    >
      <span className="self-start rounded-full bg-[#1B4D3E]/10 px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.08em] text-[#1B4D3E]">
        Coming soon
      </span>

      <h3
        id="market-map-rent-heading"
        className="font-heading text-base font-bold text-[#0A0A0B]"
      >
        Rental price data is coming soon
      </h3>

      <p className="font-sans text-sm leading-relaxed text-[#2E2E33]">
        We&rsquo;re building out average private rents by area, so you&rsquo;ll
        be able to see typical asking and let rents alongside the sale prices on
        this map.
      </p>

      <p className="font-sans text-xs leading-relaxed text-[#7A7A88]">
        Sourced from the ONS Price Index of Private Rents (PIPR) and the VOA
        Private Rental Market Statistics.
      </p>
    </section>
  );
}
