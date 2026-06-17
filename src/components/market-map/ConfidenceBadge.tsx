import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Confidence } from "@/lib/market-map/constants";

const CONFIG: Record<
  Confidence,
  { variant: "default" | "secondary" | "outline"; title: string }
> = {
  High: { variant: "default", title: "30 or more sales in the window" },
  Medium: { variant: "secondary", title: "10–29 sales in the window" },
  Low: { variant: "outline", title: "5–9 sales in the window" },
  Insufficient: { variant: "outline", title: "Fewer than 5 sales — not enough data" },
};

interface Props {
  confidence: Confidence;
  className?: string;
}

export function ConfidenceBadge({ confidence, className }: Props) {
  const cfg = CONFIG[confidence];
  return (
    <Badge
      variant={cfg.variant}
      title={cfg.title}
      className={cn(
        confidence === "Insufficient" && "text-muted-foreground",
        className,
      )}
    >
      {confidence} confidence
    </Badge>
  );
}
