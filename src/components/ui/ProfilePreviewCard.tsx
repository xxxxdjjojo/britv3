import { cn } from "@/lib/utils";
import { CheckCircle, MapPin } from "lucide-react";

export function ProfilePreviewCard(
  props: Readonly<{
    displayName: string;
    title?: string;
    agencyName?: string;
    photoUrl?: string;
    score: number;
    verified: boolean;
    serviceAreas?: string[];
    className?: string;
  }>,
) {
  return (
    <div className={cn("rounded-xl border border-neutral-200 bg-white p-5 shadow-sm", props.className)}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {props.photoUrl ? (
            <img
              src={props.photoUrl}
              alt={props.displayName}
              className="size-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full bg-brand-primary/10">
              <span className="text-xl font-bold text-brand-primary">
                {props.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-neutral-900 truncate">{props.displayName}</h3>
            {props.verified && (
              <CheckCircle className="size-4 flex-shrink-0 text-brand-primary" />
            )}
          </div>
          {props.title && (
            <p className="text-xs text-neutral-500">{props.title}</p>
          )}
          {props.agencyName && (
            <p className="text-xs font-medium text-neutral-600">{props.agencyName}</p>
          )}
        </div>
      </div>

      {/* Service areas */}
      {props.serviceAreas && props.serviceAreas.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-neutral-500">
          <MapPin className="size-3" />
          <span>{props.serviceAreas.slice(0, 5).join(", ")}</span>
          {props.serviceAreas.length > 5 && (
            <span className="text-neutral-400">+{props.serviceAreas.length - 5} more</span>
          )}
        </div>
      )}

      {/* Score bar */}
      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-brand-primary transition-all duration-500"
            style={{ width: `${props.score}%` }}
          />
        </div>
        <span className="text-[10px] font-semibold text-neutral-400">{props.score}%</span>
      </div>

      <p className="mt-2 text-center text-[10px] font-medium uppercase tracking-wider text-neutral-400">
        Profile Preview
      </p>
    </div>
  );
}
