
import { AlertTriangle } from "lucide-react";

type Props = Readonly<{
  service: string;
  message?: string;
}>;

export function AnalyticsDegraded({ service, message }: Props) {
  return (
    <div className="animate-pulse rounded-xl border border-neutral-200 bg-muted p-8 flex flex-col items-center justify-center gap-3 text-center">
      <div className="rounded-full bg-neutral-200 p-3">
        <AlertTriangle className="h-6 w-6 text-neutral-400" />
      </div>
      <p className="text-sm font-medium text-neutral-600">
        Analytics data unavailable
      </p>
      <p className="text-xs text-neutral-400">
        {message ?? `${service} is currently unreachable or not configured. Data will appear once the service is connected.`}
      </p>
    </div>
  );
}
