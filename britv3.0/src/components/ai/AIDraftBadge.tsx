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
        "border-amber-300 text-amber-700 dark:border-amber-600 dark:text-amber-400",
        className,
      )}
    >
      <Sparkles className="mr-1 h-3 w-3" />
      AI Draft
    </Badge>
  );
}
