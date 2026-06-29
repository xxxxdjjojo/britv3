import { Separator } from "@/components/ui/separator";
import { Gallery } from "@/components/properties/Gallery";
import { FloorPlan } from "@/components/properties/FloorPlan";
import { EPCDisplay } from "@/components/properties/detail/EPCDisplay";
import type { EpcRating } from "@/types/property";
import type { PropertyView } from "@/lib/properties/build-property-view";

/**
 * Block 07 — Property detail. The "show me the property properly" section:
 * facts & features, the agent description (deliberately demoted to here, not
 * the top of the page), photos by room, floor plans, and the EPC. Dense data
 * sits below the decision-support blocks.
 */
export function PropertyDetailBlock({ view }: { view: PropertyView }) {
  const { detail, features, factGroups, roomGroups, floors, epc } = view;
  const { listing, property } = detail;

  return (
    <div className="space-y-10">
      {/* Facts & features — categorized, only non-empty groups render */}
      {factGroups.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-3">Facts &amp; features</h2>
          <Separator className="mb-4" />
          <div className="space-y-6">
            {factGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  {group.title}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {group.facts.map((fact) => (
                    <div
                      key={fact.label}
                      className="rounded-xl border bg-card p-3"
                    >
                      <p className="text-xs text-muted-foreground">
                        {fact.label}
                      </p>
                      <p className="font-medium text-sm">{fact.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Agent description — demoted from the top of the page to here */}
      <section>
        <h2 className="text-xl font-semibold mb-3">About this property</h2>
        <Separator className="mb-4" />
        <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
          {property.description}
        </div>
        {features.length > 0 && (
          <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <span className="size-1.5 rounded-full bg-brand-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Photos by room — only when captions provide real room metadata */}
      {roomGroups && (
        <section>
          <h2 className="text-xl font-semibold mb-3">Photos by room</h2>
          <Separator className="mb-4" />
          <div className="space-y-6">
            {roomGroups.map((group) => (
              <div key={group.room}>
                <h3 className="text-sm font-medium mb-2">
                  {group.room}{" "}
                  <span className="text-muted-foreground font-normal">
                    ({group.images.length})
                  </span>
                </h3>
                <Gallery
                  images={group.images.map(({ src, alt }) => ({ src, alt }))}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Floor plans */}
      {floors.length > 0 && (
        <section id="floor-plans">
          <h2 className="text-xl font-semibold mb-3">Floor plans</h2>
          <Separator className="mb-4" />
          <FloorPlan floors={floors} />
        </section>
      )}

      {/* EPC */}
      {property.epcRating && (
        <section>
          <h2 className="text-xl font-semibold mb-3">
            Energy Performance Certificate
          </h2>
          <Separator className="mb-4" />
          <div className="space-y-2">
            <EPCDisplay
              currentRating={property.epcRating as EpcRating}
              currentScore={property.epcScore}
              potentialRating={property.epcPotentialRating as EpcRating | null}
              potentialScore={property.epcPotentialScore}
            />
            <a
              href={`https://find-energy-certificate.service.gov.uk/find-a-certificate/search-by-postcode?postcode=${encodeURIComponent(property.postcode)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-brand-primary hover:underline"
            >
              View full EPC certificate <span aria-hidden="true">↗</span>
            </a>
            {listing.listingType === "rent" &&
              epc !== "N/A" &&
              ["D", "E", "F", "G"].includes(epc) && (
                <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                  <strong>MEES Notice:</strong> Rental properties in England and
                  Wales may require a minimum EPC rating of C under upcoming
                  regulations. This property currently holds a rating of {epc}.
                </p>
              )}
          </div>
        </section>
      )}
    </div>
  );
}
