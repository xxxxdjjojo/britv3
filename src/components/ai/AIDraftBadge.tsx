import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AIDraftBadgeProps = Readonly<{
  className?: string;
}>;

export function AIDraftBadge({ className }: AIDraftBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-warning/30 text-warning dark:border-warning dark:text-warning",
        className,
      )}
    >
      <Sparkles className="mr-1 h-3 w-3" />
      AI Draft
    </Badge>
  );
}
