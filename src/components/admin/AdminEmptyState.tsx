import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = Readonly<{
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}>;

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-neutral-100 p-4 mb-4">
        <Icon className="h-8 w-8 text-neutral-400" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-700 mb-1">{title}</h3>
      <p className="text-sm text-neutral-500 max-w-sm mb-4">{description}</p>
      {action && (
        <Button variant="outline" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
