import { AlertTriangle } from "lucide-react";

export function DegradedDataIndicator({ message }: Readonly<{ message?: string }>) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-xs text-yellow-700">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      {message ?? "Some data may be unavailable. Showing cached or partial results."}
    </div>
  );
}
